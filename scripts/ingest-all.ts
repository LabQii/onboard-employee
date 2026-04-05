/**
 * Direct ingestion script — bypasses HTTP/middleware, runs in Node directly.
 * Usage: npx tsx scripts/ingest-all.ts
 */
import { PrismaClient } from '@prisma/client';
import { pipeline, env } from '@xenova/transformers';
import mammoth from 'mammoth';
// Use legacy build — required for Node.js (no browser DOM available)
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';

// Disable web worker for Node.js — must be set before any getDocument() call
GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.mjs';
env.allowLocalModels = false;
env.useBrowserCache = false;

const prisma = new PrismaClient();

// ----- Xenova Embedding Setup -----
let extractorInstance: any = null;
async function getExtractor() {
  if (!extractorInstance) {
    console.log('Loading AI embedding model (first time only, may take ~30s)...');
    extractorInstance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('Model loaded!');
  }
  return extractorInstance;
}

// ----- Text Chunking -----
function chunkText(text: string, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize - overlap) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

// ----- PDF / DOCX Text Extraction -----
async function extractText(buffer: Buffer, cloudinary_url: string): Promise<string> {
  const lowerUrl = cloudinary_url.toLowerCase();
  
  // Try DOCX first
  try {
    const result = await mammoth.extractRawText({ buffer });
    if (result.value && result.value.trim().length > 20) {
      console.log('  Extracted as DOCX');
      return result.value;
    }
  } catch (_) {}

  // Try PDF
  try {
    const uint8 = new Uint8Array(buffer);
    const loadingTask = getDocument({ 
      data: uint8,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });
    const pdfDoc = await loadingTask.promise;
    const textParts: string[] = [];
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(' ');
      textParts.push(pageText);
    }
    const text = textParts.join('\n');
    if (text.trim()) {
      console.log(`  Extracted as PDF (${pdfDoc.numPages} pages)`);
      return text;
    }
  } catch (e: any) {
    console.log('  PDF extraction failed:', e.message);
  }

  throw new Error('Could not extract text from document');
}

// ----- Main Ingestion Loop -----
async function main() {
  const docs = await prisma.documents.findMany();
  console.log(`Found ${docs.length} document(s) in DB\n`);

  const extractor = await getExtractor();

  for (const doc of docs) {
    console.log(`\n📄 Processing: "${doc.name}"`);
    console.log(`   URL: ${doc.cloudinary_url}`);

    try {
      // 1. Download file
      const res = await fetch(doc.cloudinary_url);
      if (!res.ok) throw new Error(`HTTP ${res.status} when downloading`);
      const buffer = Buffer.from(await res.arrayBuffer());

      // 2. Extract text
      const text = await extractText(buffer, doc.cloudinary_url);
      console.log(`   Extracted text length: ${text.length} chars`);

      // 3. Delete old chunks
      await prisma.$executeRaw`DELETE FROM chunks WHERE document_id = ${doc.id}::uuid`;

      // 4. Chunk & embed
      const chunks = chunkText(text);
      console.log(`   Chunking into ${chunks.length} pieces...`);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (!chunk.trim()) continue;

        const embRes = await extractor(chunk, { pooling: 'mean', normalize: true });
        const vector = Array.from(embRes.data as number[]);
        const vectorString = `[${vector.join(',')}]`;

        await prisma.$executeRaw`
          INSERT INTO chunks (document_id, content, embedding)
          VALUES (${doc.id}::uuid, ${chunk}, ${vectorString}::vector)
        `;
        process.stdout.write(`\r   Chunk ${i + 1}/${chunks.length} embedded`);
      }
      console.log('\n   ✅ Done!');

      // 5. Update status
      await prisma.documents.update({ where: { id: doc.id }, data: { status: 'indexed' } });

    } catch (err: any) {
      console.error(`   ❌ Error: ${err.message}`);
      await prisma.documents.update({ where: { id: doc.id }, data: { status: 'failed' } });
    }
  }

  console.log('\n✅ All documents processed!');
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  process.exit(0);
});

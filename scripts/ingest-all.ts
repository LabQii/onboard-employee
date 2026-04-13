
import { PrismaClient } from '@prisma/client';
import { pipeline, env } from '@xenova/transformers';
import mammoth from 'mammoth';

import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';


GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.mjs';
env.allowLocalModels = false;
env.useBrowserCache = false;

const prisma = new PrismaClient();


let extractorInstance: any = null;
async function getExtractor() {
  if (!extractorInstance) {
    extractorInstance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return extractorInstance;
}


function chunkText(text: string, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize - overlap) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}


async function extractText(buffer: Buffer, cloudinary_url: string): Promise<string> {
  const lowerUrl = cloudinary_url.toLowerCase();
  
  
  try {
    const result = await mammoth.extractRawText({ buffer });
    if (result.value && result.value.trim().length > 20) {
      
      return result.value;
    }
  } catch (_) {}

  
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
      return text;
    }
  } catch (e: any) {
    
  }

  throw new Error('Could not extract text from document');
}


async function main() {
  const docs = await prisma.documents.findMany();

  const extractor = await getExtractor();

  for (const doc of docs) {
    
    

    try {
      
      const res = await fetch(doc.file_url);
      if (!res.ok) throw new Error(`HTTP ${res.status} when downloading`);
      const buffer = Buffer.from(await res.arrayBuffer());

      
      const text = await extractText(buffer, doc.file_url);
      

      
      await prisma.$executeRaw`DELETE FROM document_chunks WHERE document_id = ${doc.id}::uuid`;

      
      const chunks = chunkText(text);
      

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (!chunk.trim()) continue;

        const embRes = await extractor(chunk, { pooling: 'mean', normalize: true });
        const vector = Array.from(embRes.data as number[]);
        const vectorString = `[${vector.join(',')}]`;

        await prisma.$executeRaw`
          INSERT INTO document_chunks (document_id, content, embedding)
          VALUES (${doc.id}::uuid, ${chunk}, ${vectorString}::vector)
        `;
        process.stdout.write(`\r   Chunk ${i + 1}/${chunks.length} embedded`);
      }
      

      
      await prisma.documents.update({ where: { id: doc.id }, data: { status: 'indexed' } });

    } catch (err: any) {
      console.error(`   ❌ Error: ${err.message}`);
      await prisma.documents.update({ where: { id: doc.id }, data: { status: 'failed' } });
    }
  }

  
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  process.exit(0);
});

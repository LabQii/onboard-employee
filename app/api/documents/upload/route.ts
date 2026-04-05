import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function chunkText(text: string, chunkSize = 100, overlap = 20): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(" ");
    if (chunk.trim()) chunks.push(chunk);
    if (i + chunkSize >= words.length) break;
  }
  return chunks;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const name = formData.get("name") as string;
    const department = formData.get("department") as string | null;
    const role = formData.get("role") as string | null;
    const phase = formData.get("phase") as string | null;

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
    if (file.size > 20 * 1024 * 1024)
      return NextResponse.json({ error: "File maksimal 20MB" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Upload to Supabase Storage
    const filePath = `${Date.now()}_${file.name}`;
    const { error: storageError } = await supabase.storage
      .from("documents")
      .upload(filePath, buffer, { contentType: file.type });

    if (storageError) return NextResponse.json({ error: storageError.message }, { status: 500 });

    // Ensure bucket is public, this gives the immediate public URL
    const { data: { publicUrl } } = supabase.storage
      .from("documents")
      .getPublicUrl(filePath);

    // 2. Extract Text
    let text = '';
    const lowerName = file.name.toLowerCase();
    
    if (lowerName.endsWith('.pdf')) {
      // Use legacy build for Node environments
      const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist/legacy/build/pdf.mjs');
      GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.mjs';

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
      text = textParts.join('\n');
    } else if (lowerName.endsWith('.docx')) {
      const mammoth = await import('mammoth');
      const data = await mammoth.extractRawText({ buffer });
      text = data.value;
    } else {
      text = buffer.toString('utf-8'); // basic txt
    }

    if (!text.trim()) {
       text = "Isi dokumen kosong atau gagal diekstrak.";
    }

    // 3. Save Document Metadata
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .insert({ 
        name: name || file.name, 
        file_path: filePath, 
        file_url: publicUrl,
        file_type: file.type,
        department: department || null,
        role: role || null,
        status: 'indexed'
      })
      .select()
      .single();

    if (docError) return NextResponse.json({ error: docError.message }, { status: 500 });
    
    // Auto-create Checklist Item for this Document
    const { error: checklistErr } = await supabase
      .from('checklist_items')
      .insert({
        title: `Baca Dokumen: ${name || file.name}`,
        description: publicUrl,
        phase: phase || 'Umum',
        department: department || null,
        role: role || null,
        priority: 'wajib',
      });
      
    if (checklistErr) console.warn("Could not insert checklist item:", checklistErr.message);

    // 4. Chunk Text and generate Embedding
    const chunks = chunkText(text);
    const embModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

    // Process sequentially or batch properly to avoid rate limits on 1000 requests at a time
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (!chunk.trim()) continue;
      
      try {
        const result = await embModel.embedContent(chunk);
        
        const { error: insertErr } = await supabase.from("document_chunks").insert({
          document_id: doc.id,
          content: chunk,
          embedding: result.embedding.values,
          chunk_index: i,
        });

        if (insertErr) {
          console.error(`Supabase Insert Error (chunk ${i}):`, insertErr);
        } else {
          console.log(`Successfully inserted chunk ${i} for doc ${doc.id}`);
        }
      } catch (err: any) {
        console.error(`Chunk embed error (index ${i}):`, err.message);
      }
    }

    console.log(`Finished processing document ${doc.id}. Total chunks inserted: ${chunks.length}`);

    return NextResponse.json({ success: true, document: doc, chunks: chunks.length });
  } catch (error: any) {
    console.error('Upload Process Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

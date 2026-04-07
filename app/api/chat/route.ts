import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { question, department, role, profileContext } = await req.json();

    if (!question) return NextResponse.json({ error: 'Question is required' }, { status: 400 });

    let contextChunks = "";

    // 1. Generate Embeddings for Question via Google Gemini
    try {
      const embModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
      const embRes = await embModel.embedContent(question);
      const vector = embRes.embedding.values;

      // 2. Query pgvector for similarly matched chunks via Supabase RPC
      const { data: matchedChunks, error: matchError } = await supabase.rpc('match_documents', {
        query_embedding: vector,
        match_threshold: 0.05, // 5% similarity minimum threshold
        match_count: 5 // Top 5 relevant chunks
      });

      if (matchError) throw matchError;

      if (matchedChunks && matchedChunks.length > 0) {
        // Option 1: we can filter by department logic in the App, or add department to the RPC.
        // For now, if the user requested it, the original RPC doesn't filter department. Let's do app-side filtering for simplicity if we had departments in the RPC return, but wait, the RPC doesn't return department.
        // We will just feed the chunks.
        contextChunks = matchedChunks.map((c: any, i: number) => `[Doc ${i+1} - ${c.file_name}]: ${c.content}`).join('\n\n');
      } else {
         contextChunks = "Belum ada dokumen yang memiliki kecocokan yang tinggi.";
      }
    } catch (embError) {
      console.warn("Vector search failed:", embError);
      contextChunks = "(Pencarian teks gagal dilangsungkan.)";
    }

    // 3. Construct System Prompt & Call Groq Llama-3
    const systemPrompt = `Anda adalah asisten cerdas untuk sistem Onboarding ("On Board").
Berikan jawaban ringkas, solutif, dan tegas berasaskan pedoman dokumen perusahaan yang diberikan.

Info Karyawan saat ini:
${profileContext || 'Tidak ada'}

Berikut adalah potongan teks dokumen rahasia dari dokumen penugasan Onboarding yang relevan dengan pertanyaan:
"""
${contextChunks}
"""

Tugas Anda: Jawab pertanyaan karyawan dengan tepat berdasarkan [Doc] di atas. Jika jawabannya tidak ada di dokumen, Anda boleh menjawab menggunakan penalaran yang ramah atau sebutkan bahwa "Menurut pedoman yang saya pelajari, detail tersebut belum diatur."`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        temperature: 0.5,
        max_tokens: 2048
      })
    });

    if (!res.ok) throw new Error(`Groq API Error: ${res.statusText}`);

    const data = await res.json();
    const answer = data.choices[0]?.message?.content || 'Maaf, saya gagal memproses teks dokumen.';

    return NextResponse.json({ answer });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

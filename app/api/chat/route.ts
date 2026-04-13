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

    
    try {
      const embModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
      const embRes = await embModel.embedContent(question);
      const vector = embRes.embedding.values;

      
      const { data: matchedChunks, error: matchError } = await supabase.rpc('match_documents', {
        query_embedding: vector,
        match_threshold: 0.05, 
        match_count: 5 
      });

      if (matchError) throw matchError;

      if (matchedChunks && matchedChunks.length > 0) {
        
        
        
        contextChunks = matchedChunks.map((c: any, i: number) => `[Doc ${i+1} - ${c.file_name}]: ${c.content}`).join('\n\n');
      } else {
         contextChunks = "Belum ada dokumen yang memiliki kecocokan yang tinggi.";
      }
    } catch (embError) {
      console.warn("Vector search failed:", embError);
      contextChunks = "(Pencarian teks gagal dilangsungkan.)";
    }

    
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

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);


export async function POST(req: NextRequest) {
  
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_admin', true);

  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: 'Admin sudah ada. Endpoint ini hanya untuk setup pertama.' }, { status: 403 });
  }

  const { email, password, fullName } = await req.json();
  if (!email || !password || !fullName) {
    return NextResponse.json({ error: 'email, password, fullName diperlukan.' }, { status: 400 });
  }

  const password_hash = await bcrypt.hash(password, 12);
  const id = crypto.randomUUID();

  const { error } = await supabase.from('profiles').insert({
    id,
    email: email.toLowerCase().trim(),
    full_name: fullName,
    password_hash,
    is_admin: true,
    invite_token: null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, message: 'Admin berhasil dibuat.' });
}

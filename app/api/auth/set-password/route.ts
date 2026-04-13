import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { signToken, COOKIE_NAME } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token dan password wajib.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password minimal 8 karakter.' }, { status: 400 });
    }

    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, is_admin, invite_token, invite_expires_at')
      .eq('invite_token', token)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: 'Link undangan tidak valid atau sudah digunakan.' }, { status: 400 });
    }

    
    if (profile.invite_expires_at && new Date(profile.invite_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Link undangan sudah kedaluwarsa. Minta admin untuk mengirim ulang.' }, { status: 400 });
    }

    
    const password_hash = await bcrypt.hash(password, 12);

    
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        password_hash,
        invite_token: null,
        invite_expires_at: null,
      })
      .eq('id', profile.id);

    if (updateErr) {
      return NextResponse.json({ error: 'Gagal menyimpan password.' }, { status: 500 });
    }

    
    const jwtToken = await signToken({
      userId: profile.id,
      email: profile.email,
      isAdmin: profile.is_admin ?? false,
      fullName: profile.full_name ?? '',
    });

    const response = NextResponse.json({
      success: true,
      redirectTo: profile.is_admin ? '/admin' : '/karyawan',
    });

    response.cookies.set(COOKIE_NAME, jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Set-password error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}


export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ valid: false });

  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, invite_expires_at')
    .eq('invite_token', token)
    .single();

  if (!data) return NextResponse.json({ valid: false });

  const expired = data.invite_expires_at && new Date(data.invite_expires_at) < new Date();
  if (expired) return NextResponse.json({ valid: false, reason: 'expired' });

  return NextResponse.json({ valid: true, fullName: data.full_name, email: data.email });
}

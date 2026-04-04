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
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi.' }, { status: 400 });
    }

    // Cari user berdasarkan email
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, password_hash, full_name, is_admin')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: 'Email atau password salah.' }, { status: 401 });
    }

    if (!profile.password_hash) {
      return NextResponse.json(
        { error: 'Akun belum diaktifkan. Silakan cek email undangan Anda.' },
        { status: 401 }
      );
    }

    // Verifikasi password
    const valid = await bcrypt.compare(password, profile.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Email atau password salah.' }, { status: 401 });
    }

    // Buat JWT token
    const token = await signToken({
      userId: profile.id,
      email: profile.email,
      isAdmin: profile.is_admin ?? false,
      fullName: profile.full_name ?? '',
    });

    // Set cookie HttpOnly
    const response = NextResponse.json({
      success: true,
      isAdmin: profile.is_admin,
      redirectTo: profile.is_admin ? '/admin' : '/karyawan',
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}

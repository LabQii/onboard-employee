import { NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  const url = new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
  const response = NextResponse.redirect(url, {
    status: 303 // Use 303 See Other for redirects after POST
  });
  
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}

export async function GET() {
  return POST();
}

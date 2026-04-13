import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  // Use the current request URL to build the redirect URL (relative to the same domain)
  const url = new URL('/', request.url);
  
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

export async function GET(request: NextRequest) {
  return POST(request);
}

import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  
  const url = new URL('/', request.url);
  
  const response = NextResponse.redirect(url, {
    status: 303 
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

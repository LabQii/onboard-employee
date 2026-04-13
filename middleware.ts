import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

const PUBLIC_PATHS = ['/', '/set-password', '/api/auth/login', '/api/auth/set-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  
  const isStaticAsset = pathname.match(/\.(png|jpg|jpeg|gif|svg|ico)$/);
  
  if (
    PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '?')) ||
    isStaticAsset ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth/')
  ) {
    return NextResponse.next();
  }

  
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;

  
  if (!session) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  
  if (pathname.startsWith('/admin') && !session.isAdmin) {
    return NextResponse.redirect(new URL('/karyawan', request.url));
  }

  
  if (pathname.startsWith('/karyawan') && session.isAdmin) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};

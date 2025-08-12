import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';

async function verifySessionCookie(session: string) {
  try {
    const decodedClaims = await auth.verifySessionCookie(session, true);
    return decodedClaims;
  } catch (error) {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;
  const decodedToken = sessionCookie ? await verifySessionCookie(sessionCookie) : null;

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/auth');

  if (!decodedToken && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (decodedToken && isAuthPage && request.nextUrl.pathname !== '/auth/action') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

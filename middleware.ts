// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/_next', '/favicon', '/assets'];

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => url.pathname.startsWith(p));
  
  // This session cookie will be set via server-side logic (e.g., Firebase Functions)
  // after a successful Firebase Authentication event. For now, the middleware
  // protects routes, assuming the cookie will be implemented.
  const hasSession = req.cookies.has('__session');

  if (!isPublic && !hasSession) {
    const loginUrl = new URL('/login', url.origin);
    loginUrl.searchParams.set('next', url.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!api).*)'] };


import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session');

  const isLoginPage = request.nextUrl.pathname === '/login';

  if (!session && !isLoginPage) {
    // Redirect to login page if not authenticated and not already on login page
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (session && isLoginPage) {
    // Redirect to home page if authenticated and trying to access login page
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/firebase-admin';

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;

  // Allow access to login and auth pages regardless of session
  if (
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/auth')
  ) {
    return NextResponse.next();
  }

  // If there's no session cookie, redirect to the login page
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verify the session cookie with Firebase Admin SDK
    await auth.verifySessionCookie(sessionCookie, true);
    // If verification is successful, allow the request to proceed
    return NextResponse.next();
  } catch (error) {
    // If verification fails (e.g., expired cookie), redirect to login
    console.error('Session cookie verification failed:', error);
    const response = NextResponse.redirect(new URL('/login', request.url));
    // Clear the invalid cookie
    response.cookies.delete('session');
    return response;
  }
}

// Configure the middleware to run on all paths except for static assets and API routes.
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

// This file is intentionally left blank to resolve a build error.
// The Next.js Edge Runtime used by middleware is not fully compatible with the
// Firebase Admin SDK. A different strategy is needed for route protection.
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

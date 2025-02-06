import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for API routes and non-device specific pages
  if (
    pathname.startsWith('/api') ||
    pathname === '/' ||
    pathname === '/devices' ||
    pathname === '/settings' ||
    pathname.startsWith('/device/')
  ) {
    return NextResponse.next();
  }

  // For device-specific routes without a device ID, redirect to the devices page
  if (pathname === '/files' || pathname === '/apps' || pathname === '/system') {
    return NextResponse.redirect(new URL('/devices', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 
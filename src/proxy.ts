import { NextResponse, NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Early returns for public paths
  if (pathname.startsWith('/api') || pathname === '/signin') {
    console.log(`Proxy: Allowing public path ${pathname}`);
    return NextResponse.next();
  }

  try {
    const sessionCookie = getSessionCookie(request);

    if (!sessionCookie) {
      console.log("Proxy: Redirecting to signin - no session cookie");
      return NextResponse.redirect(new URL('/signin', request.url));
    }

    console.log(`Proxy: Allowing request to ${pathname}`);
    return NextResponse.next();

  } catch (error) {
    console.error('Proxy: Error checking session:', error);
    return NextResponse.redirect(new URL('/signin', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets/).*)',
  ],
};

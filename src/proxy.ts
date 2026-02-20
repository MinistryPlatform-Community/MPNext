import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // console.log(`Proxy: Processing ${pathname}`);
  
  // Early returns for public paths
  if (pathname.startsWith('/api') || pathname === '/signin') {
    console.log(`Proxy: Allowing public path ${pathname}`);
    return NextResponse.next();
  }

  try {
    // Use getToken with more explicit configuration
    let token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: '__Secure-next-auth.session-token' 
    });   

    // If secure cookie doesn't work, try the regular one
    if (!token) {
      token = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: 'next-auth.session-token'
      });
    }    

    // console.log('Proxy: Token exists:', !!token);
    // console.log('Proxy: Available cookies:', request.cookies.getAll().map(c => c.name));

    // console.log('Proxy: Token exp:', token?.exp);
    
    if (!token) {
      console.log("Proxy: Redirecting to signin - no token");
      return NextResponse.redirect(new URL('/signin', request.url));
    }
    
    // Check token expiration - use the standard 'exp' claim
    if (token.exp && Date.now() >= (token.exp * 1000)) {
      console.log("Proxy: Redirecting to signin - token expired (exp)");
      return NextResponse.redirect(new URL('/signin', request.url));
    }
    
    console.log(`Proxy: Allowing request to ${pathname}`);
    return NextResponse.next();
    
  } catch (error) {
    console.error('Proxy: Error getting token:', error);
    return NextResponse.redirect(new URL('/signin', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets/).*)',
  ],
};
import { NextResponse, NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';
import {
  buildContentSecurityPolicy,
  createNonce,
  cspHeaderName,
  originOf,
} from '@/lib/security-headers';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Content-Security-Policy (F9) -----------------------------------------
  //
  // Built here rather than in `next.config.ts` because the nonce has to be
  // fresh per request; a value fixed at build time is a constant an attacker
  // can read off any page. The static, request-independent headers
  // (X-Frame-Options, HSTS, Referrer-Policy, ...) live in `next.config.ts`
  // instead, so that they also cover `/api` and the static-asset paths the
  // matcher at the bottom of this file excludes.
  //
  // Enforced (`Content-Security-Policy`) by default; only `CSP_ENFORCE=false`
  // drops it to `Content-Security-Policy-Report-Only` (see `cspHeaderName`).
  const nonce = createNonce();
  const cspHeader = cspHeaderName();
  const csp = buildContentSecurityPolicy({
    nonce,
    isDev: process.env.NODE_ENV === 'development',
    reportOnly: cspHeader === 'Content-Security-Policy-Report-Only',
    imageOrigin: originOf(process.env.NEXT_PUBLIC_MINISTRY_PLATFORM_FILE_URL),
    formActionOrigin: originOf(process.env.MINISTRY_PLATFORM_BASE_URL),
  });

  // Next.js does not take the nonce from an argument — it re-reads it off the
  // INCOMING request headers during render and stamps it onto the framework's
  // own script and style tags (see app-render.js, which accepts either the
  // enforcing or the report-only header name). Setting it on the response
  // alone would produce a policy whose nonce matches nothing on the page.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set(cspHeader, csp);

  // Applied to every return path below, redirects included. A redirect body is
  // never rendered, so the header does nothing there — it is set anyway so the
  // invariant is "every response this proxy produces carries a CSP", with no
  // exception for a reader to wonder about.
  const withCsp = <T extends Response>(response: T): T => {
    response.headers.set(cspHeader, csp);
    return response;
  };

  // Early returns for public paths
  // `/auth-error` must stay public: AuthWrapper's session gate would otherwise
  // bounce an unauthenticated visitor sent here (an OAuth failure) to
  // `/signin`, which immediately restarts OAuth — a loop that never lets the
  // user see why sign-in failed.
  //
  // `/api` exactly or under `/api/` — not a bare `startsWith('/api')`, which
  // would also make a future `/apidocs` or `/api-keys` page public.
  //
  // Every other path needs a session cookie to be PRESENT; its value is not
  // checked here. This is an optimistic redirect for signed-out visitors, not
  // the gate: AuthWrapper and every server action re-validate the session.
  if (
    pathname === '/api' ||
    pathname.startsWith('/api/') ||
    pathname === '/signin' ||
    pathname === '/auth-error'
  ) {
    return withCsp(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  try {
    const sessionCookie = getSessionCookie(request);

    if (!sessionCookie) {
      return withCsp(NextResponse.redirect(new URL('/signin', request.url)));
    }

    return withCsp(NextResponse.next({ request: { headers: requestHeaders } }));

  } catch (error) {
    console.error(
      'Proxy: error checking session',
      error instanceof Error ? error.message : String(error)
    );
    return withCsp(NextResponse.redirect(new URL('/signin', request.url)));
  }
}

/**
 * Every path except Next's static chunks, the image optimizer, the favicon and
 * `public/assets/`. Each exclusion is escaped and anchored so it skips only the
 * path it names: `/_next/static/` and `/assets/` as directories, `/_next/image`
 * itself or under it, `/favicon.ico` exactly. The previous unescaped, prefix
 * form also skipped `/faviconXico`, `/favicon.ico/x`, `/_next/imagefoo` and
 * `/_next/staticX` — paths that then got no cookie redirect and no CSP.
 *
 * Pinned behaviourally in proxy.test.ts through Next's own
 * `getMiddlewareMatchers`, which is how this string is compiled at build time.
 */
export const config = {
  matcher: [
    '/((?!_next/static/|_next/image(?:$|/)|favicon\\.ico$|assets/).*)',
  ],
};

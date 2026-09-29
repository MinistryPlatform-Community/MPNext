import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Proxy Tests
 *
 * Tests for the authentication proxy in src/proxy.ts
 * These tests verify route protection behavior including:
 * - Public path access (API routes, signin, auth-error, signed-out)
 * - Session cookie validation
 * - Redirect behavior for unauthenticated users
 * - Error handling during session checks
 * - Route matcher configuration
 */

const { mockGetSessionCookie } = vi.hoisted(() => ({
  mockGetSessionCookie: vi.fn(),
}));

vi.mock('better-auth/cookies', () => ({
  getSessionCookie: mockGetSessionCookie,
}));

// Mock NextResponse since next/server may not work in test env.
//
// The mock responses carry a real `Headers` instance: the proxy sets the
// Content-Security-Policy on whatever it returns, so a bare object literal
// would throw on `response.headers.set`.
const { mockNext, mockRedirect } = vi.hoisted(() => ({
  // Typed via the generic rather than an unused parameter, so that
  // `mockNext.mock.calls[0][0]` can be read back to assert what the proxy
  // forwarded to the renderer.
  mockNext: vi.fn<
    (init?: { request?: { headers: Headers } }) => { type: string; headers: Headers }
  >(() => ({ type: 'next', headers: new Headers() })),
  mockRedirect: vi.fn((url: URL) => ({ type: 'redirect', url, headers: new Headers() })),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    next: mockNext,
    redirect: mockRedirect,
  },
  NextRequest: vi.fn(),
}));

import * as pageStaticInfo from 'next/dist/build/analysis/get-page-static-info';
import { getMiddlewareRouteMatcher } from 'next/dist/shared/lib/router/utils/middleware-route-matcher';
import { proxy, config } from './proxy';

// Next's build-time matcher compiler. Exported at runtime but absent from the
// package's .d.ts, hence the cast.
const { getMiddlewareMatchers } = pageStaticInfo as unknown as {
  getMiddlewareMatchers: (
    matcher: string | string[],
    nextConfig: { i18n?: unknown; basePath?: string }
  ) => pageStaticInfo.ProxyMatcher[];
};

function createMockRequest(pathname: string, baseUrl = 'http://localhost:3000') {
  const url = new URL(pathname, baseUrl);
  return {
    nextUrl: url,
    url: url.toString(),
    // The proxy clones these to forward the nonce to the renderer.
    headers: new Headers(),
  } as unknown as NextRequest;
}

/** The CSP value off whichever response the proxy returned. */
function cspFrom(response: unknown): string {
  const headers = (response as { headers: Headers }).headers;
  return (
    headers.get('content-security-policy') ??
    headers.get('content-security-policy-report-only') ??
    ''
  );
}

/** The request headers the proxy forwarded to the renderer via NextResponse.next. */
function forwardedRequestHeaders(): Headers {
  const headers = mockNext.mock.calls[0]?.[0]?.request?.headers;
  if (!headers) throw new Error('NextResponse.next was not called with request headers');
  return headers;
}

describe('proxy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Public Paths', () => {
    it('should allow /api paths without session check', async () => {
      const request = createMockRequest('/api/auth/session');

      await proxy(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockGetSessionCookie).not.toHaveBeenCalled();
    });

    it('should allow nested /api paths without session check', async () => {
      const request = createMockRequest('/api/some/nested/route');

      await proxy(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockGetSessionCookie).not.toHaveBeenCalled();
    });

    it('should allow /signin path without session check', async () => {
      const request = createMockRequest('/signin');

      await proxy(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockGetSessionCookie).not.toHaveBeenCalled();
    });

    it('should allow /auth-error path without session check', async () => {
      // Without this, an unauthenticated visitor redirected here after a
      // failed OAuth callback would be bounced straight to /signin, which
      // auto-starts OAuth again — a loop that never shows the failure.
      const request = createMockRequest('/auth-error');

      await proxy(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockGetSessionCookie).not.toHaveBeenCalled();
    });
  });

  describe('/signed-out is public, exactly', () => {
    it('should allow /signed-out without a session cookie', async () => {
      // SessionGuard sends a tab here after its session ended, when the cookie
      // is usually already gone. A redirect to /signin would auto-start OAuth
      // and, with the MP SSO session alive, silently sign the tab back in.
      // (The cookie mock returns undefined by default — no cookie.)
      await proxy(createMockRequest('/signed-out'));

      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
      expect(mockGetSessionCookie).not.toHaveBeenCalled();
    });

    it('sets a CSP on /signed-out', async () => {
      const response = await proxy(createMockRequest('/signed-out'));

      expect(cspFrom(response)).toContain("default-src 'self'");
    });

    it.each(['/signed-outx', '/signed-out/x', '/signed'])(
      'should still redirect %s to /signin when there is no session cookie',
      async (pathname) => {
        mockGetSessionCookie.mockReturnValueOnce(null);

        await proxy(createMockRequest(pathname));

        expect(mockRedirect).toHaveBeenCalledWith(
          expect.objectContaining({ pathname: '/signin' })
        );
        expect(mockNext).not.toHaveBeenCalled();
      }
    );
  });

  describe('The /api carve-out is /api or /api/*, not any /api prefix', () => {
    it('should allow /api itself without session check', async () => {
      await proxy(createMockRequest('/api'));

      expect(mockNext).toHaveBeenCalled();
      expect(mockGetSessionCookie).not.toHaveBeenCalled();
    });

    it.each(['/apifoo', '/api-docs', '/apidocs', '/api.json'])(
      'should redirect %s to /signin when there is no session cookie',
      async (pathname) => {
        mockGetSessionCookie.mockReturnValueOnce(null);

        await proxy(createMockRequest(pathname));

        expect(mockGetSessionCookie).toHaveBeenCalled();
        expect(mockRedirect).toHaveBeenCalledWith(
          expect.objectContaining({ pathname: '/signin' })
        );
        expect(mockNext).not.toHaveBeenCalled();
      }
    );
  });

  describe('Protected Paths', () => {
    it('should redirect to /signin when no session cookie', async () => {
      const request = createMockRequest('/home');
      mockGetSessionCookie.mockReturnValueOnce(null);

      await proxy(request);

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/signin' })
      );
    });

    it('should allow request when session cookie exists', async () => {
      const request = createMockRequest('/home');
      mockGetSessionCookie.mockReturnValueOnce('session-token-value');

      await proxy(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('should redirect to /signin on error during session check', async () => {
      const request = createMockRequest('/home');
      mockGetSessionCookie.mockImplementationOnce(() => {
        throw new Error('Cookie parsing error');
      });

      await proxy(request);

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/signin' })
      );
    });

    it('should redirect to /signin when a non-Error value is thrown during session check', async () => {
      // Covers the non-Error arm of the safe-error-logging ternary in the
      // catch block (F5 — logging must never dump a raw, unshaped value).
      const request = createMockRequest('/home');
      mockGetSessionCookie.mockImplementationOnce(() => {
        throw 'not an Error instance';
      });

      await proxy(request);

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/signin' })
      );
    });
  });

  /**
   * F9: the proxy is the only place a per-request CSP nonce can be minted, so
   * these assert both halves of the contract — the header on the way out, and
   * the nonce forwarded on the request headers, which is the only way Next.js
   * learns what to stamp onto its own script tags.
   */
  describe('Content-Security-Policy', () => {
    it('sets a CSP on an allowed protected request', async () => {
      mockGetSessionCookie.mockReturnValueOnce('session-token-value');

      const response = await proxy(createMockRequest('/home'));

      expect(cspFrom(response)).toContain("default-src 'self'");
      expect(cspFrom(response)).toContain("frame-ancestors 'none'");
    });

    it('sets a CSP on a public path', async () => {
      const response = await proxy(createMockRequest('/signin'));

      expect(cspFrom(response)).toContain("default-src 'self'");
    });

    it.each([
      ['no session cookie', () => mockGetSessionCookie.mockReturnValueOnce(null)],
      [
        'a failing session check',
        () =>
          mockGetSessionCookie.mockImplementationOnce(() => {
            throw new Error('Cookie parsing error');
          }),
      ],
    ])('sets a CSP on the redirect produced by %s', async (_label, arrange) => {
      arrange();

      const response = await proxy(createMockRequest('/home'));

      expect(cspFrom(response)).toContain("default-src 'self'");
    });

    it('forwards the nonce to the renderer on the request headers', async () => {
      mockGetSessionCookie.mockReturnValueOnce('session-token-value');

      const response = await proxy(createMockRequest('/home'));
      const nonce = forwardedRequestHeaders().get('x-nonce');

      // Next.js re-reads the policy off the REQUEST to find the nonce, so both
      // must be present and must agree with the response policy. A mismatch
      // here is the failure that renders a blank page under enforcement.
      expect(nonce).toBeTruthy();
      expect(forwardedRequestHeaders().get('content-security-policy')).toContain(
        `'nonce-${nonce}'`
      );
      expect(cspFrom(response)).toContain(`'nonce-${nonce}'`);
    });

    it('mints a different nonce for every request', async () => {
      mockGetSessionCookie.mockReturnValue('session-token-value');

      const first = cspFrom(await proxy(createMockRequest('/home')));
      const second = cspFrom(await proxy(createMockRequest('/home')));

      const nonceOf = (csp: string) => /'nonce-([^']+)'/.exec(csp)?.[1];
      expect(nonceOf(first)).toBeTruthy();
      expect(nonceOf(first)).not.toBe(nonceOf(second));
    });

    it('enforces by default', async () => {
      const response = await proxy(createMockRequest('/signin'));
      const headers = (response as unknown as { headers: Headers }).headers;

      expect(headers.get('content-security-policy')).toBeTruthy();
      expect(headers.get('content-security-policy-report-only')).toBeNull();
    });

    it('falls back to report-only when CSP_ENFORCE is false', async () => {
      vi.stubEnv('CSP_ENFORCE', 'false');

      const response = await proxy(createMockRequest('/signin'));
      const headers = (response as unknown as { headers: Headers }).headers;

      expect(headers.get('content-security-policy-report-only')).toBeTruthy();
      expect(headers.get('content-security-policy')).toBeNull();
      // upgrade-insecure-requests is dropped in report-only, where browsers
      // ignore it and log an error on every page.
      expect(headers.get('content-security-policy-report-only')).not.toContain(
        'upgrade-insecure-requests'
      );

      // Targeted, not `vi.unstubAllEnvs()`: that would also drop the stubs
      // src/test-setup.ts installs for every test in this file.
      vi.stubEnv('CSP_ENFORCE', undefined);
    });

    it('allows the Ministry Platform file server in img-src', async () => {
      // Contact photos are `next/image` with `unoptimized`, so the browser
      // fetches them straight from MP. Without this origin every avatar breaks.
      vi.stubEnv(
        'NEXT_PUBLIC_MINISTRY_PLATFORM_FILE_URL',
        'https://files.example.com/ministryplatformapi/files'
      );

      const response = await proxy(createMockRequest('/signin'));

      expect(cspFrom(response)).toContain('img-src');
      expect(cspFrom(response)).toContain('https://files.example.com');

      vi.stubEnv('NEXT_PUBLIC_MINISTRY_PLATFORM_FILE_URL', undefined);
    });

    it('allows the Ministry Platform origin in form-action', async () => {
      // Sign-out is a form-driven server action that redirects to MP's
      // endsession endpoint; `form-action 'self'` alone aborts that redirect.
      const response = await proxy(createMockRequest('/signin'));

      expect(cspFrom(response)).toContain("form-action 'self' https://test-mp.example.com");
    });
  });

  /**
   * Behavioural, not `toContain`: the matcher is compiled here exactly the way
   * Next compiles it at build time (`getMiddlewareMatchers`, which adds the
   * `_next/data` prefix and `.rsc`/`.json` suffixes) and then run through
   * Next's own runtime matcher. A `toContain` check would still pass with an
   * extra exclusion such as `|contactlookup`, or with the old unescaped,
   * unanchored `favicon.ico` that also skipped `/faviconXico`.
   */
  describe('Route Matcher', () => {
    const proxyRunsOn = getMiddlewareRouteMatcher(
      getMiddlewareMatchers(config.matcher, {})
    );
    const runs = (pathname: string) =>
      proxyRunsOn(pathname, {} as Parameters<typeof proxyRunsOn>[1], {});

    it('pins the exact matcher', () => {
      expect(config.matcher).toEqual([
        '/((?!_next/static/|_next/image(?:$|/)|favicon\\.ico$|assets/).*)',
      ]);
    });

    it.each([
      '/',
      '/signin',
      '/auth-error',
      '/session-error',
      '/signed-out',
      '/no-access',
      '/contactlookup',
      '/contactlookup/123',
      '/contactlookup.rsc',
      '/api',
      '/api/auth/get-session',
      '/apifoo',
      // Lookalikes of the excluded paths — the old matcher skipped all of
      // these, so they got no cookie redirect and no CSP.
      '/faviconXico',
      '/favicon.icox',
      '/favicon.ico/x',
      '/_next/imagefoo',
      '/_next/staticX',
      '/_next/static',
      '/_nextfoo',
      '/assets',
      '/assetsX',
    ])('runs on %s', (pathname) => {
      expect(runs(pathname)).toBe(true);
    });

    it.each([
      '/_next/static/chunks/main.js',
      '/_next/static/css/app.css',
      '/_next/image',
      '/_next/image/',
      '/favicon.ico',
      '/assets/icons/logo.svg',
    ])('skips %s', (pathname) => {
      expect(runs(pathname)).toBe(false);
    });
  });
});

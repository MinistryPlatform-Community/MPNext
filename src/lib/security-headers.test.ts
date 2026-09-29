import { describe, it, expect, vi } from 'vitest';
import {
  buildContentSecurityPolicy,
  buildStaticSecurityHeaders,
  createNonce,
  cspHeaderName,
  originOf,
} from './security-headers';

/** Pulls one directive out of a policy string by name. */
function directive(csp: string, name: string): string | undefined {
  return csp
    .split('; ')
    .map((d) => d.trim())
    .find((d) => d === name || d.startsWith(`${name} `));
}

describe('buildStaticSecurityHeaders', () => {
  function valueOf(headers: ReturnType<typeof buildStaticSecurityHeaders>, key: string) {
    return headers.find((h) => h.key === key)?.value;
  }

  it('denies framing outright', () => {
    // Not SAMEORIGIN: nothing in this app frames itself, and this is the only
    // anti-framing control on the routes the proxy matcher skips.
    expect(valueOf(buildStaticSecurityHeaders(false), 'X-Frame-Options')).toBe('DENY');
  });

  it('disables content-type sniffing', () => {
    expect(valueOf(buildStaticSecurityHeaders(false), 'X-Content-Type-Options')).toBe('nosniff');
  });

  it('keeps full URLs same-origin only', () => {
    // A contact GUID in the path must not ride along to MP on the sign-out hop.
    expect(valueOf(buildStaticSecurityHeaders(false), 'Referrer-Policy')).toBe(
      'strict-origin-when-cross-origin'
    );
  });

  it('denies the device permissions this app never asks for', () => {
    const policy = valueOf(buildStaticSecurityHeaders(false), 'Permissions-Policy');

    expect(policy).toContain('camera=()');
    expect(policy).toContain('microphone=()');
    expect(policy).toContain('geolocation=()');
  });

  it('isolates the browsing-context group (COOP same-origin)', () => {
    // Safe because sign-in/sign-out are full-page redirects, not popups.
    expect(valueOf(buildStaticSecurityHeaders(false), 'Cross-Origin-Opener-Policy')).toBe(
      'same-origin'
    );
  });

  it('refuses cross-origin embedding of its responses (CORP same-origin)', () => {
    expect(valueOf(buildStaticSecurityHeaders(false), 'Cross-Origin-Resource-Policy')).toBe(
      'same-origin'
    );
  });

  it('sends HSTS in production', () => {
    const hsts = valueOf(buildStaticSecurityHeaders(true), 'Strict-Transport-Security');

    expect(hsts).toContain('max-age=63072000');
    expect(hsts).toContain('includeSubDomains');
  });

  it('omits preload from HSTS', () => {
    // `preload` is a one-way submission to a browser-vendor list. That is the
    // deploying church's decision, not this repo's default.
    expect(valueOf(buildStaticSecurityHeaders(true), 'Strict-Transport-Security')).not.toContain(
      'preload'
    );
  });

  it('omits HSTS outside production', () => {
    // Otherwise a developer running a local http build gets their browser
    // pinned to https for localhost, which is tedious to unpick.
    expect(valueOf(buildStaticSecurityHeaders(false), 'Strict-Transport-Security')).toBeUndefined();
  });

  it('reads NODE_ENV when no argument is given', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(valueOf(buildStaticSecurityHeaders(), 'Strict-Transport-Security')).toBeTruthy();

    vi.stubEnv('NODE_ENV', 'test');
    expect(valueOf(buildStaticSecurityHeaders(), 'Strict-Transport-Security')).toBeUndefined();
  });
});

describe('originOf', () => {
  it('reduces a configured URL to its origin', () => {
    expect(originOf('https://mp.example.com/ministryplatformapi/files')).toBe(
      'https://mp.example.com'
    );
  });

  it('keeps a non-default port, which is part of the origin', () => {
    expect(originOf('https://mp.example.com:8443/api')).toBe('https://mp.example.com:8443');
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['empty', ''],
    ['not a URL', 'not-a-url'],
  ])('returns null for %s rather than throwing', (_label, input) => {
    // This runs on the request path in the proxy. A missing or fat-fingered
    // environment variable must narrow the policy, never 500 the whole app.
    expect(originOf(input)).toBeNull();
  });

  it('reduces an MP URL with a path to its origin', () => {
    expect(originOf('https://x.ministryplatform.com/path')).toBe('https://x.ministryplatform.com');
  });

  it('allows plain http (local development against a local server)', () => {
    expect(originOf('http://localhost:3000/files')).toBe('http://localhost:3000');
  });

  it('normalizes case and drops userinfo, which are not part of an origin', () => {
    expect(originOf('HTTPS://user:pw@MP.Example.COM:8443/x')).toBe('https://mp.example.com:8443');
  });

  it('accepts an IDN host, which the URL parser has already turned into punycode', () => {
    expect(originOf('https://bücher.example/x')).toBe('https://xn--bcher-kva.example');
  });

  it.each([
    // `*` in a CSP source is "any host": these would WIDEN img-src and
    // form-action to every https origin.
    ['a wildcard host', 'https://*'],
    ['a wildcard subdomain', 'https://*.example.com'],
    ['a percent-encoded wildcard (the parser decodes it to *)', 'https://%2A'],
    // `;` ends the directive, so what follows is parsed as a new one.
    ['a host that injects a directive', 'https://a;sandbox'],
    ['a percent-encoded ;', 'https://a%3Bsandbox'],
    // Non-http(s) schemes: `javascript:` has the opaque origin "null".
    ['a javascript: URL', 'javascript:x'],
    ['a data: URL', 'data:text/html,x'],
    ['an ftp: URL', 'ftp://files.example.com'],
    ['a ws: URL', 'ws://mp.example.com'],
    // Not dangerous, but outside the allowed host charset — omitted rather
    // than special-cased.
    ['an IPv6 literal', 'https://[::1]:3000'],
  ])('returns null for %s (%s)', (_label, input) => {
    expect(originOf(input)).toBeNull();
  });
});

describe('createNonce', () => {
  it('is unique per call', () => {
    const nonces = new Set(Array.from({ length: 100 }, createNonce));
    expect(nonces.size).toBe(100);
  });

  it('is base64 and long enough to be unguessable', () => {
    const nonce = createNonce();

    expect(nonce).toMatch(/^[A-Za-z0-9+/]+=*$/);
    // 16 random bytes -> 24 base64 characters.
    expect(nonce.length).toBeGreaterThanOrEqual(20);
  });

  it('contains no single quote, which would break out of the directive', () => {
    for (let i = 0; i < 100; i++) {
      expect(createNonce()).not.toContain("'");
    }
  });
});

describe('buildContentSecurityPolicy', () => {
  const base = { nonce: 'TEST-NONCE' };

  it('carries the nonce and strict-dynamic in script-src', () => {
    const csp = buildContentSecurityPolicy(base);

    expect(directive(csp, 'script-src')).toContain("'nonce-TEST-NONCE'");
    expect(directive(csp, 'script-src')).toContain("'strict-dynamic'");
  });

  it('locks down the usual suspects', () => {
    const csp = buildContentSecurityPolicy(base);

    expect(directive(csp, 'default-src')).toBe("default-src 'self'");
    expect(directive(csp, 'object-src')).toBe("object-src 'none'");
    expect(directive(csp, 'frame-src')).toBe("frame-src 'none'");
    expect(directive(csp, 'frame-ancestors')).toBe("frame-ancestors 'none'");
    expect(directive(csp, 'base-uri')).toBe("base-uri 'none'");
    expect(directive(csp, 'font-src')).toBe("font-src 'self'");
  });

  it('allows inline styles, in dev and in production alike', () => {
    // Deliberate and load-bearing. Proven necessary by ENFORCING the policy in
    // a real browser (2026-09-12): Radix's dialog pulls in react-remove-scroll,
    // which locks body scroll by injecting a <style> ELEMENT at runtime. That
    // is not an attribute, so the old `style-src-attr` did not cover it, and a
    // nonce cannot cover it either — the element is created by script long
    // after the server picked the nonce. The browser blocked it and the dialog
    // died with React error #441.
    for (const csp of [
      buildContentSecurityPolicy(base),
      buildContentSecurityPolicy({ ...base, isDev: true }),
    ]) {
      expect(directive(csp, 'style-src')).toBe("style-src 'self' 'unsafe-inline'");
    }
  });

  it("never puts a nonce in style-src alongside 'unsafe-inline'", () => {
    // The trap that produced the broken policy: CSP3 browsers IGNORE
    // 'unsafe-inline' when a nonce is present in the same directive, so a
    // nonce here silently re-blocks every runtime-injected <style>.
    expect(directive(buildContentSecurityPolicy(base), 'style-src')).not.toContain('nonce-');
  });

  it('no longer emits style-src-attr', () => {
    // Redundant once style-src allows inline: that covers attributes and
    // elements alike. Keeping it would imply a distinction that does not hold.
    expect(directive(buildContentSecurityPolicy(base), 'style-src-attr')).toBeUndefined();
  });

  it('allows unsafe-eval in dev only', () => {
    expect(directive(buildContentSecurityPolicy({ ...base, isDev: true }), 'script-src')).toContain(
      "'unsafe-eval'"
    );
  });

  it('does not allow unsafe-eval outside dev', () => {
    // React uses eval only for dev-time error-stack reconstruction.
    expect(directive(buildContentSecurityPolicy(base), 'script-src')).not.toContain('unsafe-eval');
  });

  it('allows the HMR websocket in dev only', () => {
    expect(directive(buildContentSecurityPolicy({ ...base, isDev: true }), 'connect-src')).toBe(
      "connect-src 'self' ws:"
    );
    expect(directive(buildContentSecurityPolicy(base), 'connect-src')).toBe("connect-src 'self'");
  });

  it('upgrades insecure requests outside dev only', () => {
    // The directive rewrites http subresource URLs to https, which is exactly
    // wrong against a local http dev server.
    expect(directive(buildContentSecurityPolicy(base), 'upgrade-insecure-requests')).toBeDefined();
    expect(
      directive(buildContentSecurityPolicy({ ...base, isDev: true }), 'upgrade-insecure-requests')
    ).toBeUndefined();
  });

  it('omits upgrade-insecure-requests in report-only mode', () => {
    // Browsers refuse to honor it in a report-only policy and log an error
    // saying so on EVERY page. Observed during the F9 browser walk: it was the
    // only CSP message in the console, burying the reports report-only mode
    // exists to surface.
    expect(
      directive(buildContentSecurityPolicy({ ...base, reportOnly: true }), 'upgrade-insecure-requests')
    ).toBeUndefined();
  });

  it('keeps every other directive identical in report-only mode', () => {
    // report-only must not quietly weaken the policy being trialled — that
    // would make the trial meaningless.
    const enforced = buildContentSecurityPolicy(base).split('; ');
    const reported = buildContentSecurityPolicy({ ...base, reportOnly: true }).split('; ');

    expect(reported).toEqual(enforced.filter((d) => d !== 'upgrade-insecure-requests'));
  });

  it('adds the MP file origin to img-src when configured', () => {
    const csp = buildContentSecurityPolicy({ ...base, imageOrigin: 'https://files.example.com' });

    expect(directive(csp, 'img-src')).toBe(
      "img-src 'self' data: blob: https://files.example.com"
    );
  });

  it('still allows next/image placeholders with no file origin configured', () => {
    expect(directive(buildContentSecurityPolicy(base), 'img-src')).toBe(
      "img-src 'self' data: blob:"
    );
  });

  it('adds the MP origin to form-action when configured', () => {
    // Sign-out is a form-driven server action ending in a redirect to MP's
    // endsession endpoint, and browsers apply form-action to the whole
    // redirect chain — `'self'` alone can abort sign-out.
    const csp = buildContentSecurityPolicy({ ...base, formActionOrigin: 'https://mp.example.com' });

    expect(directive(csp, 'form-action')).toBe("form-action 'self' https://mp.example.com");
  });

  it('falls back to self-only form-action with no MP origin configured', () => {
    expect(directive(buildContentSecurityPolicy(base), 'form-action')).toBe("form-action 'self'");
  });

  it('emits directives separated so each parses independently', () => {
    const csp = buildContentSecurityPolicy(base);

    expect(csp).not.toContain(';;');
    expect(csp).not.toMatch(/\n/);
    expect(csp.split('; ').length).toBeGreaterThan(10);
  });
});

describe('cspHeaderName', () => {
  it('enforces by default', () => {
    // Flipped from report-only on 2026-09-12, after the policy was walked
    // through a real browser against a production build with no violations.
    expect(cspHeaderName(true)).toBe('Content-Security-Policy');
  });

  it('reports when explicitly asked', () => {
    expect(cspHeaderName(false)).toBe('Content-Security-Policy-Report-Only');
  });

  it.each([
    ['false', 'Content-Security-Policy-Report-Only'],
    ['true', 'Content-Security-Policy'],
    ['0', 'Content-Security-Policy'],
    ['FALSE', 'Content-Security-Policy'],
    ['', 'Content-Security-Policy'],
  ])('reads CSP_ENFORCE=%s as %s', (value, expected) => {
    // Only the exact string "false" backs off. Everything else enforces, so a
    // typo in this variable can never silently disarm the policy in a deploy —
    // the failure mode is a too-strict header, which is loud, rather than a
    // missing one, which is invisible.
    vi.stubEnv('CSP_ENFORCE', value);
    expect(cspHeaderName()).toBe(expected);
    vi.stubEnv('CSP_ENFORCE', undefined);
  });

  it('enforces when CSP_ENFORCE is unset', () => {
    // The common case: nobody sets this variable at all.
    vi.stubEnv('CSP_ENFORCE', undefined);
    expect(cspHeaderName()).toBe('Content-Security-Policy');
  });
});

// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { betterAuth } from 'better-auth';

/**
 * Server-side half of F3/F3b (review item security-auth-test-gaps #1): better-auth's
 * Origin / callbackURL check must be ON for the real `auth` instance.
 *
 * Vitest sets `NODE_ENV=test`, and better-auth derives
 * `skipOriginCheck = options.advanced.disableOriginCheck ?? isTest()`
 * (node_modules/better-auth/dist/context/create-context.mjs), so the check is
 * OFF in tests unless the option is pinned. src/lib/auth.ts pins
 * `disableOriginCheck: false`, which is what makes the real instance enforce
 * it here — and what these tests prove behaviourally. They fail if:
 * - `disableOriginCheck` is set to `true` or removed (the isTest() default);
 * - `trustedOrigins: ["*"]` (or any pattern admitting evil.example) is added.
 * The negative controls build exactly those configs and show the same
 * requests are then accepted, so a green run here means the check is live.
 *
 * `fetch` THROWS for any URL the mock OIDC server does not serve.
 */

const oidc = await vi.hoisted(async () =>
  (await import('@/test-utils/mock-oidc')).installMockOidc(),
);

vi.mock('@/lib/providers/ministry-platform', () => ({
  MPHelper: class {
    getTableRecords = vi.fn().mockResolvedValue([]);
  },
}));

import { auth } from '@/lib/auth';
import { codeFlow, postSignInSocial, type AuthLike } from '@/test-utils/mock-oidc';

const ORIGIN = 'http://localhost:3000';

beforeEach(() => {
  oidc.reset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

const hostileCallbackURLs: Array<[string, string]> = [
  ['an absolute URL on another origin', 'https://evil.example'],
  ['an absolute URL with a path', 'https://evil.example/phish'],
  ['a tab-smuggled protocol-relative path', '/\t/evil'],
  ['a protocol-relative URL', '//evil.example'],
  ['a backslash path', '/\\evil.example'],
];

function signInWith(instance: AuthLike, callbackURL: string, headers?: Record<string, string>) {
  return postSignInSocial(instance, ORIGIN, { provider: 'ministry-platform', callbackURL }, headers);
}

/** A cookie-bearing POST from another site: the CSRF shape the Origin check exists for. */
function crossSiteSignOut(instance: AuthLike, cookie: string) {
  return instance.handler(
    new Request(`${ORIGIN}/api/auth/sign-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example', Cookie: cookie },
      body: '{}',
    }),
  );
}

describe('the real auth instance enforces the origin check', () => {
  it('resolves skipOriginCheck to false despite NODE_ENV=test', async () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect((await auth.$context).skipOriginCheck).toBe(false);
  });

  it.each(hostileCallbackURLs)('refuses callbackURL that is %s with 403 INVALID_CALLBACK_URL', async (_label, url) => {
    const response = await signInWith(auth, url);

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: 'INVALID_CALLBACK_URL' });
    // Refused before a state cookie or authorize URL was produced.
    expect(response.headers.getSetCookie()).toEqual([]);
  });

  it('control: a same-origin relative callbackURL is accepted', async () => {
    const response = await signInWith(auth, '/contacts');
    expect(response.status).toBe(200);
  });

  it('control: an absolute callbackURL on the app origin is accepted', async () => {
    const response = await signInWith(auth, `${ORIGIN}/contacts`);
    expect(response.status).toBe(200);
  });

  it('refuses a cross-site Origin on a cookie-bearing POST (sign-out CSRF shape) with 403 INVALID_ORIGIN', async () => {
    const { jar } = await codeFlow(auth, ORIGIN);

    const response = await crossSiteSignOut(auth, jar.header());

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: 'INVALID_ORIGIN' });
  });

  // Not asserted: a cross-site Origin on a cookie-less `/sign-in/social`.
  // better-auth validates the Origin header only on cookie-bearing requests
  // there; the CSRF guard for that endpoint is the route's JSON-only
  // Content-Type check (a cross-site form cannot send application/json
  // without a preflight). See src/app/api/auth/[...all]/route.test.ts.
});

describe('negative controls: the same requests pass once the check is weakened', () => {
  it('disableOriginCheck: true accepts https://evil.example (so the test above would go red)', async () => {
    const weakened = betterAuth({
      ...auth.options,
      advanced: { ...auth.options.advanced, disableOriginCheck: true },
    });
    const response = await signInWith(weakened, 'https://evil.example');
    expect(response.status).toBe(200);
  });

  it('trustedOrigins: ["*"] accepts https://evil.example and a cross-site Origin', async () => {
    const weakened = betterAuth({ ...auth.options, trustedOrigins: ['*'] });

    expect((await signInWith(weakened, 'https://evil.example')).status).toBe(200);
    const { jar } = await codeFlow(weakened, ORIGIN);
    expect((await crossSiteSignOut(weakened, jar.header())).status).toBe(200);
  });

  it('isSafeRelativeURL still refuses "/\\t/evil" even with trustedOrigins: ["*"] (better-auth invariant)', async () => {
    const weakened = betterAuth({ ...auth.options, trustedOrigins: ['*'] });
    expect((await signInWith(weakened, '/\t/evil')).status).toBe(403);
  });
});

// @vitest-environment node
// (node, not jsdom: jose verifies id_tokens over WebCrypto, which rejects
// jsdom-realm typed arrays.)
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SignJWT, exportJWK, generateKeyPair } from 'jose';

/**
 * Issue #101: an MP blip during OIDC discovery must not take sign-in down for
 * longer than the blip itself.
 *
 * Before, genericOAuth fetched MP's discovery document ONCE, inside the auth
 * context's `init`, with no timeout and no retry, and every auth request (and
 * every page's session check) awaited that `init`. A failed fetch left
 * `/sign-in/social` answering `404 PROVIDER_NOT_FOUND` until the instance was
 * rebuilt; a hung one stalled every request for undici's ~300 s headers
 * timeout.
 *
 * Now the provider is configured with explicit endpoints, so building the
 * instance makes no MP call at all, and the id_token verifier (issuer + JWKS)
 * is loaded from discovery lazily by `lazyIdTokenVerifier`: at the first
 * callback, with a timeout, cached on success, never on failure.
 *
 * The integration tests drive the REAL `auth` export against
 * src/test-utils/mock-oidc.ts; the unit tests stub `fetch` themselves. Either
 * way `fetch` THROWS for any URL not served, so nothing here can reach a real
 * Ministry Platform.
 */

const oidc = await vi.hoisted(async () =>
  (await import('@/test-utils/mock-oidc')).installMockOidc(),
);

vi.mock('@/lib/providers/ministry-platform', () => ({
  MPHelper: class {
    getTableRecords = vi.fn().mockResolvedValue([{ User_ID: 1357 }]);
  },
}));

import {
  CookieJar,
  MOCK_ISSUER,
  callback,
  codeFlow,
  getSession,
  postSignInSocial,
  startSignIn,
} from '@/test-utils/mock-oidc';

type AuthModule = typeof import('@/lib/auth');

const ORIGIN = 'http://localhost:3000';
const DISCOVERY_URL = `${MOCK_ISSUER}/.well-known/openid-configuration`;

/** A fresh module: a fresh auth instance and a fresh (empty) verifier cache. */
async function freshAuth(): Promise<AuthModule> {
  vi.resetModules();
  return import('@/lib/auth');
}

const discoveryFetches = () => oidc.calls.filter((c) => c.url === DISCOVERY_URL).length;
const userinfoCalls = () => oidc.calls.filter((c) => c.url === `${MOCK_ISSUER}/connect/userinfo`);

/** The structured (JSON) events written to console.error. */
function loggedEvents(): Array<Record<string, unknown>> {
  return vi.mocked(console.error).mock.calls.flatMap(([line]) => {
    try {
      return [JSON.parse(String(line)) as Record<string, unknown>];
    } catch {
      return [];
    }
  });
}

function expectRefused(location: string) {
  const url = new URL(location, ORIGIN);
  expect(url.pathname).toBe('/auth-error');
  expect(url.searchParams.get('error')).toBe('unable_to_get_user_info');
}

beforeEach(() => {
  oidc.reset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('MP down or hanging while the app starts', () => {
  // The issue's first symptom: `/signin` spinning on a 404, or every page
  // hanging ~300 s, because the auth instance fetched discovery at build.
  it.each(['reject', 'http_500', 'hang'] as const)(
    'MP %s: the instance builds, sign-in starts and session checks answer, with no MP call',
    async (mode) => {
      oidc.state.mp = mode;
      const { auth } = await freshAuth();

      // In `hang` mode any MP call here would never settle and time the test out.
      await auth.$context;
      const start = await postSignInSocial(auth, ORIGIN, { provider: 'ministry-platform', callbackURL: '/' });
      expect(start.status).toBe(200);
      const { url } = (await start.json()) as { url: string };
      expect(url).toMatch(/^https:\/\/test-mp\.example\.com\/oauth\/connect\/authorize\?/);
      expect(await getSession(auth, ORIGIN, new CookieJar())).toBeNull();
      expect(await auth.api.getSession({ headers: new Headers() })).toBeNull();

      expect(oidc.calls).toEqual([]);
    },
  );

  it('the ministry-platform provider is always registered', async () => {
    oidc.state.mp = 'reject';
    const { auth } = await freshAuth();
    const ctx = await auth.$context;
    expect(ctx.socialProviders.map((p) => p.id)).toContain('ministry-platform');
  });
});

describe('discovery failing at the callback: that sign-in is refused, the next one works', () => {
  it.each([
    ['rejects (a network error)', 'reject', { reason: 'request_failed', errName: 'TypeError' }],
    ['answers 500', 'http_500', { reason: 'http_status', status: 500 }],
  ] as const)('discovery %s → refused and logged; after MP recovers, the SAME instance signs in (no restart)', async (_label, mode, logged) => {
    const { auth } = await freshAuth();
    oidc.state.discovery = mode;

    const failed = await codeFlow(auth, ORIGIN);

    expectRefused(failed.location);
    expect(failed.jar.get('session_token')).toBeUndefined();
    expect(userinfoCalls()).toEqual([]);
    expect(loggedEvents()).toContainEqual(expect.objectContaining({ event: 'auth.oidc.discovery_failed', ...logged }));
    expect(loggedEvents()).toContainEqual(
      expect.objectContaining({ event: 'auth.userinfo.id_token_unverified', reason: 'verifier_unavailable' }),
    );
    // Identifiers only: the discovery URL never reaches the log.
    expect(vi.mocked(console.error).mock.calls.flat().join(' ')).not.toContain('test-mp.example.com');

    oidc.state.discovery = 'ok';
    const { jar, location } = await codeFlow(auth, ORIGIN);

    expect(location).toBe('/');
    expect((await getSession(auth, ORIGIN, jar))?.user).toMatchObject({ userGuid: oidc.sub, userId: 1357 });
    // The failure was not cached: discovery was simply asked again.
    expect(discoveryFetches()).toBe(2);
  });

  // The same property one layer down: jose must not cache a failed key-set
  // fetch either (it clears its in-flight fetch in a `finally`).
  it.each([
    ['rejects (a network error)', 'reject', { errName: 'TypeError' }],
    ['answers 500', 'http_500', { code: 'ERR_JOSE_GENERIC' }],
  ] as const)('the JWKS %s → refused; after MP recovers, the SAME instance signs in', async (_label, mode, logged) => {
    const { auth } = await freshAuth();
    oidc.state.jwks = mode;

    const failed = await codeFlow(auth, ORIGIN);

    expectRefused(failed.location);
    expect(userinfoCalls()).toEqual([]);
    expect(loggedEvents()).toContainEqual(
      expect.objectContaining({ event: 'auth.userinfo.id_token_unverified', reason: 'verification_failed', ...logged }),
    );

    oidc.state.jwks = 'ok';
    const { location } = await codeFlow(auth, ORIGIN);

    expect(location).toBe('/');
    // Discovery itself succeeded the first time and stayed cached.
    expect(discoveryFetches()).toBe(1);
  });

  it('the discovery request carries OIDC_DISCOVERY_TIMEOUT_MS and refuses redirects', async () => {
    const mod = await freshAuth();
    const mpFetch = globalThis.fetch;
    const discoveryInits: RequestInit[] = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
      if ((input instanceof Request ? input.url : String(input)) === DISCOVERY_URL) discoveryInits.push(init ?? {});
      return mpFetch(input, init);
    });
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout');

    const { location } = await codeFlow(mod.auth, ORIGIN);

    expect(location).toBe('/');
    expect(mod.OIDC_DISCOVERY_TIMEOUT_MS).toBe(5_000);
    expect(discoveryInits).toHaveLength(1);
    expect(discoveryInits[0].redirect).toBe('error');
    const call = timeoutSpy.mock.calls.findIndex(([ms]) => ms === mod.OIDC_DISCOVERY_TIMEOUT_MS);
    expect(discoveryInits[0].signal).toBe(timeoutSpy.mock.results[call].value);
  });

  it('concurrent callbacks share one discovery fetch, and later sign-ins reuse it', async () => {
    const { auth } = await freshAuth();
    const starts = await Promise.all(Array.from({ length: 5 }, () => startSignIn(auth, ORIGIN)));

    const responses = await Promise.all(
      starts.map(({ jar, authorizeUrl }) =>
        callback(auth, ORIGIN, { code: 'test-code', state: String(authorizeUrl.searchParams.get('state')) }, jar),
      ),
    );

    expect(responses.map((r) => [r.status, r.headers.get('location')])).toEqual(Array(5).fill([302, '/']));
    expect(discoveryFetches()).toBe(1);

    await codeFlow(auth, ORIGIN);
    expect(discoveryFetches()).toBe(1);
  });
});

describe('lazyIdTokenVerifier (unit)', () => {
  const BASE = 'https://mp.test/ministryplatformapi/oauth';
  const DISCOVERY = `${BASE}/.well-known/openid-configuration`;
  // The live MP's JWKS path — not the IdentityServer default the mock uses —
  // given as a path-absolute reference, so it must be resolved, not pinned.
  const JWKS = 'https://mp.test/ministryplatformapi/oauth/.well-known/jwks';

  interface Stub {
    discovery: () => Response | Promise<Response>;
    jwks?: () => Response | Promise<Response>;
  }

  /** Stubs `fetch` for one test; returns the URLs requested, and each request's init. */
  function stubFetch(stub: Stub) {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = input instanceof Request ? input.url : String(input);
      calls.push({ url, init });
      if (url === DISCOVERY) return stub.discovery();
      if (url === JWKS && stub.jwks) return stub.jwks();
      throw new Error(`Blocked unexpected fetch in test: ${url}`);
    });
    return calls;
  }

  const json = (body: unknown) =>
    new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
  const document = (overrides: Record<string, unknown> = {}) =>
    json({ issuer: BASE, jwks_uri: '/ministryplatformapi/oauth/.well-known/jwks', ...overrides });

  it('fetches nothing until first used, then resolves jwks_uri and verifies against it', async () => {
    const { lazyIdTokenVerifier } = await freshAuth();
    const { publicKey, privateKey } = await generateKeyPair('RS256');
    const jwk = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'RS256' };
    const calls = stubFetch({ discovery: () => document(), jwks: () => json({ keys: [jwk] }) });

    const load = lazyIdTokenVerifier(DISCOVERY);
    expect(calls).toEqual([]);

    const verifier = await load();
    expect(verifier.issuer).toBe(BASE);
    const token = await new SignJWT({ sub: 'x' })
      .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
      .setIssuer(BASE)
      .setExpirationTime('5m')
      .sign(privateKey);
    const { jwtVerify } = await import('jose');
    await expect(jwtVerify(token, verifier.jwks, { issuer: verifier.issuer })).resolves.toBeDefined();
    expect(calls.map((c) => c.url)).toEqual([DISCOVERY, JWKS]);
  });

  it('caches a success: later calls, concurrent or not, share one fetch', async () => {
    const { lazyIdTokenVerifier } = await freshAuth();
    const calls = stubFetch({ discovery: () => document() });
    const load = lazyIdTokenVerifier(DISCOVERY);

    const [a, b] = await Promise.all([load(), load()]);
    const c = await load();

    expect(a).toBe(b);
    expect(c).toBe(a);
    expect(calls).toHaveLength(1);
  });

  it('never caches a failure: the next call fetches again', async () => {
    const { lazyIdTokenVerifier } = await freshAuth();
    let down = true;
    const calls = stubFetch({
      discovery: () => (down ? Promise.reject(new TypeError('fetch failed')) : document()),
    });
    const load = lazyIdTokenVerifier(DISCOVERY);

    await expect(load()).rejects.toThrow(/OIDC discovery failed: request_failed/);
    down = false;
    await expect(load()).resolves.toMatchObject({ issuer: BASE });
    expect(calls).toHaveLength(2);
  });

  it('gives up on a hung discovery request after timeoutMs, and logs TimeoutError', async () => {
    const { lazyIdTokenVerifier } = await freshAuth();
    // Accepts the request and never answers; settles only when the caller aborts.
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      (_input, init) =>
        new Promise<Response>((_, reject) => {
          init?.signal?.addEventListener('abort', () => reject(init.signal!.reason), { once: true });
        }),
    );
    const started = Date.now();

    await expect(lazyIdTokenVerifier(DISCOVERY, { timeoutMs: 20 })()).rejects.toThrow(/request_failed/);

    expect(Date.now() - started).toBeLessThan(2_000);
    expect(loggedEvents()).toContainEqual(
      expect.objectContaining({ event: 'auth.oidc.discovery_failed', reason: 'request_failed', errName: 'TimeoutError' }),
    );
  });

  it.each<[string, () => Response, Record<string, unknown>]>([
    ['a 404', () => new Response('nope', { status: 404 }), { reason: 'http_status', status: 404 }],
    ['a non-JSON 200', () => new Response('<html>proxy</html>', { status: 200 }), { reason: 'invalid_json', errName: 'SyntaxError' }],
    ['a JSON array', () => json([]), { reason: 'invalid_document', field: 'body' }],
    ['JSON null', () => json(null), { reason: 'invalid_document', field: 'body' }],
    ['no issuer', () => document({ issuer: undefined }), { reason: 'invalid_document', field: 'issuer' }],
    ['an issuer that is not a URL', () => document({ issuer: 'mp' }), { reason: 'invalid_document', field: 'issuer' }],
    ['no jwks_uri', () => document({ jwks_uri: undefined }), { reason: 'invalid_document', field: 'jwks_uri' }],
    ['a non-string jwks_uri', () => document({ jwks_uri: 42 }), { reason: 'invalid_document', field: 'jwks_uri' }],
    ['an unparseable jwks_uri', () => document({ jwks_uri: 'https://[' }), { reason: 'invalid_document', field: 'jwks_uri' }],
  ])('fails closed on %s, logging identifiers only', async (_label, discovery, logged) => {
    const { lazyIdTokenVerifier } = await freshAuth();
    stubFetch({ discovery });

    await expect(lazyIdTokenVerifier(DISCOVERY)()).rejects.toThrow(/OIDC discovery failed/);

    const events = loggedEvents().filter((e) => e.event === 'auth.oidc.discovery_failed');
    expect(events).toEqual([expect.objectContaining(logged)]);
    const text = vi.mocked(console.error).mock.calls.flat().join(' ');
    expect(text).not.toContain('mp.test');
    expect(text).not.toContain('proxy');
  });
});

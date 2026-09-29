// @vitest-environment node
// (node, not jsdom: better-auth verifies the id_token with `jose` over WebCrypto,
// which rejects jsdom-realm typed arrays.)
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toNextJsHandler } from 'better-auth/next-js';

/**
 * Review item security-discovery-failure-no-retry: genericOAuth fetches MP's OIDC
 * discovery document once per auth instance, with no retry, so one failed
 * fetch at cold start used to leave `/sign-in/social` answering
 * `404 PROVIDER_NOT_FOUND` until the process restarted. `selfHealingAuth` in
 * src/lib/auth.ts now rebuilds the instance (single-flight, 30 s cooldown)
 * when a sign-in finds the provider missing.
 *
 * Drives the REAL `auth` export against a mock MP OIDC provider whose
 * discovery endpoint can be made to fail. `fetch` THROWS for any URL the mock
 * does not serve, so nothing here can reach a real Ministry Platform.
 */

const mockOidc = await vi.hoisted(async () => {
  const { generateKeyPairSync, sign } = await import('node:crypto');
  const base = 'https://test-mp.example.com';
  const issuer = `${base}/oauth`;
  const discoveryUrl = `${issuer}/.well-known/openid-configuration`;
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key-1', alg: 'RS256', use: 'sig' };
  const sub = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  const state = {
    /** While true, the discovery endpoint rejects (a network error). */
    discoveryDown: false,
    discoveryFetches: 0,
  };

  const b64 = (v: unknown) => Buffer.from(JSON.stringify(v)).toString('base64url');
  function signIdToken(): string {
    const now = Math.floor(Date.now() / 1000);
    const input = `${b64({ alg: 'RS256', kid: 'test-key-1', typ: 'JWT' })}.${b64({
      iss: issuer,
      aud: 'test-client-id',
      sub,
      iat: now,
      exp: now + 300,
    })}`;
    return `${input}.${sign('RSA-SHA256', Buffer.from(input), privateKey).toString('base64url')}`;
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    const url = request.url;
    if (url === discoveryUrl) {
      state.discoveryFetches += 1;
      if (state.discoveryDown) throw new TypeError('fetch failed');
      return json({
        issuer,
        authorization_endpoint: `${issuer}/connect/authorize`,
        token_endpoint: `${issuer}/connect/token`,
        userinfo_endpoint: `${issuer}/connect/userinfo`,
        end_session_endpoint: `${issuer}/connect/endsession`,
        jwks_uri: `${issuer}/.well-known/openid-configuration/jwks`,
        id_token_signing_alg_values_supported: ['RS256'],
      });
    }
    if (url === `${issuer}/.well-known/openid-configuration/jwks`) return json({ keys: [jwk] });
    if (url === `${issuer}/connect/token` && request.method === 'POST') {
      return json({
        access_token: 'access-token-user',
        id_token: signIdToken(),
        token_type: 'Bearer',
        expires_in: 3600,
      });
    }
    if (url === `${issuer}/connect/userinfo`) {
      return json({ sub, given_name: 'Rebuilt', family_name: 'Instance' });
    }
    throw new Error(`Blocked unexpected fetch in test: ${url}`);
  }) as typeof fetch;

  return { sub, state };
});

vi.mock('@/lib/providers/ministry-platform', () => ({
  MPHelper: class {
    getTableRecords = vi.fn().mockResolvedValue([]);
  },
}));

type AuthModule = typeof import('@/lib/auth');

const ORIGIN = 'http://localhost:3000';
const SECOND = 1000;
const T0 = new Date('2026-09-29T08:00:00Z').getTime();
const savedVitest = process.env.VITEST;

function cookiePairs(response: Response, into = new Map<string, string>()) {
  for (const line of response.headers.getSetCookie()) {
    const pair = line.split(';')[0];
    const eq = pair.indexOf('=');
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (value === '' || /max-age=0/i.test(line)) into.delete(name);
    else into.set(name, value);
  }
  return into;
}
const header = (jar: Map<string, string>) => [...jar].map(([k, v]) => `${k}=${v}`).join('; ');

async function loadAuth(): Promise<AuthModule> {
  vi.resetModules();
  return import('@/lib/auth');
}

function startSignIn({ auth }: AuthModule) {
  return auth.handler(
    new Request(`${ORIGIN}/api/auth/sign-in/social`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
      body: JSON.stringify({ provider: 'ministry-platform', callbackURL: '/' }),
    }),
  );
}

/** Full code flow; returns the session cookie jar. */
async function signIn(mod: AuthModule) {
  const start = await startSignIn(mod);
  expect(start.status).toBe(200);
  const jar = cookiePairs(start);
  const { url } = (await start.json()) as { url: string };
  const state = new URL(url).searchParams.get('state')!;
  const callback = await mod.auth.handler(
    new Request(`${ORIGIN}/api/auth/callback/ministry-platform?code=test-code&state=${encodeURIComponent(state)}`, {
      headers: { Cookie: header(jar) },
    }),
  );
  expect(callback.status).toBe(302);
  expect(callback.headers.get('location')).not.toMatch(/error/);
  return cookiePairs(callback, new Map());
}

async function sessionGuid({ auth }: AuthModule, jar: Map<string, string>) {
  const res = await auth.handler(new Request(`${ORIGIN}/api/auth/get-session`, { headers: { Cookie: header(jar) } }));
  const body = (await res.json()) as { user?: { userGuid?: string } } | null;
  return body?.user?.userGuid ?? null;
}

const rebuildLogs = (spy: { mock: { calls: unknown[][] } }) =>
  spy.mock.calls
    .map(([line]) => String(line))
    .filter((line: string) => line.includes('"auth.discovery.rebuild"'))
    .map((line: string) => JSON.parse(line) as Record<string, unknown>);

let errorSpy: ReturnType<typeof vi.spyOn>;
let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  mockOidc.state.discoveryDown = false;
  mockOidc.state.discoveryFetches = 0;
  delete (globalThis as Record<symbol, unknown>)[Symbol.for('mpnext.auth')];
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(T0);
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  process.env.VITEST = savedVitest;
  delete (globalThis as Record<symbol, unknown>)[Symbol.for('mpnext.auth')];
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('boot-time discovery failure', () => {
  it('first discovery fails, next succeeds → after the cooldown sign-in works without a restart', async () => {
    mockOidc.state.discoveryDown = true;
    const mod = await loadAuth();

    const refused = await startSignIn(mod);
    expect(refused.status).toBe(404);
    expect(await refused.json()).toMatchObject({ code: 'PROVIDER_NOT_FOUND' });
    expect(mockOidc.state.discoveryFetches).toBe(1);

    // MP is back, but the cooldown has not elapsed: still refused, no new fetch.
    mockOidc.state.discoveryDown = false;
    vi.setSystemTime(T0 + 29 * SECOND);
    expect((await startSignIn(mod)).status).toBe(404);
    expect(mockOidc.state.discoveryFetches).toBe(1);

    vi.setSystemTime(T0 + 31 * SECOND);
    const jar = await signIn(mod);
    expect(mockOidc.state.discoveryFetches).toBe(2);
    expect(await sessionGuid(mod, jar)).toBe(mockOidc.sub);
    expect(rebuildLogs(warnSpy)).toEqual([
      expect.objectContaining({ outcome: 'recovered', providerId: 'ministry-platform' }),
    ]);
    // The facade now serves the rebuilt instance everywhere, not just handler.
    const ctx = await mod.auth.$context;
    expect(ctx.socialProviders.map((p) => p.id)).toContain('ministry-platform');
  });

  it('works through the real route adapter (toNextJsHandler checks "handler" in auth)', async () => {
    mockOidc.state.discoveryDown = true;
    const mod = await loadAuth();
    const { POST } = toNextJsHandler(mod.auth);
    await mod.auth.$context;
    mockOidc.state.discoveryDown = false;
    vi.setSystemTime(T0 + 31 * SECOND);

    const res = await POST(
      new Request(`${ORIGIN}/api/auth/sign-in/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
        body: JSON.stringify({ provider: 'ministry-platform', callbackURL: '/' }),
      }),
    );
    expect(res.status).toBe(200);
    expect('handler' in mod.auth && 'api' in mod.auth).toBe(true);
    expect('noSuchProperty' in mod.auth).toBe(false);
  });

  it('a rebuild that still finds MP down keeps refusing, logs, and waits out another cooldown', async () => {
    mockOidc.state.discoveryDown = true;
    const mod = await loadAuth();
    await mod.auth.$context;

    vi.setSystemTime(T0 + 31 * SECOND);
    expect((await startSignIn(mod)).status).toBe(404);
    expect(mockOidc.state.discoveryFetches).toBe(2);
    expect(rebuildLogs(errorSpy)).toEqual([
      expect.objectContaining({ outcome: 'provider_still_missing' }),
    ]);

    // Next cooldown is measured from that rebuild.
    vi.setSystemTime(T0 + 55 * SECOND);
    expect((await startSignIn(mod)).status).toBe(404);
    expect(mockOidc.state.discoveryFetches).toBe(2);

    mockOidc.state.discoveryDown = false;
    vi.setSystemTime(T0 + 62 * SECOND);
    expect((await startSignIn(mod)).status).toBe(200);
    expect(mockOidc.state.discoveryFetches).toBe(3);
  });

  it('concurrent sign-ins share one rebuild (no rebuild storm)', async () => {
    mockOidc.state.discoveryDown = true;
    const mod = await loadAuth();
    await mod.auth.$context;
    mockOidc.state.discoveryDown = false;
    vi.setSystemTime(T0 + 31 * SECOND);

    const responses = await Promise.all(Array.from({ length: 20 }, () => startSignIn(mod)));

    expect(responses.map((r) => r.status)).toEqual(Array(20).fill(200));
    expect(mockOidc.state.discoveryFetches).toBe(2);
    expect(rebuildLogs(warnSpy)).toHaveLength(1);
  });

  it('only sign-in and callback requests trigger a rebuild', async () => {
    mockOidc.state.discoveryDown = true;
    const mod = await loadAuth();
    await mod.auth.$context;
    mockOidc.state.discoveryDown = false;
    vi.setSystemTime(T0 + 31 * SECOND);

    await mod.auth.handler(new Request(`${ORIGIN}/api/auth/get-session`));
    await mod.auth.api.getSession({ headers: new Headers() });
    expect(mockOidc.state.discoveryFetches).toBe(1);

    // A callback does (it needs the provider to redeem the code).
    const cb = await mod.auth.handler(
      new Request(`${ORIGIN}/api/auth/callback/ministry-platform?code=x&state=y`),
    );
    expect(cb.status).toBe(302);
    expect(mockOidc.state.discoveryFetches).toBe(2);
  });
});

describe('a healthy instance is never rebuilt', () => {
  it('keeps its instance, and its sessions, however long it runs', async () => {
    const mod = await loadAuth();
    const jar = await signIn(mod);
    const ctxBefore = await mod.auth.$context;

    for (const minutes of [1, 5, 30]) {
      vi.setSystemTime(T0 + minutes * 60 * SECOND);
      expect((await startSignIn(mod)).status).toBe(200);
    }

    expect(mockOidc.state.discoveryFetches).toBe(1);
    expect(await mod.auth.$context).toBe(ctxBefore);
    expect(await sessionGuid(mod, jar)).toBe(mockOidc.sub);
    expect(rebuildLogs(warnSpy)).toHaveLength(0);
    expect(rebuildLogs(errorSpy)).toHaveLength(0);
  });
});

describe('one shared, self-healing instance per process', () => {
  it('two module copies (two Next layers) share the facade and see the rebuild', async () => {
    delete process.env.VITEST;
    mockOidc.state.discoveryDown = true;
    const routeLayer = await loadAuth();
    const actionLayer = await loadAuth();
    expect(actionLayer.auth).toBe(routeLayer.auth);
    await routeLayer.auth.$context;

    mockOidc.state.discoveryDown = false;
    vi.setSystemTime(T0 + 31 * SECOND);
    const jar = await signIn(routeLayer);

    // The server-action layer reads the session from the rebuilt instance.
    const session = await actionLayer.auth.api.getSession({ headers: new Headers({ Cookie: header(jar) }) });
    expect(session?.user.userGuid).toBe(mockOidc.sub);
  });
});

describe('selfHealingAuth (unit)', () => {
  type Fake = {
    handler: (r: Request) => Promise<Response>;
    $context: Promise<{ socialProviders: { id: string }[] }>;
    tag: string;
  };
  const signInRequest = () => new Request(`${ORIGIN}/api/auth/sign-in/social`, { method: 'POST' });
  const fake = (tag: string, context: Fake['$context']): Fake => ({
    tag,
    $context: context,
    handler: async () => new Response(tag),
  });
  const missing = () => Promise.resolve({ socialProviders: [] });
  const present = () => Promise.resolve({ socialProviders: [{ id: 'ministry-platform' }] });

  it('logs create_failed (error name only) and keeps the current instance when a rebuild throws', async () => {
    const { selfHealingAuth } = await loadAuth();
    let calls = 0;
    const auth = selfHealingAuth(() => {
      calls += 1;
      if (calls === 1) return fake('first', missing());
      throw new RangeError('boom https://secret@example');
    });
    vi.setSystemTime(T0 + 31 * SECOND);

    expect(await (await auth.handler(signInRequest())).text()).toBe('first');
    const [log] = rebuildLogs(errorSpy);
    expect(log).toMatchObject({ outcome: 'create_failed', errName: 'RangeError' });
    expect(JSON.stringify(log)).not.toContain('secret');
  });

  it('treats a rejected $context as a missing provider', async () => {
    const { selfHealingAuth } = await loadAuth();
    const rejected = Promise.reject(new Error('init failed'));
    rejected.catch(() => {});
    const instances = [fake('broken', rejected), fake('healed', present())];
    const auth = selfHealingAuth(() => instances.shift()!);
    vi.setSystemTime(T0 + 31 * SECOND);

    expect(await (await auth.handler(signInRequest())).text()).toBe('healed');
  });

  it('a request waits at most waitMs for a hung rebuild, which then completes in the background', async () => {
    const { selfHealingAuth } = await loadAuth();
    let finishDiscovery!: () => void;
    const hung = new Promise<{ socialProviders: { id: string }[] }>((resolve) => {
      finishDiscovery = () => resolve({ socialProviders: [{ id: 'ministry-platform' }] });
    });
    const instances = [fake('broken', missing()), fake('healed', hung)];
    const auth = selfHealingAuth(() => instances.shift()!, { waitMs: 5 });
    vi.setSystemTime(T0 + 31 * SECOND);

    expect(await (await auth.handler(signInRequest())).text()).toBe('broken');
    // A second request during the same rebuild waits on it rather than starting another.
    expect(await (await auth.handler(signInRequest())).text()).toBe('broken');
    expect(instances).toHaveLength(0);

    finishDiscovery();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(await (await auth.handler(signInRequest())).text()).toBe('healed');
  });

  it('leaves own properties spy-able and delegates the rest to the current instance', async () => {
    const { selfHealingAuth } = await loadAuth();
    const auth = selfHealingAuth(() => fake('only', present()));
    expect(auth.tag).toBe('only');
    expect((auth as unknown as { fetch: unknown }).fetch).toBe(auth.handler);
    const spy = vi.spyOn(auth, 'handler').mockResolvedValue(new Response('spied'));
    expect(await (await auth.handler(signInRequest())).text()).toBe('spied');
    spy.mockRestore();
    expect(await (await auth.handler(signInRequest())).text()).toBe('only');
  });
});

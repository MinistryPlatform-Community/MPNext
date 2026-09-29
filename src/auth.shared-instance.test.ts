// @vitest-environment node
// (node, not jsdom: better-auth verifies the id_token with `jose` over WebCrypto,
// which rejects jsdom-realm typed arrays.)
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Regression guard for the one-`auth`-per-process fix (`sharedInstance` in
 * src/lib/auth.ts). Next loads src/lib/auth.ts once per bundle layer, so the
 * `/api/auth` route handler (OAuth callback, `/get-session`) and the sign-out
 * server action ran in different module copies with different in-memory
 * stores. Found 2026-09-29 by a live Playwright test against MP: the logout
 * URL never carried `id_token_hint`, and sign-out could not delete the
 * session row `/get-session` is served from.
 *
 * `vi.resetModules()` + a second `import()` reproduces "a second layer": two
 * module copies in one process. `VITEST` is cleared so the real (non-test)
 * path runs. `fetch` THROWS for any URL the mock does not serve, so nothing
 * here can reach a real Ministry Platform.
 */

const mockOidc = await vi.hoisted(async () => {
  const { generateKeyPairSync, sign } = await import('node:crypto');
  const base = 'https://test-mp.example.com';
  const issuer = `${base}/oauth`;
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key-1', alg: 'RS256', use: 'sig' };
  const sub = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

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
    if (url === `${issuer}/.well-known/openid-configuration`) {
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
        refresh_token: 'refresh-token-user',
        id_token: signIdToken(),
        token_type: 'Bearer',
        expires_in: 3600,
      });
    }
    if (url === `${issuer}/connect/userinfo`) {
      return json({ sub, given_name: 'Shared', family_name: 'Instance' });
    }
    throw new Error(`Blocked unexpected fetch in test: ${url}`);
  }) as typeof fetch;

  return { sub };
});

vi.mock('@/lib/providers/ministry-platform', () => ({
  MPHelper: class {
    getTableRecords = vi.fn().mockResolvedValue([]);
  },
}));

type AuthModule = typeof import('@/lib/auth');

const ORIGIN = 'http://localhost:3000';
const MINUTE = 60 * 1000;
const T0 = new Date('2026-09-29T08:00:00Z').getTime();
const savedVitest = process.env.VITEST;

function cookiePairs(response: Response, into = new Map<string, string>()) {
  for (const line of response.headers.getSetCookie()) {
    const pair = line.split(';')[0];
    const eq = pair.indexOf('=');
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (value === '' || /max-age=0/i.test(line)) into.delete(name);
    else into.set(name, value);
  }
  return into;
}
const header = (jar: Map<string, string>) => [...jar].map(([k, v]) => `${k}=${v}`).join('; ');

/** Imports src/lib/auth as a fresh module copy — what a separate Next bundle layer gets. */
async function loadLayer(): Promise<AuthModule> {
  vi.resetModules();
  return import('@/lib/auth');
}

async function signIn({ auth }: AuthModule) {
  const start = await auth.handler(
    new Request(`${ORIGIN}/api/auth/sign-in/social`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
      body: JSON.stringify({ provider: 'ministry-platform', callbackURL: '/' }),
    }),
  );
  expect(start.status).toBe(200);
  const jar = cookiePairs(start);
  const { url } = (await start.json()) as { url: string };
  const state = new URL(url).searchParams.get('state')!;
  const callback = await auth.handler(
    new Request(`${ORIGIN}/api/auth/callback/ministry-platform?code=test-code&state=${encodeURIComponent(state)}`, {
      headers: { Cookie: header(jar) },
    }),
  );
  expect(callback.status).toBe(302);
  expect(callback.headers.get('location')).not.toMatch(/error/);
  return cookiePairs(callback, new Map());
}

async function getSessionGuid({ auth }: AuthModule, jar: Map<string, string>) {
  const res = await auth.handler(new Request(`${ORIGIN}/api/auth/get-session`, { headers: { Cookie: header(jar) } }));
  const body = (await res.json()) as { user?: { userGuid?: string } } | null;
  return body?.user?.userGuid ?? null;
}

beforeEach(() => {
  delete (globalThis as Record<symbol, unknown>)[Symbol.for('mpnext.auth')];
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(T0);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  process.env.VITEST = savedVitest;
  delete (globalThis as Record<symbol, unknown>)[Symbol.for('mpnext.auth')];
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('sharedInstance', () => {
  it('returns one instance per process outside Vitest', async () => {
    const { sharedInstance } = await loadLayer();
    const key = Symbol('test-shared');
    const create = vi.fn(() => ({}));
    const a = sharedInstance(key, create, {});
    const b = sharedInstance(key, create, {});
    expect(a).toBe(b);
    expect(create).toHaveBeenCalledTimes(1);
    delete (globalThis as Record<symbol, unknown>)[key];
  });

  it('builds a fresh instance under Vitest', async () => {
    const { sharedInstance } = await loadLayer();
    const key = Symbol('test-vitest');
    const a = sharedInstance(key, () => ({}), { VITEST: 'true' });
    const b = sharedInstance(key, () => ({}), { VITEST: 'true' });
    expect(a).not.toBe(b);
    expect((globalThis as Record<symbol, unknown>)[key]).toBeUndefined();
  });

  it('two module copies (two Next layers) get the same auth instance', async () => {
    delete process.env.VITEST;
    const routeLayer = await loadLayer();
    const actionLayer = await loadLayer();
    expect(routeLayer).not.toBe(actionLayer); // really two module copies
    expect(actionLayer.auth).toBe(routeLayer.auth);
  });
});

describe('sign-in in the route layer, sign-out in the server-action layer', () => {
  async function run() {
    const routeLayer = await loadLayer();
    const actionLayer = await loadLayer();
    const jar = await signIn(routeLayer);
    expect(await getSessionGuid(routeLayer, jar)).toBe(mockOidc.sub);

    const result = (await actionLayer.auth.api.signOut({
      headers: new Headers({ Cookie: header(jar) }),
      body: { disableRedirect: true },
    })) as { url?: string };

    // A copied cookie pair, replayed after the 1 h cookie cache, against the route layer.
    vi.setSystemTime(T0 + 61 * MINUTE);
    const replayed = await getSessionGuid(routeLayer, jar);
    return { url: result.url, replayed };
  }

  it('shared: the logout URL carries id_token_hint and the replayed cookie is dead', async () => {
    delete process.env.VITEST;
    const { url, replayed } = await run();
    expect(new URL(url!).searchParams.get('id_token_hint')).toBeTruthy();
    expect(replayed).toBeNull();
  });

  it('negative control: separate copies (the pre-fix behaviour) lose both', async () => {
    process.env.VITEST = 'true';
    const { url, replayed } = await run();
    expect(url).toBeUndefined();
    expect(replayed).toBe(mockOidc.sub);
  });
});

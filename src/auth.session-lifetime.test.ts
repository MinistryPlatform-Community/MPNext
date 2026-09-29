// @vitest-environment node
// (node, not jsdom: better-auth verifies the id_token with `jose` over WebCrypto,
// which rejects jsdom-realm typed arrays.)
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { betterAuth } from 'better-auth';

/**
 * Clock-walk guard for the session lifetime settings in src/lib/auth.ts
 * (review items security-stateless-session-not-revocable and
 * security-session-no-absolute-lifetime-or-mp-revalidation).
 *
 * Signs in through the REAL `auth` instance with the full authorization-code
 * flow against a mock MP OIDC provider (discovery, JWKS, token, userinfo — the
 * id_token genuinely RS256-signed), then steps a fake clock and replays the
 * cookies to `GET /api/auth/get-session` exactly as a browser (or an attacker
 * holding a copied cookie pair) would. `fetch` THROWS for any URL the mock
 * does not serve, so nothing here can reach a real Ministry Platform.
 *
 * Pinned numbers (better-auth 1.7.4):
 * - Hard ceiling: no session is valid after sign-in + 12h (better-auth's
 *   check is `expiresAt < now`, so exactly 12h is the last valid instant), on
 *   the cookie-cache path or the in-memory-adapter path, however often used.
 * - A cookie pair not backed by a live in-memory row (copied before sign-out,
 *   or on an instance that never saw the sign-in) dies within 1h of when it
 *   was minted.
 * The negative control rebuilds the instance with the pre-fix session config
 * and shows the same walk survives ~7 days — so deleting `expiresIn`,
 * `disableSessionRefresh` or `refreshCache: false` turns this suite red.
 */

const mockOidc = await vi.hoisted(async () => {
  const { generateKeyPairSync, sign } = await import('node:crypto');
  const base = 'https://test-mp.example.com';
  const issuer = `${base}/oauth`;
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key-1', alg: 'RS256', use: 'sig' };
  const sub = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

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
        jwks_uri: `${issuer}/.well-known/openid-configuration/jwks`,
        id_token_signing_alg_values_supported: ['RS256'],
      });
    }
    if (url === `${issuer}/.well-known/openid-configuration/jwks`) return json({ keys: [jwk] });
    if (url === `${issuer}/connect/token` && request.method === 'POST') {
      return json({
        access_token: 'access-token-lifetime',
        refresh_token: 'refresh-token-lifetime',
        id_token: signIdToken(),
        token_type: 'Bearer',
        expires_in: 3600,
      });
    }
    if (url === `${issuer}/connect/userinfo`) {
      return json({ sub, given_name: 'Clock', family_name: 'Walker' });
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

import {
  auth,
  SESSION_EXPIRES_IN_SECONDS,
  SESSION_COOKIE_CACHE_MAX_AGE_SECONDS,
} from '@/lib/auth';

type AuthLike = { handler: (r: Request) => Promise<Response> };

const ORIGIN = 'http://localhost:3000';
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const T0 = new Date('2026-09-28T08:00:00Z').getTime();

/** A minimal cookie jar: applies Set-Cookie (including deletions) like a browser. */
class CookieJar {
  private cookies = new Map<string, string>();

  constructor(from?: CookieJar) {
    if (from) this.cookies = new Map(from.cookies);
  }

  apply(response: Response) {
    for (const line of response.headers.getSetCookie()) {
      const [pair, ...attrs] = line.split(';');
      const eq = pair.indexOf('=');
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      const maxAge = attrs.map((a) => a.trim()).find((a) => /^max-age=/i.test(a));
      if (value === '' || (maxAge && Number(maxAge.split('=')[1]) <= 0)) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }

  header(): string {
    return [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  names(): string[] {
    return [...this.cookies.keys()];
  }

  without(pattern: RegExp): CookieJar {
    const copy = new CookieJar(this);
    for (const name of copy.names()) if (pattern.test(name)) copy.cookies.delete(name);
    return copy;
  }
}

/** Full authorization-code sign-in; returns the browser's cookie jar. */
async function signIn(instance: AuthLike): Promise<CookieJar> {
  const jar = new CookieJar();
  const start = await instance.handler(
    new Request(`${ORIGIN}/api/auth/sign-in/social`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
      body: JSON.stringify({ provider: 'ministry-platform', callbackURL: '/' }),
    }),
  );
  expect(start.status).toBe(200);
  jar.apply(start);
  const { url } = (await start.json()) as { url: string };
  const state = new URL(url).searchParams.get('state');
  expect(state).toBeTruthy();

  const callback = await instance.handler(
    new Request(
      `${ORIGIN}/api/auth/callback/ministry-platform?code=test-code&state=${encodeURIComponent(state!)}`,
      { headers: { Cookie: jar.header() } },
    ),
  );
  expect(callback.status).toBe(302);
  expect(callback.headers.get('location')).not.toMatch(/error/);
  jar.apply(callback);
  expect(jar.names().some((n) => n.endsWith('session_token'))).toBe(true);
  expect(jar.names().some((n) => n.endsWith('session_data'))).toBe(true);
  return jar;
}

/** GET /get-session with the jar; applies any re-minted cookies. Returns the userGuid or null. */
async function getSession(instance: AuthLike, jar: CookieJar): Promise<string | null> {
  const response = await instance.handler(
    new Request(`${ORIGIN}/api/auth/get-session`, { headers: { Cookie: jar.header() } }),
  );
  expect(response.status).toBe(200);
  jar.apply(response);
  const body = (await response.json()) as { user?: { userGuid?: string } } | null;
  return body?.user?.userGuid ?? null;
}

/**
 * Steps the clock by `step` from T0 and asks for the session each time, for
 * up to `limit`. Returns the last instant (ms after T0) the session was still
 * valid and the first instant it was not.
 */
async function walk(instance: AuthLike, jar: CookieJar, step: number, limit: number) {
  let lastValid = 0;
  for (let t = step; t <= limit; t += step) {
    vi.setSystemTime(T0 + t);
    const guid = await getSession(instance, jar);
    if (guid === null) return { lastValid, firstInvalid: t };
    expect(guid).toBe(mockOidc.sub);
    lastValid = t;
  }
  return { lastValid, firstInvalid: null };
}

async function signOut(instance: AuthLike, jar: CookieJar) {
  const response = await instance.handler(
    new Request(`${ORIGIN}/api/auth/sign-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: jar.header() },
      body: '{}',
    }),
  );
  expect(response.status).toBe(200);
  jar.apply(response);
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(T0);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('session lifetime settings', () => {
  it('pins the configured values (12h absolute, no sliding, no cookie-only re-mint)', () => {
    expect(SESSION_EXPIRES_IN_SECONDS).toBe(12 * 60 * 60);
    expect(SESSION_COOKIE_CACHE_MAX_AGE_SECONDS).toBe(60 * 60);
    expect(auth.options.session).toMatchObject({
      expiresIn: SESSION_EXPIRES_IN_SECONDS,
      disableSessionRefresh: true,
      cookieCache: {
        enabled: true,
        maxAge: SESSION_COOKIE_CACHE_MAX_AGE_SECONDS,
        // Encrypted, not just signed — see src/auth.oidc-hardening.test.ts.
        strategy: 'jwe',
        refreshCache: false,
      },
    });
  });

  it('resolves refreshCache to off in the live context (the stateless default did not win)', async () => {
    const context = await auth.$context;
    expect(context.sessionConfig.cookieRefreshCache).toBe(false);
    expect(context.sessionConfig.expiresIn).toBe(SESSION_EXPIRES_IN_SECONDS);
  });
});

describe('clock walk through the real auth instance', () => {
  it('an actively used session (cookie cache + in-memory row) never survives sign-in + 12h', async () => {
    const jar = await signIn(auth);
    // Poll every 10 minutes, as a busy tab would.
    const result = await walk(auth, jar, 10 * MINUTE, 3 * DAY);

    // better-auth's check is `expiresAt < now`, so the last valid instant is
    // exactly sign-in + 12h and the next step is refused.
    expect(result.lastValid).toBe(12 * HOUR);
    expect(result.firstInvalid).toBe(12 * HOUR + 10 * MINUTE);
  });

  // `disableSessionRefresh` is defence in depth here: better-auth only slides
  // `expiresAt` once per `updateAge` (1 day), which is longer than the 12h
  // `expiresIn`, so today the session expires before a slide could happen.
  // Its removal is caught by the config pin above, not by this walk; it
  // matters the day someone raises `expiresIn` past `updateAge`.
  it('the in-memory-adapter path alone does not slide expiresAt (no session_data cookie)', async () => {
    const jar = (await signIn(auth)).without(/session_data/);
    const result = await walk(auth, jar, 30 * MINUTE, 3 * DAY);

    expect(result.lastValid).toBe(12 * HOUR);
    expect(result.firstInvalid).toBe(12 * HOUR + 30 * MINUTE);
  });

  it('a cookie pair copied before sign-out dies within 1h of being minted', async () => {
    const victim = await signIn(auth);
    const copied = new CookieJar(victim);

    vi.setSystemTime(T0 + 5 * MINUTE);
    await signOut(auth, victim);
    expect(await getSession(auth, victim)).toBeNull();

    // The attacker replays the copy every 5 minutes.
    const result = await walk(auth, copied, 5 * MINUTE, 3 * DAY);

    expect(result.firstInvalid).not.toBeNull();
    expect(result.firstInvalid).toBeLessThanOrEqual(SESSION_COOKIE_CACHE_MAX_AGE_SECONDS * 1000 + 5 * MINUTE);
  });

  it('a cookie pair on an instance with no in-memory row (serverless) dies within 1h', async () => {
    const jar = await signIn(auth);
    // A second instance with the same config and secret: it can verify the
    // signed cookies but never saw the sign-in, like a different serverless
    // container.
    const otherInstance = betterAuth({ ...auth.options });
    const result = await walk(otherInstance, jar, 5 * MINUTE, 3 * DAY);

    // With the `jwe` strategy the cookie is still honoured AT exactly `maxAge`
    // (better-auth's check is `expiresAt < now`; the old `jwt` path was cut
    // one instant earlier by jose's `exp <= now`), so the first refused step
    // is the one after it. The precise bound is pinned below.
    expect(result.lastValid).toBeGreaterThan(0);
    expect(result.lastValid).toBeLessThanOrEqual(SESSION_COOKIE_CACHE_MAX_AGE_SECONDS * 1000);
    expect(result.firstInvalid).toBe(SESSION_COOKIE_CACHE_MAX_AGE_SECONDS * 1000 + 5 * MINUTE);
  });

  it('pins the serverless ceiling precisely: valid at exactly 1h, refused one second later', async () => {
    const jar = await signIn(auth);
    const otherInstance = betterAuth({ ...auth.options });
    const maxAgeMs = SESSION_COOKIE_CACHE_MAX_AGE_SECONDS * 1000;

    vi.setSystemTime(T0 + maxAgeMs);
    expect(await getSession(otherInstance, jar)).toBe(mockOidc.sub);
    vi.setSystemTime(T0 + maxAgeMs + 1000);
    expect(await getSession(otherInstance, jar)).toBeNull();
  });
});

/**
 * Negative control: the pre-fix session block (1h JWT cookie cache and
 * nothing else). Proves the walks above can detect a regression — this is the
 * 7-day window the 2026-09-12 advisory erratum quotes.
 */
describe('negative control: pre-fix session config', () => {
  const preFix = betterAuth({
    ...auth.options,
    session: { cookieCache: { enabled: true, maxAge: 60 * 60, strategy: 'jwt' } },
  });

  it('a copied cookie pair survives sign-out and silently re-mints until ~7 days', async () => {
    const victim = await signIn(preFix);
    const copied = new CookieJar(victim);
    vi.setSystemTime(T0 + 5 * MINUTE);
    await signOut(preFix, victim);

    const result = await walk(preFix, copied, 50 * MINUTE, 8 * DAY);

    // 50-minute steps: last valid at 201 x 50 min (6.98 days), refused at the
    // next step (7.01 days) -- the default 7-day expiresAt, re-minted all along.
    expect(result.lastValid).toBe(201 * 50 * MINUTE);
    expect(result.firstInvalid).toBe(202 * 50 * MINUTE);
  });
});

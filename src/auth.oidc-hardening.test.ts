// @vitest-environment node
// (node, not jsdom: better-auth verifies the id_token with `jose` over WebCrypto,
// which rejects jsdom-realm typed arrays.)
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * End-to-end guards for the 2026-09-28 OIDC hardening in src/lib/auth.ts:
 * - `requireIdTokenVerification: true` (review item
 *   security-require-id-token-verification): a discovery document missing
 *   `jwks_uri` or `issuer` must take the provider down, not leave it live with
 *   id_token verification silently off.
 * - id_token `exp` / `azp` checks in `getUserInfo` (review item
 *   security-id-token-claim-checks-weak), through the real code flow with
 *   genuinely signed tokens that better-auth's own verifier ACCEPTS.
 * - `cookieCache.strategy: "jwe"` (review item
 *   security-session-cookie-readable-jwt-strategy): `session_data` must not be
 *   readable.
 * - `/get-session` withholds `token`, `ipAddress`, `userAgent` (review item
 *   security-client-data-overexposure).
 *
 * Each test re-imports `@/lib/auth` (Vitest builds a fresh instance per
 * import, see `sharedInstance`) so discovery runs again against the mock's
 * current document. `fetch` THROWS for any URL the mock does not serve, so
 * nothing here can reach a real Ministry Platform.
 */

const mockOidc = await vi.hoisted(async () => {
  const { generateKeyPairSync, sign } = await import('node:crypto');
  const base = 'https://test-mp.example.com';
  const issuer = `${base}/oauth`;
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key-1', alg: 'RS256', use: 'sig' };
  const sub = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
  const email = 'hardening-member@example.test';

  const state = {
    /** Keys to drop from the discovery document. */
    omit: [] as string[],
    /** Claim overrides for the next id_tokens (undefined values are dropped). */
    claims: {} as Record<string, unknown>,
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
      ...state.claims,
    })}`;
    return `${input}.${sign('RSA-SHA256', Buffer.from(input), privateKey).toString('base64url')}`;
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    const url = request.url;
    if (url === `${issuer}/.well-known/openid-configuration`) {
      const doc: Record<string, unknown> = {
        issuer,
        authorization_endpoint: `${issuer}/connect/authorize`,
        token_endpoint: `${issuer}/connect/token`,
        userinfo_endpoint: `${issuer}/connect/userinfo`,
        end_session_endpoint: `${issuer}/connect/endsession`,
        jwks_uri: `${issuer}/.well-known/openid-configuration/jwks`,
        id_token_signing_alg_values_supported: ['RS256'],
      };
      for (const key of state.omit) delete doc[key];
      return json(doc);
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
      return json({ sub, given_name: 'Hard', family_name: 'Ening', email });
    }
    throw new Error(`Blocked unexpected fetch in test: ${url}`);
  }) as typeof fetch;

  return { sub, email, state };
});

vi.mock('@/lib/providers/ministry-platform', () => ({
  MPHelper: class {
    getTableRecords = vi.fn().mockResolvedValue([{ User_ID: 4321 }]);
  },
}));

const ORIGIN = 'http://localhost:3000';

type AuthModule = typeof import('@/lib/auth');

async function freshAuth(): Promise<AuthModule['auth']> {
  vi.resetModules();
  return (await import('@/lib/auth')).auth;
}

function cookiePairs(response: Response, into = new Map<string, string>()): Map<string, string> {
  for (const line of response.headers.getSetCookie()) {
    const pair = line.split(';')[0];
    const eq = pair.indexOf('=');
    const value = pair.slice(eq + 1).trim();
    if (value !== '') into.set(pair.slice(0, eq).trim(), value);
  }
  return into;
}

const header = (jar: Map<string, string>) => [...jar].map(([k, v]) => `${k}=${v}`).join('; ');

function startSignIn(auth: AuthModule['auth']) {
  return auth.handler(
    new Request(`${ORIGIN}/api/auth/sign-in/social`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: ORIGIN,
        'User-Agent': 'hardening-test-agent/1.0',
        'X-Forwarded-For': '203.0.113.9',
      },
      body: JSON.stringify({ provider: 'ministry-platform', callbackURL: '/' }),
    }),
  );
}

/** Full authorization-code flow. Returns the callback redirect and the cookie jar. */
async function codeFlow(auth: AuthModule['auth']) {
  const start = await startSignIn(auth);
  expect(start.status).toBe(200);
  const jar = cookiePairs(start);
  const { url } = (await start.json()) as { url: string };
  const state = new URL(url).searchParams.get('state')!;
  const callback = await auth.handler(
    new Request(
      `${ORIGIN}/api/auth/callback/ministry-platform?code=test-code&state=${encodeURIComponent(state)}`,
      {
        headers: {
          Cookie: header(jar),
          'User-Agent': 'hardening-test-agent/1.0',
          'X-Forwarded-For': '203.0.113.9',
        },
      },
    ),
  );
  expect(callback.status).toBe(302);
  return { location: callback.headers.get('location') ?? '', jar: cookiePairs(callback, jar) };
}

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

function loggedText(): string {
  return vi
    .mocked(console.error)
    .mock.calls.flat()
    .map((a) => (typeof a === 'string' ? a : JSON.stringify(a)))
    .join('\n');
}

beforeEach(() => {
  mockOidc.state.omit = [];
  mockOidc.state.claims = {};
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('requireIdTokenVerification: a partial discovery document takes the provider down', () => {
  it('control: full discovery — sign-in starts and completes', async () => {
    const auth = await freshAuth();
    const { location } = await codeFlow(auth);
    expect(location).not.toMatch(/error/);
  });

  // If `requireIdTokenVerification` is removed, genericOAuth keeps the provider
  // live with NO id_token verifier in both cases below, sign-in returns 200,
  // and these tests fail.
  it.each([['jwks_uri'], ['issuer']])(
    'discovery without %s → sign-in refused with 404 PROVIDER_NOT_FOUND and an error log',
    async (missing) => {
      mockOidc.state.omit = [missing];
      const auth = await freshAuth();

      const response = await startSignIn(auth);

      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({ code: 'PROVIDER_NOT_FOUND' });
      expect(loggedText()).toContain('requires verified ID tokens');
    },
  );
});

describe('id_token claim checks through the real code flow', () => {
  // Each of these tokens is RS256-signed by the mock JWKS key with the right
  // iss and aud, so better-auth's verifier accepts it; the refusal is ours.
  it.each([
    ['has no exp', { exp: undefined }, 'missing_exp'],
    ['lists several audiences with azp naming another client', { aud: ['other-client', 'test-client-id'], azp: 'other-client' }, 'azp_mismatch'],
  ])('refuses sign-in when the id_token %s', async (_label, claims, reason) => {
    mockOidc.state.claims = claims;
    const auth = await freshAuth();

    const { location, jar } = await codeFlow(auth);

    expect(location).toMatch(/error=unable_to_get_user_info/);
    expect([...jar.keys()].some((n) => n.endsWith('session_token'))).toBe(false);
    expect(loggedEvents()).toContainEqual(
      expect.objectContaining({ event: 'auth.userinfo.id_token_claims_invalid', reason }),
    );
  });

  it('control: several audiences with azp naming us is accepted', async () => {
    mockOidc.state.claims = { aud: ['other-client', 'test-client-id'], azp: 'test-client-id' };
    const auth = await freshAuth();
    const { location } = await codeFlow(auth);
    expect(location).not.toMatch(/error/);
  });
});

describe('session cookies and /get-session', () => {
  /** Every base64url segment of the value, decoded, that parses as JSON. */
  function decodableJsonSegments(value: string): string[] {
    return value.split('.').flatMap((segment) => {
      try {
        const text = Buffer.from(segment, 'base64url').toString('utf8');
        JSON.parse(text);
        return [text];
      } catch {
        return [];
      }
    });
  }

  it('session_data is an encrypted JWE: no segment decodes to the identity payload', async () => {
    const auth = await freshAuth();
    const { jar } = await codeFlow(auth);

    const sessionData = [...jar].filter(([name]) => name.includes('session_data'));
    expect(sessionData.length).toBeGreaterThan(0);
    const value = sessionData.map(([, v]) => v).join('');

    // Compact JWE: five segments, and the only JSON is the protected header.
    expect(value.split('.')).toHaveLength(5);
    const json = decodableJsonSegments(value);
    expect(json).toHaveLength(1);
    expect(JSON.parse(json[0])).toMatchObject({ enc: 'A256CBC-HS512' });
    for (const needle of ['userGuid', 'mpEmail', mockOidc.sub, mockOidc.email, 'ipAddress']) {
      expect(json[0]).not.toContain(needle);
      expect(value).not.toContain(needle);
    }
    // Well under the 4096-byte per-cookie limit, so better-auth does not chunk it.
    expect(sessionData).toHaveLength(1);
    expect(`${sessionData[0][0]}=${sessionData[0][1]}`.length).toBeLessThan(4096);

    // …and it still works as the session cache.
    const session = await auth.api.getSession({ headers: new Headers({ Cookie: header(jar) }) });
    expect(session?.user.userGuid).toBe(mockOidc.sub);
  });

  it('/get-session hands page JS no session token, IP or user agent (exact key sets)', async () => {
    const auth = await freshAuth();
    const { jar } = await codeFlow(auth);

    const response = await auth.handler(
      new Request(`${ORIGIN}/api/auth/get-session`, { headers: { Cookie: header(jar) } }),
    );
    expect(response.status).toBe(200);
    const text = await response.text();
    const body = JSON.parse(text) as { user: Record<string, unknown>; session: Record<string, unknown> };

    expect(Object.keys(body.session).sort()).toEqual(
      ['createdAt', 'expiresAt', 'id', 'updatedAt', 'userId'],
    );
    // No `firstName`/`lastName`: enrichSessionUser no longer splits the name.
    expect(Object.keys(body.user).sort()).toEqual(
      ['createdAt', 'email', 'emailVerified', 'id', 'mpEmail', 'name', 'updatedAt', 'userGuid', 'userId'],
    );
    expect(body.user).toMatchObject({ userGuid: mockOidc.sub, userId: 4321, name: 'Hard Ening' });

    // The raw session token (the value before the cookie's signature) is gone.
    const cookieToken = [...jar].find(([name]) => name.endsWith('session_token'))![1];
    const rawToken = decodeURIComponent(cookieToken).split('.')[0];
    expect(text).not.toContain(rawToken);
    expect(text).not.toContain('hardening-test-agent');
  });
});

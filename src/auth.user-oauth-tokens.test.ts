// @vitest-environment node
// (node, not jsdom: better-auth verifies the id_token with `jose` over WebCrypto,
// which rejects jsdom-realm typed arrays.)
import { describe, it, expect, vi } from 'vitest';

/**
 * Guard for TODO security-unused-user-oauth-tokens-stored: the user's own MP
 * OAuth tokens are never used (all MP data access is the client-credentials
 * service account), so the app must not ask for a refresh token, must not put
 * the tokens in the browser (`account_data` cookie), and must not keep the
 * access/refresh tokens in the in-memory adapter.
 *
 * Signs in through the REAL `auth` instance with the full authorization-code
 * flow against a mock MP OIDC provider. `fetch` THROWS for any URL the mock
 * does not serve, so nothing here can reach a real Ministry Platform.
 */

const mockOidc = await vi.hoisted(async () => {
  const { generateKeyPairSync, sign } = await import('node:crypto');
  const base = 'https://test-mp.example.com';
  const issuer = `${base}/oauth`;
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key-1', alg: 'RS256', use: 'sig' };
  const sub = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

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
        access_token: 'access-token-user',
        refresh_token: 'refresh-token-user',
        id_token: signIdToken(),
        token_type: 'Bearer',
        expires_in: 3600,
      });
    }
    if (url === `${issuer}/connect/userinfo`) {
      return json({ sub, given_name: 'Token', family_name: 'Minimal' });
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

import { auth, stripUserOAuthTokens } from '@/lib/auth';

const ORIGIN = 'http://localhost:3000';

function cookiePairs(response: Response): Map<string, string> {
  const jar = new Map<string, string>();
  for (const line of response.headers.getSetCookie()) {
    const pair = line.split(';')[0];
    const eq = pair.indexOf('=');
    const value = pair.slice(eq + 1).trim();
    if (value !== '') jar.set(pair.slice(0, eq).trim(), value);
  }
  return jar;
}

const header = (jar: Map<string, string>) => [...jar].map(([k, v]) => `${k}=${v}`).join('; ');

async function signIn() {
  const start = await auth.handler(
    new Request(`${ORIGIN}/api/auth/sign-in/social`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
      body: JSON.stringify({ provider: 'ministry-platform', callbackURL: '/' }),
    }),
  );
  expect(start.status).toBe(200);
  const startCookies = cookiePairs(start);
  const { url } = (await start.json()) as { url: string };
  const authorizeUrl = new URL(url);

  const callback = await auth.handler(
    new Request(
      `${ORIGIN}/api/auth/callback/ministry-platform?code=test-code&state=${encodeURIComponent(
        authorizeUrl.searchParams.get('state')!,
      )}`,
      { headers: { Cookie: header(startCookies) } },
    ),
  );
  expect(callback.status).toBe(302);
  expect(callback.headers.get('location')).not.toMatch(/error/);
  const cookies = cookiePairs(callback);

  const session = await auth.api.getSession({ headers: new Headers({ Cookie: header(cookies) }) });
  expect(session?.user.userGuid).toBe(mockOidc.sub);
  const context = await auth.$context;
  const accounts = await context.internalAdapter.findAccounts(session!.user.id);
  return { authorizeUrl, cookies, accounts };
}

describe('user MP OAuth tokens are not requested or retained', () => {
  it('does not request offline_access (no refresh token is ever needed)', async () => {
    const { authorizeUrl } = await signIn();
    const scopes = authorizeUrl.searchParams.get('scope')!.split(' ');
    expect(scopes).toContain('openid');
    expect(scopes).not.toContain('offline_access');
  });

  it('sets no account_data cookie — only the session cookies reach the browser', async () => {
    const { cookies } = await signIn();
    const names = [...cookies.keys()];
    expect(names.some((n) => n.includes('account_data'))).toBe(false);
    expect(names.some((n) => n.endsWith('session_token'))).toBe(true);
    expect(names.some((n) => n.endsWith('session_data'))).toBe(true);
    for (const value of cookies.values()) {
      expect(value).not.toContain('access-token-user');
      expect(value).not.toContain('refresh-token-user');
    }
  });

  it('keeps no access/refresh token in the in-memory account row, on first and repeat sign-in', async () => {
    for (let i = 0; i < 2; i++) {
      const { accounts } = await signIn();
      expect(accounts).toHaveLength(1);
      const [account] = accounts;
      expect(account.accessToken ?? null).toBeNull();
      expect(account.refreshToken ?? null).toBeNull();
      expect(account.accessTokenExpiresAt ?? null).toBeNull();
      expect(account.refreshTokenExpiresAt ?? null).toBeNull();
      // Kept deliberately: not an API bearer; needed for a future id_token_hint.
      expect(account.idToken).toBeTruthy();
    }
  });
});

describe('stripUserOAuthTokens', () => {
  it('blanks the tokens and expiries and leaves everything else alone', () => {
    const input = {
      accountId: 'sub',
      providerId: 'ministry-platform',
      idToken: 'id',
      accessToken: 'a',
      refreshToken: 'r',
      accessTokenExpiresAt: new Date(),
      refreshTokenExpiresAt: new Date(),
    };
    expect(stripUserOAuthTokens(input)).toEqual({
      accountId: 'sub',
      providerId: 'ministry-platform',
      idToken: 'id',
      accessToken: null,
      refreshToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
    });
    expect(input.accessToken).toBe('a');
  });
});

// @vitest-environment node
// (node, not jsdom: better-auth verifies the id_token with `jose` over WebCrypto,
// which rejects jsdom-realm typed arrays.)
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { betterAuth } from 'better-auth';

/**
 * End-to-end guard for the `/sign-in/social` id_token token-substitution
 * account takeover (2026-09-28).
 *
 * better-auth's `/sign-in/social` has an id_token mode: given
 * `idToken: { token, accessToken }` it verifies the id_token (signature, iss,
 * aud) and then calls our `getUserInfo` with the CALLER'S access token. Because
 * `discoveryUrl` is set, that mode is live for the "ministry-platform"
 * provider. Nothing bound the verified id_token's `sub` to the access token's
 * userinfo `sub`, so an attacker's own valid id_token plus a victim's access
 * token minted a session as the victim.
 *
 * These tests drive the REAL `auth` instance from src/lib/auth.ts against a
 * mock MP OIDC provider (discovery, JWKS and userinfo), with id_tokens really
 * RS256-signed by a key the mock JWKS publishes — so better-auth's own
 * verification genuinely passes and the only thing standing between the
 * attacker and the victim's session is this app's code. `fetch` is stubbed to
 * THROW for any URL the mock doesn't serve: nothing here can reach a real
 * Ministry Platform.
 *
 * Two layers are proven independently here:
 * - `refuseIdTokenSignIn` (`hooks.before`) refuses the mode outright.
 * - With that hook removed, `getUserInfo`'s sub binding still refuses the
 *   substituted token (while the victim's own matched pair still works, which
 *   proves the mode really is live and the refusal is the binding).
 * The third layer, the route's body filter, is covered in
 * src/app/api/auth/[...all]/route.test.ts.
 */

const mockOidc = await vi.hoisted(async () => {
  const { generateKeyPairSync, sign } = await import('node:crypto');
  const base = 'https://test-mp.example.com';
  const issuer = `${base}/oauth`;
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key-1', alg: 'RS256', use: 'sig' };

  const subs = {
    attacker: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    victim: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  };
  const accessTokens: Record<string, string> = {
    'access-token-attacker': subs.attacker,
    'access-token-victim': subs.victim,
  };
  const userinfoCalls: string[] = [];

  const b64 = (v: unknown) => Buffer.from(JSON.stringify(v)).toString('base64url');
  function signIdToken(sub: string): string {
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
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

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
    if (url === `${issuer}/.well-known/openid-configuration/jwks`) {
      return json({ keys: [jwk] });
    }
    if (url === `${issuer}/connect/userinfo`) {
      const token = (request.headers.get('authorization') ?? '').replace(/^Bearer /, '');
      userinfoCalls.push(token);
      const sub = accessTokens[token];
      return sub
        ? json({ sub, given_name: 'Test', family_name: 'User', email: `${sub}@example.test` })
        : json({ error: 'invalid_token' }, 401);
    }
    throw new Error(`Blocked unexpected fetch in test: ${url}`);
  }) as typeof fetch;

  return { subs, signIdToken, userinfoCalls };
});

vi.mock('@/lib/providers/ministry-platform', () => ({
  MPHelper: class {
    getTableRecords = vi.fn().mockResolvedValue([]);
  },
}));

import { auth, ID_TOKEN_SIGN_IN_DISABLED } from '@/lib/auth';

const ORIGIN = 'http://localhost:3000';

function signInSocial(instance: { handler: (r: Request) => Promise<Response> }, body: unknown) {
  return instance.handler(
    new Request(`${ORIGIN}/api/auth/sign-in/social`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
      body: JSON.stringify(body),
    }),
  );
}

function sessionCookies(response: Response): string[] {
  return response.headers.getSetCookie().filter((c) => /session_token=/.test(c));
}

/** The attack body: attacker's own valid id_token, victim's access token. */
function attackBody() {
  return {
    provider: 'ministry-platform',
    idToken: {
      token: mockOidc.signIdToken(mockOidc.subs.attacker),
      accessToken: 'access-token-victim',
    },
  };
}

beforeEach(() => {
  mockOidc.userinfoCalls.length = 0;
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('refuseIdTokenSignIn (hooks.before) — primary control', () => {
  it('refuses the id_token mode over HTTP with 404 ID_TOKEN_SIGN_IN_DISABLED, minting no session', async () => {
    const response = await signInSocial(auth, attackBody());

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ code: ID_TOKEN_SIGN_IN_DISABLED });
    expect(sessionCookies(response)).toEqual([]);
    // Refused before better-auth ever used the caller's access token.
    expect(mockOidc.userinfoCalls).toEqual([]);
  });

  it('refuses the id_token mode for in-process auth.api.signInSocial calls too', async () => {
    await expect(auth.api.signInSocial({ body: attackBody() })).rejects.toMatchObject({
      statusCode: 404,
      body: expect.objectContaining({ code: ID_TOKEN_SIGN_IN_DISABLED }),
    });
    expect(mockOidc.userinfoCalls).toEqual([]);
  });

  it.each([
    ['null', null],
    ['an empty object', {}],
  ])('keys on the presence of idToken, not its truthiness (idToken: %s)', async (_label, idToken) => {
    const response = await signInSocial(auth, { provider: 'ministry-platform', idToken });

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ code: ID_TOKEN_SIGN_IN_DISABLED });
  });

  it('lets the normal redirect sign-in (no idToken) through to the authorize URL', async () => {
    const response = await signInSocial(auth, {
      provider: 'ministry-platform',
      callbackURL: '/',
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { url: string; redirect: boolean };
    expect(body.redirect).toBe(true);
    expect(body.url).toMatch(/^https:\/\/test-mp\.example\.com\/oauth\/connect\/authorize\?/);
  });

  it.each([
    ['JSON null', 'null'],
    ['a JSON string', '"idToken"'],
    ['a JSON array', '["idToken"]'],
  ])('does not throw on a non-object body (%s); schema validation rejects it instead', async (_label, raw) => {
    const response = await auth.handler(
      new Request(`${ORIGIN}/api/auth/sign-in/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
        body: raw,
      }),
    );

    expect(response.status).toBe(400);
    const body = (await response.json()) as { code?: string };
    expect(body.code).not.toBe(ID_TOKEN_SIGN_IN_DISABLED);
  });

  it('leaves other endpoints alone, even with an idToken key in the body', async () => {
    const getSession = await auth.handler(new Request(`${ORIGIN}/api/auth/get-session`));
    expect(getSession.status).toBe(200);

    const signOut = await auth.handler(
      new Request(`${ORIGIN}/api/auth/sign-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
        body: JSON.stringify({ idToken: 'x' }),
      }),
    );
    const text = await signOut.text();
    expect(text).not.toContain(ID_TOKEN_SIGN_IN_DISABLED);
  });
});

describe('getUserInfo sub binding — defence in depth, with the hook removed', () => {
  // Same config, same plugins, same getUserInfo — only the user hook is gone.
  const authWithoutHook = betterAuth({ ...auth.options, hooks: {} });

  it('refuses an attacker id_token paired with a victim access token', async () => {
    const response = await signInSocial(authWithoutHook, attackBody());

    // better-auth maps getUserInfo's null to FAILED_TO_GET_USER_INFO.
    expect(response.status).toBe(401);
    expect(sessionCookies(response)).toEqual([]);
    // The victim's token WAS used (the mode is live without the hook)...
    expect(mockOidc.userinfoCalls).toEqual(['access-token-victim']);
    // ...and the binding is what refused it.
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('"reason":"mismatch"'),
    );
  });

  it('control: a matched id_token + access token pair does sign in (the mode is live)', async () => {
    const response = await signInSocial(authWithoutHook, {
      provider: 'ministry-platform',
      idToken: {
        token: mockOidc.signIdToken(mockOidc.subs.victim),
        accessToken: 'access-token-victim',
      },
    });

    expect(response.status).toBe(200);
    expect(sessionCookies(response)).not.toEqual([]);
    const body = (await response.json()) as { user: { userGuid: string } };
    expect(body.user.userGuid).toBe(mockOidc.subs.victim);
  });
});

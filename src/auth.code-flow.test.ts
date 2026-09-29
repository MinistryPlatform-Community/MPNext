// @vitest-environment node
// (node, not jsdom: better-auth verifies the id_token with `jose` over WebCrypto,
// which rejects jsdom-realm typed arrays.)
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { betterAuth } from 'better-auth';
import { genericOAuth, type GenericOAuthConfig, type GenericOAuthOptions } from 'better-auth/plugins';

/**
 * End-to-end tests of `GET /api/auth/callback/ministry-platform` through the
 * REAL `auth.handler` (TODO security-auth-test-gaps #2, #4, #5):
 * - state validation: a missing, mismatched, cookie-less, tampered or expired
 *   state is refused before the code is ever redeemed;
 * - the code exchange (no PKCE verifier, since MP does not support PKCE);
 * - id_token verification against the mock JWKS (foreign key, wrong iss/aud,
 *   expired) and the app's userinfo sub binding;
 * - session minting (cookies set, `/get-session` resolves the MP identity);
 * - sign-out effectiveness on the same instance;
 * - `pkce: false` and `disableIdTokenNonceBinding: true`, pinned in config
 *   and behaviourally.
 *
 * The mock OIDC server (src/test-utils/mock-oidc.ts) signs real RS256
 * id_tokens with a key its JWKS publishes. `fetch` THROWS for any URL it does
 * not serve, so nothing here can reach a real Ministry Platform.
 */

const oidc = await vi.hoisted(async () =>
  (await import('@/test-utils/mock-oidc')).installMockOidc(),
);

vi.mock('@/lib/providers/ministry-platform', () => ({
  MPHelper: class {
    getTableRecords = vi.fn().mockResolvedValue([{ User_ID: 2468 }]);
  },
}));

import { auth } from '@/lib/auth';
import {
  CookieJar,
  MOCK_CLIENT_ID,
  MOCK_ISSUER,
  callback,
  codeFlow,
  getSession,
  startSignIn,
  type AuthLike,
} from '@/test-utils/mock-oidc';

const ORIGIN = 'http://localhost:3000';
const REDIRECT_URI = `${ORIGIN}/api/auth/callback/ministry-platform`;
const T0 = new Date('2026-09-29T08:00:00Z').getTime();
const MINUTE = 60 * 1000;

function getMpProviderConfig(): GenericOAuthConfig {
  const plugins = (auth.options as { plugins?: Array<Record<string, unknown>> }).plugins ?? [];
  const plugin = plugins.find((pl) => pl.id === 'generic-oauth') as { options?: GenericOAuthOptions } | undefined;
  const config = plugin?.options?.config?.find((c) => c.providerId === 'ministry-platform');
  if (!config) throw new Error('ministry-platform generic OAuth config not found');
  return config;
}

/** The real options with the MP provider config overridden. */
function withProviderConfig(overrides: Partial<GenericOAuthConfig>) {
  const plugins = (auth.options.plugins ?? []).map((plugin) =>
    plugin.id === 'generic-oauth' ? genericOAuth({ config: [{ ...getMpProviderConfig(), ...overrides }] }) : plugin,
  );
  return betterAuth({ ...auth.options, plugins });
}

const tokenCalls = () => oidc.calls.filter((c) => c.url === `${MOCK_ISSUER}/connect/token`);
const userinfoCalls = () => oidc.calls.filter((c) => c.url === `${MOCK_ISSUER}/connect/userinfo`);
const hasSessionCookie = (jar: CookieJar) => jar.get('session_token') !== undefined;

function loggedText(): string {
  return vi
    .mocked(console.error)
    .mock.calls.flat()
    .map((a) => (typeof a === 'string' ? a : a instanceof Error ? a.message : JSON.stringify(a)))
    .join('\n');
}

/** Asserts a refused callback: redirected to our error page with `code`, no session. */
function expectRefused(response: Response, code: string) {
  expect(response.status).toBe(302);
  const location = new URL(response.headers.get('location') ?? '', ORIGIN);
  expect(location.pathname).toBe('/auth-error');
  expect(location.searchParams.get('error')).toBe(code);
  expect(response.headers.getSetCookie().some((c) => /session_token=[^;]/.test(c))).toBe(false);
}

beforeEach(() => {
  oidc.reset();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(T0);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('the mock OIDC server', () => {
  it('throws for any URL it does not serve, so no test can reach a real Ministry Platform', async () => {
    await expect(fetch('https://mp.example.invalid/ministryplatformapi/tables/Contacts')).rejects.toThrow(
      /Blocked unexpected fetch in test: GET https:\/\/mp\.example\.invalid/,
    );
    await expect(fetch(`${MOCK_ISSUER}/connect/token`)).rejects.toThrow(/Blocked unexpected fetch/);
  });
});

describe('sign-in start: the authorize request', () => {
  it('sends a code request to MP with state, our redirect URI, the realm and scopes — and no nonce or PKCE', async () => {
    const { authorizeUrl, jar, response } = await startSignIn(auth, ORIGIN);

    expect(`${authorizeUrl.origin}${authorizeUrl.pathname}`).toBe(`${MOCK_ISSUER}/connect/authorize`);
    const q = authorizeUrl.searchParams;
    expect(q.get('response_type')).toBe('code');
    expect(q.get('client_id')).toBe(MOCK_CLIENT_ID);
    expect(q.get('redirect_uri')).toBe(REDIRECT_URI);
    expect(q.get('realm')).toBe('realm');
    expect(q.get('scope')?.split(' ')).toEqual(
      expect.arrayContaining(['openid', 'http://www.thinkministry.com/dataplatform/scopes/all']),
    );
    expect(q.get('scope')).not.toContain('offline_access');
    expect(q.get('state')).toMatch(/^.{32,}$/);
    // pkce: false — MP does not support PKCE.
    expect(q.has('code_challenge')).toBe(false);
    expect(q.has('code_challenge_method')).toBe(false);
    // disableIdTokenNonceBinding: true — MP does not echo `nonce`.
    expect(q.has('nonce')).toBe(false);

    // The state rides in an encrypted, HttpOnly, 10-minute cookie.
    const stateCookie = response.headers.getSetCookie().find((c) => c.startsWith('better-auth.oauth_state='));
    expect(stateCookie).toBeDefined();
    expect(stateCookie).toMatch(/; HttpOnly/i);
    expect(stateCookie).toMatch(/; SameSite=Lax/i);
    expect(stateCookie).toMatch(/; Max-Age=600/i);
    expect(jar.get('oauth_state')).not.toContain(q.get('state'));
  });
});

describe('callback: the happy path', () => {
  it('redeems the code, verifies the id_token, binds userinfo, mints a session and redirects to callbackURL', async () => {
    const { response, jar, location } = await codeFlow(auth, ORIGIN);

    expect(response.status).toBe(302);
    expect(location).toBe('/');

    // Code exchange: one token request with our code and redirect URI, no PKCE verifier.
    expect(tokenCalls()).toHaveLength(1);
    const body = new URLSearchParams(tokenCalls()[0].body);
    expect(body.get('grant_type')).toBe('authorization_code');
    expect(body.get('code')).toBe('test-code');
    expect(body.get('redirect_uri')).toBe(REDIRECT_URI);
    expect(body.has('code_verifier')).toBe(false);

    // Verified against the JWKS, then userinfo called with the MP access token.
    expect(oidc.calls.some((c) => c.url.endsWith('/.well-known/openid-configuration/jwks'))).toBe(true);
    expect(userinfoCalls()).toHaveLength(1);

    // Session minted; the one-time state cookie cleared.
    expect(hasSessionCookie(jar)).toBe(true);
    expect(jar.get('session_data')).toBeDefined();
    expect(jar.get('oauth_state')).toBeUndefined();
    const session = await getSession(auth, ORIGIN, jar);
    expect(session?.user).toMatchObject({ userGuid: oidc.sub, userId: 2468, name: 'Code Flow' });
  });
});

describe('callback: state validation', () => {
  it('refuses a callback with no state (state_not_found) and never redeems the code', async () => {
    const { jar } = await startSignIn(auth, ORIGIN);
    const response = await callback(auth, ORIGIN, { code: 'test-code' }, jar);

    expectRefused(response, 'state_not_found');
    expect(tokenCalls()).toEqual([]);
  });

  it('refuses a state that does not match the state cookie (state_mismatch)', async () => {
    const { jar } = await startSignIn(auth, ORIGIN);
    const response = await callback(auth, ORIGIN, { code: 'test-code', state: 'x'.repeat(32) }, jar);

    expectRefused(response, 'state_mismatch');
    expect(tokenCalls()).toEqual([]);
  });

  it("refuses a valid state presented without its cookie (another browser's callback)", async () => {
    const { authorizeUrl } = await startSignIn(auth, ORIGIN);
    const response = await callback(
      auth,
      ORIGIN,
      { code: 'test-code', state: authorizeUrl.searchParams.get('state')! },
      new CookieJar(),
    );

    expectRefused(response, 'state_mismatch');
    expect(tokenCalls()).toEqual([]);
  });

  it('refuses a state cookie that has been tampered with (state_invalid)', async () => {
    const { jar, authorizeUrl } = await startSignIn(auth, ORIGIN);
    const [name, value] = [...jar.cookies].find(([n]) => n.endsWith('oauth_state'))!;
    jar.cookies.set(name, `${value.slice(0, -4)}AAAA`);

    const response = await callback(
      auth,
      ORIGIN,
      { code: 'test-code', state: authorizeUrl.searchParams.get('state')! },
      jar,
    );

    expectRefused(response, 'state_invalid');
    expect(tokenCalls()).toEqual([]);
  });

  it('refuses a state older than 10 minutes, even with its cookie', async () => {
    const { jar, authorizeUrl } = await startSignIn(auth, ORIGIN);
    vi.setSystemTime(T0 + 10 * MINUTE + 1000);

    const response = await callback(
      auth,
      ORIGIN,
      { code: 'test-code', state: authorizeUrl.searchParams.get('state')! },
      jar,
    );

    expectRefused(response, 'state_mismatch');
    expect(tokenCalls()).toEqual([]);
  });

  it('control: the same state accepted at 9 minutes', async () => {
    const { jar, authorizeUrl } = await startSignIn(auth, ORIGIN);
    vi.setSystemTime(T0 + 9 * MINUTE);

    const response = await callback(
      auth,
      ORIGIN,
      { code: 'test-code', state: authorizeUrl.searchParams.get('state')! },
      jar,
    );

    expect(response.headers.get('location')).toBe('/');
  });

  it('passes a provider error (access_denied) to the error page without redeeming anything', async () => {
    const { jar, authorizeUrl } = await startSignIn(auth, ORIGIN);
    const response = await callback(
      auth,
      ORIGIN,
      { error: 'access_denied', state: authorizeUrl.searchParams.get('state')! },
      jar,
    );

    expectRefused(response, 'access_denied');
    expect(tokenCalls()).toEqual([]);
  });

  it('refuses a callback with state but no code (no_code)', async () => {
    const { jar, authorizeUrl } = await startSignIn(auth, ORIGIN);
    const response = await callback(auth, ORIGIN, { state: authorizeUrl.searchParams.get('state')! }, jar);

    expectRefused(response, 'no_code');
    expect(tokenCalls()).toEqual([]);
  });
});

describe('callback: id_token verification (the verified path)', () => {
  it.each<[string, () => void]>([
    ['signed by a key the JWKS does not publish', () => (oidc.state.foreignKey = true)],
    ['issued by another issuer', () => (oidc.state.claims = { iss: 'https://evil.example/oauth' })],
    ['issued for another client', () => (oidc.state.claims = { aud: 'another-client' })],
    ['already expired', () => (oidc.state.claims = { exp: Math.floor(T0 / 1000) - 60 })],
  ])('refuses an id_token %s, before userinfo is ever called', async (_label, arrange) => {
    arrange();
    const { response, jar } = await codeFlow(auth, ORIGIN);

    expectRefused(response, 'unable_to_get_user_info');
    expect(hasSessionCookie(jar)).toBe(false);
    expect(userinfoCalls()).toEqual([]);
    expect(loggedText()).toContain('id_token failed verification');
  });

  it('refuses a verified id_token whose sub differs from the userinfo sub (sub binding)', async () => {
    oidc.state.userinfo = { sub: '99999999-9999-4999-8999-999999999999' };
    const { response, jar } = await codeFlow(auth, ORIGIN);

    expectRefused(response, 'unable_to_get_user_info');
    expect(hasSessionCookie(jar)).toBe(false);
    expect(loggedText()).toContain('"reason":"mismatch"');
  });

  it('refuses a userinfo profile with no usable sub', async () => {
    oidc.state.userinfo = { sub: 'not-a-guid' };
    const { response } = await codeFlow(auth, ORIGIN);

    expectRefused(response, 'unable_to_get_user_info');
    expect(loggedText()).toContain('auth.userinfo.invalid_sub');
  });
});

describe('provider config pins (MP supports neither PKCE nor nonce echo)', () => {
  it('pins pkce: false and disableIdTokenNonceBinding: true', () => {
    const config = getMpProviderConfig();
    expect(config.pkce).toBe(false);
    expect(config.disableIdTokenNonceBinding).toBe(true);
  });

  it('the live provider verifies id_tokens (issuer + JWKS config) but does not require a nonce', async () => {
    const providers = (await (await auth.$context).socialProviders) as Array<{
      id: string;
      issuer?: string;
      idToken?: { issuer: string; audience: string };
      requiresIdTokenNonce: boolean;
    }>;
    const mp = providers.find((p) => p.id === 'ministry-platform');
    expect(mp?.issuer).toBe(MOCK_ISSUER);
    expect(mp?.idToken).toMatchObject({ issuer: MOCK_ISSUER, audience: MOCK_CLIENT_ID });
    expect(mp?.requiresIdTokenNonce).toBe(false);
  });

  it('negative control: with nonce binding on, the same MP-shaped id_token (no nonce) cannot sign in', async () => {
    const withNonce = withProviderConfig({ disableIdTokenNonceBinding: false });
    const { authorizeUrl } = await startSignIn(withNonce, ORIGIN);
    expect(authorizeUrl.searchParams.has('nonce')).toBe(true);

    const { response } = await codeFlow(withNonce, ORIGIN);
    expectRefused(response, 'unable_to_get_user_info');
  });

  it('negative control: with pkce on, a code_challenge is sent (which MP would reject)', async () => {
    const withPkce = withProviderConfig({ pkce: true });
    const { authorizeUrl } = await startSignIn(withPkce, ORIGIN);
    expect(authorizeUrl.searchParams.get('code_challenge_method')).toBe('S256');
  });
});

describe('sign-out effectiveness (same instance)', () => {
  async function signOutOverHttp(instance: AuthLike, jar: CookieJar) {
    const response = await instance.handler(
      new Request(`${ORIGIN}/api/auth/sign-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: jar.header() },
        body: '{}',
      }),
    );
    expect(response.status).toBe(200);
    return response;
  }

  it('sign-out expires both session cookies in the browser', async () => {
    const { jar } = await codeFlow(auth, ORIGIN);
    const response = await signOutOverHttp(auth, jar);

    const cleared = response.headers.getSetCookie().filter((c) => /session_(token|data)=/.test(c));
    expect(cleared.some((c) => c.startsWith('better-auth.session_token=') && /Max-Age=0/i.test(c))).toBe(true);
    expect(cleared.some((c) => c.startsWith('better-auth.session_data=') && /Max-Age=0/i.test(c))).toBe(true);
    jar.apply(response);
    expect(await getSession(auth, ORIGIN, jar)).toBeNull();
  });

  it('a replayed session_token is dead immediately after sign-out (the row is deleted)', async () => {
    const { jar } = await codeFlow(auth, ORIGIN);
    const tokenOnly = jar.only(/session_token$/);
    // Control: the token alone is a valid session before sign-out.
    expect((await getSession(auth, ORIGIN, tokenOnly))?.user.userGuid).toBe(oidc.sub);

    await signOutOverHttp(auth, jar);

    expect(await getSession(auth, ORIGIN, jar.only(/session_token$/))).toBeNull();
  });

  it('a replayed full cookie pair is dead once its cookie cache lapses (the documented ≤1h bound)', async () => {
    const { jar } = await codeFlow(auth, ORIGIN);
    const copied = new CookieJar(jar);
    await signOutOverHttp(auth, jar);

    // Accepted risk (see SESSION_EXPIRES_IN_SECONDS in src/lib/auth.ts): the
    // encrypted session_data may still be honoured until its 1h maxAge. Only
    // what is guaranteed is asserted: after that, the deleted row wins.
    vi.setSystemTime(T0 + 60 * MINUTE + 1000);
    expect(await getSession(auth, ORIGIN, copied)).toBeNull();
  });

  it('in-process auth.api.signOut (what the user-menu action calls) also deletes the row', async () => {
    const { jar } = await codeFlow(auth, ORIGIN);

    await auth.api.signOut({
      headers: new Headers({ Cookie: jar.header() }),
      body: { disableRedirect: true },
    });

    expect(await getSession(auth, ORIGIN, jar.only(/session_token$/))).toBeNull();
  });
});

// @vitest-environment node
// (node, not jsdom: better-auth verifies the id_token with `jose` over WebCrypto,
// which rejects jsdom-realm typed arrays.)
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { betterAuth } from 'better-auth';
import { symmetricDecodeJWT } from 'better-auth/crypto';

/**
 * Pins the session cookies the real `auth` instance actually sets (review item
 * security-auth-test-gaps #3), so a better-auth upgrade that changes stateless
 * defaults, or a config edit, cannot ship unnoticed:
 * - cookie names and prefix (`better-auth.*`, `__Secure-` over https);
 * - attributes: HttpOnly, SameSite=Lax, Path=/, Secure over https, and the
 *   Max-Age each cookie gets (12h session_token, 1h session_data);
 * - no account_data cookie (`storeAccountCookie: false`);
 * - `session_data` is a JWE whose DECRYPTED payload is better-auth's own
 *   session + user, not customSession's output (no `userId`);
 * - `expiresAt` is sign-in + 12h.
 * The option values themselves (`expiresIn`, `maxAge`, `strategy`,
 * `refreshCache`, `disableSessionRefresh`) and the clock walks are in
 * src/auth.session-lifetime.test.ts; this suite checks what reaches the wire.
 *
 * `fetch` THROWS for any URL the mock OIDC server does not serve.
 */

const oidc = await vi.hoisted(async () =>
  (await import('@/test-utils/mock-oidc')).installMockOidc(),
);

vi.mock('@/lib/providers/ministry-platform', () => ({
  MPHelper: class {
    getTableRecords = vi.fn().mockResolvedValue([{ User_ID: 1357 }]);
  },
}));

import { auth, SESSION_EXPIRES_IN_SECONDS, SESSION_COOKIE_CACHE_MAX_AGE_SECONDS } from '@/lib/auth';
import { codeFlow, getSession } from '@/test-utils/mock-oidc';

const HTTP_ORIGIN = 'http://localhost:3000';
const HTTPS_ORIGIN = 'https://app.example.test';
const T0 = new Date('2026-09-29T08:00:00Z').getTime();

/** Set-Cookie lines keyed by cookie name, attributes lower-cased for matching. */
function setCookies(response: Response): Map<string, { value: string; attrs: string[] }> {
  const out = new Map<string, { value: string; attrs: string[] }>();
  for (const line of response.headers.getSetCookie()) {
    const [pair, ...attrs] = line.split(';').map((s) => s.trim());
    const eq = pair.indexOf('=');
    out.set(pair.slice(0, eq), { value: pair.slice(eq + 1), attrs: attrs.map((a) => a.toLowerCase()) });
  }
  return out;
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

describe('session cookies over http (dev / test)', () => {
  it('sets exactly better-auth.session_token and better-auth.session_data, with the pinned attributes', async () => {
    const { response } = await codeFlow(auth, HTTP_ORIGIN);
    const cookies = setCookies(response);

    const sessionNames = [...cookies.keys()].filter((n) => /session|account/.test(n)).sort();
    expect(sessionNames).toEqual(['better-auth.session_data', 'better-auth.session_token']);

    const token = cookies.get('better-auth.session_token')!;
    expect(token.attrs).toEqual(
      expect.arrayContaining(['httponly', 'samesite=lax', 'path=/', `max-age=${SESSION_EXPIRES_IN_SECONDS}`]),
    );
    expect(token.attrs).not.toContain('secure');
    expect(token.attrs.some((a) => a.startsWith('domain='))).toBe(false);

    const data = cookies.get('better-auth.session_data')!;
    expect(data.attrs).toEqual(
      expect.arrayContaining([
        'httponly',
        'samesite=lax',
        'path=/',
        `max-age=${SESSION_COOKIE_CACHE_MAX_AGE_SECONDS}`,
      ]),
    );
  });

  it('pins the live cookie config the instance resolved', async () => {
    const context = await auth.$context;
    expect(context.authCookies.sessionToken).toEqual({
      name: 'better-auth.session_token',
      attributes: { secure: false, sameSite: 'lax', path: '/', httpOnly: true, maxAge: 12 * 60 * 60 },
    });
    expect(context.authCookies.sessionData).toEqual({
      name: 'better-auth.session_data',
      attributes: { secure: false, sameSite: 'lax', path: '/', httpOnly: true, maxAge: 60 * 60 },
    });
  });

  it('expiresAt is sign-in + 12h', async () => {
    const { jar } = await codeFlow(auth, HTTP_ORIGIN);
    const session = await getSession(auth, HTTP_ORIGIN, jar);
    expect(new Date(String(session?.session.expiresAt)).getTime()).toBe(T0 + 12 * 60 * 60 * 1000);
  });
});

describe('session cookies over https (production shape)', () => {
  const httpsAuth = betterAuth({ ...auth.options, baseURL: HTTPS_ORIGIN });

  it('uses the __Secure- prefix and the Secure attribute on every auth cookie', async () => {
    const { response, jar } = await codeFlow(httpsAuth, HTTPS_ORIGIN);
    const cookies = setCookies(response);

    for (const name of ['__Secure-better-auth.session_token', '__Secure-better-auth.session_data']) {
      expect(cookies.get(name)?.attrs).toEqual(expect.arrayContaining(['secure', 'httponly', 'samesite=lax']));
    }
    for (const [name] of cookies) expect(name.startsWith('__Secure-')).toBe(true);
    // …and the session still resolves from the prefixed cookies.
    expect((await getSession(httpsAuth, HTTPS_ORIGIN, jar))?.user.userGuid).toBe(oidc.sub);
  });
});

describe('what the session_data cookie contains', () => {
  it('decrypts to better-auth session + user only — customSession output is not written into the cookie', async () => {
    const { jar } = await codeFlow(auth, HTTP_ORIGIN);
    const context = await auth.$context;

    const payload = (await symmetricDecodeJWT(
      jar.get('session_data')!,
      context.secretConfig,
      'better-auth-session',
    )) as { session: Record<string, unknown>; user: Record<string, unknown> } | null;

    expect(payload).not.toBeNull();
    const { user, session } = payload!;
    expect(user.userGuid).toBe(oidc.sub);
    // `userId` is added by customSession (enrichSessionUser) on read, never stored.
    expect(user).not.toHaveProperty('userId');
    expect(Object.keys(user).sort()).toEqual(
      ['createdAt', 'email', 'emailVerified', 'id', 'mpEmail', 'name', 'updatedAt', 'userGuid'],
    );
    // The raw row, token/IP/UA included: these stay inside the encrypted
    // cookie and are stripped only from the /get-session response (see
    // src/auth.oidc-hardening.test.ts).
    expect(Object.keys(session).sort()).toEqual(
      ['createdAt', 'expiresAt', 'id', 'ipAddress', 'token', 'updatedAt', 'userAgent', 'userId'],
    );
    expect(session.userId).toBe(user.id);
    expect(payload).toMatchObject({ version: '1', exp: Math.floor(T0 / 1000) + SESSION_COOKIE_CACHE_MAX_AGE_SECONDS });

    // The enriched value is what /get-session hands out.
    expect((await getSession(auth, HTTP_ORIGIN, jar))?.user.userId).toBe(1357);
  });
});

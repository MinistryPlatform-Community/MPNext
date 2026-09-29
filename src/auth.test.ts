import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseAdditionalUserInputFromProviderProfile } from 'better-auth/db';
import type {
  GenericOAuthConfig,
  GenericOAuthOptions,
} from 'better-auth/plugins';
import type { OAuth2Tokens } from '@better-auth/core/oauth2';
import type { GenericEndpointContext } from '@better-auth/core';
import { handleOAuthUserInfo } from 'better-auth/oauth2';

const { mockGetTableRecords } = vi.hoisted(() => ({
  mockGetTableRecords: vi.fn(),
}));

// MPHelper is mocked as a class (not vi.fn().mockImplementation) so `new MPHelper()`
// inside resolveMpUserId picks up the stubbed method — see .claude/references/testing.md.
vi.mock('@/lib/providers/ministry-platform', () => ({
  MPHelper: class {
    getTableRecords = mockGetTableRecords;
  },
}));

import {
  auth,
  userAdditionalFields,
  enrichSessionUser,
  syntheticEmailForSub,
  USER_ID_FAILURE_CACHE_TTL_MS,
  USER_ID_NOT_FOUND_CACHE_TTL_MS,
  USERINFO_TIMEOUT_MS,
} from '@/lib/auth';

/**
 * An UNSIGNED compact JWT carrying the given payload. `getUserInfo` reads
 * `sub`, `exp`, `aud` and `azp` from the id_token without verifying it
 * (genericOAuth's wrapper verifies the signature before calling it — see
 * `readIdTokenClaims` in src/lib/auth.ts), so calling the configured
 * `getUserInfo` directly needs no real signature. `exp` defaults to five
 * minutes from now, since `getUserInfo` refuses a token without one; pass
 * `exp: undefined` to omit it. src/auth.id-token-sign-in.test.ts covers the
 * signed, end-to-end path.
 */
function fakeIdToken(payload: Record<string, unknown>): string {
  const enc = (v: unknown) => Buffer.from(JSON.stringify(v)).toString('base64url');
  const claims = { exp: Math.floor(Date.now() / 1000) + 300, ...payload };
  return `${enc({ alg: 'RS256', typ: 'JWT' })}.${enc(claims)}.sig`;
}

/**
 * Auth Tests
 *
 * Tests for the Better Auth configuration in src/lib/auth.ts.
 * - enrichSessionUser: the customSession callback body — name splitting plus the
 *   cached dp_Users User_ID lookup that backs MP write attribution
 * - getUserInfo: fetches the OIDC profile and returns `sub` (better-auth 1.7
 *   resolves the account subject from it for OIDC discovery providers)
 * - mapProfileToUser: stores the OAuth sub claim as userGuid (additionalField)
 * - User profile loading is handled client-side by UserProvider
 */
/**
 * These tests invoke the REAL `enrichSessionUser` exported from src/lib/auth.ts,
 * which is the body of the `customSession` callback. An earlier version of this
 * block re-implemented the name-splitting inside the test and asserted against
 * its own copy, so it passed even if the callback were deleted outright. Do not
 * reintroduce that pattern: assert against the imported function.
 *
 * `userIdCache` in auth.ts is module-level and persists for the lifetime of this
 * test file, so each test that cares about lookup counts uses its own GUID.
 */
describe('Auth - enrichSessionUser', () => {
  const session = { id: 'session-123', token: 'tok', userId: 'ba-internal-id' };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGetTableRecords.mockResolvedValue([{ User_ID: 4242 }]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('User fields', () => {
    it('passes the user through and adds only userId (no firstName/lastName split)', async () => {
      const user = {
        id: 'ba-internal-id',
        name: 'Mary Jane Van Der Berg',
        email: 'x@mp.invalid',
        userGuid: 'ab12cd34-ef56-7890-abcd-ef1234501001',
      };
      const result = await enrichSessionUser(user, session);

      // Exact key set: the split fields were dropped (nothing read them, and a
      // name missing a part produced "undefined").
      expect(Object.keys(result.user).sort()).toEqual(
        ['email', 'id', 'name', 'userGuid', 'userId'],
      );
      expect(result.user).toMatchObject({ ...user, userId: 4242 });
    });
  });

  describe('Session structure', () => {
    it('should preserve user.id and userGuid as distinct values', async () => {
      const result = await enrichSessionUser(
        {
          id: 'ba-internal-id',
          name: 'John Doe',
          email: 'john@example.com',
          userGuid: 'ab12cd34-ef56-7890-abcd-ef1234501006',
        },
        session,
      );

      // user.id is Better Auth's internal ID, NOT the MP User_GUID.
      expect(result.user.id).toBe('ba-internal-id');
      // userGuid is the MP User_GUID, stored via additionalFields + mapProfileToUser.
      expect(result.user.userGuid).toBe('ab12cd34-ef56-7890-abcd-ef1234501006');
    });

    /**
     * TODO security-client-data-overexposure: `/get-session` must not hand page
     * JS the raw session token (a bearer credential if a `bearer` plugin is ever
     * added) or the recorded IP / user agent.
     */
    it('withholds token, ipAddress and userAgent from the session (exact key set)', async () => {
      const fullSession = {
        id: 'session-123',
        token: 'raw-session-token',
        userId: 'ba-internal-id',
        expiresAt: new Date('2026-09-29T12:00:00Z'),
        createdAt: new Date('2026-09-29T00:00:00Z'),
        updatedAt: new Date('2026-09-29T00:00:00Z'),
        ipAddress: '203.0.113.7',
        userAgent: 'Mozilla/5.0 test',
      };
      const result = await enrichSessionUser(
        { id: 'ba-internal-id', name: 'John Doe', userGuid: 'ab12cd34-ef56-7890-abcd-ef1234501007' },
        fullSession,
      );

      expect(Object.keys(result.session).sort()).toEqual(
        ['createdAt', 'expiresAt', 'id', 'updatedAt', 'userId'],
      );
      expect(result.session).toEqual({
        id: 'session-123',
        userId: 'ba-internal-id',
        expiresAt: fullSession.expiresAt,
        createdAt: fullSession.createdAt,
        updatedAt: fullSession.updatedAt,
      });
      // A copy: better-auth's own session object is left untouched.
      expect(result.session).not.toBe(fullSession);
      expect(fullSession.token).toBe('raw-session-token');
    });

    it('should not add userProfile to the session', async () => {
      // The MP profile is loaded client-side by UserProvider, not baked into the
      // session — a stateless JWT cookie cache cannot carry it cheaply.
      const result = await enrichSessionUser(
        { id: 'ba-internal-id', name: 'John Doe', userGuid: 'ab12cd34-ef56-7890-abcd-ef1234501008' },
        session,
      );

      expect(result.user).not.toHaveProperty('userProfile');
      expect(result.session).not.toHaveProperty('userProfile');
    });
  });

  describe('User_ID resolution', () => {
    it('should resolve the MP User_ID from dp_Users and expose it as userId', async () => {
      const userGuid = 'ab12cd34-ef56-7890-abcd-ef1234502001';
      mockGetTableRecords.mockResolvedValueOnce([{ User_ID: 4242 }]);

      const result = await enrichSessionUser({ id: 'ba', name: 'John Doe', userGuid }, session);

      expect(result.user.userId).toBe(4242);
      expect(mockGetTableRecords).toHaveBeenCalledWith({
        table: 'dp_Users',
        filter: `User_GUID = '${userGuid}'`,
        select: 'User_ID',
        top: 1,
      });
    });

    it('should cache the lookup so a repeat session costs no MP call', async () => {
      const userGuid = 'ab12cd34-ef56-7890-abcd-ef1234502002';
      mockGetTableRecords.mockResolvedValue([{ User_ID: 99 }]);

      const first = await enrichSessionUser({ id: 'ba', name: 'John Doe', userGuid }, session);
      const second = await enrichSessionUser({ id: 'ba', name: 'John Doe', userGuid }, session);

      expect(first.user.userId).toBe(99);
      expect(second.user.userId).toBe(99);
      expect(mockGetTableRecords).toHaveBeenCalledTimes(1);
    });

    it('should look up each distinct userGuid separately', async () => {
      mockGetTableRecords
        .mockResolvedValueOnce([{ User_ID: 1 }])
        .mockResolvedValueOnce([{ User_ID: 2 }]);

      const a = await enrichSessionUser(
        { id: 'ba', name: 'A A', userGuid: 'ab12cd34-ef56-7890-abcd-ef1234502003' },
        session,
      );
      const b = await enrichSessionUser(
        { id: 'ba', name: 'B B', userGuid: 'ab12cd34-ef56-7890-abcd-ef1234502004' },
        session,
      );

      expect(a.user.userId).toBe(1);
      expect(b.user.userId).toBe(2);
      expect(mockGetTableRecords).toHaveBeenCalledTimes(2);
    });

    it('should skip the lookup entirely when the user has no userGuid', async () => {
      const result = await enrichSessionUser({ id: 'ba', name: 'John Doe' }, session);

      expect(result.user.userId).toBeNull();
      expect(mockGetTableRecords).not.toHaveBeenCalled();
    });

    it('should treat an empty userGuid as no userGuid', async () => {
      const result = await enrichSessionUser(
        { id: 'ba', name: 'John Doe', userGuid: '' },
        session,
      );

      expect(result.user.userId).toBeNull();
      expect(mockGetTableRecords).not.toHaveBeenCalled();
    });

    it('should return a null userId when dp_Users has no matching row', async () => {
      mockGetTableRecords.mockResolvedValueOnce([]);

      const result = await enrichSessionUser(
        { id: 'ba', name: 'John Doe', userGuid: 'ab12cd34-ef56-7890-abcd-ef1234502005' },
        session,
      );

      expect(result.user.userId).toBeNull();
    });

    it('should return a null userId when the row has no User_ID', async () => {
      mockGetTableRecords.mockResolvedValueOnce([{ User_ID: 0 }]);

      const result = await enrichSessionUser(
        { id: 'ba', name: 'John Doe', userGuid: 'ab12cd34-ef56-7890-abcd-ef1234502006' },
        session,
      );

      expect(result.user.userId).toBeNull();
    });

    it('should never block session creation when the MP lookup throws', async () => {
      // A failed User_ID lookup must degrade to null, not reject — otherwise a
      // transient MP outage logs every user out. The missing attribution surfaces
      // later as the mp.write.non_user warning at write time.
      mockGetTableRecords.mockRejectedValueOnce(new Error('MP unreachable'));

      const result = await enrichSessionUser(
        { id: 'ba', name: 'John Doe', userGuid: 'ab12cd34-ef56-7890-abcd-ef1234502008' },
        session,
      );

      expect(result.user.userId).toBeNull();
      expect(result.user.name).toBe('John Doe');
      expect(console.error).toHaveBeenCalled();
    });

    /**
     * TODO security-resolve-mp-user-id-logs-guid-and-no-negative-cache: the
     * failure log is a structured event with no GUID, and never the error
     * message (an MP client error can carry the `$filter`, which holds the GUID).
     */
    it('logs a structured event that never contains the GUID or the error message', async () => {
      const userGuid = 'ab12cd34-ef56-7890-abcd-ef1234502009';
      mockGetTableRecords.mockRejectedValueOnce(
        new Error(`GET /tables/dp_Users?$filter=User_GUID = '${userGuid}' failed`),
      );

      await enrichSessionUser({ id: 'ba', name: 'John Doe', userGuid }, session);

      const calls = vi.mocked(console.error).mock.calls;
      expect(calls).toHaveLength(1);
      const logged = calls.flat().map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
      expect(logged.toLowerCase()).not.toContain(userGuid.toLowerCase());
      expect(logged).not.toContain('dp_Users?$filter');
      expect(JSON.parse(String(calls[0][0]))).toEqual({
        event: 'auth.session.user_id_unresolved',
        message: expect.any(String),
        reason: 'lookup_failed',
        errName: 'Error',
      });
    });

    it('should reject a malformed userGuid rather than interpolating it into the filter', async () => {
      // resolveMpUserId runs the GUID through sanitizeGuid, which throws on a
      // non-canonical value. The throw is caught, so the session still succeeds.
      const result = await enrichSessionUser(
        { id: 'ba', name: 'John Doe', userGuid: "' OR 1=1 --" },
        session,
      );

      expect(result.user.userId).toBeNull();
      expect(mockGetTableRecords).not.toHaveBeenCalled();
    });
  });
});

/**
 * Negative cache for `resolveMpUserId` (TODO
 * security-resolve-mp-user-id-logs-guid-and-no-negative-cache). customSession
 * runs on every `/get-session`, so an uncached failure cost one MP query (and
 * one log line) per request. Fake `Date` only: the module-level cache compares
 * against `Date.now()`.
 */
describe('Auth - enrichSessionUser negative cache', () => {
  const session = { id: 'session-123', userId: 'ba-internal-id' };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-29T08:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('pins the windows (30 s after an error, 5 min for "no such user")', () => {
    expect(USER_ID_FAILURE_CACHE_TTL_MS).toBe(30 * 1000);
    expect(USER_ID_NOT_FOUND_CACHE_TTL_MS).toBe(5 * 60 * 1000);
  });

  it('makes at most one MP call, and logs once, while MP is failing within the window', async () => {
    const userGuid = 'ab12cd34-ef56-7890-abcd-ef1234502101';
    mockGetTableRecords.mockRejectedValue(new Error('MP unreachable'));

    for (let i = 0; i < 5; i++) {
      vi.setSystemTime(Date.now() + 5_000);
      const result = await enrichSessionUser({ id: 'ba', name: 'A B', userGuid }, session);
      expect(result.user.userId).toBeNull();
    }
    // 5 calls spread over 25 s — all inside the 30 s window.
    expect(mockGetTableRecords).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it('retries after the failure window, and recovers attribution once MP is back', async () => {
    const userGuid = 'ab12cd34-ef56-7890-abcd-ef1234502102';
    mockGetTableRecords.mockRejectedValueOnce(new Error('MP unreachable')).mockResolvedValue([{ User_ID: 77 }]);

    const first = await enrichSessionUser({ id: 'ba', name: 'A B', userGuid }, session);
    vi.setSystemTime(Date.now() + USER_ID_FAILURE_CACHE_TTL_MS - 1);
    const inside = await enrichSessionUser({ id: 'ba', name: 'A B', userGuid }, session);
    expect(mockGetTableRecords).toHaveBeenCalledTimes(1);

    vi.setSystemTime(Date.now() + 1);
    const after = await enrichSessionUser({ id: 'ba', name: 'A B', userGuid }, session);

    expect(first.user.userId).toBeNull();
    expect(inside.user.userId).toBeNull();
    expect(after.user.userId).toBe(77);
    expect(mockGetTableRecords).toHaveBeenCalledTimes(2);
  });

  it('remembers "no such user" for the longer window, then re-reads dp_Users', async () => {
    const userGuid = 'ab12cd34-ef56-7890-abcd-ef1234502103';
    mockGetTableRecords.mockResolvedValueOnce([]).mockResolvedValue([{ User_ID: 88 }]);

    const t0 = Date.now();
    const first = await enrichSessionUser({ id: 'ba', name: 'A B', userGuid }, session);
    // Past the error window, still inside the not-found window: no MP call.
    vi.setSystemTime(t0 + USER_ID_FAILURE_CACHE_TTL_MS + 1);
    await enrichSessionUser({ id: 'ba', name: 'A B', userGuid }, session);
    vi.setSystemTime(t0 + USER_ID_NOT_FOUND_CACHE_TTL_MS - 1);
    const inside = await enrichSessionUser({ id: 'ba', name: 'A B', userGuid }, session);
    expect(mockGetTableRecords).toHaveBeenCalledTimes(1);

    vi.setSystemTime(t0 + USER_ID_NOT_FOUND_CACHE_TTL_MS);
    const after = await enrichSessionUser({ id: 'ba', name: 'A B', userGuid }, session);

    expect(first.user.userId).toBeNull();
    expect(inside.user.userId).toBeNull();
    expect(after.user.userId).toBe(88);
    expect(mockGetTableRecords).toHaveBeenCalledTimes(2);
    // "No such user" is an answer, not an error: nothing is logged.
    expect(console.error).not.toHaveBeenCalled();
  });

  it('negative-caches a malformed userGuid too (sanitizeGuid throws before any MP call)', async () => {
    const userGuid = "' OR 1=1 -- negative-cache";
    await enrichSessionUser({ id: 'ba', name: 'A B', userGuid }, session);
    await enrichSessionUser({ id: 'ba', name: 'A B', userGuid }, session);

    expect(mockGetTableRecords).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledTimes(1);
  });
});

describe('Auth - OAuth Configuration', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Reach into the real configured provider rather than re-simulating it, so
   * these tests break when `src/lib/auth.ts` drifts from the contract
   * better-auth actually enforces.
   */
  function getMpProviderConfig(): GenericOAuthConfig {
    const plugins =
      (auth.options as { plugins?: Array<Record<string, unknown>> }).plugins ?? [];
    const plugin = plugins.find((pl) => pl.id === 'generic-oauth') as
      | { options?: GenericOAuthOptions }
      | undefined;
    const config = plugin?.options?.config?.find(
      (c) => c.providerId === 'ministry-platform',
    );
    if (!config) throw new Error('ministry-platform generic OAuth config not found');
    return config;
  }

  it('should configure Ministry Platform as generic OAuth provider', () => {
    const config = getMpProviderConfig();

    expect(config.providerId).toBe('ministry-platform');
    expect(config.scopes).toContain('openid');
    // No refresh token is ever used, so none is requested.
    expect(config.scopes).not.toContain('offline_access');
    expect(config.scopes).toContain(
      'http://www.thinkministry.com/dataplatform/scopes/all',
    );
    // MP does not support PKCE; better-auth 1.7 defaults it to true (OAuth
    // 2.1), so this must stay explicitly false (accepted risk F8 — see the
    // nonce comment in src/lib/auth.ts).
    expect(config.pkce).toBe(false);
    // A partial discovery document must not silently disable id_token
    // verification. Behavioural guard: src/auth.oidc-hardening.test.ts.
    expect(config.requireIdTokenVerification).toBe(true);
    expect(config.authorizationUrlParams).toEqual({ realm: 'realm' });
  });

  /**
   * Regression guard for the better-auth 1.7 account-identity churn.
   *
   * 1.7.0–1.7.2 keyed accounts on (issuer, accountId) and refused to initialize
   * a discovery provider whose issuer it could not resolve, which is why this
   * config used to set an explicit `accountIssuer`. 1.7.3 reverted that:
   * accounts are identified by (providerId, accountId) as in 1.6 (#11153), and
   * a discovery failure no longer takes down the auth API (#10978).
   *
   * That makes `providerId` the whole stable half of the account key again — if
   * it ever drifts, every existing user silently becomes a new account. Assert
   * it stays pinned, and that the removed issuer option has not crept back in
   * (it would now be silently ignored rather than rejected at runtime).
   */
  it('keys accounts on a stable providerId, with no issuer pinning', () => {
    const config = getMpProviderConfig();

    expect(config.providerId).toBe('ministry-platform');
    expect(config).not.toHaveProperty('accountIssuer');
  });

  /**
   * F7 security-review guard: OAuth callback failures must land on this app's
   * own page, not better-auth's built-in `/api/auth/error` (which the route
   * allowlist in src/app/api/auth/[...all]/route.ts no longer exposes — see
   * `allowedAuthRoutes`). See src/app/auth-error/page.tsx and its test.
   */
  it('redirects OAuth callback failures to our own /auth-error page', () => {
    expect(auth.options.onAPIError?.errorURL).toBe('/auth-error');
  });

  /**
   * Regression guard for the better-auth 1.7 generic-OAuth rewrite.
   *
   * MP's discovery document advertises `id_token_signing_alg_values_supported`,
   * so better-auth treats this provider as OIDC and its default
   * `accountSubject` resolver reads `profile.sub` off the raw profile returned
   * by `getUserInfo`. Before 1.7 the resolver fell back to `profile.id`; that
   * fallback is gone, so returning only `id` (the pre-1.7 shape) resolves the
   * account subject to "" and breaks account identity for every user.
   */
  it('returns sub (not id) from getUserInfo (better-auth 1.7 guard)', async () => {
    const config = getMpProviderConfig();
    const guid = 'ab12cd34-ef56-7890-abcd-ef1234567890';

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          sub: guid,
          given_name: 'John',
          family_name: 'Doe',
          email: 'john@example.com',
          email_verified: true,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const profile = await config.getUserInfo!({
      accessToken: 'access-token',
      idToken: fakeIdToken({ sub: guid }),
    } as OAuth2Tokens);

    expect(fetchSpy).toHaveBeenCalledWith(
      `${process.env.MINISTRY_PLATFORM_BASE_URL}/oauth/connect/userinfo`,
      {
        headers: { Authorization: 'Bearer access-token' },
        signal: expect.any(AbortSignal),
        redirect: 'error',
      },
    );
    // This is the field better-auth resolves the account subject from.
    expect(profile).toMatchObject({
      sub: guid,
      name: 'John Doe',
      email: 'john@example.com',
      emailVerified: true,
    });
  });

  /**
   * F2 security-review guard: `emailVerified` must reflect MP's own claim,
   * not be hardcoded. better-auth's OAuth callback uses this value to decide
   * whether to implicitly link an incoming OAuth account onto an existing
   * user by email match (node_modules/better-auth/dist/oauth2/link-account.mjs).
   * MP's userinfo response may omit `email_verified` entirely, so the default
   * MUST be false, never true. See also the `accountLinking.enabled: false`
   * guard below, which is the primary fix — this guards the claim feeding it.
   */
  it('defaults emailVerified to false when MP userinfo omits email_verified (F2 guard)', async () => {
    const config = getMpProviderConfig();
    const guid = 'ab12cd34-ef56-7890-abcd-ef1234598001';

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          sub: guid,
          given_name: 'Jane',
          family_name: 'Roe',
          email: 'jane@example.com',
          // no email_verified claim
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const profile = await config.getUserInfo!({
      accessToken: 'access-token',
      idToken: fakeIdToken({ sub: guid }),
    } as OAuth2Tokens);

    expect(profile).toMatchObject({ emailVerified: false });
  });

  it('sets emailVerified true only when MP userinfo explicitly claims it (F2 guard)', async () => {
    const config = getMpProviderConfig();
    const guid = 'ab12cd34-ef56-7890-abcd-ef1234598002';

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          sub: guid,
          given_name: 'Jane',
          family_name: 'Roe',
          email: 'jane@example.com',
          email_verified: true,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const profile = await config.getUserInfo!({
      accessToken: 'access-token',
      idToken: fakeIdToken({ sub: guid }),
    } as OAuth2Tokens);

    expect(profile).toMatchObject({ emailVerified: true });
  });

  it('returns null from getUserInfo when the userinfo request fails', async () => {
    const config = getMpProviderConfig();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 401 }),
    );
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      config.getUserInfo!({
        accessToken: 'bad-token',
        idToken: fakeIdToken({ sub: 'ab12cd34-ef56-7890-abcd-ef1234598003' }),
      } as OAuth2Tokens),
    ).resolves.toBeNull();
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(errorSpy.mock.calls[0][0]))).toEqual({
      event: 'auth.userinfo.fetch_failed',
      message: expect.any(String),
      reason: 'http_status',
      status: 401,
    });
  });

  /**
   * TODO security-get-user-info-robustness: `getUserInfo`'s contract is
   * "return null, never throw" (a throw is not caught by better-auth's callback
   * route), so every way the userinfo request can go wrong must come back as
   * null plus a structured log with no body and no token.
   */
  describe('userinfo request robustness', () => {
    const guid = 'ab12cd34-ef56-7890-abcd-ef1234596001';
    const tokens = () =>
      ({ accessToken: 'secret-access-token', idToken: fakeIdToken({ sub: guid }) }) as OAuth2Tokens;

    function loggedEvent(spy: { mock: { calls: unknown[][] } }) {
      expect(spy.mock.calls).toHaveLength(1);
      const [line] = spy.mock.calls[0];
      expect(String(line)).not.toContain('secret-access-token');
      return JSON.parse(String(line)) as Record<string, unknown>;
    }

    it('returns null (does not throw) when fetch rejects (network error / timeout)', async () => {
      const config = getMpProviderConfig();
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const timeout = new DOMException('The operation was aborted due to timeout', 'TimeoutError');
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(timeout);

      await expect(config.getUserInfo!(tokens())).resolves.toBeNull();
      expect(loggedEvent(errorSpy)).toEqual({
        event: 'auth.userinfo.fetch_failed',
        message: expect.any(String),
        reason: 'request_failed',
        errName: 'TimeoutError',
      });
    });

    it('returns null when fetch rejects with a non-Error value', async () => {
      const config = getMpProviderConfig();
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(globalThis, 'fetch').mockRejectedValue('boom');

      await expect(config.getUserInfo!(tokens())).resolves.toBeNull();
      expect(loggedEvent(errorSpy)).toMatchObject({ reason: 'request_failed', errName: 'string' });
    });

    it('returns null for a non-JSON 200 (a proxy HTML error page), without logging the body', async () => {
      const config = getMpProviderConfig();
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('<html>Gateway says hi to member@example.com</html>', {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }),
      );

      await expect(config.getUserInfo!(tokens())).resolves.toBeNull();
      const event = loggedEvent(errorSpy);
      expect(event).toMatchObject({ event: 'auth.userinfo.fetch_failed', reason: 'invalid_json', errName: 'SyntaxError' });
      expect(JSON.stringify(event)).not.toContain('member@example.com');
    });

    it.each([
      ['null', 'null'],
      ['an array', '[]'],
      ['a string', '"sub"'],
    ])('returns null when the JSON body is %s (not an object)', async (_label, body) => {
      const config = getMpProviderConfig();
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } }),
      );

      await expect(config.getUserInfo!(tokens())).resolves.toBeNull();
      expect(loggedEvent(errorSpy)).toMatchObject({ reason: 'not_an_object' });
    });

    it('sets a timeout and refuses redirects on the userinfo request', async () => {
      expect(USERINFO_TIMEOUT_MS).toBe(10_000);
      const config = getMpProviderConfig();
      const timeoutSpy = vi.spyOn(AbortSignal, 'timeout');
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ sub: guid }), { status: 200 }),
      );

      await config.getUserInfo!(tokens());

      expect(timeoutSpy).toHaveBeenCalledWith(USERINFO_TIMEOUT_MS);
      const init = fetchSpy.mock.calls[0][1]!;
      expect(init.redirect).toBe('error');
      expect(init.signal).toBe(timeoutSpy.mock.results[0].value);
    });

    it.each([
      ['given_name missing', { family_name: 'Doe' }, 'Doe'],
      ['family_name missing', { given_name: 'Pat' }, 'Pat'],
      ['both missing, name present', { name: 'Pat Doe' }, 'Pat Doe'],
      ['nothing usable', { given_name: 42, family_name: null, name: {} }, ''],
      ['whitespace parts', { given_name: '  Pat ', family_name: ' ' }, 'Pat'],
    ])('builds the display name from string claims only (%s)', async (_label, claims, expected) => {
      const config = getMpProviderConfig();
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ sub: guid, ...claims }), { status: 200 }),
      );

      const profile = await config.getUserInfo!(tokens());

      expect(profile?.name).toBe(expected);
      expect(profile?.name).not.toContain('undefined');
    });
  });

  /**
   * TODO security-id-token-claim-checks-weak: jose checks `exp` only when it
   * is present, and nothing checks `azp` for a multi-audience token, so
   * `getUserInfo` does both (before spending a userinfo call).
   */
  describe('id_token claim checks', () => {
    const guid = 'ab12cd34-ef56-7890-abcd-ef1234595001';
    const clientId = process.env.OIDC_CLIENT_ID!;

    function mockUserinfo() {
      return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ sub: guid, given_name: 'Pat', family_name: 'Doe' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    }

    it.each([
      ['no exp', { exp: undefined }, 'missing_exp'],
      ['a non-numeric exp', { exp: 'tomorrow' }, 'missing_exp'],
      ['an exp in the past', { exp: Math.floor(Date.now() / 1000) - 1 }, 'expired'],
      ['aud: [other, ours] with azp: other', { aud: ['other-client', clientId], azp: 'other-client' }, 'azp_mismatch'],
      ['aud: [other, ours] with no azp', { aud: ['other-client', clientId] }, 'azp_mismatch'],
    ])('refuses an id_token with %s, before calling userinfo', async (_label, claims, reason) => {
      const config = getMpProviderConfig();
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const fetchSpy = mockUserinfo();

      await expect(
        config.getUserInfo!({
          accessToken: 'access-token',
          idToken: fakeIdToken({ sub: guid, ...claims }),
        } as OAuth2Tokens),
      ).resolves.toBeNull();

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(JSON.parse(String(errorSpy.mock.calls[0][0]))).toEqual({
        event: 'auth.userinfo.id_token_claims_invalid',
        message: expect.any(String),
        reason,
      });
    });

    it.each([
      ['a single string aud', { aud: clientId }],
      ['aud: [other, ours] with azp: ours', { aud: ['other-client', clientId], azp: clientId }],
    ])('accepts %s', async (_label, claims) => {
      const config = getMpProviderConfig();
      mockUserinfo();

      await expect(
        config.getUserInfo!({
          accessToken: 'access-token',
          idToken: fakeIdToken({ sub: guid, ...claims }),
        } as OAuth2Tokens),
      ).resolves.toMatchObject({ sub: guid });
    });
  });

  it('should map profile to user with userGuid via mapProfileToUser', async () => {
    const config = getMpProviderConfig();
    const guid = 'ab12cd34-ef56-7890-abcd-ef1234567890';

    // mapProfileToUser receives the raw profile returned by getUserInfo, and
    // as of 1.7 may not return `id` — provider identity belongs to
    // accountSubject, so userGuid is our own additional field.
    const mapped = await config.mapProfileToUser!({
      sub: guid,
      email: 'john@example.com',
      name: 'John Doe',
      emailVerified: true,
    });

    expect(mapped).toEqual({
      userGuid: guid,
      email: syntheticEmailForSub(guid),
      mpEmail: 'john@example.com',
    });
    expect(mapped).not.toHaveProperty('id');
  });

  /**
   * F2 (root cause): better-auth's user table declares `email` as
   * `required: true, unique: true` and its OAuth callback uses
   * `findUserByEmail` as a fallback identity lookup. Ministry Platform enforces
   * no uniqueness on email — households share one — so a real MP email must
   * never reach better-auth's `email` column. `mapProfileToUser` overrides it
   * with a value derived from `sub`, which IS unique (it is the User_GUID).
   * The generic-oauth wrapper spreads the mapped object over `raw.email`, so
   * this override is what better-auth persists.
   */
  it('never hands a real MP email to better-auth as the user email (F2 root cause)', async () => {
    const config = getMpProviderConfig();
    const guid = 'AB12CD34-EF56-7890-ABCD-EF1234567890';

    const mapped = await config.mapProfileToUser!({
      sub: guid,
      email: 'shared-household@example.com',
      emailVerified: false,
    });

    expect(mapped.email).toBe(`${guid.toLowerCase()}@mp.invalid`);
    expect(mapped.email).not.toBe('shared-household@example.com');
    // The real address is preserved for display, on our own field.
    expect(mapped.mpEmail).toBe('shared-household@example.com');
  });

  it('maps a missing MP email to mpEmail: null rather than "" (MP does not require an email)', async () => {
    const config = getMpProviderConfig();
    const guid = 'ab12cd34-ef56-7890-abcd-ef1234567890';

    const noEmail = await config.mapProfileToUser!({ sub: guid, emailVerified: false });
    expect(noEmail.mpEmail).toBeNull();
    // Sign-in must not depend on the email: the synthetic key is still present.
    expect(noEmail.email).toBe(syntheticEmailForSub(guid));

    const emptyEmail = await config.mapProfileToUser!({ sub: guid, email: '', emailVerified: false });
    expect(emptyEmail.mpEmail).toBeNull();
  });

  it('mapProfileToUser throws rather than minting an empty userGuid when sub is absent', async () => {
    const config = getMpProviderConfig();
    // getUserInfo refuses these upstream (see the test below); this is the
    // defense-in-depth guard so a future refactor cannot reintroduce the old
    // `String(profile.sub ?? "")` fallback that produced sessions with
    // userGuid "" — the broken state AuthWrapper routes to /session-error.
    // The mapper is synchronous, so the throw happens before a promise exists.
    expect(() =>
      config.mapProfileToUser!({ email: 'x@example.com', emailVerified: false }),
    ).toThrow(/no sub/);
  });

  /**
   * A profile with no usable `sub` must fail sign-in, not produce a session
   * with an empty identity. Returning null is better-auth's contract for
   * "user info unusable": the callback redirects with
   * `unable_to_get_user_info` and mints nothing. `sanitizeGuid` is the shape
   * check because `userGuid` is interpolated into MP `$filter` strings.
   */
  it.each([
    ['missing', {}],
    ['empty string', { sub: '' }],
    ['not a GUID', { sub: "abc' OR 1=1 --" }],
    ['numeric', { sub: 12345 }],
  ])('returns null from getUserInfo when sub is %s (refuses sign-in)', async (_label, subClaim) => {
    const config = getMpProviderConfig();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          ...subClaim,
          given_name: 'No',
          family_name: 'Sub',
          email: 'nosub@example.com',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    await expect(
      config.getUserInfo!({
        accessToken: 'access-token',
        // A valid id_token, so the refusal is provably the userinfo `sub`
        // check and not the id_token binding check that runs before it.
        idToken: fakeIdToken({ sub: 'ab12cd34-ef56-7890-abcd-ef1234598004' }),
      } as OAuth2Tokens),
    ).resolves.toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('"event":"auth.userinfo.invalid_sub"'),
    );
  });

  /**
   * Token-substitution guard (defence in depth behind `refuseIdTokenSignIn`).
   * `/sign-in/social`'s id_token mode calls `getUserInfo` with a
   * CALLER-SUPPLIED access token; the userinfo `sub` it yields must match the
   * verified id_token's `sub`, or an attacker's id_token plus a victim's access
   * token signs in as the victim. Every refusal returns null (never throws) and
   * logs `auth.userinfo.sub_mismatch` with a reason — never the GUIDs or token
   * contents themselves.
   */
  describe('id_token sub binding', () => {
    const userinfoSub = 'ab12cd34-ef56-7890-abcd-ef1234597001';

    function mockUserinfo(sub: string) {
      return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify({ sub, given_name: 'Pat', family_name: 'Doe' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    }

    /** The structured (JSON) events written to console.error. */
    function loggedEvents(calls: unknown[][]) {
      return calls.flatMap(([line]) => {
        try {
          return [JSON.parse(String(line)) as Record<string, unknown>];
        } catch {
          return [];
        }
      });
    }

    it('accepts a profile whose userinfo sub matches the id_token sub', async () => {
      const config = getMpProviderConfig();
      mockUserinfo(userinfoSub);

      const profile = await config.getUserInfo!({
        accessToken: 'access-token',
        idToken: fakeIdToken({ sub: userinfoSub }),
      } as OAuth2Tokens);

      expect(profile).toMatchObject({ sub: userinfoSub });
    });

    it('accepts a case-only difference (GUID case carries no meaning)', async () => {
      const config = getMpProviderConfig();
      mockUserinfo(userinfoSub);

      const profile = await config.getUserInfo!({
        accessToken: 'access-token',
        idToken: fakeIdToken({ sub: userinfoSub.toUpperCase() }),
      } as OAuth2Tokens);

      // The userinfo sub is what is returned, unchanged.
      expect(profile).toMatchObject({ sub: userinfoSub });
    });

    it('refuses a userinfo sub that differs from the id_token sub (token substitution)', async () => {
      const config = getMpProviderConfig();
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const attackerSub = 'ab12cd34-ef56-7890-abcd-ef1234597002';
      mockUserinfo(userinfoSub);

      await expect(
        config.getUserInfo!({
          accessToken: 'victim-access-token',
          idToken: fakeIdToken({ sub: attackerSub }),
        } as OAuth2Tokens),
      ).resolves.toBeNull();

      expect(loggedEvents(errorSpy.mock.calls)).toContainEqual(
        expect.objectContaining({ event: 'auth.userinfo.sub_mismatch', reason: 'mismatch' }),
      );
      // Identifiers only: neither GUID nor any token content reaches the log.
      const logged = errorSpy.mock.calls.flat().join(' ');
      expect(logged).not.toContain(attackerSub);
      expect(logged).not.toContain(userinfoSub);
      expect(logged).not.toContain('victim-access-token');
    });

    it.each([
      ['missing', {}],
      ['empty', { sub: '' }],
      ['non-string', { sub: 12345 }],
    ])('refuses an id_token whose sub is %s, before calling userinfo', async (_label, payload) => {
      const config = getMpProviderConfig();
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const fetchSpy = mockUserinfo(userinfoSub);

      await expect(
        config.getUserInfo!({
          accessToken: 'access-token',
          idToken: fakeIdToken(payload),
        } as OAuth2Tokens),
      ).resolves.toBeNull();

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(loggedEvents(errorSpy.mock.calls)).toContainEqual(
        expect.objectContaining({ event: 'auth.userinfo.sub_mismatch', reason: 'missing_sub' }),
      );
    });

    it.each([
      ['not three segments', 'only.two'],
      ['a five-segment JWE', 'a.b.c.d.e'],
      ['a payload that is not JSON', `x.${Buffer.from('not json').toString('base64url')}.y`],
      ['a payload that is a JSON array', `x.${Buffer.from('["sub"]').toString('base64url')}.y`],
      ['a payload that is JSON null', `x.${Buffer.from('null').toString('base64url')}.y`],
    ])('refuses an undecodable id_token (%s), before calling userinfo', async (_label, idToken) => {
      const config = getMpProviderConfig();
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const fetchSpy = mockUserinfo(userinfoSub);

      await expect(
        config.getUserInfo!({ accessToken: 'access-token', idToken } as OAuth2Tokens),
      ).resolves.toBeNull();

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(loggedEvents(errorSpy.mock.calls)).toContainEqual(
        expect.objectContaining({ event: 'auth.userinfo.sub_mismatch', reason: 'undecodable_id_token' }),
      );
    });

    /**
     * Deliberate fail-closed choice (see the comment in `getUserInfo`): every
     * legitimate caller supplies an id_token (the `openid` code flow and the
     * id_token mode), so an access token with nothing to bind it to is refused.
     */
    it.each([
      ['absent', undefined],
      ['empty', ''],
    ])('refuses when the id_token is %s, before calling userinfo', async (_label, idToken) => {
      const config = getMpProviderConfig();
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const fetchSpy = mockUserinfo(userinfoSub);

      await expect(
        config.getUserInfo!({ accessToken: 'access-token', idToken } as OAuth2Tokens),
      ).resolves.toBeNull();

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(loggedEvents(errorSpy.mock.calls)).toContainEqual(
        expect.objectContaining({ event: 'auth.userinfo.sub_mismatch', reason: 'missing_id_token' }),
      );
    });
  });

  /**
   * Regression guard for the better-auth 1.6 upgrade incident.
   *
   * better-auth 1.6 changed `parseAdditionalUserInputFromProviderProfile` to
   * strip any user additional field declared with `input: false` before the
   * user record is created. Our `userGuid` field is populated server-side from
   * the OAuth profile via `mapProfileToUser`, so `input: false` silently
   * dropped it — leaving `session.user.userGuid` undefined and breaking every
   * MP profile lookup (avatar, user menu, User_ID resolution).
   *
   * This test runs the REAL better-auth field-filtering function against our
   * REAL field config, so it fails if either (a) someone flips `userGuid` back
   * to `input: false`, or (b) a future better-auth upgrade changes how
   * provider-profile fields are parsed. See .claude/references/auth.md.
   */
  it('persists userGuid from the OAuth provider profile (better-auth 1.6 guard)', () => {
    const guid = 'ab12cd34-ef56-7890-abcd-ef1234567890';
    const options = { user: { additionalFields: userAdditionalFields } };

    // Mirrors the object better-auth builds from `mapProfileToUser`'s return
    // before creating the user record.
    const parsed = parseAdditionalUserInputFromProviderProfile(
      options,
      { userGuid: guid, mpEmail: 'john@example.com' },
      'create',
    );

    expect(parsed).toHaveProperty('userGuid', guid);
    // The real MP address must survive the same filter, or the header loses
    // its email fallback (better-auth's own `email` is synthetic).
    expect(parsed).toHaveProperty('mpEmail', 'john@example.com');
  });

  /**
   * `userGuid` is `required: true`, so better-auth's `parseInputData` refuses
   * to create a user record without it (`400 userGuid is required`). This is
   * the last gate behind getUserInfo's sub validation: no code path can mint
   * a session whose MP identity is missing. Runs the REAL better-auth parser.
   */
  it('refuses to create a user record without userGuid (required additional field)', () => {
    const options = { user: { additionalFields: userAdditionalFields } };

    expect(() =>
      parseAdditionalUserInputFromProviderProfile(options, { mpEmail: 'x@example.com' }, 'create'),
    ).toThrow(/userGuid is required/);
  });

  it('allows a user record without mpEmail (MP does not require an email)', () => {
    const guid = 'ab12cd34-ef56-7890-abcd-ef1234567890';
    const options = { user: { additionalFields: userAdditionalFields } };

    expect(() =>
      parseAdditionalUserInputFromProviderProfile(options, { userGuid: guid, mpEmail: null }, 'create'),
    ).not.toThrow();
  });

  /**
   * F2 security-review guard (config): account linking must stay disabled.
   *
   * better-auth's OAuth callback (link-account.mjs) falls back to
   * findUserByEmail when no account matches (providerId, sub). If the
   * matched user and the incoming profile are both emailVerified, it
   * implicitly links the new provider account onto that EXISTING user and
   * issues a session for them — handing a second person who shares that
   * email the first person's userGuid/User_ID. MP household data commonly
   * shares an email across multiple contacts, so this is a real identity
   * takeover path, not a theoretical one. `accountLinking.enabled: false`
   * makes link-account.mjs take the "account not linked" branch instead
   * (verified directly against node_modules/better-auth/dist/oauth2/link-account.mjs
   * line ~79: `accountLinking?.enabled === false` is one of the OR'd
   * conditions that trigger the refusal). See also the behavioral guard
   * below.
   */
  it('disables implicit account linking by email (F2 guard)', () => {
    expect(auth.options.account?.accountLinking?.enabled).toBe(false);
  });

  it('should distinguish user.id (Better Auth internal) from userGuid (MP User_GUID)', () => {
    // Better Auth generates its own user.id (random nanoid-style)
    // The OAuth sub claim is stored as userGuid via additionalFields
    // Server actions and UserProvider must use userGuid for MP API lookups
    const mpUserGuid = 'ab12cd34-ef56-7890-abcd-ef1234567890';
    const betterAuthId = '1gYSNMvy6OqAm9q3DdVhtKj3Czkxd0ms';

    const sessionUser = {
      id: betterAuthId,
      userGuid: mpUserGuid,
      email: 'test@example.com',
      name: 'Test User',
    };

    // user.id is NOT suitable for MP API queries
    expect(sessionUser.id).not.toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-/);
    // userGuid IS the MP User_GUID (UUID format)
    expect(sessionUser.userGuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-/);
  });
});

/**
 * Privilege-escalation guard: session identity must not be reassignable.
 *
 * better-auth mounts `/update-user` unconditionally. Its body schema is
 * `z.record(z.string(), z.any())`, it rejects only `email`, and it hands every
 * other key to `parseUserInput` — which copies any additional field declared
 * `input !== false` with no validator, then re-mints the session cookie from
 * the result. Its only gate is `sessionMiddleware`, which any valid session
 * cookie satisfies.
 *
 * `userGuid` MUST stay `input: true` or sign-in breaks (see the better-auth 1.6
 * guard above), so the two facts compose into a privilege escalation: any
 * authenticated user could POST `{ userGuid: "<victim's MP User_GUID>" }` and
 * inherit that user's MP roles, groups, and write attribution. The fix is
 * `disabledPaths`, matched in the router's `onRequest` before any handler.
 *
 * These two concerns are tested TOGETHER on purpose. The `input: true` guard
 * above pins the writable half of the tradeoff; on its own it would lock in the
 * hazard with nothing asserting the door is shut. Removing EITHER protection
 * must fail the build. Do not delete one of these tests to make the other pass.
 */
describe('Auth - disabled account-management endpoints', () => {
  const authBase = 'http://localhost:3000/api/auth';

  it('pins the exact set of disabled paths', () => {
    expect(auth.options.disabledPaths).toEqual([
      '/update-user',
      '/change-email',
      '/change-password',
      '/set-password',
      '/delete-user',
      '/delete-user/callback',
      '/link-social',
    ]);
  });

  it('returns 404 for POST /update-user (session identity is not reassignable)', async () => {
    const response = await auth.handler(
      new Request(`${authBase}/update-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userGuid: 'ab12cd34-ef56-7890-abcd-ef1234509001',
        }),
      }),
    );

    expect(response.status).toBe(404);
  });

  /**
   * Verified by negative control: with `disabledPaths` removed, `/change-email`,
   * `/change-password` and `/delete-user` all answer **401**, not 404 — they are
   * mounted and gated only by `sessionMiddleware`, so a session cookie reaches
   * them. `/set-password` is the exception: better-auth never mounts it without
   * a credential provider, so it 404s either way and this case asserts nothing
   * today. It is kept deliberately — if an email/password provider is ever
   * added, the path appears and this case starts doing real work.
   */
  it.each([
    '/change-email',
    '/change-password',
    '/set-password',
    '/delete-user',
  ])('returns 404 for POST %s', async (path) => {
    const response = await auth.handler(
      new Request(`${authBase}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(404);
  });

  /**
   * `/link-social` carries its own id_token branch (see `disabledAuthPaths`).
   * Negative control: with it removed from `disabledPaths` this request answers
   * 401 (mounted, session-gated), not 404.
   */
  it('returns 404 for POST /link-social, including its id_token mode', async () => {
    const response = await auth.handler(
      new Request(`${authBase}/link-social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'ministry-platform',
          idToken: { token: 'x', accessToken: 'y' },
        }),
      }),
    );

    expect(response.status).toBe(404);
  });

  /**
   * Control: proves the assertions above are meaningful. Without this, a
   * misconfigured baseURL or basePath would 404 every request and the suite
   * would pass while the app was wide open.
   */
  it('still routes an endpoint that is NOT disabled', async () => {
    const response = await auth.handler(
      new Request(`${authBase}/get-session`, { method: 'GET' }),
    );

    expect(response.status).not.toBe(404);
  });
});

/**
 * F2 security-review behavioral guard: drives better-auth's REAL account
 * linking/creation logic (`handleOAuthUserInfo`, the same function
 * `src/app/api/auth/[...all]/route.ts`'s OAuth callback calls) against the
 * app's real, in-memory `auth` instance — no HTTP, no MP calls, no database.
 *
 * This reproduces finding F2 end-to-end at the library boundary: two
 * different OAuth `sub` values (i.e. two different MP contacts) sharing one
 * email. Before the fix (`accountLinking.enabled: false` in
 * `src/lib/auth.ts`), the second sign-in would silently link onto the first
 * user's record and return THEIR session/user — full identity takeover.
 * After the fix, better-auth's `link-account.mjs` takes its
 * `"account not linked"` refusal branch instead (confirmed by reading the
 * library source — see the comment on `accountLinking` in `src/lib/auth.ts`).
 */
describe('Auth - F2 account-linking behavioral guard', () => {
  /** Same lookup as in 'Auth - OAuth Configuration'; scoped per describe. */
  function getMpProviderConfig(): GenericOAuthConfig {
    const plugins =
      (auth.options as { plugins?: Array<Record<string, unknown>> }).plugins ?? [];
    const plugin = plugins.find((pl) => pl.id === 'generic-oauth') as
      | { options?: GenericOAuthOptions }
      | undefined;
    const config = plugin?.options?.config?.find(
      (c) => c.providerId === 'ministry-platform',
    );
    if (!config) throw new Error('ministry-platform generic OAuth config not found');
    return config;
  }

  // Deliberately BYPASSES mapProfileToUser: this simulates a regression in
  // which the same real email reaches better-auth's `email` column for two
  // subs. `userGuid` is supplied because it is a required field — without it
  // user creation fails on "userGuid is required" before linking is reached.
  function buildUserInfo(sub: string, email: string) {
    return {
      id: sub,
      email,
      emailVerified: true,
      name: 'Shared Email User',
      image: undefined,
      userGuid: sub,
    };
  }

  it('refuses to implicitly link a second sub sharing an existing user\'s email', async () => {
    const context = await auth.$context;
    // `ctx.setCookie`/`ctx.getCookie` only exist on the real request-endpoint
    // context better-call builds per request; stub them as no-ops in case
    // handleOAuthUserInfo touches cookies (it writes an account cookie only
    // when `storeAccountCookie` is on — it is off in src/lib/auth.ts). This
    // test only cares about the account-linking decision, not cookies.
    const c = {
      context,
      headers: new Headers(),
      setCookie: () => {},
      getCookie: () => null,
    } as unknown as GenericEndpointContext;
    const email = 'f2-shared-guard@example.com';

    const first = await handleOAuthUserInfo(c, {
      userInfo: buildUserInfo('f2-behavioral-sub-one', email),
      account: { providerId: 'ministry-platform', accountId: 'f2-behavioral-sub-one' },
      callbackURL: '/',
    });

    expect(first.error).toBeNull();
    expect(first.isRegister).toBe(true);
    expect(first.data?.user.email).toBe(email);

    const second = await handleOAuthUserInfo(c, {
      userInfo: buildUserInfo('f2-behavioral-sub-two', email),
      account: { providerId: 'ministry-platform', accountId: 'f2-behavioral-sub-two' },
      callbackURL: '/',
    });

    // The vulnerable behavior would have returned `error: null` here with
    // `data.user` equal to the FIRST user (same id, same userGuid) — this
    // second sign-in taking over that identity. The fix refuses instead.
    expect(second.error).toBe('account not linked');
    expect(second.data).toBeNull();
    expect(second.data?.user.id).not.toBe(first.data?.user.id);
  });

  /**
   * The root-cause fix, end to end: run two MP profiles that share one REAL
   * email through the app's real `mapProfileToUser` and then through
   * better-auth's real `handleOAuthUserInfo`. Because the local `email` is
   * derived from `sub`, the two never collide: both sign-ins succeed, produce
   * two distinct users with their own `userGuid`, and neither is refused or
   * merged. The shared real address survives on `mpEmail` for both.
   *
   * This is the case `accountLinking.enabled: false` alone could not solve —
   * it turned takeover into lockout for the second person. With a persistent
   * database the `unique` constraint on `email` would have rejected them too.
   */
  it('two MP users sharing a real email become two distinct better-auth users', async () => {
    const config = getMpProviderConfig();
    const context = await auth.$context;
    const c = {
      context,
      headers: new Headers(),
      setCookie: () => {},
      getCookie: () => null,
    } as unknown as GenericEndpointContext;

    const sharedEmail = 'household@example.com';
    const subOne = 'f2c0ffee-0000-4000-8000-000000000001';
    const subTwo = 'f2c0ffee-0000-4000-8000-000000000002';

    // Mirror the generic-oauth wrapper: `{ email: raw.email, ..., ...mapped }`.
    async function localUserFor(sub: string, name: string) {
      const raw = { sub, email: sharedEmail, name, emailVerified: false };
      const mapped = await config.mapProfileToUser!(raw);
      // `mapped.email` is typed `string | null | undefined`; the wrapper's
      // spread makes it the final value, and the mapping test above proves it
      // is always a string here.
      return {
        id: sub,
        emailVerified: false,
        name,
        image: undefined,
        ...mapped,
        email: mapped.email as string,
      };
    }

    const first = await handleOAuthUserInfo(c, {
      userInfo: await localUserFor(subOne, 'Pat Household'),
      account: { providerId: 'ministry-platform', accountId: subOne },
      callbackURL: '/',
    });
    const second = await handleOAuthUserInfo(c, {
      userInfo: await localUserFor(subTwo, 'Sam Household'),
      account: { providerId: 'ministry-platform', accountId: subTwo },
      callbackURL: '/',
    });

    expect(first.error).toBeNull();
    expect(second.error).toBeNull();
    expect(first.isRegister).toBe(true);
    expect(second.isRegister).toBe(true);

    const u1 = first.data!.user as Record<string, unknown>;
    const u2 = second.data!.user as Record<string, unknown>;
    expect(u1.id).not.toBe(u2.id);
    expect(u1.userGuid).toBe(subOne);
    expect(u2.userGuid).toBe(subTwo);
    expect(u1.email).toBe(syntheticEmailForSub(subOne));
    expect(u2.email).toBe(syntheticEmailForSub(subTwo));
    expect(u1.mpEmail).toBe(sharedEmail);
    expect(u2.mpEmail).toBe(sharedEmail);
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseAdditionalUserInputFromProviderProfile } from 'better-auth/db';
import type {
  GenericOAuthConfig,
  GenericOAuthOptions,
} from 'better-auth/plugins';
import type { OAuth2Tokens } from '@better-auth/core/oauth2';

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

import { auth, userAdditionalFields, enrichSessionUser } from '@/lib/auth';

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

  describe('Name splitting', () => {
    it('should split a full name into firstName and lastName', async () => {
      const result = await enrichSessionUser(
        { id: 'ba-internal-id', name: 'John Doe', userGuid: 'ab12cd34-ef56-7890-abcd-ef1234501001' },
        session,
      );

      expect(result.user.firstName).toBe('John');
      expect(result.user.lastName).toBe('Doe');
    });

    it('should keep multi-part last names intact', async () => {
      const result = await enrichSessionUser(
        { id: 'ba-internal-id', name: 'Mary Jane Van Der Berg', userGuid: 'ab12cd34-ef56-7890-abcd-ef1234501002' },
        session,
      );

      expect(result.user.firstName).toBe('Mary');
      expect(result.user.lastName).toBe('Jane Van Der Berg');
    });

    it('should return an empty lastName for a single-word name', async () => {
      const result = await enrichSessionUser(
        { id: 'ba-internal-id', name: 'Prince', userGuid: 'ab12cd34-ef56-7890-abcd-ef1234501003' },
        session,
      );

      expect(result.user.firstName).toBe('Prince');
      expect(result.user.lastName).toBe('');
    });

    it('should handle an undefined name without throwing', async () => {
      const result = await enrichSessionUser(
        { id: 'ba-internal-id', name: undefined, userGuid: 'ab12cd34-ef56-7890-abcd-ef1234501004' },
        session,
      );

      expect(result.user.firstName).toBe('');
      expect(result.user.lastName).toBe('');
    });

    it('should handle an empty-string name', async () => {
      const result = await enrichSessionUser(
        { id: 'ba-internal-id', name: '', userGuid: 'ab12cd34-ef56-7890-abcd-ef1234501005' },
        session,
      );

      expect(result.user.firstName).toBe('');
      expect(result.user.lastName).toBe('');
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

    it('should pass the session object through by reference, unmodified', async () => {
      const result = await enrichSessionUser(
        { id: 'ba-internal-id', name: 'John Doe', userGuid: 'ab12cd34-ef56-7890-abcd-ef1234501007' },
        session,
      );

      expect(result.session).toBe(session);
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

    it('should not cache a failed resolution', async () => {
      const userGuid = 'ab12cd34-ef56-7890-abcd-ef1234502007';
      mockGetTableRecords.mockResolvedValueOnce([]).mockResolvedValueOnce([{ User_ID: 77 }]);

      const first = await enrichSessionUser({ id: 'ba', name: 'John Doe', userGuid }, session);
      const second = await enrichSessionUser({ id: 'ba', name: 'John Doe', userGuid }, session);

      expect(first.user.userId).toBeNull();
      expect(second.user.userId).toBe(77);
      expect(mockGetTableRecords).toHaveBeenCalledTimes(2);
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
      expect(result.user.firstName).toBe('John');
      expect(console.error).toHaveBeenCalled();
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
    expect(config.scopes).toContain('offline_access');
    expect(config.scopes).toContain(
      'http://www.thinkministry.com/dataplatform/scopes/all',
    );
    // MP rejects PKCE today; better-auth 1.7 defaults it to true (OAuth 2.1),
    // so this must stay explicitly false until MP is verified to accept S256.
    expect(config.pkce).toBe(false);
    expect(config.authorizationUrlParams).toEqual({ realm: 'realm' });
  });

  /**
   * Regression guard for the better-auth 1.7 account-identity change.
   *
   * 1.7 keys accounts on (issuer, accountId) and refuses to initialize a
   * discovery provider whose issuer it cannot resolve — a failed discovery
   * fetch throws straight out of `betterAuth()`. An explicit `accountIssuer`
   * pins the namespace so a transient MP outage cannot silently re-key existing
   * accounts, and keeps this module importable without network access.
   */
  it('pins the account issuer explicitly (better-auth 1.7 guard)', () => {
    const config = getMpProviderConfig();

    expect(config.accountIssuer).toBe(
      `${process.env.MINISTRY_PLATFORM_BASE_URL}/oauth`,
    );
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
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const profile = await config.getUserInfo!({
      accessToken: 'access-token',
    } as OAuth2Tokens);

    expect(fetchSpy).toHaveBeenCalledWith(
      `${process.env.MINISTRY_PLATFORM_BASE_URL}/oauth/connect/userinfo`,
      { headers: { Authorization: 'Bearer access-token' } },
    );
    // This is the field better-auth resolves the account subject from.
    expect(profile).toMatchObject({
      sub: guid,
      name: 'John Doe',
      email: 'john@example.com',
      emailVerified: true,
    });
  });

  it('returns null from getUserInfo when the userinfo request fails', async () => {
    const config = getMpProviderConfig();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 401 }),
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      config.getUserInfo!({ accessToken: 'bad-token' } as OAuth2Tokens),
    ).resolves.toBeNull();
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

    expect(mapped).toEqual({ userGuid: guid });
    expect(mapped).not.toHaveProperty('id');
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
      { userGuid: guid },
      'create',
    );

    expect(parsed).toHaveProperty('userGuid', guid);
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

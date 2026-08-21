import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseAdditionalUserInputFromProviderProfile } from 'better-auth/db';
import type {
  GenericOAuthConfig,
  GenericOAuthOptions,
} from 'better-auth/plugins';
import type { OAuth2Tokens } from '@better-auth/core/oauth2';
import { auth, userAdditionalFields } from '@/lib/auth';

/**
 * Auth Tests
 *
 * Tests for the Better Auth configuration in src/lib/auth.ts.
 * - customSession: lightweight name splitting only (no API calls)
 * - getUserInfo: fetches the OIDC profile and returns `sub` (better-auth 1.7
 *   resolves the account subject from it for OIDC discovery providers)
 * - mapProfileToUser: stores the OAuth sub claim as userGuid (additionalField)
 * - User profile loading is handled client-side by UserProvider
 */

describe('Auth - Custom Session Enrichment Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Name Splitting', () => {
    it('should split full name into firstName and lastName', () => {
      const user = { id: 'ba-internal-id', name: 'John Doe', email: 'john@example.com', userGuid: 'user-guid-123' };

      const enrichedUser = {
        ...user,
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
      };

      expect(enrichedUser.firstName).toBe('John');
      expect(enrichedUser.lastName).toBe('Doe');
    });

    it('should handle multi-part last names', () => {
      const user = { id: 'ba-internal-id', name: 'Mary Jane Watson', email: 'mary@example.com' };

      const enrichedUser = {
        ...user,
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
      };

      expect(enrichedUser.firstName).toBe('Mary');
      expect(enrichedUser.lastName).toBe('Jane Watson');
    });

    it('should handle single name (no last name)', () => {
      const user = { id: 'ba-internal-id', name: 'Madonna', email: 'madonna@example.com' };

      const enrichedUser = {
        ...user,
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
      };

      expect(enrichedUser.firstName).toBe('Madonna');
      expect(enrichedUser.lastName).toBe('');
    });

    it('should handle undefined name gracefully', () => {
      const user = { id: 'ba-internal-id', name: undefined as string | undefined, email: 'user@example.com' };

      const enrichedUser = {
        ...user,
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
      };

      expect(enrichedUser.firstName).toBe('');
      expect(enrichedUser.lastName).toBe('');
    });

    it('should handle empty string name', () => {
      const user = { id: 'ba-internal-id', name: '', email: 'user@example.com' };

      const enrichedUser = {
        ...user,
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
      };

      expect(enrichedUser.firstName).toBe('');
      expect(enrichedUser.lastName).toBe('');
    });
  });

  describe('Session Structure', () => {
    it('should return enriched user with userGuid and unchanged session', () => {
      const user = { id: 'ba-internal-id', name: 'John Doe', email: 'john@example.com', userGuid: 'ab12cd34-ef56-7890-abcd-ef1234567890' };
      const session = { id: 'session-123', expiresAt: new Date() };

      // Simulate customSession logic (no API calls, just name splitting)
      const result = {
        user: {
          ...user,
          firstName: user.name?.split(' ')[0] || '',
          lastName: user.name?.split(' ').slice(1).join(' ') || '',
        },
        session,
      };

      // user.id is Better Auth's internal ID, NOT the MP User_GUID
      expect(result.user.id).toBe('ba-internal-id');
      // userGuid is the MP User_GUID stored via additionalFields + mapProfileToUser
      expect(result.user.userGuid).toBe('ab12cd34-ef56-7890-abcd-ef1234567890');
      expect(result.user.firstName).toBe('John');
      expect(result.user.lastName).toBe('Doe');
      expect(result.session).toBe(session);
    });

    it('should not include userProfile in session', () => {
      const user = { id: 'ba-internal-id', name: 'John Doe', email: 'john@example.com' };
      const session = { id: 'session-123', expiresAt: new Date() };

      const result = {
        user: {
          ...user,
          firstName: user.name?.split(' ')[0] || '',
          lastName: user.name?.split(' ').slice(1).join(' ') || '',
        },
        session,
      };

      // userProfile is NOT part of the session — it's loaded client-side by UserProvider
      expect(result.session).not.toHaveProperty('userProfile');
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

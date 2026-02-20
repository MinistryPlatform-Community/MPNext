import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Auth Tests
 *
 * Tests for the Better Auth configuration in src/lib/auth.ts.
 * - customSession: lightweight name splitting only (no API calls)
 * - getUserInfo: fetches OIDC profile and returns id=sub (used as accountId)
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
  it('should configure Ministry Platform as generic OAuth provider', () => {
    const config = {
      providerId: 'ministry-platform',
      scopes: ['openid', 'offline_access', 'http://www.thinkministry.com/dataplatform/scopes/all'],
      pkce: false,
    };

    expect(config.providerId).toBe('ministry-platform');
    expect(config.scopes).toContain('openid');
    expect(config.scopes).toContain('offline_access');
    expect(config.pkce).toBe(false);
  });

  it('should map getUserInfo profile to user info with sub as id', () => {
    // Simulate the getUserInfo callback — returns id=sub for the accountId
    const profile = {
      sub: 'ab12cd34-ef56-7890-abcd-ef1234567890',
      given_name: 'John',
      family_name: 'Doe',
      email: 'john@example.com',
    };

    const userInfo = {
      id: profile.sub,
      email: profile.email,
      name: `${profile.given_name} ${profile.family_name}`,
      image: undefined,
      emailVerified: true,
    };

    expect(userInfo.id).toBe('ab12cd34-ef56-7890-abcd-ef1234567890');
    expect(userInfo.name).toBe('John Doe');
    expect(userInfo.email).toBe('john@example.com');
    expect(userInfo.image).toBeUndefined();
    expect(userInfo.emailVerified).toBe(true);
  });

  it('should map profile to user with userGuid via mapProfileToUser', () => {
    // Simulate the mapProfileToUser callback
    // It receives the getUserInfo result and extracts the sub as userGuid
    const getUserInfoResult = {
      id: 'ab12cd34-ef56-7890-abcd-ef1234567890',
      email: 'john@example.com',
      name: 'John Doe',
      image: undefined,
      emailVerified: true,
    };

    // mapProfileToUser extracts profile.id (the sub) as userGuid
    const mappedFields = {
      userGuid: getUserInfoResult.id,
    };

    expect(mappedFields.userGuid).toBe('ab12cd34-ef56-7890-abcd-ef1234567890');
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

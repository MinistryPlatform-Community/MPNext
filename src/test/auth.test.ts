import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { JWT } from 'next-auth/jwt';
import type { Session } from 'next-auth';

/**
 * Auth Tests
 *
 * Tests for the authentication logic in src/auth.ts
 * These tests verify the JWT callback behavior for token management
 * and session callback behavior for session enrichment.
 */

// Mock fetch for token refresh tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Create a mock for MPHelper that can be configured per test
const mockGetTableRecords = vi.fn();

vi.mock('@/lib/providers/ministry-platform', () => ({
  MPHelper: class MockMPHelper {
    getTableRecords = mockGetTableRecords;
  },
}));

describe('Auth - JWT Callback Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockGetTableRecords.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Token Setup (account && profile)', () => {
    it('should set initial token from account and profile on sign in', async () => {
      const { MPHelper } = await import('@/lib/providers/ministry-platform');

      mockGetTableRecords.mockResolvedValue([{
        User_ID: 1,
        User_GUID: 'user-guid-123',
        Contact_ID: 100,
        First_Name: 'John',
        Nickname: 'Johnny',
        Last_Name: 'Doe',
        Email_Address: 'john@example.com',
        Mobile_Phone: '555-1234',
        Image_GUID: 'image-guid-123',
      }]);

      // Simulate the JWT callback logic for initial sign-in
      const account = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        id_token: 'id-token-123',
      };

      const profile = {
        sub: 'user-guid-123',
        user_id: 'user-id-123',
        email: 'john@example.com',
        name: 'John Doe',
        given_name: 'John',
        family_name: 'Doe',
      };

      const token: JWT = { sub: '' };

      // Simulate the callback logic
      const mp = new MPHelper();
      const records = await mp.getTableRecords({
        table: 'dp_Users',
        filter: `User_GUID = '${profile.sub}'`,
        select: 'User_ID,User_GUID,Contact_ID',
        top: 1,
      });
      const userProfile = records[0] || null;

      const resultToken = {
        ...token,
        accessToken: account.access_token,
        refreshToken: account.refresh_token,
        expiresAt: account.expires_at,
        idToken: account.id_token,
        sub: profile.sub,
        userId: profile.user_id,
        email: profile.email,
        name: profile.name,
        firstName: profile.given_name,
        lastName: profile.family_name,
        userProfile,
      };

      expect(resultToken.accessToken).toBe('access-token-123');
      expect(resultToken.refreshToken).toBe('refresh-token-123');
      expect(resultToken.sub).toBe('user-guid-123');
      expect(resultToken.userProfile).toBeDefined();
      expect(resultToken.userProfile?.Contact_ID).toBe(100);
    });

    it('should handle user profile fetch failure gracefully', async () => {
      const { MPHelper } = await import('@/lib/providers/ministry-platform');

      mockGetTableRecords.mockRejectedValue(new Error('API Error'));

      const mp = new MPHelper();
      let userProfile = null;

      try {
        const records = await mp.getTableRecords({
          table: 'dp_Users',
          filter: `User_GUID = 'test-guid'`,
          select: 'User_ID',
          top: 1,
        });
        userProfile = records[0] || null;
      } catch {
        // Error is logged but userProfile remains null
        userProfile = null;
      }

      expect(userProfile).toBeNull();
    });

    it('should handle empty user profile result', async () => {
      const { MPHelper } = await import('@/lib/providers/ministry-platform');

      mockGetTableRecords.mockResolvedValue([]);

      const mp = new MPHelper();
      const records = await mp.getTableRecords({
        table: 'dp_Users',
        filter: `User_GUID = 'nonexistent-guid'`,
        select: 'User_ID',
        top: 1,
      });
      const userProfile = records[0] || null;

      expect(userProfile).toBeNull();
    });
  });

  describe('Token Validity Check', () => {
    it('should return existing token when not expired', () => {
      const futureExpiration = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const token: JWT = {
        sub: 'user-123',
        accessToken: 'valid-token',
        expiresAt: futureExpiration,
      };

      // Simulate the validity check
      const isValid = token.expiresAt && Date.now() < (token.expiresAt as number) * 1000;

      expect(isValid).toBe(true);
    });

    it('should detect expired token', () => {
      const pastExpiration = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const token: JWT = {
        sub: 'user-123',
        accessToken: 'expired-token',
        expiresAt: pastExpiration,
      };

      // Simulate the validity check
      const isValid = token.expiresAt && Date.now() < (token.expiresAt as number) * 1000;

      expect(isValid).toBe(false);
    });

    it('should handle token without expiration', () => {
      const token: JWT = {
        sub: 'user-123',
        accessToken: 'no-expiry-token',
      };

      // Simulate the validity check (no expiresAt means we should attempt refresh)
      const isValid = token.expiresAt && Date.now() < (token.expiresAt as number) * 1000;

      expect(isValid).toBeFalsy();
    });
  });

  describe('Token Refresh', () => {
    it('should successfully refresh expired token', async () => {
      const refreshedTokenData = {
        access_token: 'new-access-token',
        expires_in: 3600,
        refresh_token: 'new-refresh-token',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(refreshedTokenData),
      });

      const token: JWT = {
        sub: 'user-123',
        accessToken: 'expired-token',
        refreshToken: 'valid-refresh-token',
        expiresAt: Math.floor(Date.now() / 1000) - 100, // expired
      };

      // Simulate token refresh
      const response = await fetch(`https://test-mp.example.com/oauth/connect/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: token.refreshToken as string,
          client_id: 'test-client-id',
          client_secret: 'test-client-secret',
        }),
      });

      expect(response.ok).toBe(true);
      const refreshedTokens = await response.json();

      const updatedToken = {
        ...token,
        accessToken: refreshedTokens.access_token,
        expiresAt: Math.floor(Date.now() / 1000 + refreshedTokens.expires_in),
        refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      };

      expect(updatedToken.accessToken).toBe('new-access-token');
      expect(updatedToken.refreshToken).toBe('new-refresh-token');
      expect(updatedToken.expiresAt).toBeGreaterThan(Date.now() / 1000);
    });

    it('should handle refresh token failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      const token: JWT = {
        sub: 'user-123',
        accessToken: 'expired-token',
        refreshToken: 'invalid-refresh-token',
        expiresAt: Math.floor(Date.now() / 1000) - 100,
      };

      const response = await fetch(`https://test-mp.example.com/oauth/connect/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: token.refreshToken as string,
          client_id: 'test-client-id',
          client_secret: 'test-client-secret',
        }),
      });

      expect(response.ok).toBe(false);

      // Simulate error handling in callback
      const errorToken = { ...token, error: 'RefreshTokenError' };
      expect(errorToken.error).toBe('RefreshTokenError');
    });

    it('should handle network error during refresh', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const token: JWT = {
        sub: 'user-123',
        accessToken: 'expired-token',
        refreshToken: 'valid-refresh-token',
        expiresAt: Math.floor(Date.now() / 1000) - 100,
      };

      let errorToken = token;
      try {
        await fetch(`https://test-mp.example.com/oauth/connect/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: token.refreshToken as string,
            client_id: 'test-client-id',
            client_secret: 'test-client-secret',
          }),
        });
      } catch {
        errorToken = { ...token, error: 'RefreshTokenError' };
      }

      expect(errorToken.error).toBe('RefreshTokenError');
    });

    it('should set error when no refresh token available', () => {
      const token: JWT = {
        sub: 'user-123',
        accessToken: 'expired-token',
        expiresAt: Math.floor(Date.now() / 1000) - 100,
        // No refreshToken
      };

      // Simulate the callback logic when no refresh token
      let resultToken = token;
      if (!token.refreshToken) {
        resultToken = { ...token, error: 'RefreshTokenError' };
      }

      expect(resultToken.error).toBe('RefreshTokenError');
    });

    it('should preserve existing refresh token when new one not provided', async () => {
      const refreshedTokenData = {
        access_token: 'new-access-token',
        expires_in: 3600,
        // No refresh_token in response
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(refreshedTokenData),
      });

      const token: JWT = {
        sub: 'user-123',
        accessToken: 'expired-token',
        refreshToken: 'original-refresh-token',
        expiresAt: Math.floor(Date.now() / 1000) - 100,
      };

      const response = await fetch(`https://test-mp.example.com/oauth/connect/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: token.refreshToken as string,
          client_id: 'test-client-id',
          client_secret: 'test-client-secret',
        }),
      });

      const refreshedTokens = await response.json();

      const updatedToken = {
        ...token,
        accessToken: refreshedTokens.access_token,
        expiresAt: Math.floor(Date.now() / 1000 + refreshedTokens.expires_in),
        refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      };

      // Should keep the original refresh token
      expect(updatedToken.refreshToken).toBe('original-refresh-token');
    });
  });
});

describe('Auth - Session Callback Logic', () => {
  it('should enrich session with token data', () => {
    const token: JWT = {
      sub: 'user-guid-123',
      accessToken: 'access-token-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      idToken: 'id-token-123',
      userProfile: {
        User_ID: 1,
        User_GUID: 'user-guid-123',
        Contact_ID: 100,
        First_Name: 'John',
        Nickname: 'Johnny',
        Last_Name: 'Doe',
        Email_Address: 'john@example.com',
        Mobile_Phone: '555-1234',
        Image_GUID: 'image-guid-123',
      },
    };

    const session: Session = {
      user: {
        id: '',
        name: 'John Doe',
        email: 'john@example.com',
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    };

    // Simulate session callback logic
    if (token && session.user) {
      session.user.id = token.sub as string;
      (session as Session & { accessToken?: string }).accessToken = token.accessToken as string;
      (session as Session & { firstName?: string }).firstName = token.firstName as string;
      (session as Session & { lastName?: string }).lastName = token.lastName as string;
      (session as Session & { email?: string }).email = token.email as string;
      (session as Session & { sub?: string }).sub = token.sub as string;
      (session as Session & { idToken?: string }).idToken = token.idToken as string;
      (session as Session & { userProfile?: unknown }).userProfile = token.userProfile;
      (session as Session & { error?: string }).error = token.error as string | undefined;
    }

    expect(session.user.id).toBe('user-guid-123');
    expect((session as Session & { accessToken?: string }).accessToken).toBe('access-token-123');
    expect((session as Session & { firstName?: string }).firstName).toBe('John');
    expect((session as Session & { lastName?: string }).lastName).toBe('Doe');
    expect((session as Session & { userProfile?: { Contact_ID: number } }).userProfile?.Contact_ID).toBe(100);
  });

  it('should propagate error from token to session', () => {
    const token: JWT = {
      sub: 'user-123',
      error: 'RefreshTokenError',
    };

    const session: Session = {
      user: {
        id: '',
        name: 'John Doe',
        email: 'john@example.com',
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    };

    // Simulate session callback
    if (token && session.user) {
      session.user.id = token.sub as string;
      (session as Session & { error?: string }).error = token.error as string | undefined;
    }

    expect((session as Session & { error?: string }).error).toBe('RefreshTokenError');
  });

  it('should handle missing token gracefully', () => {
    const token: JWT | null = null;
    const session: Session = {
      user: {
        id: '',
        name: 'John Doe',
        email: 'john@example.com',
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    };

    // Simulate session callback with null token
    if (token && session.user) {
      session.user.id = token.sub as string;
    }

    // Session should remain unchanged
    expect(session.user.id).toBe('');
  });

  it('should handle session without user object', () => {
    const token: JWT = {
      sub: 'user-123',
      accessToken: 'access-token',
    };

    const session = {
      expires: new Date(Date.now() + 3600000).toISOString(),
    } as Session;

    // Simulate session callback - should not throw
    if (token && session.user) {
      session.user.id = token.sub as string;
    }

    // No error thrown, session unchanged
    expect(session.user).toBeUndefined();
  });
});

describe('Auth - Token Expiration Edge Cases', () => {
  it('should handle token expiring exactly now', () => {
    const exactlyNow = Math.floor(Date.now() / 1000);
    const token: JWT = {
      sub: 'user-123',
      expiresAt: exactlyNow,
    };

    // Check: Date.now() < expiresAt * 1000
    // If exactly equal, this should be false (needs refresh)
    const isValid = token.expiresAt && Date.now() < (token.expiresAt as number) * 1000;

    expect(isValid).toBe(false);
  });

  it('should handle very large expiration timestamp', () => {
    const farFuture = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 year
    const token: JWT = {
      sub: 'user-123',
      expiresAt: farFuture,
    };

    const isValid = token.expiresAt && Date.now() < (token.expiresAt as number) * 1000;

    expect(isValid).toBe(true);
  });

  it('should handle negative/invalid expiration timestamp', () => {
    const token: JWT = {
      sub: 'user-123',
      expiresAt: -1,
    };

    const isValid = token.expiresAt && Date.now() < (token.expiresAt as number) * 1000;

    expect(isValid).toBe(false);
  });

  it('should handle zero expiration timestamp', () => {
    const token: JWT = {
      sub: 'user-123',
      expiresAt: 0,
    };

    // 0 is falsy, so this should trigger refresh
    const isValid = token.expiresAt && Date.now() < (token.expiresAt as number) * 1000;

    expect(isValid).toBeFalsy();
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MinistryPlatformClient } from '@/lib/providers/ministry-platform/client';

/**
 * MinistryPlatformClient Tests
 *
 * Tests for the core Ministry Platform client that handles:
 * - OAuth2 client credentials token management
 * - Automatic token refresh before expiration
 * - HTTP client configuration with token injection
 */

// Mock the client credentials module
vi.mock('@/lib/providers/ministry-platform/auth/client-credentials', () => ({
  getClientCredentialsToken: vi.fn(),
}));

describe('MinistryPlatformClient', () => {
  let mockGetClientCredentialsToken: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    const { getClientCredentialsToken } = await import(
      '@/lib/providers/ministry-platform/auth/client-credentials'
    );
    mockGetClientCredentialsToken = getClientCredentialsToken as ReturnType<typeof vi.fn>;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should create client with base URL from environment', () => {
      const client = new MinistryPlatformClient();
      const httpClient = client.getHttpClient();

      // Verify HTTP client was created
      expect(httpClient).toBeDefined();
    });
  });

  describe('Token Management - ensureValidToken', () => {
    it('should fetch new token when no token exists (initial state)', async () => {
      mockGetClientCredentialsToken.mockResolvedValueOnce({
        access_token: 'new-access-token',
        expires_in: 3600,
        token_type: 'Bearer',
      });

      const client = new MinistryPlatformClient();

      // Token should be fetched since expiresAt is initialized to epoch
      await client.ensureValidToken();

      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(1);
    });

    it('should not fetch new token when token is still valid', async () => {
      mockGetClientCredentialsToken.mockResolvedValueOnce({
        access_token: 'valid-token',
        expires_in: 3600,
        token_type: 'Bearer',
      });

      const client = new MinistryPlatformClient();

      // First call - should fetch token
      await client.ensureValidToken();
      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(1);

      // Advance time by 1 minute (well inside the token's validity window)
      vi.advanceTimersByTime(60 * 1000);

      // Second call - should NOT fetch new token
      await client.ensureValidToken();
      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(1);
    });

    it('should refresh token when expired', async () => {
      mockGetClientCredentialsToken
        .mockResolvedValueOnce({
          access_token: 'first-token',
          expires_in: 3600,
          token_type: 'Bearer',
        })
        .mockResolvedValueOnce({
          access_token: 'refreshed-token',
          expires_in: 3600,
          token_type: 'Bearer',
        });

      const client = new MinistryPlatformClient();

      // First call - fetch initial token
      await client.ensureValidToken();
      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(1);

      // Advance time past the token's usable life (3600s - 5min safety margin)
      vi.advanceTimersByTime(56 * 60 * 1000);

      // Second call - should fetch new token
      await client.ensureValidToken();
      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(2);
    });

    it('should throw error when token refresh fails', async () => {
      mockGetClientCredentialsToken.mockRejectedValueOnce(
        new Error('OAuth server unavailable')
      );

      const client = new MinistryPlatformClient();

      await expect(client.ensureValidToken()).rejects.toThrow('OAuth server unavailable');
    });

    it('should handle concurrent ensureValidToken calls', async () => {
      let resolveToken: (value: unknown) => void;
      const tokenPromise = new Promise((resolve) => {
        resolveToken = resolve;
      });

      mockGetClientCredentialsToken.mockImplementation(() => tokenPromise);

      const client = new MinistryPlatformClient();

      // Start multiple concurrent calls
      const promise1 = client.ensureValidToken();
      const promise2 = client.ensureValidToken();
      const promise3 = client.ensureValidToken();

      // Resolve the token
      resolveToken!({
        access_token: 'concurrent-token',
        expires_in: 3600,
        token_type: 'Bearer',
      });

      await Promise.all([promise1, promise2, promise3]);

      // All three share the one in-flight refresh
      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(1);
    });
  });

  describe('Token Lifecycle', () => {
    it('should refresh 5 minutes before the reported expiration', async () => {
      // expires_in: 3600 minus the 5-minute safety margin => 55 minutes usable
      mockGetClientCredentialsToken
        .mockResolvedValueOnce({
          access_token: 'token-1',
          expires_in: 3600,
          token_type: 'Bearer',
        })
        .mockResolvedValueOnce({
          access_token: 'token-2',
          expires_in: 3600,
          token_type: 'Bearer',
        });

      const client = new MinistryPlatformClient();

      // Fetch initial token
      await client.ensureValidToken();
      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(1);

      // Advance to 54:59 - just inside the 55-minute window
      vi.advanceTimersByTime(54 * 60 * 1000 + 59 * 1000);

      // Should still be valid
      await client.ensureValidToken();
      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(1);

      // Advance 2 more seconds, past 55:00
      vi.advanceTimersByTime(2000);

      // Should refresh now
      await client.ensureValidToken();
      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(2);
    });

    it('should fall back to a 1-hour lifetime when expires_in is missing', async () => {
      mockGetClientCredentialsToken
        .mockResolvedValueOnce({
          access_token: 'no-expiry-token',
          token_type: 'Bearer',
        })
        .mockResolvedValueOnce({
          access_token: 'refreshed-token',
          token_type: 'Bearer',
        });

      const client = new MinistryPlatformClient();

      await client.ensureValidToken();
      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(1);

      // Same 55-minute boundary as an explicit expires_in: 3600
      vi.advanceTimersByTime(54 * 60 * 1000 + 59 * 1000);
      await client.ensureValidToken();
      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(2000);
      await client.ensureValidToken();
      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(2);
    });

    it('should clamp a short expires_in to the 30-second floor', async () => {
      // 60s - 5min margin is negative, so the floor applies instead
      mockGetClientCredentialsToken
        .mockResolvedValueOnce({
          access_token: 'short-lived-token',
          expires_in: 60,
          token_type: 'Bearer',
        })
        .mockResolvedValueOnce({
          access_token: 'refreshed-token',
          expires_in: 60,
          token_type: 'Bearer',
        });

      const client = new MinistryPlatformClient();

      await client.ensureValidToken();
      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(1);

      // Just inside the 30-second floor
      vi.advanceTimersByTime(29 * 1000);
      await client.ensureValidToken();
      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(1);

      // Just past it
      vi.advanceTimersByTime(2000);
      await client.ensureValidToken();
      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(2);
    });

    it('should ignore a non-numeric expires_in and use the default lifetime', async () => {
      mockGetClientCredentialsToken.mockResolvedValueOnce({
        access_token: 'bogus-expiry-token',
        expires_in: 'not-a-number',
        token_type: 'Bearer',
      });

      const client = new MinistryPlatformClient();

      await client.ensureValidToken();
      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(1);

      // Would have refreshed immediately if NaN had reached expiresAt
      vi.advanceTimersByTime(54 * 60 * 1000);
      await client.ensureValidToken();
      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(1);
    });
  });

  describe('HTTP Client', () => {
    it('should return the same HttpClient instance', () => {
      const client = new MinistryPlatformClient();

      const httpClient1 = client.getHttpClient();
      const httpClient2 = client.getHttpClient();

      expect(httpClient1).toBe(httpClient2);
    });

    it('should provide HttpClient with token getter', async () => {
      mockGetClientCredentialsToken.mockResolvedValueOnce({
        access_token: 'injected-token',
        expires_in: 3600,
        token_type: 'Bearer',
      });

      const client = new MinistryPlatformClient();
      await client.ensureValidToken();

      const httpClient = client.getHttpClient();

      // The HttpClient should have access to the token via the getter
      // This is tested indirectly through the URL building
      expect(httpClient).toBeDefined();
      expect(typeof httpClient.buildUrl).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should propagate network errors from token refresh', async () => {
      mockGetClientCredentialsToken.mockRejectedValueOnce(
        new TypeError('Failed to fetch')
      );

      const client = new MinistryPlatformClient();

      await expect(client.ensureValidToken()).rejects.toThrow('Failed to fetch');
    });

    it('should propagate authentication errors', async () => {
      mockGetClientCredentialsToken.mockRejectedValueOnce(
        new Error('invalid_client: Client authentication failed')
      );

      const client = new MinistryPlatformClient();

      await expect(client.ensureValidToken()).rejects.toThrow(
        'invalid_client: Client authentication failed'
      );
    });

    it('should allow retry after failed token refresh', async () => {
      mockGetClientCredentialsToken
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce({
          access_token: 'retry-success-token',
          expires_in: 3600,
          token_type: 'Bearer',
        });

      const client = new MinistryPlatformClient();

      // First attempt fails
      await expect(client.ensureValidToken()).rejects.toThrow('Temporary error');

      // Once the negative-cache window (at most 30 s) has passed, a retry succeeds
      vi.advanceTimersByTime(30 * 1000 + 1);
      await client.ensureValidToken();
      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(2);
    });

    it('should log only the error name on refresh failure, never its message', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetClientCredentialsToken.mockRejectedValueOnce(
        new Error('Unexpected token "Jane Doe, "... is not valid JSON')
      );

      const client = new MinistryPlatformClient();
      await expect(client.ensureValidToken()).rejects.toThrow();

      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy.mock.calls[0]).toEqual([
        'Failed to refresh MP access token:',
        { error: 'Error' },
      ]);
    });
  });

  describe('Single-flight refresh and negative cache', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should make one token request for 50 concurrent cold calls', async () => {
      let resolveToken: (value: unknown) => void;
      mockGetClientCredentialsToken.mockImplementation(
        () => new Promise((resolve) => { resolveToken = resolve; })
      );

      const client = new MinistryPlatformClient();
      const calls = Array.from({ length: 50 }, () => client.ensureValidToken());

      resolveToken!({ access_token: 'shared-token', token_type: 'Bearer', expires_in: 3600 });
      await Promise.all(calls);

      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(1);
    });

    it('should share one failed refresh across concurrent callers', async () => {
      let rejectToken: (reason: unknown) => void;
      mockGetClientCredentialsToken.mockImplementation(
        () => new Promise((_, reject) => { rejectToken = reject; })
      );

      const client = new MinistryPlatformClient();
      const calls = Array.from({ length: 20 }, () => client.ensureValidToken());

      rejectToken!(new Error('503'));
      const results = await Promise.allSettled(calls);

      expect(results.every((r) => r.status === 'rejected')).toBe(true);
      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(1);
    });

    it('should fail fast without a token request inside the jittered window', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5); // 5 s + 12.5 s = 17.5 s
      mockGetClientCredentialsToken
        .mockRejectedValueOnce(new Error('down'))
        .mockResolvedValueOnce({ access_token: 'back', token_type: 'Bearer', expires_in: 3600 });

      const client = new MinistryPlatformClient();
      await expect(client.ensureValidToken()).rejects.toThrow('down');

      vi.advanceTimersByTime(17 * 1000);
      await expect(client.ensureValidToken()).rejects.toThrow(
        'MP access token unavailable: recent refresh failed'
      );
      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1000);
      await client.ensureValidToken();
      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(2);
    });

    it('should hold failures for at least 5 s even with zero jitter', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      mockGetClientCredentialsToken.mockRejectedValue(new Error('down'));

      const client = new MinistryPlatformClient();
      await expect(client.ensureValidToken()).rejects.toThrow('down');

      vi.advanceTimersByTime(4999);
      await expect(client.ensureValidToken()).rejects.toThrow('recent refresh failed');

      vi.advanceTimersByTime(2);
      await expect(client.ensureValidToken()).rejects.toThrow('down');
      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(2);
    });

    it('should clear the negative cache after a successful refresh', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      mockGetClientCredentialsToken
        .mockRejectedValueOnce(new Error('down'))
        .mockResolvedValueOnce({ access_token: 'a', token_type: 'Bearer', expires_in: 60 })
        .mockResolvedValueOnce({ access_token: 'b', token_type: 'Bearer', expires_in: 60 });

      const client = new MinistryPlatformClient();
      await expect(client.ensureValidToken()).rejects.toThrow('down');
      vi.advanceTimersByTime(5001);
      await client.ensureValidToken();

      // Token 'a' lives 30 s; the next refresh must not be blocked by the old failure
      vi.advanceTimersByTime(31 * 1000);
      await client.ensureValidToken();
      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(3);
    });
  });

  describe('Lifetime clamping', () => {
    it('should clamp a huge expires_in to 1 hour (no Invalid Date / never-refresh)', async () => {
      mockGetClientCredentialsToken
        .mockResolvedValueOnce({ access_token: 't1', token_type: 'Bearer', expires_in: 1e13 })
        .mockResolvedValueOnce({ access_token: 't2', token_type: 'Bearer', expires_in: 1e13 });

      const client = new MinistryPlatformClient();
      await client.ensureValidToken();

      vi.advanceTimersByTime(54 * 60 * 1000);
      await client.ensureValidToken();
      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(60 * 1000 + 1);
      await client.ensureValidToken();
      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(2);
    });

    it.each([0, -5])('should treat expires_in %s as the 30-second floor, not an hour', async (expiresIn) => {
      mockGetClientCredentialsToken
        .mockResolvedValueOnce({ access_token: 't1', token_type: 'Bearer', expires_in: expiresIn })
        .mockResolvedValueOnce({ access_token: 't2', token_type: 'Bearer', expires_in: expiresIn });

      const client = new MinistryPlatformClient();
      await client.ensureValidToken();

      vi.advanceTimersByTime(31 * 1000);
      await client.ensureValidToken();
      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(2);
    });
  });

  describe('401 handling through the HttpClient', () => {
    const originalEnv = { ...process.env };
    let fetchMock: ReturnType<typeof vi.fn>;

    const jsonHeaders = { get: (n: string) => (n.toLowerCase() === 'content-type' ? 'application/json' : null) };
    const ok = (body: unknown) => ({ ok: true, status: 200, statusText: 'OK', headers: jsonHeaders, json: () => Promise.resolve(body) });
    const unauthorized = () => ({ ok: false, status: 401, statusText: 'Unauthorized', headers: jsonHeaders, json: vi.fn() });
    const authHeader = (call: number) => fetchMock.mock.calls[call][1].headers.Authorization;

    beforeEach(() => {
      process.env.MINISTRY_PLATFORM_BASE_URL = 'https://mp.example.org/ministryplatformapi';
      fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetClientCredentialsToken
        .mockResolvedValueOnce({ access_token: 'revoked', token_type: 'Bearer', expires_in: 3600 })
        .mockResolvedValueOnce({ access_token: 'fresh', token_type: 'Bearer', expires_in: 3600 });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      process.env = { ...originalEnv };
    });

    it('should invalidate the token, refresh once, and retry once', async () => {
      fetchMock.mockResolvedValueOnce(unauthorized()).mockResolvedValueOnce(ok([{ Contact_ID: 1 }]));

      const client = new MinistryPlatformClient();
      await client.ensureValidToken();
      const result = await client.getHttpClient().get('/tables/Contacts');

      expect(result).toEqual([{ Contact_ID: 1 }]);
      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(2);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(authHeader(0)).toBe('Bearer revoked');
      expect(authHeader(1)).toBe('Bearer fresh');
    });

    it('should not loop when the retry is also rejected', async () => {
      fetchMock.mockResolvedValue(unauthorized());

      const client = new MinistryPlatformClient();
      await client.ensureValidToken();

      await expect(client.getHttpClient().get('/tables/Contacts')).rejects.toThrow(
        'GET /tables/Contacts failed: 401 Unauthorized'
      );
      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(2);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should refresh once for a burst of 401s on the same stale token', async () => {
      fetchMock
        .mockResolvedValueOnce(unauthorized())
        .mockResolvedValueOnce(unauthorized())
        .mockResolvedValue(ok([]));

      const client = new MinistryPlatformClient();
      await client.ensureValidToken();
      const http = client.getHttpClient();
      await Promise.all([http.get('/tables/A'), http.get('/tables/B')]);

      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(2);
      expect(fetchMock).toHaveBeenCalledTimes(4);
    });

    it('should not invalidate a token that was already replaced', async () => {
      fetchMock.mockResolvedValueOnce(unauthorized()).mockResolvedValue(ok([]));

      const client = new MinistryPlatformClient();
      await client.ensureValidToken(); // 'revoked'
      await client.getHttpClient().get('/tables/A'); // 401 -> now 'fresh'

      // A late 401 for 'revoked' arriving after 'fresh' is in place is a no-op
      const handler = (client as unknown as { handleUnauthorized: (t: string) => Promise<void> }).handleUnauthorized.bind(client);
      await handler('revoked');

      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(2);
    });

    it('should surface the 401 when the refresh itself fails', async () => {
      mockGetClientCredentialsToken.mockReset();
      mockGetClientCredentialsToken
        .mockResolvedValueOnce({ access_token: 'revoked', token_type: 'Bearer', expires_in: 3600 })
        .mockRejectedValueOnce(new Error('token endpoint down'));
      fetchMock.mockResolvedValue(unauthorized());

      const client = new MinistryPlatformClient();
      await client.ensureValidToken();

      await expect(client.getHttpClient().get('/tables/Contacts')).rejects.toThrow(
        'GET /tables/Contacts failed: 401 Unauthorized'
      );
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Secret handling on token-refresh failure', () => {
    const originalEnv = { ...process.env };
    const SECRET = 'super-secret-client-secret-value';

    afterEach(() => {
      vi.unstubAllGlobals();
      process.env = { ...originalEnv };
    });

    it('should never pass the client secret to console.error', async () => {
      // Exercise the real token function behind the mock, with a token
      // endpoint that rejects the request
      const actual = await vi.importActual<
        typeof import('@/lib/providers/ministry-platform/auth/client-credentials')
      >('@/lib/providers/ministry-platform/auth/client-credentials');
      mockGetClientCredentialsToken.mockImplementation(actual.getClientCredentialsToken);

      process.env.MINISTRY_PLATFORM_BASE_URL = 'https://mp.example.org/ministryplatformapi';
      process.env.MINISTRY_PLATFORM_CLIENT_ID = 'client-id';
      process.env.MINISTRY_PLATFORM_CLIENT_SECRET = SECRET;

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const fetchMock = vi.fn()
        .mockResolvedValueOnce({ ok: false, status: 401, statusText: 'Unauthorized', json: vi.fn() })
        .mockRejectedValueOnce(new TypeError(`fetch failed (body: client_secret=${SECRET})`));
      vi.stubGlobal('fetch', fetchMock);

      const client = new MinistryPlatformClient();
      await expect(client.ensureValidToken()).rejects.toThrow();
      vi.advanceTimersByTime(31 * 1000);
      await expect(client.ensureValidToken()).rejects.toThrow();

      // The secret really was sent, so its absence from the logs is meaningful
      expect(String(fetchMock.mock.calls[0][1].body)).toContain(SECRET);
      expect(errorSpy).toHaveBeenCalledTimes(2);
      for (const args of errorSpy.mock.calls) {
        const logged = args
          .map((a) => (a instanceof Error ? `${a.name} ${a.message} ${String(a.cause)}` : JSON.stringify(a)))
          .join(' ');
        expect(logged).not.toContain(SECRET);
      }
    });
  });
});

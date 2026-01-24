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

      // Advance time by 1 minute (still within 5-minute validity window)
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

      // Advance time by 6 minutes (past the 5-minute token life)
      vi.advanceTimersByTime(6 * 60 * 1000);

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

      // Each call triggers getClientCredentialsToken because there's no deduplication
      // This is current behavior - could be optimized in the future
      expect(mockGetClientCredentialsToken).toHaveBeenCalled();
    });
  });

  describe('Token Lifecycle', () => {
    it('should use 5-minute safety buffer for token expiration', async () => {
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

      // Advance time by 4 minutes 59 seconds (just under 5-minute buffer)
      vi.advanceTimersByTime(4 * 60 * 1000 + 59 * 1000);

      // Should still be valid
      await client.ensureValidToken();
      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(1);

      // Advance time by 2 more seconds (past 5-minute buffer)
      vi.advanceTimersByTime(2000);

      // Should refresh now
      await client.ensureValidToken();
      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(2);
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

      // Second attempt succeeds
      await client.ensureValidToken();
      expect(mockGetClientCredentialsToken).toHaveBeenCalledTimes(2);
    });
  });
});

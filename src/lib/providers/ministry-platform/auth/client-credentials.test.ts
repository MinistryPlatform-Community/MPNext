import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getClientCredentialsToken } from '@/lib/providers/ministry-platform/auth/client-credentials';

/**
 * getClientCredentialsToken Tests
 *
 * This 25-line function is the only thing standing between the app and every
 * Ministry Platform API call - MinistryPlatformClient.ensureValidToken() calls it
 * for every token refresh. It had no tests at all.
 *
 * What is worth pinning here:
 * - the OAuth2 client_credentials grant is form-encoded, not JSON
 * - the MP-specific scope string is sent verbatim (MP rejects a wrong scope)
 * - a non-OK response throws rather than returning a token-shaped object with
 *   undefined fields, which would otherwise surface later as a confusing 401
 */
describe('getClientCredentialsToken', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    process.env.MINISTRY_PLATFORM_BASE_URL = 'https://mp.example.org/ministryplatformapi';
    process.env.MINISTRY_PLATFORM_CLIENT_ID = 'test-client-id';
    process.env.MINISTRY_PLATFORM_CLIENT_SECRET = 'test-client-secret';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
  });

  it('should POST the client_credentials grant to the MP token endpoint', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        access_token: 'test-token',
        token_type: 'Bearer',
        expires_in: 3600,
      }),
    });

    const result = await getClientCredentialsToken();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];

    expect(url).toBe('https://mp.example.org/ministryplatformapi/oauth/connect/token');
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/x-www-form-urlencoded');

    expect(result).toEqual({
      access_token: 'test-token',
      token_type: 'Bearer',
      expires_in: 3600,
    });
  });

  it('should send grant_type, credentials, and the MP scope in the form body', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ access_token: 'test-token' }),
    });

    await getClientCredentialsToken();

    const body = new URLSearchParams(fetchMock.mock.calls[0][1].body);

    expect(body.get('grant_type')).toBe('client_credentials');
    expect(body.get('client_id')).toBe('test-client-id');
    expect(body.get('client_secret')).toBe('test-client-secret');
    expect(body.get('scope')).toBe(
      'http://www.thinkministry.com/dataplatform/scopes/all'
    );
  });

  it('should throw with the status text when the token request is rejected', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: vi.fn(),
    });

    await expect(getClientCredentialsToken()).rejects.toThrow(
      'Failed to get client credentials token: Unauthorized'
    );
  });

  it('should not attempt to parse the body of a failed response', async () => {
    const json = vi.fn();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json,
    });

    await expect(getClientCredentialsToken()).rejects.toThrow('Internal Server Error');
    expect(json).not.toHaveBeenCalled();
  });

  it('should propagate network failures unchanged', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));

    await expect(getClientCredentialsToken()).rejects.toThrow('fetch failed');
  });
});

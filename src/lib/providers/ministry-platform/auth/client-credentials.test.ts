import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getClientCredentialsToken,
  TOKEN_TIMEOUT_MS,
} from '@/lib/providers/ministry-platform/auth/client-credentials';

/**
 * getClientCredentialsToken Tests
 *
 * This function is the only thing standing between the app and every
 * Ministry Platform API call - MinistryPlatformClient.ensureValidToken() calls it
 * for every token refresh.
 *
 * What is worth pinning here:
 * - the OAuth2 client_credentials grant is form-encoded, not JSON
 * - the MP-specific scope string is sent verbatim (MP rejects a wrong scope)
 * - a non-OK response throws rather than returning a token-shaped object with
 *   undefined fields, which would otherwise surface later as a confusing 401
 * - a 200 without a usable bearer token is rejected, not cached
 * - the request has a deadline and refuses redirects (a 307 would re-send the
 *   client secret to whatever origin it names)
 * - no error message ever carries the client secret or the response body
 */

const SECRET = 'test-client-secret';

function mockHeaders(values: Record<string, string>) {
  const lower = Object.fromEntries(
    Object.entries(values).map(([k, v]) => [k.toLowerCase(), v])
  );
  return { get: (name: string) => lower[name.toLowerCase()] ?? null };
}

function tokenResponse(body: unknown, contentType = 'application/json') {
  return {
    ok: true,
    status: 200,
    headers: mockHeaders({ 'Content-Type': contentType }),
    json: vi.fn().mockResolvedValue(body),
  };
}

describe('getClientCredentialsToken', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    process.env.MINISTRY_PLATFORM_BASE_URL = 'https://mp.example.org/ministryplatformapi';
    process.env.MINISTRY_PLATFORM_CLIENT_ID = 'test-client-id';
    process.env.MINISTRY_PLATFORM_CLIENT_SECRET = SECRET;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  it('should POST the client_credentials grant to the MP token endpoint', async () => {
    fetchMock.mockResolvedValueOnce(
      tokenResponse({ access_token: 'test-token', token_type: 'Bearer', expires_in: 3600 })
    );

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

  it('should refuse redirects and set a deadline on the token request', async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout');
    fetchMock.mockResolvedValueOnce(
      tokenResponse({ access_token: 'test-token', token_type: 'Bearer' })
    );

    await getClientCredentialsToken();

    const init = fetchMock.mock.calls[0][1];
    expect(init.redirect).toBe('error');
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(timeoutSpy).toHaveBeenCalledWith(TOKEN_TIMEOUT_MS);
    expect(TOKEN_TIMEOUT_MS).toBe(10_000);
  });

  it('should send grant_type, credentials, and the MP scope in the form body', async () => {
    fetchMock.mockResolvedValueOnce(
      tokenResponse({ access_token: 'test-token', token_type: 'bearer' })
    );

    await getClientCredentialsToken();

    const body = new URLSearchParams(fetchMock.mock.calls[0][1].body);

    expect(body.get('grant_type')).toBe('client_credentials');
    expect(body.get('client_id')).toBe('test-client-id');
    expect(body.get('client_secret')).toBe(SECRET);
    expect(body.get('scope')).toBe(
      'http://www.thinkministry.com/dataplatform/scopes/all'
    );
  });

  it('should throw with the status and status text when the token request is rejected', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: vi.fn(),
    });

    await expect(getClientCredentialsToken()).rejects.toThrow(
      'Failed to get client credentials token: 401 Unauthorized'
    );
  });

  it('should still report the status when statusText is empty (HTTP/2)', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 503, statusText: '', json: vi.fn() });

    await expect(getClientCredentialsToken()).rejects.toThrow(
      /^Failed to get client credentials token: 503$/
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

    await expect(getClientCredentialsToken()).rejects.toThrow('500 Internal Server Error');
    expect(json).not.toHaveBeenCalled();
  });

  it('should wrap network failures, keeping only the error name', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed: https://mp.example.org'));

    await expect(getClientCredentialsToken()).rejects.toThrow(
      /^Failed to get client credentials token: TypeError$/
    );
  });

  it('should reject a refused redirect (fetch throws under redirect: "error")', async () => {
    // undici rejects with TypeError('fetch failed', { cause: 'unexpected redirect' })
    fetchMock.mockRejectedValueOnce(
      new TypeError('fetch failed', { cause: new Error('unexpected redirect') })
    );

    await expect(getClientCredentialsToken()).rejects.toThrow(
      'Failed to get client credentials token: TypeError'
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should reject when the deadline passes', async () => {
    fetchMock.mockRejectedValueOnce(
      new DOMException('The operation was aborted due to timeout', 'TimeoutError')
    );

    await expect(getClientCredentialsToken()).rejects.toThrow(
      'Failed to get client credentials token: TimeoutError'
    );
  });

  describe('token response validation', () => {
    it.each([
      ['missing access_token', { token_type: 'Bearer', expires_in: 3600 }],
      ['empty access_token', { access_token: '', token_type: 'Bearer' }],
      ['whitespace access_token', { access_token: '   ', token_type: 'Bearer' }],
      ['non-string access_token', { access_token: 12345, token_type: 'Bearer' }],
      ['missing token_type', { access_token: 'tok' }],
      ['non-bearer token_type', { access_token: 'tok', token_type: 'mac' }],
      ['non-string token_type', { access_token: 'tok', token_type: 1 }],
      ['null body', null],
    ])('should reject a 200 with %s', async (_label, body) => {
      fetchMock.mockResolvedValueOnce(tokenResponse(body));

      await expect(getClientCredentialsToken()).rejects.toThrow(
        'Failed to get client credentials token: invalid token response'
      );
    });

    it('should accept token_type case-insensitively', async () => {
      fetchMock.mockResolvedValueOnce(
        tokenResponse({ access_token: 'tok', token_type: 'BEARER' })
      );

      await expect(getClientCredentialsToken()).resolves.toMatchObject({ access_token: 'tok' });
    });

    it('should reject a 204 (no token at all)', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, status: 204, headers: mockHeaders({}), json: vi.fn() });

      await expect(getClientCredentialsToken()).rejects.toThrow('invalid token response');
    });

    it('should refuse to parse a non-JSON 200 and not echo its body', async () => {
      const json = vi.fn();
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: mockHeaders({ 'Content-Type': 'text/html' }),
        json,
      });

      await expect(getClientCredentialsToken()).rejects.toThrow(
        'Failed to get client credentials token: unexpected content-type'
      );
      expect(json).not.toHaveBeenCalled();
    });

    it('should not leak a body fragment from a malformed JSON 200', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: mockHeaders({ 'Content-Type': 'application/json' }),
        json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected token "Jane Doe, "... is not valid JSON')),
      });

      try {
        await getClientCredentialsToken();
        expect.unreachable('expected getClientCredentialsToken to throw');
      } catch (err) {
        expect((err as Error).message).toBe(
          'Failed to get client credentials token: invalid JSON response'
        );
      }
    });
  });

  describe('secret handling', () => {
    it.each([
      ['a rejected token request', () => fetchMock.mockResolvedValueOnce({ ok: false, status: 400, statusText: 'Bad Request', json: vi.fn() })],
      ['a network failure', () => fetchMock.mockRejectedValueOnce(new TypeError(`fetch failed ${SECRET}`))],
      ['an invalid token response', () => fetchMock.mockResolvedValueOnce(tokenResponse({ error: SECRET }))],
    ])('should never put the client secret in the error for %s', async (_label, arrange) => {
      arrange();

      const err = await getClientCredentialsToken().catch((e: unknown) => e);
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).message).not.toContain(SECRET);
      expect(JSON.stringify(err)).not.toContain(SECRET);
      expect((err as Error).cause).toBeUndefined();
    });
  });
});

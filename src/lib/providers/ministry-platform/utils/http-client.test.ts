import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  API_TIMEOUT_MS,
  HttpClient,
  UPLOAD_TIMEOUT_MS,
} from '@/lib/providers/ministry-platform/utils/http-client';

/**
 * HttpClient Tests
 *
 * Tests for the HTTP client utility that handles all Ministry Platform API requests.
 * Tests cover:
 * - HTTP methods (GET, POST, PUT, DELETE)
 * - URL building and query parameter encoding
 * - Authorization header injection
 * - Error handling for failed requests
 * - FormData handling
 */

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Minimal Headers stand-in for mocked responses
function mockHeaders(values: Record<string, string>) {
  const lower = Object.fromEntries(
    Object.entries(values).map(([k, v]) => [k.toLowerCase(), v])
  );
  return { get: (name: string) => lower[name.toLowerCase()] ?? null };
}
const JSON_HEADERS = mockHeaders({ 'Content-Type': 'application/json; charset=utf-8' });

// Every request must carry a deadline and refuse redirects
const SAFE_INIT = { redirect: 'error', signal: expect.any(AbortSignal) };

describe('HttpClient', () => {
  const baseUrl = 'https://api.ministryplatform.com';
  const mockToken = 'test-access-token-123';
  const getToken = () => mockToken;
  let httpClient: HttpClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    httpClient = new HttpClient(baseUrl, getToken);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('URL Building', () => {
    it('should build URL without query parameters', () => {
      const url = httpClient.buildUrl('/tables/Contacts');
      expect(url).toBe('https://api.ministryplatform.com/tables/Contacts');
    });

    it('should build URL with single query parameter', () => {
      const url = httpClient.buildUrl('/tables/Contacts', { $top: 10 });
      expect(url).toBe('https://api.ministryplatform.com/tables/Contacts?$top=10');
    });

    it('should build URL with multiple query parameters', () => {
      const url = httpClient.buildUrl('/tables/Contacts', {
        $top: 10,
        $skip: 20,
        $select: 'Contact_ID,Display_Name',
      });
      expect(url).toContain('$top=10');
      expect(url).toContain('$skip=20');
      expect(url).toContain('$select=Contact_ID%2CDisplay_Name');
    });

    it('should URL-encode special characters in query parameters', () => {
      const url = httpClient.buildUrl('/tables/Contacts', {
        $filter: "Last_Name LIKE 'Smith%'",
      });
      expect(url).toContain("$filter=Last_Name%20LIKE%20'Smith%25'");
    });

    it('should handle array query parameters', () => {
      const url = httpClient.buildUrl('/tables/Contact_Log', {
        id: [1, 2, 3],
      });
      expect(url).toContain('id=1');
      expect(url).toContain('id=2');
      expect(url).toContain('id=3');
    });

    it('should filter out undefined and null query parameters', () => {
      const url = httpClient.buildUrl('/tables/Contacts', {
        $top: 10,
        $skip: undefined,
        $filter: null,
      });
      expect(url).toBe('https://api.ministryplatform.com/tables/Contacts?$top=10');
    });

    it('should return base URL when all query params are undefined/null', () => {
      const url = httpClient.buildUrl('/tables/Contacts', {
        $top: undefined,
        $skip: null,
      });
      expect(url).toBe('https://api.ministryplatform.com/tables/Contacts');
    });

    it('should handle boolean query parameters', () => {
      const url = httpClient.buildUrl('/tables/Contacts', {
        $distinct: true,
      });
      expect(url).toBe('https://api.ministryplatform.com/tables/Contacts?$distinct=true');
    });
  });

  describe('GET Requests', () => {
    it('should make GET request with authorization header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: JSON_HEADERS,
        json: () => Promise.resolve([{ Contact_ID: 1, Display_Name: 'John Doe' }]),
      });

      const result = await httpClient.get('/tables/Contacts');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.ministryplatform.com/tables/Contacts',
        {
          ...SAFE_INIT,
          method: 'GET',
          headers: {
            'Authorization': 'Bearer test-access-token-123',
            'Accept': 'application/json',
          },
        }
      );
      expect(result).toEqual([{ Contact_ID: 1, Display_Name: 'John Doe' }]);
    });

    it('should make GET request with query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: JSON_HEADERS,
        json: () => Promise.resolve([]),
      });

      await httpClient.get('/tables/Contacts', { $top: 10, $filter: 'Active=1' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('$top=10'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('$filter=Active%3D1'),
        expect.any(Object)
      );
    });

    it('should throw error on failed GET request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: () => Promise.resolve(''),
      });

      await expect(httpClient.get('/tables/NonExistent')).rejects.toThrow(
        'GET /tables/NonExistent failed: 404 Not Found'
      );
    });

    it('should throw error on 401 Unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: () => Promise.resolve(''),
      });

      await expect(httpClient.get('/tables/Contacts')).rejects.toThrow(
        'GET /tables/Contacts failed: 401 Unauthorized'
      );
    });

    it('should throw error on 500 Internal Server Error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve(''),
      });

      await expect(httpClient.get('/tables/Contacts')).rejects.toThrow(
        'GET /tables/Contacts failed: 500 Internal Server Error'
      );
    });
  });

  describe('POST Requests', () => {
    it('should make POST request with JSON body', async () => {
      const newRecord = { First_Name: 'John', Last_Name: 'Doe' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: JSON_HEADERS,
        json: () => Promise.resolve([{ Contact_ID: 1, ...newRecord }]),
      });

      const result = await httpClient.post('/tables/Contacts', newRecord);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.ministryplatform.com/tables/Contacts',
        {
          ...SAFE_INIT,
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-access-token-123',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(newRecord),
        }
      );
      expect(result).toEqual([{ Contact_ID: 1, ...newRecord }]);
    });

    it('should make POST request without body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: JSON_HEADERS,
        json: () => Promise.resolve({ success: true }),
      });

      await httpClient.post('/some/endpoint');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.ministryplatform.com/some/endpoint',
        {
          ...SAFE_INIT,
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-access-token-123',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: undefined,
        }
      );
    });

    it('should make POST request with query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: JSON_HEADERS,
        json: () => Promise.resolve([]),
      });

      await httpClient.post('/tables/Contacts', { Name: 'Test' }, { $userId: 1 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('$userId=1'),
        expect.any(Object)
      );
    });

    it('should throw error on failed POST request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      await expect(
        httpClient.post('/tables/Contacts', { Invalid: 'data' })
      ).rejects.toThrow('POST /tables/Contacts failed: 400 Bad Request');
    });
  });

  describe('POST FormData Requests', () => {
    it('should make POST request with FormData', async () => {
      const formData = new FormData();
      formData.append('file', new Blob(['test']), 'test.txt');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: JSON_HEADERS,
        json: () => Promise.resolve({ FileId: 1 }),
      });

      const result = await httpClient.postFormData('/files', formData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.ministryplatform.com/files',
        {
          ...SAFE_INIT,
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-access-token-123',
            'Accept': 'application/json',
            // No Content-Type for FormData
          },
          body: formData,
        }
      );
      expect(result).toEqual({ FileId: 1 });
    });

    it('should throw error on failed FormData POST', async () => {
      const formData = new FormData();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 413,
        statusText: 'Payload Too Large',
      });

      await expect(httpClient.postFormData('/files', formData)).rejects.toThrow(
        'POST /files failed: 413 Payload Too Large'
      );
    });
  });

  describe('PUT Requests', () => {
    it('should make PUT request with JSON body', async () => {
      const updatedRecord = { Contact_ID: 1, First_Name: 'Jane' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: JSON_HEADERS,
        json: () => Promise.resolve([updatedRecord]),
      });

      const result = await httpClient.put('/tables/Contacts', updatedRecord);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.ministryplatform.com/tables/Contacts',
        {
          ...SAFE_INIT,
          method: 'PUT',
          headers: {
            'Authorization': 'Bearer test-access-token-123',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(updatedRecord),
        }
      );
      expect(result).toEqual([updatedRecord]);
    });

    it('should throw error on failed PUT request with response body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: () => Promise.resolve('Validation error: Field X is required'),
      });

      await expect(
        httpClient.put('/tables/Contacts', { Invalid: 'data' })
      ).rejects.toThrow('PUT /tables/Contacts failed: 400 Bad Request');
    });
  });

  describe('PUT FormData Requests', () => {
    it('should make PUT request with FormData', async () => {
      const formData = new FormData();
      formData.append('file', new Blob(['updated']), 'updated.txt');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: JSON_HEADERS,
        json: () => Promise.resolve({ FileId: 1, FileName: 'updated.txt' }),
      });

      const result = await httpClient.putFormData('/files/1', formData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.ministryplatform.com/files/1',
        {
          ...SAFE_INIT,
          method: 'PUT',
          headers: {
            'Authorization': 'Bearer test-access-token-123',
            'Accept': 'application/json',
          },
          body: formData,
        }
      );
      expect(result).toEqual({ FileId: 1, FileName: 'updated.txt' });
    });

    it('should throw on a non-OK PUT FormData response', async () => {
      const formData = new FormData();
      formData.append('file', new Blob(['updated']), 'updated.txt');

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 413,
        statusText: 'Payload Too Large',
        json: () => Promise.resolve({}),
      });

      await expect(httpClient.putFormData('/files/1', formData)).rejects.toThrow(
        'PUT /files/1 failed: 413 Payload Too Large'
      );
    });

    it('should append query params to a PUT FormData request', async () => {
      const formData = new FormData();
      formData.append('file', new Blob(['updated']), 'updated.txt');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: JSON_HEADERS,
        json: () => Promise.resolve({ FileId: 1 }),
      });

      await httpClient.putFormData('/files/1', formData, { $userId: 7 });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.ministryplatform.com/files/1?$userId=7',
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  describe('DELETE Requests', () => {
    it('should make DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: JSON_HEADERS,
        json: () => Promise.resolve([{ Contact_ID: 1 }]),
      });

      const result = await httpClient.delete('/tables/Contacts', { id: [1] });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('id=1'),
        {
          ...SAFE_INIT,
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer test-access-token-123',
            'Accept': 'application/json',
          },
        }
      );
      expect(result).toEqual([{ Contact_ID: 1 }]);
    });

    it('should throw error on failed DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      await expect(httpClient.delete('/tables/Contacts', { id: [1] })).rejects.toThrow(
        'DELETE /tables/Contacts failed: 403 Forbidden'
      );
    });
  });

  describe('Token Injection', () => {
    it('should use current token from getToken function', async () => {
      let currentToken = 'initial-token';
      const dynamicClient = new HttpClient(baseUrl, () => currentToken);

      mockFetch.mockResolvedValue({
        ok: true,
        headers: JSON_HEADERS,
        json: () => Promise.resolve([]),
      });

      await dynamicClient.get('/test');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer initial-token',
          }),
        })
      );

      // Update token
      currentToken = 'updated-token';

      await dynamicClient.get('/test');
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer updated-token',
          }),
        })
      );
    });
  });

  describe('Type Safety', () => {
    it('should return typed response from GET', async () => {
      interface Contact {
        Contact_ID: number;
        Display_Name: string;
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: JSON_HEADERS,
        json: () => Promise.resolve([{ Contact_ID: 1, Display_Name: 'Test' }]),
      });

      const result = await httpClient.get<Contact[]>('/tables/Contacts');

      expect(result[0].Contact_ID).toBe(1);
      expect(result[0].Display_Name).toBe('Test');
    });
  });

  describe('Logging safety (F5)', () => {
    // Member PII and pastoral notes must never reach info-level logs, and a
    // failure log/message must never echo the query string ($filter) or the
    // response body. See .claude/references/auth.md § Logging policy.
    let logSpy: ReturnType<typeof vi.fn>;
    let errorSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should not log anything on a successful GET', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: JSON_HEADERS,
        json: () => Promise.resolve([{ Contact_ID: 1, Notes: 'Pastoral note' }]),
      });

      await httpClient.get('/tables/Contact_Log');

      expect(logSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should not log the response body or the full URL/query string on a failed GET', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Notes: "Confidential pastoral note", Display_Name: "Jane Doe"'),
      });

      await expect(
        httpClient.get('/tables/Contact_Log', { $filter: "Notes LIKE '%grief%'" })
      ).rejects.toThrow('GET /tables/Contact_Log failed: 500 Internal Server Error');

      expect(errorSpy).toHaveBeenCalledTimes(1);
      const loggedArgs = errorSpy.mock.calls[0].map((a) => JSON.stringify(a)).join(' ');
      expect(loggedArgs).not.toContain('Confidential pastoral note');
      expect(loggedArgs).not.toContain('Jane Doe');
      expect(loggedArgs).not.toContain('grief');
      expect(loggedArgs).not.toContain('$filter');
    });

    it('should not include the response body in the thrown error message on a failed GET', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: () => Promise.resolve('Notes: "Confidential pastoral note"'),
      });

      try {
        await httpClient.get('/tables/Contact_Log');
        expect.unreachable('expected httpClient.get to throw');
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        expect((err as Error).message).not.toContain('Confidential pastoral note');
        expect((err as Error).message).toBe('GET /tables/Contact_Log failed: 400 Bad Request');
      }
    });

    it('should not log the request body or response body on a failed PUT', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: () => Promise.resolve('Notes: "Confidential pastoral note"'),
      });

      await expect(
        httpClient.put('/tables/Contact_Log', { Notes: 'Confidential pastoral note' })
      ).rejects.toThrow('PUT /tables/Contact_Log failed: 400 Bad Request');

      expect(logSpy).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledTimes(1);
      const loggedArgs = errorSpy.mock.calls[0].map((a) => JSON.stringify(a)).join(' ');
      expect(loggedArgs).not.toContain('Confidential pastoral note');
    });

    it.each([
      ['POST', () => httpClient.post('/tables/Contact_Log', { Notes: 'Confidential pastoral note' })],
      ['POST', () => httpClient.postFormData('/files/Contact_Log/1', new FormData())],
      ['PUT', () => httpClient.putFormData('/files/1', new FormData())],
      ['DELETE', () => httpClient.delete('/tables/Contact_Log', { id: [1] })],
    ])('should log %s failures with identifiers only', async (method, call) => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        statusText: 'Conflict',
        text: () => Promise.resolve('Notes: "Confidential pastoral note"'),
      });

      await expect(call()).rejects.toThrow(`${method} `);

      expect(errorSpy).toHaveBeenCalledTimes(1);
      const [message, details] = errorSpy.mock.calls[0];
      expect(message).toBe(`${method} Request failed:`);
      expect(details).toEqual({
        method,
        endpoint: expect.any(String),
        status: 409,
        statusText: 'Conflict',
      });
      expect(JSON.stringify(errorSpy.mock.calls)).not.toContain('Confidential pastoral note');
    });

    it('should redact a file unique ID from failure logs and messages', async () => {
      const uniqueId = '0f8fad5b-d9cb-469f-a165-70867728950e';
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' });

      await expect(httpClient.get(`/files/${uniqueId}/metadata`)).rejects.toThrow(
        'GET /files/{uniqueId}/metadata failed: 404 Not Found'
      );
      expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(uniqueId);
      expect(JSON.stringify(errorSpy.mock.calls)).toContain('/files/{uniqueId}/metadata');
    });

    it('should redact a file unique ID from network-failure messages', async () => {
      const uniqueId = '0F8FAD5B-D9CB-469F-A165-70867728950E';
      mockFetch.mockRejectedValueOnce(new TypeError(`fetch failed for ${uniqueId}`));

      const err = await httpClient.delete(`/files/${uniqueId}`).catch((e: unknown) => e);
      expect((err as Error).message).toBe('DELETE /files/{uniqueId} failed: TypeError');
      expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(uniqueId);
    });
  });

  describe('Timeouts and redirects', () => {
    let errorSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should use the API deadline for JSON calls and the upload deadline for form data', async () => {
      const timeoutSpy = vi.spyOn(AbortSignal, 'timeout');
      mockFetch.mockResolvedValue({ ok: true, headers: JSON_HEADERS, json: () => Promise.resolve({}) });

      await httpClient.get('/tables/Contacts');
      await httpClient.post('/tables/Contacts', {});
      await httpClient.put('/tables/Contacts', {});
      await httpClient.delete('/tables/Contacts');
      expect(timeoutSpy.mock.calls.map((c) => c[0])).toEqual([
        API_TIMEOUT_MS, API_TIMEOUT_MS, API_TIMEOUT_MS, API_TIMEOUT_MS,
      ]);

      timeoutSpy.mockClear();
      await httpClient.postFormData('/files/Contacts/1', new FormData());
      await httpClient.putFormData('/files/1', new FormData());
      expect(timeoutSpy.mock.calls.map((c) => c[0])).toEqual([UPLOAD_TIMEOUT_MS, UPLOAD_TIMEOUT_MS]);

      expect(API_TIMEOUT_MS).toBe(20_000);
      expect(UPLOAD_TIMEOUT_MS).toBe(60_000);
    });

    it('should reject at the deadline when MP never responds', async () => {
      const realTimeout = AbortSignal.timeout.bind(AbortSignal);
      vi.spyOn(AbortSignal, 'timeout').mockImplementation(() => realTimeout(10));
      // A server that never answers: settle only when the signal aborts
      mockFetch.mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise((_, reject) => {
            init.signal!.addEventListener('abort', () => reject(init.signal!.reason));
          })
      );

      await expect(httpClient.get('/tables/Contacts')).rejects.toThrow(
        'GET /tables/Contacts failed: TimeoutError'
      );
      expect(errorSpy).toHaveBeenCalledWith('GET Request failed:', {
        method: 'GET',
        endpoint: '/tables/Contacts',
        error: 'TimeoutError',
      });
    });

    it('should fail (not follow) when fetch refuses a redirect', async () => {
      // undici's behaviour under redirect: "error"
      mockFetch.mockRejectedValueOnce(
        new TypeError('fetch failed', { cause: new Error('unexpected redirect') })
      );

      await expect(httpClient.post('/tables/Contact_Log', { Notes: 'x' })).rejects.toThrow(
        'POST /tables/Contact_Log failed: TypeError'
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][1].redirect).toBe('error');
    });

    it('should report a non-Error rejection by its type', async () => {
      mockFetch.mockRejectedValueOnce('boom');

      await expect(httpClient.get('/tables/Contacts')).rejects.toThrow(
        'GET /tables/Contacts failed: string'
      );
    });

    it('should never put the query string in a network-failure message', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('fetch failed'));

      const err = await httpClient
        .get('/tables/Contact_Log', { $filter: "Notes LIKE '%grief%'" })
        .catch((e: unknown) => e);
      expect((err as Error).message).not.toContain('grief');
      expect(JSON.stringify(errorSpy.mock.calls)).not.toContain('grief');
    });
  });

  describe('Response parsing', () => {
    it('should accept +json media types such as application/vnd.api+json', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: mockHeaders({ 'content-type': 'application/vnd.api+json' }),
        json: () => Promise.resolve({ a: 1 }),
      });

      await expect(httpClient.get('/tables/Contacts')).resolves.toEqual({ a: 1 });
    });

    it.each([
      ['text/html', mockHeaders({ 'content-type': 'text/html' })],
      ['application/jsonp', mockHeaders({ 'content-type': 'application/jsonp' })],
      ['a missing content-type', mockHeaders({})],
      ['no headers at all', undefined],
    ])('should refuse to parse %s', async (_label, headers) => {
      const json = vi.fn();
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200, headers, json });

      await expect(httpClient.get('/tables/Contacts')).rejects.toThrow(
        'GET /tables/Contacts failed: unexpected content-type'
      );
      expect(json).not.toHaveBeenCalled();
    });

    it('should not leak a body fragment from malformed JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: JSON_HEADERS,
        json: () => Promise.reject(new SyntaxError('Unexpected token "Jane Doe, "... is not valid JSON')),
      });

      const err = await httpClient.get('/tables/Contacts').catch((e: unknown) => e);
      expect((err as Error).message).toBe('GET /tables/Contacts failed: invalid JSON response');
    });

    it('should return undefined for an empty body', async () => {
      const json = vi.fn();
      mockFetch
        .mockResolvedValueOnce({ ok: true, status: 204, headers: mockHeaders({}), json })
        .mockResolvedValueOnce({ ok: true, status: 200, headers: mockHeaders({ 'Content-Length': '0' }), json });

      await expect(httpClient.delete('/files/1')).resolves.toBeUndefined();
      await expect(httpClient.get('/refreshMetadata')).resolves.toBeUndefined();
      expect(json).not.toHaveBeenCalled();
    });
  });

  describe('401 retry', () => {
    let errorSpy: ReturnType<typeof vi.fn>;
    const unauthorized = { ok: false, status: 401, statusText: 'Unauthorized' };
    const okJson = (body: unknown) => ({ ok: true, status: 200, headers: JSON_HEADERS, json: () => Promise.resolve(body) });

    beforeEach(() => {
      errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should call the handler with the rejected token and retry once with the new one', async () => {
      let token = 'stale';
      const onUnauthorized = vi.fn(async () => { token = 'fresh'; });
      const client = new HttpClient(baseUrl, () => token, onUnauthorized);
      mockFetch.mockResolvedValueOnce(unauthorized).mockResolvedValueOnce(okJson([1]));

      await expect(client.post('/tables/Contacts', { A: 1 })).resolves.toEqual([1]);

      expect(onUnauthorized).toHaveBeenCalledExactlyOnceWith('stale');
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch.mock.calls[1][1].headers.Authorization).toBe('Bearer fresh');
      // The body is re-sent on the retry
      expect(mockFetch.mock.calls[1][1].body).toBe(JSON.stringify({ A: 1 }));
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should retry only once', async () => {
      const onUnauthorized = vi.fn(async () => {});
      const client = new HttpClient(baseUrl, getToken, onUnauthorized);
      mockFetch.mockResolvedValue(unauthorized);

      await expect(client.get('/tables/Contacts')).rejects.toThrow(
        'GET /tables/Contacts failed: 401 Unauthorized'
      );
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry other failures', async () => {
      const onUnauthorized = vi.fn(async () => {});
      const client = new HttpClient(baseUrl, getToken, onUnauthorized);
      mockFetch.mockResolvedValueOnce({ ok: false, status: 403, statusText: 'Forbidden' });

      await expect(client.get('/tables/Contacts')).rejects.toThrow('403 Forbidden');
      expect(onUnauthorized).not.toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should surface the original 401 and log only the error name when the refresh fails', async () => {
      const onUnauthorized = vi.fn(async () => {
        throw new Error('Failed to get client credentials token: 400 Bad Request');
      });
      const client = new HttpClient(baseUrl, getToken, onUnauthorized);
      mockFetch.mockResolvedValueOnce(unauthorized);

      await expect(client.get('/tables/Contacts')).rejects.toThrow(
        'GET /tables/Contacts failed: 401 Unauthorized'
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith('MP token refresh after 401 failed:', {
        method: 'GET',
        endpoint: '/tables/Contacts',
        error: 'Error',
      });
    });
  });

  describe('Endpoint guard (path traversal)', () => {
    const mpBase = 'https://mp.example.org/ministryplatformapi';
    let client: HttpClient;

    beforeEach(() => {
      client = new HttpClient(mpBase, getToken);
    });

    it.each([
      '/tables/Contacts',
      '/tables/dp_Users',
      '/tables/Contact%20Log',
      '/tables',
      '/procs',
      '/procs/api_Common_GetPrefetchData',
      '/files/Contacts/42',
      '/files/123',
      '/files/123/metadata',
      '/files/0f8fad5b-d9cb-469f-a165-70867728950e',
      '/files/0f8fad5b-d9cb-469f-a165-70867728950e/metadata',
      '/domain',
      '/domain/filters',
      '/refreshMetadata',
      '/communications',
      '/messages',
      '/tables/Contacts.v2',
    ])('should allow the legitimate endpoint %s', (endpoint) => {
      expect(client.buildUrl(endpoint)).toBe(`${mpBase}${endpoint}`);
    });

    it.each([
      ['a dot-dot segment', '/files/../tables/Contacts'],
      ['a bare dot-dot', '/tables/..'],
      ['a query smuggled into the path', '/files/x?$select=Email_Address'],
      ['a fragment', '/files/x#'],
      ['a backslash', '/files/..\\tables'],
      ['a lone backslash', '/files\\x'],
      ['%2e (lower case)', '/files/%2e%2e/tables'],
      ['%2E (upper case)', '/files/%2E%2E/tables'],
      ['%2f (lower case)', '/files/x%2ftables'],
      ['%2F (upper case)', '/files/x%2Ftables'],
      ['%5c', '/files/x%5Ctables'],
      ['a tab (stripped by the URL parser)', '/files/.\t./tables'],
      ['a newline', '/files/.\n./tables'],
      ['a NUL', '/files/x\u0000'],
      ['no leading slash', 'tables/Contacts'],
      ['a userinfo/host injection', '@evil.example/x'],
      ['an absolute URL', 'https://evil.example/x'],
      ['an empty endpoint', ''],
    ])('should reject %s before fetch', async (_label, endpoint) => {
      expect(() => client.buildUrl(endpoint)).toThrow('Refusing unsafe MP API endpoint');
      await expect(client.get(endpoint)).rejects.toThrow('Refusing unsafe MP API endpoint');
      await expect(client.delete(endpoint)).rejects.toThrow('Refusing unsafe MP API endpoint');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should reject a non-string endpoint at runtime', () => {
      expect(() => client.buildUrl(undefined as unknown as string)).toThrow(
        'Refusing unsafe MP API endpoint'
      );
    });

    it.each([
      // The review's repro payloads (FileService / TableService shapes)
      '/files/../tables/Contacts?$select=Contact_ID,Email_Address&$top=1000#/metadata',
      '/files/../procs/api_Some_Proc?@ContactID=1#/1',
      '/files/../tables/Contacts?id=1#',
      `/tables/${encodeURIComponent('..')}`,
      `/procs/${encodeURIComponent('../tables/Contacts')}`,
    ])('should reject the review repro %s', (endpoint) => {
      expect(() => client.buildUrl(endpoint)).toThrow('Refusing unsafe MP API endpoint');
    });

    it('should refuse a request whose resolved URL leaves the API root', () => {
      // The URL parser strips a trailing space from the base on its own, but
      // not once a path follows it, so the resolved URL no longer sits under root
      const misconfigured = new HttpClient(`${mpBase} `, getToken);
      expect(() => misconfigured.buildUrl('/tables/Contacts')).toThrow(
        'Refusing unsafe MP API endpoint'
      );
    });

    it('should refuse to build a URL when the base URL is not a URL', () => {
      const broken = new HttpClient('not a url', getToken);
      expect(() => broken.buildUrl('/tables/Contacts')).toThrow('Invalid MP API base URL');
    });

    it('should accept a base URL with a trailing slash', () => {
      const trailing = new HttpClient(`${mpBase}/`, getToken);
      expect(trailing.buildUrl('/tables/Contacts')).toBe(`${mpBase}//tables/Contacts`);
    });
  });

  describe('Query key encoding', () => {
    it('should encode caller-shaped query keys', () => {
      const url = httpClient.buildUrl('/tables/Contacts', {
        'a&$filter=1': 'x',
        'k#frag': 'y',
        'sp ace': ['1', '2'],
      });
      expect(url).toBe(
        'https://api.ministryplatform.com/tables/Contacts?a%26$filter%3D1=x&k%23frag=y&sp%20ace=1&sp%20ace=2'
      );
    });

    it('should keep $ and @ literal in keys (MP query options and proc parameters)', () => {
      const url = httpClient.buildUrl('/procs/api_Proc', { $userId: 1, '@ContactID': 2 });
      expect(url).toBe('https://api.ministryplatform.com/procs/api_Proc?$userId=1&@ContactID=2');
    });
  });
});

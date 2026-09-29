import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileService } from '@/lib/providers/ministry-platform/services/file.service';
import type { MinistryPlatformClient } from '@/lib/providers/ministry-platform/client';
import type { HttpClient } from '@/lib/providers/ministry-platform/utils/http-client';
import type { FileDescription } from '@/lib/providers/ministry-platform/types';

/**
 * FileService Tests
 *
 * Covers all eight file endpoints:
 * - getFilesByRecord            -> GET  /files/{table}/{recordId}
 * - uploadFiles                 -> POST /files/{table}/{recordId} (multipart)
 * - updateFile                  -> PUT  /files/{fileId}           (multipart)
 * - deleteFile                  -> DELETE /files/{fileId}
 * - getFileContentByUniqueId    -> raw fetch, deliberately unauthenticated
 * - getFileMetadata             -> GET  /files/{fileId}/metadata
 * - getFileMetadataByUniqueId   -> GET  /files/{uniqueFileId}/metadata
 *
 * Two behaviors get extra attention because they are easy to break silently:
 *
 * 1. `!== undefined` vs truthiness. `defaultOnly` and `isDefaultImage` use
 *    `!== undefined`, so `false` must still be sent. `longestDimension` and
 *    `userId` use plain truthiness, so `0` is dropped. Both are asserted so the
 *    distinction is pinned rather than accidental.
 * 2. `getFileContentByUniqueId` must NOT call ensureValidToken and must NOT send
 *    an Authorization header - that endpoint is public by design.
 *
 * Path segments (table, record/file ID, unique ID) are validated before they
 * are encoded into the URL; see "path segment validation" at the bottom.
 */
describe('FileService', () => {
  let fileService: FileService;
  let mockClient: MinistryPlatformClient;
  let mockHttpClient: HttpClient;

  const mockFileDescription: FileDescription = {
    FileId: 501,
    FileName: 'photo.jpg',
    FileExtension: '.jpg',
    FileSize: 20480,
    IsImage: true,
    IsDefaultImage: false,
    TableName: 'Contacts',
    RecordId: 42,
    UniqueFileId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    LastUpdated: '2026-08-21T09:00:00',
    InclusionType: 'Attachment',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});

    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      buildUrl: vi.fn(),
      postFormData: vi.fn(),
      putFormData: vi.fn(),
    } as unknown as HttpClient;

    mockClient = {
      ensureValidToken: vi.fn().mockResolvedValue(undefined),
      getHttpClient: vi.fn().mockReturnValue(mockHttpClient),
    } as unknown as MinistryPlatformClient;

    fileService = new FileService(mockClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getFilesByRecord', () => {
    it('should fetch file descriptions for a record', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
        mockFileDescription,
      ]);

      const result = await fileService.getFilesByRecord('Contacts', 42);

      expect(mockClient.ensureValidToken).toHaveBeenCalledTimes(1);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/files/Contacts/42', {});
      expect(result).toEqual([mockFileDescription]);
    });

    it('should send $default=true when defaultOnly is true', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      await fileService.getFilesByRecord('Contacts', 42, true);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/files/Contacts/42', {
        $default: 'true',
      });
    });

    it('should send $default=false when defaultOnly is explicitly false', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      await fileService.getFilesByRecord('Contacts', 42, false);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/files/Contacts/42', {
        $default: 'false',
      });
    });

    it('should return an empty array when the record has no files', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      await expect(fileService.getFilesByRecord('Contacts', 999)).resolves.toEqual([]);
    });

    it('should re-throw HTTP errors unchanged', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('GET /files/Contacts/42 failed: 404 Not Found')
      );

      await expect(fileService.getFilesByRecord('Contacts', 42)).rejects.toThrow('404 Not Found');
    });

    it('should re-throw token refresh failures without calling the API', async () => {
      (mockClient.ensureValidToken as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Token refresh failed')
      );

      await expect(fileService.getFilesByRecord('Contacts', 42)).rejects.toThrow(
        'Token refresh failed'
      );
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('uploadFiles', () => {
    it('should append each file as file-{index} and post multipart', async () => {
      (mockHttpClient.postFormData as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
        mockFileDescription,
      ]);

      const first = new File(['one'], 'one.jpg', { type: 'image/jpeg' });
      const second = new File(['two'], 'two.png', { type: 'image/png' });

      const result = await fileService.uploadFiles('Contacts', 42, [first, second]);

      expect(mockClient.ensureValidToken).toHaveBeenCalledTimes(1);

      const [endpoint, formData, queryParams] = (
        mockHttpClient.postFormData as ReturnType<typeof vi.fn>
      ).mock.calls[0];
      expect(endpoint).toBe('/files/Contacts/42');
      expect(formData).toBeInstanceOf(FormData);
      expect((formData.get('file-0') as File).name).toBe('one.jpg');
      expect((formData.get('file-1') as File).name).toBe('two.png');
      expect(queryParams).toEqual({});
      expect(result).toEqual([mockFileDescription]);
    });

    it('should accept an empty file list without appending any file entries', async () => {
      (mockHttpClient.postFormData as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      await fileService.uploadFiles('Contacts', 42, []);

      const [, formData] = (
        mockHttpClient.postFormData as ReturnType<typeof vi.fn>
      ).mock.calls[0];
      expect(formData.get('file-0')).toBeNull();
    });

    it('should mirror every optional param into both the form body and the query string', async () => {
      (mockHttpClient.postFormData as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
        mockFileDescription,
      ]);

      await fileService.uploadFiles('Contacts', 42, [new File(['x'], 'x.jpg')], {
        description: 'Profile photo',
        isDefaultImage: true,
        longestDimension: 800,
        userId: 7,
      });

      const [, formData, queryParams] = (
        mockHttpClient.postFormData as ReturnType<typeof vi.fn>
      ).mock.calls[0];

      expect(formData.get('description')).toBe('Profile photo');
      expect(formData.get('isDefaultImage')).toBe('true');
      expect(formData.get('longestDimension')).toBe('800');

      // userId is a query-string-only parameter; it is never added to the body.
      expect(formData.get('userId')).toBeNull();

      expect(queryParams).toEqual({
        $description: 'Profile photo',
        $default: 'true',
        $longestDimension: '800',
        $userId: '7',
      });
    });

    it('should send $default=false when isDefaultImage is explicitly false', async () => {
      (mockHttpClient.postFormData as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      await fileService.uploadFiles('Contacts', 42, [new File(['x'], 'x.jpg')], {
        isDefaultImage: false,
      });

      const [, formData, queryParams] = (
        mockHttpClient.postFormData as ReturnType<typeof vi.fn>
      ).mock.calls[0];
      expect(formData.get('isDefaultImage')).toBe('false');
      expect(queryParams).toEqual({ $default: 'false' });
    });

    it('should drop longestDimension: 0 because the check is truthiness, not undefined', async () => {
      (mockHttpClient.postFormData as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      await fileService.uploadFiles('Contacts', 42, [new File(['x'], 'x.jpg')], {
        longestDimension: 0,
        userId: 0,
      });

      const [, formData, queryParams] = (
        mockHttpClient.postFormData as ReturnType<typeof vi.fn>
      ).mock.calls[0];
      expect(formData.get('longestDimension')).toBeNull();
      expect(queryParams).toEqual({});
    });

    it('should re-throw HTTP errors unchanged', async () => {
      (mockHttpClient.postFormData as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('POST /files/Contacts/42 failed: 413 Payload Too Large')
      );

      await expect(
        fileService.uploadFiles('Contacts', 42, [new File(['x'], 'big.zip')])
      ).rejects.toThrow('413 Payload Too Large');
    });

    it('should not upload anything when the token refresh fails', async () => {
      (mockClient.ensureValidToken as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Token refresh failed')
      );

      await expect(
        fileService.uploadFiles('Contacts', 42, [new File(['x'], 'x.jpg')])
      ).rejects.toThrow('Token refresh failed');
      expect(mockHttpClient.postFormData).not.toHaveBeenCalled();
    });
  });

  describe('updateFile', () => {
    it('should PUT multipart with the replacement file under the file key', async () => {
      (mockHttpClient.putFormData as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockFileDescription
      );

      const replacement = new File(['new'], 'replacement.jpg', { type: 'image/jpeg' });

      const result = await fileService.updateFile(501, replacement);

      expect(mockClient.ensureValidToken).toHaveBeenCalledTimes(1);

      const [endpoint, formData, queryParams] = (
        mockHttpClient.putFormData as ReturnType<typeof vi.fn>
      ).mock.calls[0];
      expect(endpoint).toBe('/files/501');
      expect((formData.get('file') as File).name).toBe('replacement.jpg');
      expect(queryParams).toEqual({});
      expect(result).toEqual(mockFileDescription);
    });

    it('should support a metadata-only update with no file', async () => {
      (mockHttpClient.putFormData as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockFileDescription
      );

      await fileService.updateFile(501, undefined, { description: 'Renamed only' });

      const [, formData, queryParams] = (
        mockHttpClient.putFormData as ReturnType<typeof vi.fn>
      ).mock.calls[0];
      expect(formData.get('file')).toBeNull();
      expect(formData.get('description')).toBe('Renamed only');
      expect(queryParams).toEqual({ $description: 'Renamed only' });
    });

    it('should mirror every optional param into both the form body and the query string', async () => {
      (mockHttpClient.putFormData as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockFileDescription
      );

      await fileService.updateFile(501, undefined, {
        fileName: 'renamed.jpg',
        description: 'Updated caption',
        isDefaultImage: true,
        longestDimension: 1200,
        userId: 7,
      });

      const [, formData, queryParams] = (
        mockHttpClient.putFormData as ReturnType<typeof vi.fn>
      ).mock.calls[0];

      expect(formData.get('fileName')).toBe('renamed.jpg');
      expect(formData.get('description')).toBe('Updated caption');
      expect(formData.get('isDefaultImage')).toBe('true');
      expect(formData.get('longestDimension')).toBe('1200');

      expect(queryParams).toEqual({
        $fileName: 'renamed.jpg',
        $description: 'Updated caption',
        $default: 'true',
        $longestDimension: '1200',
        $userId: '7',
      });
    });

    it('should send $default=false when isDefaultImage is explicitly false', async () => {
      (mockHttpClient.putFormData as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockFileDescription
      );

      await fileService.updateFile(501, undefined, { isDefaultImage: false });

      const [, formData, queryParams] = (
        mockHttpClient.putFormData as ReturnType<typeof vi.fn>
      ).mock.calls[0];
      expect(formData.get('isDefaultImage')).toBe('false');
      expect(queryParams).toEqual({ $default: 'false' });
    });

    it('should re-throw HTTP errors unchanged', async () => {
      (mockHttpClient.putFormData as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('PUT /files/501 failed: 404 Not Found')
      );

      await expect(fileService.updateFile(501)).rejects.toThrow('404 Not Found');
    });

    it('should not update anything when the token refresh fails', async () => {
      (mockClient.ensureValidToken as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Token refresh failed')
      );

      await expect(fileService.updateFile(501)).rejects.toThrow('Token refresh failed');
      expect(mockHttpClient.putFormData).not.toHaveBeenCalled();
    });
  });

  describe('deleteFile', () => {
    it('should DELETE the file with no query params when no userId is given', async () => {
      (mockHttpClient.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

      await expect(fileService.deleteFile(501)).resolves.toBeUndefined();

      expect(mockClient.ensureValidToken).toHaveBeenCalledTimes(1);
      expect(mockHttpClient.delete).toHaveBeenCalledWith('/files/501', {});
    });

    it('should pass $userId for audit attribution when given', async () => {
      (mockHttpClient.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

      await fileService.deleteFile(501, 7);

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/files/501', { $userId: '7' });
    });

    it('should drop userId: 0 because the check is truthiness, not undefined', async () => {
      (mockHttpClient.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

      await fileService.deleteFile(501, 0);

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/files/501', {});
    });

    it('should re-throw HTTP errors unchanged', async () => {
      (mockHttpClient.delete as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('DELETE /files/501 failed: 403 Forbidden')
      );

      await expect(fileService.deleteFile(501)).rejects.toThrow('403 Forbidden');
    });

    it('should not delete anything when the token refresh fails', async () => {
      (mockClient.ensureValidToken as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Token refresh failed')
      );

      await expect(fileService.deleteFile(501)).rejects.toThrow('Token refresh failed');
      expect(mockHttpClient.delete).not.toHaveBeenCalled();
    });
  });

  describe('getFileContentByUniqueId', () => {
    const uniqueId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      (mockHttpClient.buildUrl as ReturnType<typeof vi.fn>).mockImplementation(
        (endpoint: string) => `https://mp.example.org/api${endpoint}`
      );
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should fetch the blob without authenticating (public endpoint)', async () => {
      const blob = new Blob(['image-bytes'], { type: 'image/jpeg' });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        blob: vi.fn().mockResolvedValue(blob),
      });

      const result = await fileService.getFileContentByUniqueId(uniqueId);

      // This endpoint is documented as requiring no authentication - assert that
      // no token work happens and no Authorization header is attached.
      expect(mockClient.ensureValidToken).not.toHaveBeenCalled();
      expect(mockHttpClient.buildUrl).toHaveBeenCalledWith(`/files/${uniqueId}`, {});
      expect(fetchMock).toHaveBeenCalledWith(`https://mp.example.org/api/files/${uniqueId}`, {
        method: 'GET',
        signal: expect.any(AbortSignal),
        redirect: 'error',
      });
      const init = fetchMock.mock.calls[0][1] as RequestInit;
      expect(init).not.toHaveProperty('headers');
      expect(result).toBe(blob);
    });

    it('should bound the request with a 20 s timeout signal', async () => {
      const timeoutSpy = vi.spyOn(AbortSignal, 'timeout');
      fetchMock.mockResolvedValueOnce({
        ok: true,
        blob: vi.fn().mockResolvedValue(new Blob(['x'])),
      });

      await fileService.getFileContentByUniqueId(uniqueId);

      expect(timeoutSpy).toHaveBeenCalledWith(20_000);
      expect((fetchMock.mock.calls[0][1] as RequestInit).signal).toBe(
        timeoutSpy.mock.results[0].value
      );
    });

    it('should keep the unique ID (a download capability) out of errors and logs', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        blob: vi.fn(),
      });

      const error = await fileService.getFileContentByUniqueId(uniqueId).catch((e: Error) => e);

      expect((error as Error).message).toBe('GET /files/{uniqueId} failed: 500 Internal Server Error');
      expect(console.error).toHaveBeenCalledWith('Error getting file content by unique ID:', 'Error');
      expect(JSON.stringify((console.error as ReturnType<typeof vi.fn>).mock.calls)).not.toContain(
        uniqueId
      );
    });

    it('should request the thumbnail variant when thumbnail is true', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        blob: vi.fn().mockResolvedValue(new Blob(['thumb'])),
      });

      await fileService.getFileContentByUniqueId(uniqueId, true);

      expect(mockHttpClient.buildUrl).toHaveBeenCalledWith(`/files/${uniqueId}`, {
        $thumbnail: 'true',
      });
    });

    it('should send $thumbnail=false when thumbnail is explicitly false', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        blob: vi.fn().mockResolvedValue(new Blob(['full'])),
      });

      await fileService.getFileContentByUniqueId(uniqueId, false);

      expect(mockHttpClient.buildUrl).toHaveBeenCalledWith(`/files/${uniqueId}`, {
        $thumbnail: 'false',
      });
    });

    it('should throw with status and statusText on a non-OK response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        blob: vi.fn(),
      });

      await expect(fileService.getFileContentByUniqueId(uniqueId)).rejects.toThrow(
        'GET /files/{uniqueId} failed: 404 Not Found'
      );
    });

    it('should re-throw network failures unchanged', async () => {
      fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));

      await expect(fileService.getFileContentByUniqueId(uniqueId)).rejects.toThrow('fetch failed');
    });
  });

  describe('getFileMetadata', () => {
    it('should fetch metadata by numeric file id', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockFileDescription);

      const result = await fileService.getFileMetadata(501);

      expect(mockClient.ensureValidToken).toHaveBeenCalledTimes(1);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/files/501/metadata');
      expect(result).toEqual(mockFileDescription);
    });

    it('should re-throw HTTP errors unchanged', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('GET /files/501/metadata failed: 404 Not Found')
      );

      await expect(fileService.getFileMetadata(501)).rejects.toThrow('404 Not Found');
    });

    it('should re-throw token refresh failures without calling the API', async () => {
      (mockClient.ensureValidToken as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Token refresh failed')
      );

      await expect(fileService.getFileMetadata(501)).rejects.toThrow('Token refresh failed');
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('getFileMetadataByUniqueId', () => {
    const uniqueId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

    it('should fetch metadata by unique file id', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockFileDescription);

      const result = await fileService.getFileMetadataByUniqueId(uniqueId);

      expect(mockClient.ensureValidToken).toHaveBeenCalledTimes(1);
      expect(mockHttpClient.get).toHaveBeenCalledWith(`/files/${uniqueId}/metadata`);
      expect(result).toEqual(mockFileDescription);
    });

    it('should re-throw HTTP errors unchanged', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('GET /files/{uniqueId}/metadata failed: 404 Not Found')
      );

      await expect(fileService.getFileMetadataByUniqueId(uniqueId)).rejects.toThrow('404 Not Found');
    });

    it('should re-throw token refresh failures without calling the API', async () => {
      (mockClient.ensureValidToken as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Token refresh failed')
      );

      await expect(fileService.getFileMetadataByUniqueId(uniqueId)).rejects.toThrow(
        'Token refresh failed'
      );
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });

  /**
   * Every path segment is validated for its shape before encoding, so none of
   * these can re-aim the service bearer at another MP API path. Each must throw
   * before ensureValidToken, before HttpClient, and before fetch - and with a
   * fixed message that does not echo the input.
   */
  describe('path segment validation', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    function expectNothingSent() {
      expect(mockClient.ensureValidToken).not.toHaveBeenCalled();
      expect(mockHttpClient.get).not.toHaveBeenCalled();
      expect(mockHttpClient.delete).not.toHaveBeenCalled();
      expect(mockHttpClient.postFormData).not.toHaveBeenCalled();
      expect(mockHttpClient.putFormData).not.toHaveBeenCalled();
      expect(mockHttpClient.buildUrl).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    }

    // The requests from the 2026-09-28 review repro, which previously reached
    // /tables/Contacts, /procs/... and a DELETE on /tables/Contacts.
    it('should refuse the review repro for getFileMetadataByUniqueId', async () => {
      await expect(
        fileService.getFileMetadataByUniqueId(
          '../tables/Contacts?$select=Contact_ID,Email_Address&$top=1000#'
        )
      ).rejects.toThrow('Invalid GUID format');
      expectNothingSent();
    });

    it('should refuse the review repro for getFilesByRecord', async () => {
      await expect(
        fileService.getFilesByRecord('../procs/api_Some_Proc?@ContactID=1#', 1)
      ).rejects.toThrow('Invalid table name');
      expectNothingSent();
    });

    it('should refuse the review repro for deleteFile', async () => {
      await expect(
        fileService.deleteFile('../tables/Contacts?id=1#' as unknown as number)
      ).rejects.toThrow('Invalid file ID');
      expectNothingSent();
    });

    it.each(['..', 'Contacts/..', 'Contacts?x=1', 'Contacts#', 'Con tacts', 'Contacts%2F', '1Contacts', '', 42])(
      'should refuse the table name %j in getFilesByRecord and uploadFiles',
      async (bad) => {
        await expect(
          fileService.getFilesByRecord(bad as unknown as string, 42)
        ).rejects.toThrow('Invalid table name');
        await expect(
          fileService.uploadFiles(bad as unknown as string, 42, [new File(['x'], 'x.jpg')])
        ).rejects.toThrow('Invalid table name');
        expectNothingSent();
      }
    );

    it.each([0, -1, 1.5, NaN, '42/../1', '1?x', '..', null, undefined])(
      'should refuse the record ID %j in getFilesByRecord and uploadFiles',
      async (bad) => {
        await expect(
          fileService.getFilesByRecord('Contacts', bad as unknown as number)
        ).rejects.toThrow('Invalid record ID');
        await expect(
          fileService.uploadFiles('Contacts', bad as unknown as number, [])
        ).rejects.toThrow('Invalid record ID');
        expectNothingSent();
      }
    );

    it.each([0, -1, 1.5, '501/metadata', '..', '501#', null])(
      'should refuse the file ID %j in updateFile, deleteFile and getFileMetadata',
      async (bad) => {
        const id = bad as unknown as number;
        await expect(fileService.updateFile(id)).rejects.toThrow('Invalid file ID');
        await expect(fileService.deleteFile(id)).rejects.toThrow('Invalid file ID');
        await expect(fileService.getFileMetadata(id)).rejects.toThrow('Invalid file ID');
        expectNothingSent();
      }
    );

    it.each([
      '..',
      'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/../../tables/Contacts',
      'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee?x',
      'not-a-guid',
      '',
      42,
      undefined,
    ])('should refuse the unique ID %j in both unique-ID methods', async (bad) => {
      const id = bad as unknown as string;
      await expect(fileService.getFileMetadataByUniqueId(id)).rejects.toThrow('Invalid GUID format');
      await expect(fileService.getFileContentByUniqueId(id)).rejects.toThrow('Invalid GUID format');
      expectNothingSent();
    });

    it('should accept a digit-string record/file ID and send it as a plain number', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await fileService.getFilesByRecord('Contacts', '42' as unknown as number);
      await fileService.getFileMetadata('501' as unknown as number);

      expect(mockHttpClient.get).toHaveBeenNthCalledWith(1, '/files/Contacts/42', {});
      expect(mockHttpClient.get).toHaveBeenNthCalledWith(2, '/files/501/metadata');
    });

    it('should not echo the refused value in the error or the log', async () => {
      const bad = '../tables/Contacts?$select=Email_Address#';

      const error = await fileService.getFilesByRecord(bad, 1).catch((e: Error) => e);

      expect((error as Error).message).toBe('Invalid table name');
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('error logging', () => {
    it('should log only the error name, never the error object or message', async () => {
      const failure = new SyntaxError('Unexpected token J, "Jane Doe, 12 Main St" is not valid JSON');
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(failure);

      await expect(fileService.getFileMetadata(501)).rejects.toBe(failure);

      expect(console.error).toHaveBeenCalledWith('Error getting file metadata:', 'SyntaxError');
      expect(JSON.stringify((console.error as ReturnType<typeof vi.fn>).mock.calls)).not.toContain(
        'Jane'
      );
    });

    it('should log the typeof a non-Error rejection', async () => {
      (mockHttpClient.delete as ReturnType<typeof vi.fn>).mockRejectedValueOnce('raw body text');

      await expect(fileService.deleteFile(501)).rejects.toBe('raw body text');

      expect(console.error).toHaveBeenCalledWith('Error deleting file:', 'string');
    });
  });
});

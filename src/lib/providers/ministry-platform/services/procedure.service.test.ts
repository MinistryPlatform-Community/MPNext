import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProcedureService } from '@/lib/providers/ministry-platform/services/procedure.service';
import type { MinistryPlatformClient } from '@/lib/providers/ministry-platform/client';
import type { HttpClient } from '@/lib/providers/ministry-platform/utils/http-client';
import type { ProcedureInfo } from '@/lib/providers/ministry-platform/types';

/**
 * ProcedureService Tests
 *
 * Covers:
 * - getProcedures            -> GET /procs (optional $search)
 * - executeProcedure         -> GET /procs/{name}, params in the query string
 * - executeProcedureWithBody -> POST /procs/{name}, params in the body
 *
 * The procedure name is the only caller-supplied value interpolated into the
 * endpoint path, so the encodeURIComponent behavior is asserted explicitly for
 * names containing spaces and slashes.
 *
 * Stored procedures can mutate MP data. Every call here goes to a mocked
 * HttpClient; nothing reaches a real Ministry Platform instance.
 */
describe('ProcedureService', () => {
  let procedureService: ProcedureService;
  let mockClient: MinistryPlatformClient;
  let mockHttpClient: HttpClient;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
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

    procedureService = new ProcedureService(mockClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getProcedures', () => {
    const mockProcedures: ProcedureInfo[] = [
      { Name: 'api_Custom_Get_Contacts', Parameters: [] },
    ];

    it('should list procedures when no search term is given', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockProcedures);

      const result = await procedureService.getProcedures();

      expect(mockClient.ensureValidToken).toHaveBeenCalledTimes(1);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/procs', undefined);
      expect(result).toEqual(mockProcedures);
    });

    it('should pass $search when a search term is given', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockProcedures);

      await procedureService.getProcedures('api_Custom');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/procs', { $search: 'api_Custom' });
    });

    it('should treat an empty search string as no search', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockProcedures);

      await procedureService.getProcedures('');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/procs', undefined);
    });

    it('should re-throw HTTP errors unchanged', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('GET /procs failed: 401 Unauthorized')
      );

      await expect(procedureService.getProcedures()).rejects.toThrow('401 Unauthorized');
    });
  });

  describe('executeProcedure', () => {
    // MP returns one array per result set
    const mockResults = [[{ Contact_ID: 1, Display_Name: 'John Doe' }]];

    it('should execute a procedure with no parameters', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResults);

      const result = await procedureService.executeProcedure('api_Custom_Get_Contacts');

      expect(mockClient.ensureValidToken).toHaveBeenCalledTimes(1);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/procs/api_Custom_Get_Contacts',
        undefined
      );
      expect(result).toEqual(mockResults);
    });

    it('should pass query parameters through', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResults);

      await procedureService.executeProcedure('api_Custom_Get_Contacts', {
        '@ContactID': 42,
        '@IncludeInactive': false,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith('/procs/api_Custom_Get_Contacts', {
        '@ContactID': 42,
        '@IncludeInactive': false,
      });
    });

    it('should URL-encode a procedure name containing a space', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      await procedureService.executeProcedure('api Custom Proc');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/procs/api%20Custom%20Proc', undefined);
    });

    it('should URL-encode path separators in the procedure name', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      await procedureService.executeProcedure('evil/../admin');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/procs/evil%2F..%2Fadmin', undefined);
    });

    it('should return an empty result set unchanged', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      await expect(procedureService.executeProcedure('api_Empty')).resolves.toEqual([]);
    });

    it('should re-throw HTTP errors unchanged', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('GET /procs/api_Bad failed: 400 Bad Request')
      );

      await expect(procedureService.executeProcedure('api_Bad')).rejects.toThrow('400 Bad Request');
    });

    it('should re-throw token refresh failures without calling the API', async () => {
      (mockClient.ensureValidToken as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Token refresh failed')
      );

      await expect(procedureService.executeProcedure('api_Any')).rejects.toThrow(
        'Token refresh failed'
      );
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('executeProcedureWithBody', () => {
    const mockResults = [[{ Rows_Affected: 1 }]];

    it('should POST parameters in the request body', async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResults);

      const result = await procedureService.executeProcedureWithBody('api_Custom_Update', {
        '@ContactID': 42,
        '@Notes': 'Updated',
      });

      expect(mockClient.ensureValidToken).toHaveBeenCalledTimes(1);
      expect(mockHttpClient.post).toHaveBeenCalledWith('/procs/api_Custom_Update', {
        '@ContactID': 42,
        '@Notes': 'Updated',
      });
      expect(result).toEqual(mockResults);
    });

    it('should accept an empty parameter object', async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      await procedureService.executeProcedureWithBody('api_NoArgs', {});

      expect(mockHttpClient.post).toHaveBeenCalledWith('/procs/api_NoArgs', {});
    });

    it('should URL-encode the procedure name', async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      await procedureService.executeProcedureWithBody('api Custom Proc', {});

      expect(mockHttpClient.post).toHaveBeenCalledWith('/procs/api%20Custom%20Proc', {});
    });

    it('should re-throw HTTP errors unchanged', async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('POST /procs/api_Bad failed: 500 Internal Server Error')
      );

      await expect(
        procedureService.executeProcedureWithBody('api_Bad', {})
      ).rejects.toThrow('500 Internal Server Error');
    });

    it('should re-throw token refresh failures without calling the API', async () => {
      (mockClient.ensureValidToken as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Token refresh failed')
      );

      await expect(
        procedureService.executeProcedureWithBody('api_Any', {})
      ).rejects.toThrow('Token refresh failed');
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });
  });
});

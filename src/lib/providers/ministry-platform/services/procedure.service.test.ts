import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ALLOWED_PROCEDURES,
  ProcedureService,
} from '@/lib/providers/ministry-platform/services/procedure.service';
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
 * endpoint path, so it must be a plain identifier AND on the allowlist; names
 * with spaces, slashes or `..` are refused before any token or network work.
 * The service under test is built with an explicit allowlist; the default
 * (the exported ALLOWED_PROCEDURES, empty) is asserted to refuse everything.
 *
 * Stored procedures can mutate MP data. Every call here goes to a mocked
 * HttpClient; nothing reaches a real Ministry Platform instance.
 */
describe('ProcedureService', () => {
  let procedureService: ProcedureService;
  let mockClient: MinistryPlatformClient;
  let mockHttpClient: HttpClient;

  const allowedProcedures = [
    'api_Custom_Get_Contacts',
    'api_Empty',
    'api_Bad',
    'api_Any',
    'api_Custom_Update',
    'api_NoArgs',
  ];

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

    procedureService = new ProcedureService(mockClient, { allowedProcedures });
  });

  describe('procedure allowlist', () => {
    it('should ship with an empty allowlist (the app calls no procedures)', () => {
      expect(ALLOWED_PROCEDURES).toEqual([]);
    });

    it('should refuse every procedure by default, before any token or network work', async () => {
      const defaultService = new ProcedureService(mockClient);

      await expect(defaultService.executeProcedure('api_Custom_Get_Contacts')).rejects.toThrow(
        'Procedure is not on the allowlist'
      );
      await expect(defaultService.executeProcedureWithBody('api_Custom_Update', {})).rejects.toThrow(
        'Procedure is not on the allowlist'
      );
      expect(mockClient.ensureValidToken).not.toHaveBeenCalled();
      expect(mockHttpClient.get).not.toHaveBeenCalled();
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('should refuse a well-formed name that is not on the allowlist', async () => {
      await expect(procedureService.executeProcedure('api_Delete_Everything')).rejects.toThrow(
        'Procedure is not on the allowlist'
      );
      await expect(
        procedureService.executeProcedureWithBody('api_Delete_Everything', {})
      ).rejects.toThrow('Procedure is not on the allowlist');
      expect(mockHttpClient.get).not.toHaveBeenCalled();
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('should match names exactly (case-sensitive)', async () => {
      await expect(procedureService.executeProcedure('API_CUSTOM_GET_CONTACTS')).rejects.toThrow(
        'Procedure is not on the allowlist'
      );
    });

    it.each([
      '..',
      '../tables/Contacts',
      'evil/../admin',
      'api Custom Proc',
      'api_Proc?$top=1',
      'api_Proc#',
      'api%2e%2e',
      'api\\Proc',
      '1api',
      '',
      'a'.repeat(129),
    ])('should refuse the malformed name %j before any token or network work', async (bad) => {
      // Even if a malformed name were somehow allowlisted, the identifier check runs first.
      const permissive = new ProcedureService(mockClient, { allowedProcedures: [bad] });

      await expect(permissive.executeProcedure(bad)).rejects.toThrow('Invalid procedure name');
      await expect(permissive.executeProcedureWithBody(bad, {})).rejects.toThrow(
        'Invalid procedure name'
      );
      expect(mockClient.ensureValidToken).not.toHaveBeenCalled();
      expect(mockHttpClient.get).not.toHaveBeenCalled();
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it.each([undefined, null, 42, {}])('should refuse a non-string name (%j)', async (bad) => {
      await expect(
        procedureService.executeProcedure(bad as unknown as string)
      ).rejects.toThrow('Invalid procedure name');
    });

    it('should not echo a refused name in the error or the log', async () => {
      const bad = '../tables/Contacts?$select=Email_Address';

      const error = await procedureService.executeProcedure(bad).catch((e: Error) => e);

      expect((error as Error).message).toBe('Invalid procedure name');
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should log only the error name for an allowlisted procedure that fails', async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new SyntaxError('"Jane Doe, 12 Main St" is not valid JSON')
      );

      await expect(procedureService.executeProcedureWithBody('api_Bad', {})).rejects.toThrow(
        SyntaxError
      );
      expect(console.error).toHaveBeenCalledWith(
        'Error executing procedure api_Bad:',
        'SyntaxError'
      );
    });
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

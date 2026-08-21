import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MetadataService } from '@/lib/providers/ministry-platform/services/metadata.service';
import type { MinistryPlatformClient } from '@/lib/providers/ministry-platform/client';
import type { HttpClient } from '@/lib/providers/ministry-platform/utils/http-client';
import type { TableMetadata } from '@/lib/providers/ministry-platform/types';

/**
 * MetadataService Tests
 *
 * Covers:
 * - refreshMetadata -> GET /refreshMetadata (fire-and-forget, returns void)
 * - getTables       -> GET /tables, with the optional $search parameter
 *
 * The $search branch matters: `search ? { $search: search } : undefined` means
 * an empty string is treated as "no search", which is asserted below so the
 * behavior is pinned rather than incidental.
 */
describe('MetadataService', () => {
  let metadataService: MetadataService;
  let mockClient: MinistryPlatformClient;
  let mockHttpClient: HttpClient;

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

    metadataService = new MetadataService(mockClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('refreshMetadata', () => {
    it('should trigger the metadata cache refresh', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

      await expect(metadataService.refreshMetadata()).resolves.toBeUndefined();

      expect(mockClient.ensureValidToken).toHaveBeenCalledTimes(1);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/refreshMetadata');
    });

    it('should re-throw HTTP errors unchanged', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('GET /refreshMetadata failed: 503 Service Unavailable')
      );

      await expect(metadataService.refreshMetadata()).rejects.toThrow('503 Service Unavailable');
    });

    it('should re-throw token refresh failures without calling the API', async () => {
      (mockClient.ensureValidToken as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Token refresh failed')
      );

      await expect(metadataService.refreshMetadata()).rejects.toThrow('Token refresh failed');
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('getTables', () => {
    const mockTables: TableMetadata[] = [
      { Table_ID: 1, Table_Name: 'Contacts', Display_Name: 'Contacts' },
      { Table_ID: 2, Table_Name: 'Contact_Log', Display_Name: 'Contact Log' },
    ];

    it('should list all tables when no search term is given', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTables);

      const result = await metadataService.getTables();

      expect(mockClient.ensureValidToken).toHaveBeenCalledTimes(1);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/tables', undefined);
      expect(result).toEqual(mockTables);
    });

    it('should pass $search when a search term is given', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce([mockTables[0]]);

      const result = await metadataService.getTables('Contact');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/tables', { $search: 'Contact' });
      expect(result).toHaveLength(1);
    });

    it('should treat an empty search string as no search', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTables);

      await metadataService.getTables('');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/tables', undefined);
    });

    it('should return an empty array when nothing matches', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      await expect(metadataService.getTables('NoSuchTable')).resolves.toEqual([]);
    });

    it('should re-throw HTTP errors unchanged', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('GET /tables failed: 401 Unauthorized')
      );

      await expect(metadataService.getTables()).rejects.toThrow('401 Unauthorized');
    });
  });
});

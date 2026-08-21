import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DomainService } from '@/lib/providers/ministry-platform/services/domain.service';
import type { MinistryPlatformClient } from '@/lib/providers/ministry-platform/client';
import type { HttpClient } from '@/lib/providers/ministry-platform/utils/http-client';
import type { DomainInfo, GlobalFilterItem } from '@/lib/providers/ministry-platform/types';

/**
 * DomainService Tests
 *
 * Covers the two read-only domain endpoints:
 * - getDomainInfo   -> GET /domain
 * - getGlobalFilters -> GET /domain/filters
 *
 * Both follow the provider-wide shape: ensureValidToken() first, then the HTTP
 * call, with errors logged and re-thrown unchanged (never swallowed).
 *
 * DomainInfo.TimeZoneName is what DomainTimezoneService reads to drive every MP
 * datetime conversion, so the pass-through here is load-bearing.
 */
describe('DomainService', () => {
  let domainService: DomainService;
  let mockClient: MinistryPlatformClient;
  let mockHttpClient: HttpClient;

  const mockDomainInfo: DomainInfo = {
    DisplayName: 'Test Church',
    TimeZoneName: 'Eastern Standard Time',
    CultureName: 'en-US',
    IsSimpleSignOnEnabled: false,
    IsUserTimeZoneEnabled: false,
    IsSmsMfaEnabled: false,
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

    domainService = new DomainService(mockClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getDomainInfo', () => {
    it('should fetch domain info from /domain', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockDomainInfo);

      const result = await domainService.getDomainInfo();

      expect(mockClient.ensureValidToken).toHaveBeenCalledTimes(1);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/domain');
      expect(result).toEqual(mockDomainInfo);
    });

    it('should expose TimeZoneName for DomainTimezoneService', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockDomainInfo);

      const result = await domainService.getDomainInfo();

      expect(result.TimeZoneName).toBe('Eastern Standard Time');
    });

    it('should re-throw HTTP errors unchanged', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('GET /domain failed: 500 Internal Server Error')
      );

      await expect(domainService.getDomainInfo()).rejects.toThrow('500 Internal Server Error');
    });

    it('should re-throw token refresh failures without calling the API', async () => {
      (mockClient.ensureValidToken as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Token refresh failed')
      );

      await expect(domainService.getDomainInfo()).rejects.toThrow('Token refresh failed');
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('getGlobalFilters', () => {
    const mockFilters: GlobalFilterItem[] = [
      { Key: 0, Value: 'Not Assigned' },
      { Key: 1, Value: 'Main Campus' },
    ];

    it('should fetch global filters with no params', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockFilters);

      const result = await domainService.getGlobalFilters();

      expect(mockClient.ensureValidToken).toHaveBeenCalledTimes(1);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/domain/filters', undefined);
      expect(result).toEqual(mockFilters);
    });

    it('should pass optional params through to the query string', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockFilters);

      await domainService.getGlobalFilters({ $ignorePermissions: true, $userId: 42 });

      expect(mockHttpClient.get).toHaveBeenCalledWith('/domain/filters', {
        $ignorePermissions: true,
        $userId: 42,
      });
    });

    it('should return an empty array when the domain has no global filters', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      await expect(domainService.getGlobalFilters()).resolves.toEqual([]);
    });

    it('should re-throw HTTP errors unchanged', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('GET /domain/filters failed: 403 Forbidden')
      );

      await expect(domainService.getGlobalFilters()).rejects.toThrow('403 Forbidden');
    });
  });
});

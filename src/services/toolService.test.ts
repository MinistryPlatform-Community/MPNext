import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToolService } from '@/services/toolService';

const mockExecuteProcedureWithBody = vi.fn();

vi.mock('@/lib/providers/ministry-platform', () => {
  return {
    MPHelper: class {
      executeProcedureWithBody = mockExecuteProcedureWithBody;
    },
  };
});

describe('ToolService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ToolService as any).instance = undefined;
  });

  describe('getInstance', () => {
    it('should return a singleton instance', async () => {
      const instance1 = await ToolService.getInstance();
      const instance2 = await ToolService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getPageData', () => {
    it('should call executeProcedureWithBody with correct params', async () => {
      const mockPageData = {
        Page_ID: 292,
        Display_Name: 'Contacts',
        Table_Name: 'Contacts',
        Primary_Key: 'Contact_ID',
      };
      mockExecuteProcedureWithBody.mockResolvedValueOnce([[mockPageData]]);

      const service = await ToolService.getInstance();
      const result = await service.getPageData(292);

      expect(mockExecuteProcedureWithBody).toHaveBeenCalledWith('api_Tools_GetPageData', {
        '@PageID': 292,
      });
      expect(result).toEqual(mockPageData);
    });

    it('should return null when no data found', async () => {
      mockExecuteProcedureWithBody.mockResolvedValueOnce([[]]);

      const service = await ToolService.getInstance();
      const result = await service.getPageData(999);

      expect(result).toBeNull();
    });

    it('should return null when result is empty', async () => {
      mockExecuteProcedureWithBody.mockResolvedValueOnce([]);

      const service = await ToolService.getInstance();
      const result = await service.getPageData(999);

      expect(result).toBeNull();
    });

    it('should propagate errors', async () => {
      mockExecuteProcedureWithBody.mockRejectedValueOnce(new Error('Procedure not found'));

      const service = await ToolService.getInstance();
      await expect(service.getPageData(292)).rejects.toThrow('Procedure not found');
    });
  });

  describe('getUserTools', () => {
    it('should return tool paths array', async () => {
      mockExecuteProcedureWithBody.mockResolvedValueOnce([
        [
          { Tool_Path: '/contacts' },
          { Tool_Path: '/events' },
          { Tool_Path: '/groups' },
        ],
      ]);

      const service = await ToolService.getInstance();
      const result = await service.getUserTools(1, 42);

      expect(mockExecuteProcedureWithBody).toHaveBeenCalledWith('api_Tools_GetUserTools', {
        '@DomainId': 1,
        '@UserId': 42,
      });
      expect(result).toEqual(['/contacts', '/events', '/groups']);
    });

    it('should return empty array when no tools found', async () => {
      mockExecuteProcedureWithBody.mockResolvedValueOnce([[]]);

      const service = await ToolService.getInstance();
      const result = await service.getUserTools(1, 42);

      expect(result).toEqual([]);
    });

    it('should propagate errors', async () => {
      mockExecuteProcedureWithBody.mockRejectedValueOnce(new Error('Access denied'));

      const service = await ToolService.getInstance();
      await expect(service.getUserTools(1, 42)).rejects.toThrow('Access denied');
    });
  });
});

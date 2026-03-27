import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SelectionService } from '@/services/selectionService';

const mockExecuteProcedureWithBody = vi.fn();

vi.mock('@/lib/providers/ministry-platform', () => {
  return {
    MPHelper: class {
      executeProcedureWithBody = mockExecuteProcedureWithBody;
    },
  };
});

describe('SelectionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (SelectionService as any).instance = undefined;
    process.env.NEXT_PUBLIC_MINISTRY_PLATFORM_URL = 'https://my.grangerchurch.com';
    process.env.MINISTRY_PLATFORM_DOMAIN_ID = '1';
  });

  describe('getInstance', () => {
    it('should return a singleton instance', async () => {
      const instance1 = await SelectionService.getInstance();
      const instance2 = await SelectionService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('createSelection', () => {
    it('should throw when recordIds is empty', async () => {
      const service = await SelectionService.getInstance();
      await expect(
        service.createSelection({
          selectionName: 'Test',
          pageId: 292,
          recordIds: [],
          userId: 1,
        })
      ).rejects.toThrow('recordIds must not be empty');
    });

    it('should call executeProcedureWithBody with correct params', async () => {
      mockExecuteProcedureWithBody.mockResolvedValueOnce([
        [{ Selection_ID: 138291, Selection_Name: 'Test Selection', Record_Count: 2 }],
      ]);

      const service = await SelectionService.getInstance();
      await service.createSelection({
        selectionName: 'Test Selection',
        pageId: 292,
        recordIds: [10, 20],
        userId: 42,
      });

      expect(mockExecuteProcedureWithBody).toHaveBeenCalledTimes(1);
      expect(mockExecuteProcedureWithBody).toHaveBeenCalledWith('api_custom_CreateSelection', {
        '@DomainID': 1,
        '@PageID': 292,
        '@UserID': 42,
        '@SelectionName': 'Test Selection',
        '@RecordIDs': '10,20',
      });
    });

    it('should build the correct selectionUrl from NEXT_PUBLIC_MINISTRY_PLATFORM_URL', async () => {
      mockExecuteProcedureWithBody.mockResolvedValueOnce([
        [{ Selection_ID: 138291, Selection_Name: 'Test', Record_Count: 1 }],
      ]);

      const service = await SelectionService.getInstance();
      const result = await service.createSelection({
        selectionName: 'Test',
        pageId: 292,
        recordIds: [1],
        userId: 1,
      });

      expect(result.selectionUrl).toBe('https://my.grangerchurch.com/292.138291');
      expect(result.pageId).toBe(292);
      expect(result.selectionId).toBe(138291);
    });

    it('should throw when stored procedure returns no Selection_ID', async () => {
      mockExecuteProcedureWithBody.mockResolvedValueOnce([[{}]]);

      const service = await SelectionService.getInstance();
      await expect(
        service.createSelection({
          selectionName: 'Test',
          pageId: 292,
          recordIds: [1],
          userId: 1,
        })
      ).rejects.toThrow('Failed to create selection: stored procedure returned no Selection_ID');
    });

    it('should throw when stored procedure returns empty result set', async () => {
      mockExecuteProcedureWithBody.mockResolvedValueOnce([[]]);

      const service = await SelectionService.getInstance();
      await expect(
        service.createSelection({
          selectionName: 'Test',
          pageId: 292,
          recordIds: [1],
          userId: 1,
        })
      ).rejects.toThrow('Failed to create selection: stored procedure returned no Selection_ID');
    });

    it('should propagate errors from executeProcedureWithBody', async () => {
      mockExecuteProcedureWithBody.mockRejectedValueOnce(new Error('Procedure execution failed'));

      const service = await SelectionService.getInstance();
      await expect(
        service.createSelection({
          selectionName: 'Test',
          pageId: 292,
          recordIds: [1, 2, 3],
          userId: 1,
        })
      ).rejects.toThrow('Procedure execution failed');
    });

    it('should join recordIds as comma-separated string', async () => {
      mockExecuteProcedureWithBody.mockResolvedValueOnce([
        [{ Selection_ID: 55555, Selection_Name: 'Test', Record_Count: 3 }],
      ]);

      const service = await SelectionService.getInstance();
      await service.createSelection({
        selectionName: 'Test',
        pageId: 292,
        recordIds: [100, 200, 300],
        userId: 5,
      });

      const callArgs = mockExecuteProcedureWithBody.mock.calls[0];
      expect(callArgs[1]['@RecordIDs']).toBe('100,200,300');
    });
  });
});

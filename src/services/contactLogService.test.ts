import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockGetTableRecords,
  mockCreateTableRecords,
  mockUpdateTableRecords,
  mockDeleteTableRecords,
  mockGetDomainInfo,
} = vi.hoisted(() => ({
  mockGetTableRecords: vi.fn(),
  mockCreateTableRecords: vi.fn(),
  mockUpdateTableRecords: vi.fn(),
  mockDeleteTableRecords: vi.fn(),
  mockGetDomainInfo: vi.fn(),
}));

vi.mock('@/lib/providers/ministry-platform', () => {
  return {
    MPHelper: class {
      getTableRecords = mockGetTableRecords;
      createTableRecords = mockCreateTableRecords;
      updateTableRecords = mockUpdateTableRecords;
      deleteTableRecords = mockDeleteTableRecords;
      getDomainInfo = mockGetDomainInfo;
    },
  };
});

import { ContactLogService } from '@/services/contactLogService';
import { DomainTimezoneService } from '@/services/domainTimezoneService';

describe('ContactLogService', () => {
  beforeEach(() => {
    mockGetTableRecords.mockReset();
    mockCreateTableRecords.mockReset();
    mockUpdateTableRecords.mockReset();
    mockDeleteTableRecords.mockReset();
    mockGetDomainInfo.mockReset();
    mockGetDomainInfo.mockResolvedValue({
      TimeZoneName: 'America/New_York',
      DisplayName: 'Test',
      CultureName: 'en-US',
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ContactLogService as any).instance = undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (DomainTimezoneService as any).instance = null;
  });

  describe('getInstance', () => {
    it('should return a singleton instance', async () => {
      const instance1 = await ContactLogService.getInstance();
      const instance2 = await ContactLogService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getContactLogTypes', () => {
    it('should fetch contact log types with correct parameters', async () => {
      const mockTypes = [
        { Contact_Log_Type_ID: 1, Contact_Log_Type: 'Email', Description: 'Email contact' },
        { Contact_Log_Type_ID: 2, Contact_Log_Type: 'Phone', Description: 'Phone contact' },
      ];
      mockGetTableRecords.mockResolvedValueOnce(mockTypes);

      const service = await ContactLogService.getInstance();
      const result = await service.getContactLogTypes();

      expect(mockGetTableRecords).toHaveBeenCalledWith({
        table: 'Contact_Log_Types',
        select: 'Contact_Log_Type_ID,Contact_Log_Type,Description',
        top: 100,
        orderBy: 'Contact_Log_Type',
      });
      expect(result).toEqual(mockTypes);
    });
  });

  describe('searchContactLogs', () => {
    it('should search with contactId filter when provided', async () => {
      mockGetTableRecords.mockResolvedValueOnce([]);

      const service = await ContactLogService.getInstance();
      await service.searchContactLogs(42);

      expect(mockGetTableRecords).toHaveBeenCalledWith(
        expect.objectContaining({
          table: 'Contact_Log',
          filter: 'Contact_ID = 42',
          top: 50,
          orderBy: 'Contact_Date DESC',
        })
      );
    });

    it('should search with empty filter when no contactId', async () => {
      mockGetTableRecords.mockResolvedValueOnce([]);

      const service = await ContactLogService.getInstance();
      await service.searchContactLogs();

      expect(mockGetTableRecords).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: '',
        })
      );
    });

    it('should respect custom limit', async () => {
      mockGetTableRecords.mockResolvedValueOnce([]);

      const service = await ContactLogService.getInstance();
      await service.searchContactLogs(42, 10);

      expect(mockGetTableRecords).toHaveBeenCalledWith(
        expect.objectContaining({ top: 10 })
      );
    });
  });

  describe('getContactLogById', () => {
    it('should return contact log when found', async () => {
      const mockLog = { Contact_Log_ID: 1, Contact_ID: 42, Notes: 'Test' };
      mockGetTableRecords.mockResolvedValueOnce([mockLog]);

      const service = await ContactLogService.getInstance();
      const result = await service.getContactLogById(1);

      expect(mockGetTableRecords).toHaveBeenCalledWith(
        expect.objectContaining({
          table: 'Contact_Log',
          filter: 'Contact_Log_ID = 1',
          top: 1,
        })
      );
      expect(result).toEqual(mockLog);
    });

    it('should return null when not found', async () => {
      mockGetTableRecords.mockResolvedValueOnce([]);

      const service = await ContactLogService.getInstance();
      const result = await service.getContactLogById(999);

      expect(result).toBeNull();
    });
  });

  describe('getContactLogsByContactId', () => {
    it('should fetch logs for contact with correct ordering', async () => {
      const mockLogs = [
        { Contact_Log_ID: 2, Contact_ID: 42 },
        { Contact_Log_ID: 1, Contact_ID: 42 },
      ];
      mockGetTableRecords.mockResolvedValueOnce(mockLogs);

      const service = await ContactLogService.getInstance();
      const result = await service.getContactLogsByContactId(42);

      expect(mockGetTableRecords).toHaveBeenCalledWith(
        expect.objectContaining({
          table: 'Contact_Log',
          filter: 'Contact_ID = 42',
          orderBy: 'Contact_Date DESC',
        })
      );
      expect(result).toEqual(mockLogs);
    });
  });

  describe('createContactLog', () => {
    it('passes a date-only Contact_Date through as MP-TZ midnight (no UTC shift)', async () => {
      const mockCreated = { Contact_Log_ID: 1, Contact_ID: 42 };
      mockCreateTableRecords.mockResolvedValueOnce([mockCreated]);

      const service = await ContactLogService.getInstance();
      const result = await service.createContactLog({
        Contact_ID: 42,
        Contact_Date: '2026-05-17',
        Contact_Log_Type_ID: 1,
        Made_By: 100,
        Notes: 'Test note',
        Planned_Contact_ID: null,
        Contact_Successful: null,
        Original_Contact_Log_Entry: null,
        Feedback_Entry_ID: null,
      });

      expect(mockCreateTableRecords).toHaveBeenCalledWith('Contact_Log', [
        expect.objectContaining({
          Contact_ID: 42,
          Contact_Date: '2026-05-17 00:00:00',
          Notes: 'Test note',
          Made_By: 100,
        }),
      ]);
      expect(result).toEqual(mockCreated);
    });

    it('converts a UTC-tagged Contact_Date into MP-TZ wall-clock', async () => {
      mockCreateTableRecords.mockResolvedValueOnce([{ Contact_Log_ID: 1 }]);

      const service = await ContactLogService.getInstance();
      // 2026-05-17T03:33:00Z = 2026-05-16 23:33:00 in America/New_York (EDT, UTC-4)
      await service.createContactLog({
        Contact_ID: 42,
        Contact_Date: '2026-05-17T03:33:00.000Z',
        Contact_Log_Type_ID: 1,
        Made_By: 100,
        Notes: 'Test',
        Planned_Contact_ID: null,
        Contact_Successful: null,
        Original_Contact_Log_Entry: null,
        Feedback_Entry_ID: null,
      });

      expect(mockCreateTableRecords).toHaveBeenCalledWith('Contact_Log', [
        expect.objectContaining({ Contact_Date: '2026-05-16 23:33:00' }),
      ]);
    });

    it('throws when API returns empty result', async () => {
      mockCreateTableRecords.mockResolvedValueOnce([]);

      const service = await ContactLogService.getInstance();
      await expect(
        service.createContactLog({
          Contact_ID: 42,
          Contact_Date: '2026-05-17',
          Contact_Log_Type_ID: 1,
          Made_By: 100,
          Notes: 'Test',
          Planned_Contact_ID: null,
          Contact_Successful: null,
          Original_Contact_Log_Entry: null,
          Feedback_Entry_ID: null,
        })
      ).rejects.toThrow('Failed to create contact log record');
    });

    it('rejects invalid non-date fields via Zod validation', async () => {
      const service = await ContactLogService.getInstance();

      await expect(
        service.createContactLog({
          Contact_ID: 42,
          Contact_Date: '2026-05-17',
          Contact_Log_Type_ID: null,
          // Missing Made_By (required number)
          Notes: 'Test',
        } as never)
      ).rejects.toThrow();
    });
  });

  describe('updateContactLog', () => {
    it('updates non-date fields and adds Contact_Log_ID', async () => {
      const mockUpdated = { Contact_Log_ID: 1, Notes: 'Updated note' };
      mockUpdateTableRecords.mockResolvedValueOnce([mockUpdated]);

      const service = await ContactLogService.getInstance();
      const result = await service.updateContactLog(1, { Notes: 'Updated note' });

      expect(mockUpdateTableRecords).toHaveBeenCalledWith('Contact_Log', [
        expect.objectContaining({
          Contact_Log_ID: 1,
          Notes: 'Updated note',
        }),
      ]);
      expect(result).toEqual(mockUpdated);
    });

    it('converts a date-only Contact_Date to MP-TZ midnight on update', async () => {
      mockUpdateTableRecords.mockResolvedValueOnce([{ Contact_Log_ID: 1 }]);

      const service = await ContactLogService.getInstance();
      await service.updateContactLog(1, { Contact_Date: '2026-05-17' });

      expect(mockUpdateTableRecords).toHaveBeenCalledWith('Contact_Log', [
        expect.objectContaining({
          Contact_Log_ID: 1,
          Contact_Date: '2026-05-17 00:00:00',
        }),
      ]);
    });

    it('regression: round-tripping the same edit does not shift the date', async () => {
      // The original bug: editing a saved log moved its date back another day
      // each time. After the fix, the date the user reads back (from MP, in
      // MP wall-clock) should round-trip unchanged when re-saved.
      mockUpdateTableRecords.mockResolvedValue([{ Contact_Log_ID: 1 }]);

      const service = await ContactLogService.getInstance();
      // Form pre-fills from log.Contact_Date.split("T")[0] — date-only string.
      await service.updateContactLog(1, { Contact_Date: '2026-05-17' });
      await service.updateContactLog(1, { Contact_Date: '2026-05-17' });
      await service.updateContactLog(1, { Contact_Date: '2026-05-17' });

      for (const call of mockUpdateTableRecords.mock.calls) {
        expect(call[1][0].Contact_Date).toBe('2026-05-17 00:00:00');
      }
    });

    it('throws when API returns empty result', async () => {
      mockUpdateTableRecords.mockResolvedValueOnce([]);

      const service = await ContactLogService.getInstance();
      await expect(
        service.updateContactLog(1, { Notes: 'Updated' })
      ).rejects.toThrow('Failed to update contact log record');
    });
  });

  describe('deleteContactLog', () => {
    it('should delete contact log by ID', async () => {
      mockDeleteTableRecords.mockResolvedValueOnce(undefined);

      const service = await ContactLogService.getInstance();
      await service.deleteContactLog(42);

      expect(mockDeleteTableRecords).toHaveBeenCalledWith('Contact_Log', [42]);
    });

    it('should propagate delete errors', async () => {
      mockDeleteTableRecords.mockRejectedValueOnce(new Error('Record not found'));

      const service = await ContactLogService.getInstance();
      await expect(service.deleteContactLog(999)).rejects.toThrow('Record not found');
    });
  });
});

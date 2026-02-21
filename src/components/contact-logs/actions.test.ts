import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockGetSession,
  mockGetContactLogTypes,
  mockCreateContactLog,
  mockUpdateContactLog,
  mockDeleteContactLog,
  mockGetContactLogsByContactId,
  mockGetContactLogById,
  mockGetTableRecords,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockGetContactLogTypes: vi.fn(),
  mockCreateContactLog: vi.fn(),
  mockUpdateContactLog: vi.fn(),
  mockDeleteContactLog: vi.fn(),
  mockGetContactLogsByContactId: vi.fn(),
  mockGetContactLogById: vi.fn(),
  mockGetTableRecords: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock('@/services/contactLogService', () => ({
  ContactLogService: {
    getInstance: vi.fn().mockResolvedValue({
      getContactLogTypes: mockGetContactLogTypes,
      createContactLog: mockCreateContactLog,
      updateContactLog: mockUpdateContactLog,
      deleteContactLog: mockDeleteContactLog,
      getContactLogsByContactId: mockGetContactLogsByContactId,
      getContactLogById: mockGetContactLogById,
    }),
  },
}));

vi.mock('@/lib/providers/ministry-platform', () => {
  return {
    MPHelper: class {
      getTableRecords = mockGetTableRecords;
    },
  };
});

import {
  getContactLogTypes,
  createContactLog,
  updateContactLog,
  deleteContactLog,
  getContactLogsByContactId,
  getContactLogById,
} from './actions';

const mockAuthSession = {
  user: { id: 'internal-id', userGuid: 'user-guid-123' },
};

describe('contact-logs actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getContactLogTypes', () => {
    it('should require authentication', async () => {
      mockGetSession.mockResolvedValueOnce(null);
      await expect(getContactLogTypes()).rejects.toThrow('Authentication required');
    });

    it('should return types when authenticated', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      const mockTypes = [{ Contact_Log_Type_ID: 1, Contact_Log_Type: 'Email' }];
      mockGetContactLogTypes.mockResolvedValueOnce(mockTypes);

      const result = await getContactLogTypes();
      expect(result).toEqual(mockTypes);
    });
  });

  describe('createContactLog', () => {
    it('should require authentication', async () => {
      mockGetSession.mockResolvedValueOnce(null);
      await expect(
        createContactLog({
          Contact_ID: 42,
          Contact_Date: '2024-01-15T10:00:00Z',
          Notes: 'Test',
          Contact_Log_Type_ID: 1,
          Planned_Contact_ID: null,
          Contact_Successful: null,
          Original_Contact_Log_Entry: null,
          Feedback_Entry_ID: null,
        })
      ).rejects.toThrow('Authentication required');
    });

    it('should fetch User_ID and create log with Made_By', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      mockGetTableRecords.mockResolvedValueOnce([{ User_ID: 99 }]);
      const mockLog = { Contact_Log_ID: 1, Contact_ID: 42 };
      mockCreateContactLog.mockResolvedValueOnce(mockLog);

      const result = await createContactLog({
        Contact_ID: 42,
        Contact_Date: '2024-01-15T10:00:00Z',
        Notes: 'Test note',
        Contact_Log_Type_ID: 1,
        Planned_Contact_ID: null,
        Contact_Successful: null,
        Original_Contact_Log_Entry: null,
        Feedback_Entry_ID: null,
      });

      expect(mockCreateContactLog).toHaveBeenCalledWith(
        expect.objectContaining({
          Contact_ID: 42,
          Made_By: 99,
          Notes: 'Test note',
        })
      );
      expect(result).toEqual(mockLog);
    });

    it('should throw when required fields are missing', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      mockGetTableRecords.mockResolvedValueOnce([{ User_ID: 99 }]);

      await expect(
        createContactLog({
          Contact_ID: 0,
          Contact_Date: '',
          Notes: '',
          Contact_Log_Type_ID: null,
          Planned_Contact_ID: null,
          Contact_Successful: null,
          Original_Contact_Log_Entry: null,
          Feedback_Entry_ID: null,
        })
      ).rejects.toThrow('Required fields are missing');
    });

    it('should throw when user not found in MP', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      mockGetTableRecords.mockResolvedValueOnce([]);

      await expect(
        createContactLog({
          Contact_ID: 42,
          Contact_Date: '2024-01-15T10:00:00Z',
          Notes: 'Test',
          Contact_Log_Type_ID: 1,
          Planned_Contact_ID: null,
          Contact_Successful: null,
          Original_Contact_Log_Entry: null,
          Feedback_Entry_ID: null,
        })
      ).rejects.toThrow('Unable to determine user User_ID');
    });
  });

  describe('updateContactLog', () => {
    it('should require authentication', async () => {
      mockGetSession.mockResolvedValueOnce(null);
      await expect(updateContactLog(1, { Notes: 'Updated' })).rejects.toThrow('Authentication required');
    });

    it('should throw for invalid contactLogId', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      mockGetTableRecords.mockResolvedValueOnce([{ User_ID: 99 }]);

      await expect(updateContactLog(0, { Notes: 'Updated' })).rejects.toThrow('Valid Contact Log ID is required');
    });

    it('should update log with Made_By', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      mockGetTableRecords.mockResolvedValueOnce([{ User_ID: 99 }]);
      const mockLog = { Contact_Log_ID: 1, Notes: 'Updated' };
      mockUpdateContactLog.mockResolvedValueOnce(mockLog);

      const result = await updateContactLog(1, { Notes: 'Updated' });

      expect(mockUpdateContactLog).toHaveBeenCalledWith(1, expect.objectContaining({
        Notes: 'Updated',
        Made_By: 99,
      }));
      expect(result).toEqual(mockLog);
    });
  });

  describe('deleteContactLog', () => {
    it('should require authentication', async () => {
      mockGetSession.mockResolvedValueOnce(null);
      await expect(deleteContactLog(1)).rejects.toThrow('Authentication required');
    });

    it('should throw for invalid contactLogId', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      await expect(deleteContactLog(0)).rejects.toThrow('Valid Contact Log ID is required');
    });

    it('should delete when authenticated', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      mockDeleteContactLog.mockResolvedValueOnce(undefined);

      await deleteContactLog(42);
      expect(mockDeleteContactLog).toHaveBeenCalledWith(42);
    });
  });

  describe('getContactLogsByContactId', () => {
    it('should require authentication', async () => {
      mockGetSession.mockResolvedValueOnce(null);
      await expect(getContactLogsByContactId(42)).rejects.toThrow('Authentication required');
    });

    it('should throw for invalid contactId', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      await expect(getContactLogsByContactId(0)).rejects.toThrow('Valid contact ID is required');
    });

    it('should return logs when authenticated', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      const mockLogs = [{ Contact_Log_ID: 1, Contact_ID: 42 }];
      mockGetContactLogsByContactId.mockResolvedValueOnce(mockLogs);

      const result = await getContactLogsByContactId(42);
      expect(result).toEqual(mockLogs);
    });
  });

  describe('getContactLogById', () => {
    it('should require authentication', async () => {
      mockGetSession.mockResolvedValueOnce(null);
      await expect(getContactLogById(1)).rejects.toThrow('Authentication required');
    });

    it('should throw for invalid contactLogId', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      await expect(getContactLogById(0)).rejects.toThrow('Valid contact log ID is required');
    });

    it('should return log when found', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      const mockLog = { Contact_Log_ID: 1, Notes: 'Test' };
      mockGetContactLogById.mockResolvedValueOnce(mockLog);

      const result = await getContactLogById(1);
      expect(result).toEqual(mockLog);
    });

    it('should return null when not found', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      mockGetContactLogById.mockResolvedValueOnce(null);

      const result = await getContactLogById(999);
      expect(result).toBeNull();
    });
  });
});

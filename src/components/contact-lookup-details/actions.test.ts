import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockGetSession,
  mockGetContactByGuid,
  mockGetContactLogsByContactId,
  mockGetContactLogTypes,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockGetContactByGuid: vi.fn(),
  mockGetContactLogsByContactId: vi.fn(),
  mockGetContactLogTypes: vi.fn(),
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

vi.mock('@/services/contactService', () => ({
  ContactService: {
    getInstance: vi.fn().mockResolvedValue({
      getContactByGuid: mockGetContactByGuid,
    }),
  },
}));

vi.mock('@/services/contactLogService', () => ({
  ContactLogService: {
    getInstance: vi.fn().mockResolvedValue({
      getContactLogsByContactId: mockGetContactLogsByContactId,
      getContactLogTypes: mockGetContactLogTypes,
    }),
  },
}));

import { getContactDetails, getContactLogsByContactId } from './actions';

const mockAuthSession = {
  user: { id: 'internal-id', userGuid: 'user-guid-123' },
};

describe('contact-lookup-details actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getContactDetails', () => {
    it('should require authentication', async () => {
      mockGetSession.mockResolvedValueOnce(null);
      await expect(getContactDetails('some-guid')).rejects.toThrow('Authentication required');
    });

    it('should throw for empty GUID', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      await expect(getContactDetails('')).rejects.toThrow('GUID is required');
    });

    it('should throw for whitespace-only GUID', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      await expect(getContactDetails('   ')).rejects.toThrow('GUID is required');
    });

    it('should return contact details when found', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      const mockContact = {
        Contact_ID: 1,
        Contact_GUID: 'guid-123',
        First_Name: 'John',
        Last_Name: 'Doe',
      };
      mockGetContactByGuid.mockResolvedValueOnce(mockContact);

      const result = await getContactDetails('guid-123');

      expect(mockGetContactByGuid).toHaveBeenCalledWith('guid-123');
      expect(result).toEqual(mockContact);
    });

    it('should throw when contact not found', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      mockGetContactByGuid.mockResolvedValueOnce(null);

      await expect(getContactDetails('nonexistent-guid')).rejects.toThrow('Contact not found');
    });
  });

  describe('getContactLogsByContactId', () => {
    it('should require authentication', async () => {
      mockGetSession.mockResolvedValueOnce(null);
      await expect(getContactLogsByContactId(42)).rejects.toThrow('Authentication required');
    });

    it('should throw for invalid contact ID', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      await expect(getContactLogsByContactId(0)).rejects.toThrow('Valid contact ID is required');
    });

    it('should return logs with type names mapped', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      const mockLogs = [
        { Contact_Log_ID: 1, Contact_ID: 42, Contact_Log_Type_ID: 1, Notes: 'Test' },
        { Contact_Log_ID: 2, Contact_ID: 42, Contact_Log_Type_ID: null, Notes: 'No type' },
      ];
      const mockTypes = [
        { Contact_Log_Type_ID: 1, Contact_Log_Type: 'Email' },
        { Contact_Log_Type_ID: 2, Contact_Log_Type: 'Phone' },
      ];
      mockGetContactLogsByContactId.mockResolvedValueOnce(mockLogs);
      mockGetContactLogTypes.mockResolvedValue(mockTypes);

      const result = await getContactLogsByContactId(42);

      expect(result).toHaveLength(2);
      expect(result[0].Contact_Log_Type).toBe('Email');
      expect(result[1].Contact_Log_Type).toBeNull();
    });

    it('should handle unknown type ID gracefully', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      const mockLogs = [
        { Contact_Log_ID: 1, Contact_ID: 42, Contact_Log_Type_ID: 999, Notes: 'Unknown type' },
      ];
      mockGetContactLogsByContactId.mockResolvedValueOnce(mockLogs);
      mockGetContactLogTypes.mockResolvedValueOnce([
        { Contact_Log_Type_ID: 1, Contact_Log_Type: 'Email' },
      ]);

      const result = await getContactLogsByContactId(42);

      expect(result[0].Contact_Log_Type).toBeNull();
    });
  });
});

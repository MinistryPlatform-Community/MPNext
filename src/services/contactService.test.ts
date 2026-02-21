import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContactService } from '@/services/contactService';

const mockGetTableRecords = vi.fn();
const mockUpdateTableRecords = vi.fn();

vi.mock('@/lib/providers/ministry-platform', () => {
  return {
    MPHelper: class {
      getTableRecords = mockGetTableRecords;
      updateTableRecords = mockUpdateTableRecords;
    },
  };
});

describe('ContactService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ContactService as any).instance = undefined;
  });

  describe('getInstance', () => {
    it('should return a singleton instance', async () => {
      const instance1 = await ContactService.getInstance();
      const instance2 = await ContactService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('contactSearch', () => {
    it('should search contacts with correct filter and parameters', async () => {
      const mockContacts = [
        { Contact_ID: 1, First_Name: 'John', Last_Name: 'Doe' },
      ];
      mockGetTableRecords.mockResolvedValueOnce(mockContacts);

      const service = await ContactService.getInstance();
      const result = await service.contactSearch('John');

      expect(mockGetTableRecords).toHaveBeenCalledWith({
        table: 'Contacts',
        filter: expect.stringContaining("First_Name LIKE '%John%'"),
        select: expect.stringContaining('Contact_ID'),
        top: 20,
      });
      expect(result).toEqual(mockContacts);
    });

    it('should search across all expected fields', async () => {
      mockGetTableRecords.mockResolvedValueOnce([]);

      const service = await ContactService.getInstance();
      await service.contactSearch('test');

      const filter = mockGetTableRecords.mock.calls[0][0].filter;
      expect(filter).toContain("First_Name LIKE '%test%'");
      expect(filter).toContain("Last_Name LIKE '%test%'");
      expect(filter).toContain("Nickname LIKE '%test%'");
      expect(filter).toContain("Email_Address LIKE '%test%'");
      expect(filter).toContain("Mobile_Phone LIKE '%test%'");
    });

    it('should return empty array when no results found', async () => {
      mockGetTableRecords.mockResolvedValueOnce([]);

      const service = await ContactService.getInstance();
      const result = await service.contactSearch('nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('getContactByGuid', () => {
    it('should return contact when found', async () => {
      const mockContact = { Contact_ID: 1, Contact_GUID: 'guid-123', First_Name: 'John' };
      mockGetTableRecords.mockResolvedValueOnce([mockContact]);

      const service = await ContactService.getInstance();
      const result = await service.getContactByGuid('guid-123');

      expect(mockGetTableRecords).toHaveBeenCalledWith({
        table: 'Contacts',
        filter: "Contact_GUID = 'guid-123'",
        select: expect.stringContaining('Contact_GUID'),
        top: 1,
      });
      expect(result).toEqual(mockContact);
    });

    it('should return null when contact not found', async () => {
      mockGetTableRecords.mockResolvedValueOnce([]);

      const service = await ContactService.getInstance();
      const result = await service.getContactByGuid('nonexistent-guid');

      expect(result).toBeNull();
    });
  });

  describe('updateContact', () => {
    it('should update contact with correct record', async () => {
      mockUpdateTableRecords.mockResolvedValueOnce([]);

      const service = await ContactService.getInstance();
      await service.updateContact(42, { Email_Address: 'new@example.com' });

      expect(mockUpdateTableRecords).toHaveBeenCalledWith('Contacts', [
        { Contact_ID: 42, Email_Address: 'new@example.com' },
      ]);
    });

    it('should update multiple fields', async () => {
      mockUpdateTableRecords.mockResolvedValueOnce([]);

      const service = await ContactService.getInstance();
      await service.updateContact(42, {
        Email_Address: 'new@example.com',
        Mobile_Phone: '555-9999',
      });

      expect(mockUpdateTableRecords).toHaveBeenCalledWith('Contacts', [
        { Contact_ID: 42, Email_Address: 'new@example.com', Mobile_Phone: '555-9999' },
      ]);
    });

    it('should propagate errors from MPHelper', async () => {
      mockUpdateTableRecords.mockRejectedValueOnce(new Error('Update failed'));

      const service = await ContactService.getInstance();
      await expect(service.updateContact(42, { Email_Address: 'bad' })).rejects.toThrow('Update failed');
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockGetTableRecords,
  mockUpdateTableRecords,
  mockRequireSecurityRole,
} = vi.hoisted(() => ({
  mockGetTableRecords: vi.fn(),
  mockUpdateTableRecords: vi.fn(),
  mockRequireSecurityRole: vi.fn(),
}));

vi.mock('@/lib/providers/ministry-platform', () => {
  return {
    MPHelper: class {
      getTableRecords = mockGetTableRecords;
      updateTableRecords = mockUpdateTableRecords;
    },
  };
});

vi.mock('@/services/authorizationService', () => {
  class UnauthorizedError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'UnauthorizedError';
    }
  }
  return {
    UnauthorizedError,
    AuthorizationService: {
      getInstance: () => ({
        requireSecurityRole: mockRequireSecurityRole,
      }),
    },
  };
});

import { ContactService } from '@/services/contactService';
import { UnauthorizedError } from '@/services/authorizationService';
import { CONTACT_SEARCH_MAX_LENGTH } from '@/lib/dto';

describe('ContactService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: an authorized role-holder with MP User_ID 500.
    mockRequireSecurityRole.mockResolvedValue(500);
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

    it('should sanitize single quotes in search input', async () => {
      mockGetTableRecords.mockResolvedValueOnce([]);

      const service = await ContactService.getInstance();
      await service.contactSearch("O'Brien");

      const filter = mockGetTableRecords.mock.calls[0][0].filter;
      expect(filter).toContain("O''Brien");
      expect(filter).not.toContain("O'Brien");
    });

    it("gives every LIKE clause ESCAPE '\\' so the sanitizer's escapes are honored", async () => {
      mockGetTableRecords.mockResolvedValueOnce([]);

      const service = await ContactService.getInstance();
      await service.contactSearch('[0-9]');

      const filter: string = mockGetTableRecords.mock.calls[0][0].filter;
      const clauses = filter.split(' OR ');
      expect(clauses).toHaveLength(5);
      for (const clause of clauses) {
        expect(clause).toMatch(/ LIKE '%\\\[0-9\]%' ESCAPE '\\'$/);
      }
    });

    it('accepts a term of exactly CONTACT_SEARCH_MAX_LENGTH characters', async () => {
      mockGetTableRecords.mockResolvedValueOnce([]);

      const service = await ContactService.getInstance();
      await service.contactSearch('a'.repeat(CONTACT_SEARCH_MAX_LENGTH));

      expect(mockGetTableRecords).toHaveBeenCalledTimes(1);
    });

    it('rejects an over-long term before any MP call', async () => {
      const service = await ContactService.getInstance();
      await expect(service.contactSearch('a'.repeat(10_000))).rejects.toThrow(
        `Search term must be ${CONTACT_SEARCH_MAX_LENGTH} characters or fewer`,
      );
      expect(mockGetTableRecords).not.toHaveBeenCalled();
    });

    it('rejects control characters and non-strings before any MP call', async () => {
      const service = await ContactService.getInstance();
      await expect(service.contactSearch('a\u0000b')).rejects.toThrow('control characters');
      await expect(service.contactSearch(['x'] as never)).rejects.toThrow('expected a string');
      expect(mockGetTableRecords).not.toHaveBeenCalled();
    });
  });

  describe('getContactByGuid', () => {
    const validGuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const validButUnknownGuid = 'b2c3d4e5-f678-9012-3456-7890abcdef12';

    it('should return contact when found', async () => {
      const mockContact = { Contact_ID: 1, Contact_GUID: validGuid, First_Name: 'John' };
      mockGetTableRecords.mockResolvedValueOnce([mockContact]);

      const service = await ContactService.getInstance();
      const result = await service.getContactByGuid(validGuid);

      expect(mockGetTableRecords).toHaveBeenCalledWith({
        table: 'Contacts',
        filter: `Contact_GUID = '${validGuid}'`,
        select: expect.stringContaining('Contact_GUID'),
        top: 1,
      });
      expect(result).toEqual(mockContact);
    });

    it('should return null when contact not found', async () => {
      mockGetTableRecords.mockResolvedValueOnce([]);

      const service = await ContactService.getInstance();
      const result = await service.getContactByGuid(validButUnknownGuid);

      expect(result).toBeNull();
    });

    it('should throw on invalid GUID format', async () => {
      const service = await ContactService.getInstance();
      await expect(service.getContactByGuid('not-a-guid')).rejects.toThrow('Invalid GUID format');
    });
  });

  /**
   * F1 (2026-09-12). Reads used to be ungated at every layer, and MP data is
   * fetched with this app's client-credentials service account, so MP's own
   * per-user record security never applies. The service re-checks rather than
   * trusting its callers: a future action, route handler or script that forgets
   * the gate must still come up empty.
   */
  describe('read authorization', () => {
    it('gates contactSearch on an MP security role before touching MP', async () => {
      mockGetTableRecords.mockResolvedValueOnce([]);

      const service = await ContactService.getInstance();
      await service.contactSearch('John');

      expect(mockRequireSecurityRole).toHaveBeenCalledWith({
        table: 'Contacts',
        operation: 'read',
      });
    });

    it('does NOT search when the caller holds no security role', async () => {
      mockRequireSecurityRole.mockRejectedValueOnce(
        new UnauthorizedError('Not authorized: an MP security role is required'),
      );

      const service = await ContactService.getInstance();
      await expect(service.contactSearch('John')).rejects.toThrow(UnauthorizedError);
      expect(mockGetTableRecords).not.toHaveBeenCalled();
    });

    it('gates getContactByGuid on an MP security role before touching MP', async () => {
      mockGetTableRecords.mockResolvedValueOnce([]);

      const service = await ContactService.getInstance();
      await service.getContactByGuid('a1b2c3d4-e5f6-7890-abcd-ef1234567890');

      expect(mockRequireSecurityRole).toHaveBeenCalledWith({
        table: 'Contacts',
        operation: 'read',
      });
    });

    it('does NOT read a contact by GUID when the caller holds no security role', async () => {
      mockRequireSecurityRole.mockRejectedValueOnce(
        new UnauthorizedError('Not authorized: an MP security role is required'),
      );

      const service = await ContactService.getInstance();
      await expect(
        service.getContactByGuid('a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
      ).rejects.toThrow(UnauthorizedError);
      expect(mockGetTableRecords).not.toHaveBeenCalled();
    });
  });

  describe('updateContact', () => {
    it('should update contact with correct record and $userId from session', async () => {
      mockUpdateTableRecords.mockResolvedValueOnce([]);

      const service = await ContactService.getInstance();
      await service.updateContact(42, { Email_Address: 'new@example.com' });

      expect(mockUpdateTableRecords).toHaveBeenCalledWith(
        'Contacts',
        [{ Contact_ID: 42, Email_Address: 'new@example.com' }],
        { $userId: 500 },
      );
      expect(mockRequireSecurityRole).toHaveBeenCalledWith({
        table: 'Contacts',
        operation: 'update',
      });
    });

    it('should update multiple fields', async () => {
      mockUpdateTableRecords.mockResolvedValueOnce([]);

      const service = await ContactService.getInstance();
      await service.updateContact(42, {
        Email_Address: 'new@example.com',
        Mobile_Phone: '555-9999',
      });

      expect(mockUpdateTableRecords).toHaveBeenCalledWith(
        'Contacts',
        [{ Contact_ID: 42, Email_Address: 'new@example.com', Mobile_Phone: '555-9999' }],
        { $userId: 500 },
      );
    });

    // F10 (2026-09-12). This method used to take its acting user straight from
    // SessionContextService, which logs and proceeds when none resolves — so an
    // unattributed, unauthorized write to Contacts went through and MP recorded
    // it against the integration account. It must now refuse.
    it('does NOT write when the caller holds no security role', async () => {
      mockRequireSecurityRole.mockRejectedValueOnce(
        new UnauthorizedError('Not authorized: an MP security role is required'),
      );

      const service = await ContactService.getInstance();
      await expect(
        service.updateContact(42, { Email_Address: 'anon@example.com' }),
      ).rejects.toThrow(UnauthorizedError);

      expect(mockUpdateTableRecords).not.toHaveBeenCalled();
    });

    it('stamps $userId with the User_ID the gate returned, not one it looked up', async () => {
      mockRequireSecurityRole.mockResolvedValueOnce(4242);
      mockUpdateTableRecords.mockResolvedValueOnce([]);

      const service = await ContactService.getInstance();
      await service.updateContact(42, { Email_Address: 'new@example.com' });

      expect(mockUpdateTableRecords).toHaveBeenCalledWith(
        'Contacts',
        expect.anything(),
        { $userId: 4242 },
      );
    });

    it('should propagate errors from MPHelper', async () => {
      mockUpdateTableRecords.mockRejectedValueOnce(new Error('Update failed'));

      const service = await ContactService.getInstance();
      await expect(
        service.updateContact(42, { Email_Address: 'ok@example.com' }),
      ).rejects.toThrow('Update failed');
    });

    // Mass assignment (2026-09-28 review). The `Pick` on the parameter is
    // erased at runtime, so the service allowlists the columns itself.
    it('drops a smuggled column that is not on the allowlist', async () => {
      mockUpdateTableRecords.mockResolvedValueOnce([]);

      const service = await ContactService.getInstance();
      await service.updateContact(42, {
        Email_Address: 'new@example.com',
        Household_ID: 999,
        Contact_Status_ID: 2,
      } as never);

      expect(mockUpdateTableRecords).toHaveBeenCalledWith(
        'Contacts',
        [{ Contact_ID: 42, Email_Address: 'new@example.com' }],
        { $userId: 500 },
      );
    });

    it('ignores fields.Contact_ID — the write always targets the contactId argument', async () => {
      mockUpdateTableRecords.mockResolvedValueOnce([]);

      const service = await ContactService.getInstance();
      await service.updateContact(42, {
        Contact_ID: 7,
        Mobile_Phone: '555-0000',
      } as never);

      const [, records] = mockUpdateTableRecords.mock.calls[0];
      expect(records).toEqual([{ Contact_ID: 42, Mobile_Phone: '555-0000' }]);
    });

    it.each(['5 OR 1=1', [42], 0, -1, 1.5, '1e3'])(
      'rejects a non-ID contactId (%j) before any MP call',
      async (bad) => {
        const service = await ContactService.getInstance();
        await expect(
          service.updateContact(bad as never, { Email_Address: 'new@example.com' }),
        ).rejects.toThrow('Invalid Contact ID');
        expect(mockUpdateTableRecords).not.toHaveBeenCalled();
      },
    );

    it('rejects an invalid email before any MP call', async () => {
      const service = await ContactService.getInstance();
      await expect(
        service.updateContact(42, { Email_Address: 'not-an-email' }),
      ).rejects.toThrow();
      expect(mockUpdateTableRecords).not.toHaveBeenCalled();
    });

    it('checks the gate before validating arguments', async () => {
      mockRequireSecurityRole.mockRejectedValueOnce(
        new UnauthorizedError('Not authorized: an MP security role is required'),
      );

      const service = await ContactService.getInstance();
      await expect(
        service.updateContact('5 OR 1=1' as never, {}),
      ).rejects.toThrow(UnauthorizedError);
    });
  });
});

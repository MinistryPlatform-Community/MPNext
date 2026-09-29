import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockRequireSecurityRole,
  mockGetContactByGuid,
  mockGetContactLogsByContactId,
  mockGetContactLogTypes,
} = vi.hoisted(() => ({
  mockRequireSecurityRole: vi.fn(),
  mockGetContactByGuid: vi.fn(),
  mockGetContactLogsByContactId: vi.fn(),
  mockGetContactLogTypes: vi.fn(),
}));

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
import { UnauthorizedError } from '@/services/authorizationService';

/**
 * Both actions here are reads, and as of F1 (2026-09-12) both require an MP
 * security role rather than a bare session. The old `mockGetSession` harness is
 * gone: the gate subsumes authentication, so there is nothing left for a
 * session-only assertion to say.
 */
describe('contact-lookup-details actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: an authorized role-holder.
    mockRequireSecurityRole.mockResolvedValue(99);
  });

  describe('getContactDetails', () => {
    it('requires an MP security role, not merely a session', async () => {
      mockGetContactByGuid.mockResolvedValueOnce({ Contact_ID: 1 });

      await getContactDetails('ab12cd34-ef56-7890-abcd-ef1234567890');

      expect(mockRequireSecurityRole).toHaveBeenCalledWith({
        table: 'Contacts',
        operation: 'read',
      });
    });

    it('reads nothing when the caller holds no security role', async () => {
      mockRequireSecurityRole.mockRejectedValueOnce(
        new UnauthorizedError('Not authorized: an MP security role is required')
      );

      await expect(getContactDetails('some-guid')).rejects.toThrow(UnauthorizedError);
      expect(mockGetContactByGuid).not.toHaveBeenCalled();
    });

    it('rejects a session with no Ministry Platform user', async () => {
      mockRequireSecurityRole.mockRejectedValueOnce(
        new UnauthorizedError('Not authorized: no Ministry Platform user is attached to this session')
      );

      await expect(getContactDetails('some-guid')).rejects.toThrow(
        /no Ministry Platform user is attached/
      );
      expect(mockGetContactByGuid).not.toHaveBeenCalled();
    });

    it('refuses before validating the GUID argument', async () => {
      mockRequireSecurityRole.mockRejectedValueOnce(
        new UnauthorizedError('Not authorized: an MP security role is required')
      );

      // An unauthorized caller must not be able to probe argument validation.
      await expect(getContactDetails('')).rejects.toThrow(UnauthorizedError);
    });

    it('should throw for empty GUID', async () => {
      await expect(getContactDetails('')).rejects.toThrow('GUID is required');
    });

    it('should throw for whitespace-only GUID', async () => {
      await expect(getContactDetails('   ')).rejects.toThrow('GUID is required');
    });

    it('should return contact details when found', async () => {
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
      mockGetContactByGuid.mockResolvedValueOnce(null);

      await expect(getContactDetails('nonexistent-guid')).rejects.toThrow('Contact not found');
    });
  });

  describe('getContactLogsByContactId', () => {
    it('gates the contact-log read on an MP security role', async () => {
      mockGetContactLogsByContactId.mockResolvedValueOnce([]);

      await getContactLogsByContactId(42);

      expect(mockRequireSecurityRole).toHaveBeenCalledWith({
        table: 'Contact_Log',
        operation: 'read',
      });
    });

    it('reads nothing when the caller holds no security role', async () => {
      mockRequireSecurityRole.mockRejectedValueOnce(
        new UnauthorizedError('Not authorized: an MP security role is required')
      );

      await expect(getContactLogsByContactId(42)).rejects.toThrow(UnauthorizedError);
      expect(mockGetContactLogsByContactId).not.toHaveBeenCalled();
    });

    it('should throw for invalid contact ID', async () => {
      await expect(getContactLogsByContactId(0)).rejects.toThrow('Invalid Contact ID');
    });

    it('should return logs with type names mapped', async () => {
      const mockLogs = [
        { Contact_Log_ID: 1, Contact_ID: 42, Contact_Log_Type_ID: 1, Notes: 'Test' },
        { Contact_Log_ID: 2, Contact_ID: 42, Contact_Log_Type_ID: null, Notes: 'No type' },
      ];
      const mockTypes = [
        { Contact_Log_Type_ID: 1, Contact_Log_Type: 'Email' },
        { Contact_Log_Type_ID: 2, Contact_Log_Type: 'Phone' },
      ];
      mockGetContactLogsByContactId.mockResolvedValueOnce(mockLogs);
      mockGetContactLogTypes.mockResolvedValueOnce(mockTypes);

      const result = await getContactLogsByContactId(42);

      expect(result).toHaveLength(2);
      expect(result[0].Contact_Log_Type).toBe('Email');
      expect(result[1].Contact_Log_Type).toBeNull();
    });

    // Data minimization (2026-09-28 review): this used to spread the whole MP
    // row — author IDs, the subject Contact_ID and cross-record links — into
    // what is serialized to the browser, behind an `as` cast.
    it('returns exactly the rendered fields, not the whole MP row', async () => {
      mockGetContactLogsByContactId.mockResolvedValueOnce([
        {
          Contact_Log_ID: 7,
          Contact_ID: 42,
          Contact_Date: '2026-08-20T14:30:00',
          Contact_Log_Type_ID: 1,
          Made_By: 12345,
          Notes: 'Called.',
          Planned_Contact_ID: 3,
          Contact_Successful: true,
          Original_Contact_Log_Entry: 6,
          Feedback_Entry_ID: 9,
        },
      ]);
      mockGetContactLogTypes.mockResolvedValueOnce([
        { Contact_Log_Type_ID: 1, Contact_Log_Type: 'Email' },
      ]);

      const result = await getContactLogsByContactId(42);

      expect(result).toEqual([
        {
          Contact_Log_ID: 7,
          Contact_Date: '2026-08-20T14:30:00',
          Notes: 'Called.',
          Contact_Log_Type: 'Email',
        },
      ]);
      expect(Object.keys(result[0]).sort()).toEqual([
        'Contact_Date',
        'Contact_Log_ID',
        'Contact_Log_Type',
        'Notes',
      ]);
    });

    it('should handle unknown type ID gracefully', async () => {
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

  // Regression guard for `.claude/TODO/n-plus-1-contact-log-types-lookup.md`.
  // `getContactLogTypes()` used to be called inside the `logs.map()` callback, so
  // the same small lookup table was refetched once per typed log. The call-count
  // assertions below are the whole point — the pre-existing tests mocked the call
  // and never counted it, which is exactly why the N+1 was invisible to the suite.
  describe('contact log type lookup is fetched once', () => {
    it('fetches the lookup table exactly once for many typed logs', async () => {
      mockGetContactLogsByContactId.mockResolvedValueOnce([
        { Contact_Log_ID: 1, Contact_ID: 42, Contact_Log_Type_ID: 1, Notes: 'a' },
        { Contact_Log_ID: 2, Contact_ID: 42, Contact_Log_Type_ID: 2, Notes: 'b' },
        { Contact_Log_ID: 3, Contact_ID: 42, Contact_Log_Type_ID: 1, Notes: 'c' },
        { Contact_Log_ID: 4, Contact_ID: 42, Contact_Log_Type_ID: null, Notes: 'd' },
        { Contact_Log_ID: 5, Contact_ID: 42, Contact_Log_Type_ID: 2, Notes: 'e' },
      ]);
      mockGetContactLogTypes.mockResolvedValueOnce([
        { Contact_Log_Type_ID: 1, Contact_Log_Type: 'Email' },
        { Contact_Log_Type_ID: 2, Contact_Log_Type: 'Phone' },
      ]);

      const result = await getContactLogsByContactId(42);

      expect(mockGetContactLogTypes).toHaveBeenCalledTimes(1);
      expect(result.map(log => log.Contact_Log_Type)).toEqual([
        'Email',
        'Phone',
        'Email',
        null,
        'Phone',
      ]);
    });

    it('does not fetch the lookup table when no log has a type', async () => {
      mockGetContactLogsByContactId.mockResolvedValueOnce([
        { Contact_Log_ID: 1, Contact_ID: 42, Contact_Log_Type_ID: null, Notes: 'a' },
        { Contact_Log_ID: 2, Contact_ID: 42, Contact_Log_Type_ID: 0, Notes: 'b' },
      ]);

      const result = await getContactLogsByContactId(42);

      expect(mockGetContactLogTypes).not.toHaveBeenCalled();
      expect(result.map(log => log.Contact_Log_Type)).toEqual([null, null]);
    });

    it('does not fetch the lookup table when the contact has no logs', async () => {
      mockGetContactLogsByContactId.mockResolvedValueOnce([]);

      const result = await getContactLogsByContactId(42);

      expect(result).toEqual([]);
      expect(mockGetContactLogTypes).not.toHaveBeenCalled();
    });

    it('maps a type with an empty name to null rather than the empty string', async () => {
      mockGetContactLogsByContactId.mockResolvedValueOnce([
        { Contact_Log_ID: 1, Contact_ID: 42, Contact_Log_Type_ID: 1, Notes: 'a' },
      ]);
      mockGetContactLogTypes.mockResolvedValueOnce([
        { Contact_Log_Type_ID: 1, Contact_Log_Type: '' },
      ]);

      const result = await getContactLogsByContactId(42);

      expect(result[0].Contact_Log_Type).toBeNull();
    });
  });

  describe('Non-Error rejections', () => {
    // Both actions end in `throw error instanceof Error ? error : new Error(...)`.
    // A service that rejects with a non-Error (a string from a bare `throw`, or a
    // rejected promise carrying a plain object) must still surface a real Error,
    // otherwise the caller gets `undefined` for `error.message`.
    it('should wrap a non-Error rejection from getContactDetails', async () => {
      mockGetContactByGuid.mockRejectedValueOnce('mp connection reset');

      await expect(getContactDetails('ab12cd34-ef56-7890-abcd-ef1234567890')).rejects.toThrow(
        'Failed to fetch contact details'
      );
    });

    it('should wrap a non-Error rejection from getContactLogsByContactId', async () => {
      mockGetContactLogsByContactId.mockRejectedValueOnce({ status: 500 });

      await expect(getContactLogsByContactId(42)).rejects.toThrow('Failed to fetch contact logs');
    });
  });

  // Regression guard for `.claude/TODO/mp-filter-injection-numeric-ids.md`. This
  // is the second reachable entry point into
  // `ContactLogService.getContactLogsByContactId` and carried the same
  // ineffective `!contactId || contactId <= 0` guard.
  describe('numeric ID validation at the action boundary', () => {
    it.each(['1 OR 1=1', '5; DROP', "1' OR '1'='1", '', 'abc', '  7  '])(
      'rejects %j before reaching the service',
      async (payload) => {
  
        await expect(
          getContactLogsByContactId(payload as unknown as number)
        ).rejects.toThrow('Invalid Contact ID');
        expect(mockGetContactLogsByContactId).not.toHaveBeenCalled();
      }
    );

    it('passes a digits-only ID through to the service as a number', async () => {
      mockGetContactLogsByContactId.mockResolvedValueOnce([]);

      await getContactLogsByContactId('42' as unknown as number);

      expect(mockGetContactLogsByContactId).toHaveBeenCalledWith(42);
    });
  });
});

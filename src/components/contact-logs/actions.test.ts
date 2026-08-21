import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Contact-log action tests.
 *
 * These encode the decided authorization policy, not just the code's shape:
 * writes require an authenticated session AND an MP security role; any
 * role-holder may edit or delete a log another user created; reads require
 * authentication only. See `.claude/references/auth.md`.
 */

const {
  mockGetSession,
  mockGetContactLogTypes,
  mockCreateContactLog,
  mockUpdateContactLog,
  mockDeleteContactLog,
  mockGetContactLogsByContactId,
  mockGetContactLogById,
  mockRequireSecurityRoleForWrite,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockGetContactLogTypes: vi.fn(),
  mockCreateContactLog: vi.fn(),
  mockUpdateContactLog: vi.fn(),
  mockDeleteContactLog: vi.fn(),
  mockGetContactLogsByContactId: vi.fn(),
  mockGetContactLogById: vi.fn(),
  mockRequireSecurityRoleForWrite: vi.fn(),
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
        requireSecurityRoleForWrite: mockRequireSecurityRoleForWrite,
      }),
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
import { UnauthorizedError } from '@/services/authorizationService';

const validUserGuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

const mockAuthSession = {
  user: { id: 'internal-id', userGuid: validUserGuid, userId: 99 },
};

const validCreateInput = {
  Contact_ID: 42,
  Contact_Date: '2024-01-15T10:00:00Z',
  Notes: 'Test note',
  Contact_Log_Type_ID: 1,
  Planned_Contact_ID: null,
  Contact_Successful: null,
  Original_Contact_Log_Entry: null,
  Feedback_Entry_ID: null,
};

describe('contact-logs actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: an authorized role-holder. Individual tests override.
    mockRequireSecurityRoleForWrite.mockResolvedValue(99);
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

    it('should not require a security role — it is a read', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      mockGetContactLogTypes.mockResolvedValueOnce([]);

      await getContactLogTypes();
      expect(mockRequireSecurityRoleForWrite).not.toHaveBeenCalled();
    });
  });

  describe('createContactLog', () => {
    it('should require authentication', async () => {
      mockGetSession.mockResolvedValueOnce(null);
      await expect(createContactLog(validCreateInput)).rejects.toThrow(
        'Authentication required'
      );
      expect(mockRequireSecurityRoleForWrite).not.toHaveBeenCalled();
    });

    it('should create the log with Made_By taken from the acting session', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      const mockLog = { Contact_Log_ID: 1, Contact_ID: 42 };
      mockCreateContactLog.mockResolvedValueOnce(mockLog);

      const result = await createContactLog(validCreateInput);

      expect(mockRequireSecurityRoleForWrite).toHaveBeenCalledWith({
        table: 'Contact_Log',
        operation: 'create',
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

      await expect(
        createContactLog({
          ...validCreateInput,
          Contact_ID: 0,
          Contact_Date: '',
          Notes: '',
        })
      ).rejects.toThrow('Required fields are missing');
      expect(mockCreateContactLog).not.toHaveBeenCalled();
    });

    it.each([
      ['Contact_ID', { Contact_ID: 0 }],
      ['Contact_Date', { Contact_Date: '' }],
      ['Notes', { Notes: '' }],
    ])('should reject a create missing %s', async (_field, override) => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);

      await expect(
        createContactLog({ ...validCreateInput, ...override })
      ).rejects.toThrow('Required fields are missing');
      expect(mockCreateContactLog).not.toHaveBeenCalled();
    });

    it('should not write when the caller holds no security role', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      mockRequireSecurityRoleForWrite.mockRejectedValueOnce(
        new UnauthorizedError('Not authorized: an MP security role is required')
      );

      await expect(createContactLog(validCreateInput)).rejects.toThrow(
        'Not authorized: an MP security role is required'
      );
      expect(mockCreateContactLog).not.toHaveBeenCalled();
    });

    it('should not resolve the acting user itself — SessionContextService owns that', async () => {
      // Regression guard for the inline dp_Users lookup this action used to do
      // on every write. Made_By must come from the authorization gate's return
      // value, which reads the session-baked (already cached) User_ID.
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      mockRequireSecurityRoleForWrite.mockResolvedValueOnce(4242);
      mockCreateContactLog.mockResolvedValueOnce({ Contact_Log_ID: 1 });

      await createContactLog(validCreateInput);

      expect(mockCreateContactLog).toHaveBeenCalledWith(
        expect.objectContaining({ Made_By: 4242 })
      );
    });

    it('should wrap a non-Error rejection from the service', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      mockCreateContactLog.mockRejectedValueOnce('boom');

      await expect(createContactLog(validCreateInput)).rejects.toThrow(
        'Failed to create contact log'
      );
    });
  });

  describe('updateContactLog', () => {
    it('should require authentication', async () => {
      mockGetSession.mockResolvedValueOnce(null);
      await expect(updateContactLog(1, { Notes: 'Updated' })).rejects.toThrow(
        'Authentication required'
      );
      expect(mockRequireSecurityRoleForWrite).not.toHaveBeenCalled();
    });

    it('should throw for invalid contactLogId', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      await expect(updateContactLog(0, { Notes: 'Updated' })).rejects.toThrow(
        'Invalid Contact Log ID'
      );
      expect(mockRequireSecurityRoleForWrite).not.toHaveBeenCalled();
    });

    it('should reject a negative contact log ID', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      await expect(updateContactLog(-5, { Notes: 'x' })).rejects.toThrow(
        'Invalid Contact Log ID'
      );
      expect(mockUpdateContactLog).not.toHaveBeenCalled();
    });

    it('should update the log after the security-role gate passes', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      const mockLog = { Contact_Log_ID: 1, Notes: 'Updated' };
      mockUpdateContactLog.mockResolvedValueOnce(mockLog);

      const result = await updateContactLog(1, { Notes: 'Updated' });

      expect(mockRequireSecurityRoleForWrite).toHaveBeenCalledWith({
        table: 'Contact_Log',
        operation: 'update',
      });
      expect(mockUpdateContactLog).toHaveBeenCalledWith(1, { Notes: 'Updated' });
      expect(result).toEqual(mockLog);
    });

    it('should NOT stamp Made_By with the editor', async () => {
      // Made_By records who made the *contact*. Since any role-holder may edit
      // anyone's log, stamping the editor would rewrite the record's authorship.
      // MP's audit trail captures the editor via $userId in ContactLogService.
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      mockUpdateContactLog.mockResolvedValueOnce({ Contact_Log_ID: 1 });

      await updateContactLog(1, { Notes: 'Updated' });

      expect(mockUpdateContactLog).toHaveBeenCalledWith(
        1,
        expect.not.objectContaining({ Made_By: expect.anything() })
      );
    });

    it('should not write when the caller holds no security role', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      mockRequireSecurityRoleForWrite.mockRejectedValueOnce(
        new UnauthorizedError('Not authorized: an MP security role is required')
      );

      await expect(updateContactLog(1, { Notes: 'x' })).rejects.toThrow(
        'Not authorized: an MP security role is required'
      );
      expect(mockUpdateContactLog).not.toHaveBeenCalled();
    });

    it('should permit editing a log made by a different user', async () => {
      // POLICY: ownership is not a factor. This test exists so a future reader
      // knows the absence of an ownership check was chosen, not overlooked.
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      mockUpdateContactLog.mockResolvedValueOnce({ Contact_Log_ID: 7, Made_By: 12345 });

      await expect(updateContactLog(7, { Notes: 'Corrected typo' })).resolves.toEqual({
        Contact_Log_ID: 7,
        Made_By: 12345,
      });
      // No read of the target log is performed to compare Made_By.
      expect(mockGetContactLogById).not.toHaveBeenCalled();
    });

    it('should wrap a non-Error rejection from the service', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      mockUpdateContactLog.mockRejectedValueOnce('boom');

      await expect(updateContactLog(1, { Notes: 'x' })).rejects.toThrow(
        'Failed to update contact log'
      );
    });
  });

  describe('deleteContactLog', () => {
    it('should require authentication', async () => {
      mockGetSession.mockResolvedValueOnce(null);
      await expect(deleteContactLog(1)).rejects.toThrow('Authentication required');
      expect(mockRequireSecurityRoleForWrite).not.toHaveBeenCalled();
    });

    it('should throw for invalid contactLogId', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      await expect(deleteContactLog(0)).rejects.toThrow('Invalid Contact Log ID');
      expect(mockRequireSecurityRoleForWrite).not.toHaveBeenCalled();
    });

    it('should delete after the security-role gate passes', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      mockDeleteContactLog.mockResolvedValueOnce(undefined);

      await deleteContactLog(42);

      expect(mockRequireSecurityRoleForWrite).toHaveBeenCalledWith({
        table: 'Contact_Log',
        operation: 'delete',
      });
      expect(mockDeleteContactLog).toHaveBeenCalledWith(42);
    });

    it('should NOT delete when the caller holds no security role', async () => {
      // This is the sharpest edge the gate closes: previously any authenticated
      // session could delete any contact log in the domain by ID.
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      mockRequireSecurityRoleForWrite.mockRejectedValueOnce(
        new UnauthorizedError('Not authorized: an MP security role is required')
      );

      await expect(deleteContactLog(42)).rejects.toThrow(
        'Not authorized: an MP security role is required'
      );
      expect(mockDeleteContactLog).not.toHaveBeenCalled();
    });

    it('should permit deleting a log made by a different user', async () => {
      // POLICY: ownership is not a factor — see updateContactLog above.
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      mockDeleteContactLog.mockResolvedValueOnce(undefined);

      await deleteContactLog(7);

      expect(mockDeleteContactLog).toHaveBeenCalledWith(7);
      expect(mockGetContactLogById).not.toHaveBeenCalled();
    });

    it('should wrap a non-Error rejection from the service', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      mockDeleteContactLog.mockRejectedValueOnce('boom');

      await expect(deleteContactLog(42)).rejects.toThrow('Failed to delete contact log');
    });
  });

  describe('getContactLogsByContactId', () => {
    it('should require authentication', async () => {
      mockGetSession.mockResolvedValueOnce(null);
      await expect(getContactLogsByContactId(42)).rejects.toThrow('Authentication required');
    });

    it('should throw for invalid contactId', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      await expect(getContactLogsByContactId(0)).rejects.toThrow(
        'Invalid Contact ID'
      );
    });

    it('should return logs when authenticated, without a role check', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      const mockLogs = [{ Contact_Log_ID: 1, Contact_ID: 42 }];
      mockGetContactLogsByContactId.mockResolvedValueOnce(mockLogs);

      const result = await getContactLogsByContactId(42);
      expect(result).toEqual(mockLogs);
      expect(mockRequireSecurityRoleForWrite).not.toHaveBeenCalled();
    });

    it('should wrap a non-Error rejection from the service', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      mockGetContactLogsByContactId.mockRejectedValueOnce('boom');

      await expect(getContactLogsByContactId(42)).rejects.toThrow(
        'Failed to fetch contact logs'
      );
    });
  });

  describe('getContactLogById', () => {
    it('should require authentication', async () => {
      mockGetSession.mockResolvedValueOnce(null);
      await expect(getContactLogById(1)).rejects.toThrow('Authentication required');
    });

    it('should throw for invalid contactLogId', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      await expect(getContactLogById(0)).rejects.toThrow('Invalid Contact Log ID');
    });

    it('should return log when found', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      const mockLog = { Contact_Log_ID: 1, Notes: 'Test' };
      mockGetContactLogById.mockResolvedValueOnce(mockLog);

      const result = await getContactLogById(1);
      expect(result).toEqual(mockLog);
      expect(mockRequireSecurityRoleForWrite).not.toHaveBeenCalled();
    });

    it('should return null when not found', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      mockGetContactLogById.mockResolvedValueOnce(null);

      const result = await getContactLogById(999);
      expect(result).toBeNull();
    });

    it('should wrap a non-Error rejection from the service', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      mockGetContactLogById.mockRejectedValueOnce('boom');

      await expect(getContactLogById(1)).rejects.toThrow('Failed to fetch contact log');
    });
  });

  describe('Session guards', () => {
    it('should reject writes for a session with no user id', async () => {
      mockGetSession.mockResolvedValue({ user: {} });

      await expect(createContactLog(validCreateInput)).rejects.toThrow(
        'Authentication required'
      );
      await expect(updateContactLog(1, { Notes: 'x' })).rejects.toThrow(
        'Authentication required'
      );
      await expect(deleteContactLog(1)).rejects.toThrow('Authentication required');
      expect(mockRequireSecurityRoleForWrite).not.toHaveBeenCalled();
    });

    it('no longer requires userGuid on the session — the gate uses the resolved userId', async () => {
      // The old actions threw "User GUID not found in session" here because they
      // did their own dp_Users lookup. SessionContextService reads the User_ID
      // that customSession already baked in, so userGuid is not needed.
      mockGetSession.mockResolvedValueOnce({ user: { id: 'ba-internal-id', userId: 99 } });
      mockCreateContactLog.mockResolvedValueOnce({ Contact_Log_ID: 1 });

      await expect(createContactLog(validCreateInput)).resolves.toEqual({
        Contact_Log_ID: 1,
      });
    });
  });

  // Regression guard for `.claude/TODO/mp-filter-injection-numeric-ids.md`.
  //
  // These actions compile to POST endpoints, so a caller controls the payload's
  // shape as well as its values — a string reaches a `number` parameter. The old
  // `!id || id <= 0` guard passed such values through: for '1 OR 1=1',
  // `!id` is false and `id <= 0` is false, so the guard was a no-op.
  describe('numeric ID validation at the action boundary', () => {
    const injectionPayloads = ['1 OR 1=1', '5; DROP', "1' OR '1'='1", '1 --', '', 'abc', '  7  '];

    it.each(injectionPayloads)('getContactLogById rejects %j before reaching the service', async (payload) => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);

      await expect(getContactLogById(payload as unknown as number)).rejects.toThrow(
        'Invalid Contact Log ID'
      );
      expect(mockGetContactLogById).not.toHaveBeenCalled();
    });

    it.each(injectionPayloads)('getContactLogsByContactId rejects %j before reaching the service', async (payload) => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);

      await expect(getContactLogsByContactId(payload as unknown as number)).rejects.toThrow(
        'Invalid Contact ID'
      );
      expect(mockGetContactLogsByContactId).not.toHaveBeenCalled();
    });

    it.each(injectionPayloads)('updateContactLog rejects %j before the write gate', async (payload) => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);

      await expect(
        updateContactLog(payload as unknown as number, { Notes: 'x' })
      ).rejects.toThrow('Invalid Contact Log ID');
      expect(mockRequireSecurityRoleForWrite).not.toHaveBeenCalled();
      expect(mockUpdateContactLog).not.toHaveBeenCalled();
    });

    it.each(injectionPayloads)('deleteContactLog rejects %j before the write gate', async (payload) => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);

      await expect(deleteContactLog(payload as unknown as number)).rejects.toThrow(
        'Invalid Contact Log ID'
      );
      expect(mockRequireSecurityRoleForWrite).not.toHaveBeenCalled();
      expect(mockDeleteContactLog).not.toHaveBeenCalled();
    });

    it('rejects before authorization but after authentication', async () => {
      mockGetSession.mockResolvedValueOnce(null);

      await expect(deleteContactLog('1 OR 1=1' as unknown as number)).rejects.toThrow(
        'Authentication required'
      );
    });

    it('passes a digits-only ID through to the service as a number', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      mockGetContactLogById.mockResolvedValueOnce({ Contact_Log_ID: 42 });

      await getContactLogById('42' as unknown as number);

      expect(mockGetContactLogById).toHaveBeenCalledWith(42);
    });
  });
});

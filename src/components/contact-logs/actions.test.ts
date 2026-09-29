import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Contact-log action tests.
 *
 * These encode the decided authorization policy, not just the code's shape:
 * every action — reads as well as writes — requires an authenticated session
 * AND an MP security role; any role-holder may read, edit, or delete a log
 * another user created. See `.claude/references/auth.md`.
 *
 * Reads joined the gate on 2026-09-12 (F1). Before that they took a bare
 * session check, which proved nothing: MP's OIDC endpoint authenticates any
 * `dp_Users` record and this app reads MP with its own client-credentials
 * service account, so MP's per-user record security never applied to what came
 * back. There is no longer a session-only assertion to make here — the gate
 * subsumes authentication, which is why `mockGetSession` is gone from this file.
 */

const {
  mockGetContactLogTypes,
  mockCreateContactLog,
  mockUpdateContactLog,
  mockDeleteContactLog,
  mockGetContactLogById,
  mockRequireSecurityRole,
} = vi.hoisted(() => ({
  mockGetContactLogTypes: vi.fn(),
  mockCreateContactLog: vi.fn(),
  mockUpdateContactLog: vi.fn(),
  mockDeleteContactLog: vi.fn(),
  mockGetContactLogById: vi.fn(),
  mockRequireSecurityRole: vi.fn(),
}));

vi.mock('@/services/contactLogService', () => ({
  ContactLogService: {
    getInstance: vi.fn().mockResolvedValue({
      getContactLogTypes: mockGetContactLogTypes,
      createContactLog: mockCreateContactLog,
      updateContactLog: mockUpdateContactLog,
      deleteContactLog: mockDeleteContactLog,
      // Only ever asserted NOT called: no action reads the target log to
      // compare ownership.
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
        requireSecurityRole: mockRequireSecurityRole,
      }),
    },
  };
});

import * as actions from './actions';
import {
  getContactLogTypes,
  createContactLog,
  updateContactLog,
  deleteContactLog,
} from './actions';
import { UnauthorizedError } from '@/services/authorizationService';

/** The gate's refusal for an MP user holding no security role. */
function noRole() {
  return new UnauthorizedError(
    'Not authorized: an MP security role is required'
  );
}

/** The gate's refusal for a session with no MP user behind it. */
function noMpUser() {
  return new UnauthorizedError(
    'Not authorized: no Ministry Platform user is attached to this session'
  );
}

const validCreateInput = {
  Contact_ID: 42,
  Contact_Date: '2024-01-15T10:00:00Z',
  Notes: 'Test note',
  Contact_Log_Type_ID: 1,
};

describe('contact-logs actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: an authorized role-holder. Individual tests override.
    mockRequireSecurityRole.mockResolvedValue(99);
  });

  describe('getContactLogTypes', () => {
    it('refuses a caller with no security role', async () => {
      mockRequireSecurityRole.mockRejectedValueOnce(noRole());

      await expect(getContactLogTypes()).rejects.toThrow(UnauthorizedError);
      expect(mockGetContactLogTypes).not.toHaveBeenCalled();
    });

    it('refuses a session with no Ministry Platform user', async () => {
      mockRequireSecurityRole.mockRejectedValueOnce(noMpUser());

      await expect(getContactLogTypes()).rejects.toThrow(
        /no Ministry Platform user is attached/
      );
      expect(mockGetContactLogTypes).not.toHaveBeenCalled();
    });

    it('should return types when authenticated', async () => {
      const mockTypes = [{ Contact_Log_Type_ID: 1, Contact_Log_Type: 'Email' }];
      mockGetContactLogTypes.mockResolvedValueOnce(mockTypes);

      const result = await getContactLogTypes();
      expect(result).toEqual(mockTypes);
    });

    it('gates the read on a security role (F1 — it used to gate on nothing)', async () => {
      mockGetContactLogTypes.mockResolvedValueOnce([]);

      await getContactLogTypes();

      expect(mockRequireSecurityRole).toHaveBeenCalledWith({
        table: 'Contact_Log',
        operation: 'read',
      });
    });
  });

  describe('createContactLog', () => {
    it('refuses a session with no Ministry Platform user', async () => {
      mockRequireSecurityRole.mockRejectedValueOnce(noMpUser());

      await expect(createContactLog(validCreateInput)).rejects.toThrow(
        /no Ministry Platform user is attached/
      );
      expect(mockCreateContactLog).not.toHaveBeenCalled();
    });

    it('should create the log after the security-role gate passes', async () => {
      const mockLog = { Contact_Log_ID: 1, Contact_ID: 42 };
      mockCreateContactLog.mockResolvedValueOnce(mockLog);

      const result = await createContactLog(validCreateInput);

      expect(mockRequireSecurityRole).toHaveBeenCalledWith({
        table: 'Contact_Log',
        operation: 'create',
      });
      expect(mockCreateContactLog).toHaveBeenCalledWith(
        expect.objectContaining({
          Contact_ID: 42,
          Notes: 'Test note',
        })
      );
      expect(result).toEqual(mockLog);
    });

    it('should throw when required fields are missing', async () => {
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
      await expect(
        createContactLog({ ...validCreateInput, ...override })
      ).rejects.toThrow('Required fields are missing');
      expect(mockCreateContactLog).not.toHaveBeenCalled();
    });

    it('should not write when the caller holds no security role', async () => {
      mockRequireSecurityRole.mockRejectedValueOnce(
        new UnauthorizedError('Not authorized: an MP security role is required')
      );

      await expect(createContactLog(validCreateInput)).rejects.toThrow(
        'Not authorized: an MP security role is required'
      );
      expect(mockCreateContactLog).not.toHaveBeenCalled();
    });

    it('should not resolve the acting user itself — SessionContextService owns that', async () => {
      // Regression guard for the inline dp_Users lookup this action used to do
      // on every write. The acting user comes from the authorization gate,
      // which reads the session-baked (already cached) User_ID.
      mockRequireSecurityRole.mockResolvedValueOnce(4242);
      mockCreateContactLog.mockResolvedValueOnce({ Contact_Log_ID: 1 });

      await createContactLog(validCreateInput);

      // The gate is consulted exactly once and is the sole source of the
      // acting user; no separate lookup is performed alongside it.
      expect(mockRequireSecurityRole).toHaveBeenCalledTimes(1);
      expect(mockGetContactLogById).not.toHaveBeenCalled();
    });

    it('F4: does not assemble Made_By itself — the service is the only stamper', async () => {
      // Authorship has exactly one source: the gate's return value, applied
      // inside ContactLogService. If the action also built a Made_By the two
      // could drift, and a caller-supplied value could slip past whichever
      // layer was checked second.
      mockCreateContactLog.mockResolvedValueOnce({ Contact_Log_ID: 1 });

      await createContactLog(validCreateInput);

      expect(mockCreateContactLog).toHaveBeenCalledWith(
        expect.not.objectContaining({ Made_By: expect.anything() })
      );
    });

    it('F4: forwards no Made_By even when the caller smuggles one in', async () => {
      // TypeScript is erased at runtime and a server action is a POST endpoint,
      // so this is the shape a crafted request can actually send. The action
      // adds nothing; ContactLogService strips the smuggled key.
      mockCreateContactLog.mockResolvedValueOnce({ Contact_Log_ID: 1 });

      await createContactLog({ ...validCreateInput, Made_By: 999 } as never);

      const [payload] = mockCreateContactLog.mock.calls[0];
      expect(payload.Made_By).not.toBe(99);
    });

    it('should wrap a non-Error rejection from the service', async () => {
      mockCreateContactLog.mockRejectedValueOnce('boom');

      await expect(createContactLog(validCreateInput)).rejects.toThrow(
        'Failed to create contact log'
      );
    });
  });

  describe('updateContactLog', () => {
    it('refuses a session with no Ministry Platform user', async () => {
      mockRequireSecurityRole.mockRejectedValueOnce(noMpUser());

      await expect(updateContactLog(1, { Notes: 'Updated' })).rejects.toThrow(
        /no Ministry Platform user is attached/
      );
      expect(mockUpdateContactLog).not.toHaveBeenCalled();
    });

    it('should throw for invalid contactLogId', async () => {
      await expect(updateContactLog(0, { Notes: 'Updated' })).rejects.toThrow(
        'Invalid Contact Log ID'
      );
      // The gate runs before argument parsing now, so an unauthorized caller
      // never reaches this check at all — but an authorized one still does.
      expect(mockUpdateContactLog).not.toHaveBeenCalled();
    });

    it('should reject a negative contact log ID', async () => {
      await expect(updateContactLog(-5, { Notes: 'x' })).rejects.toThrow(
        'Invalid Contact Log ID'
      );
      expect(mockUpdateContactLog).not.toHaveBeenCalled();
    });

    it('should update the log after the security-role gate passes', async () => {
      const mockLog = { Contact_Log_ID: 1, Notes: 'Updated' };
      mockUpdateContactLog.mockResolvedValueOnce(mockLog);

      const result = await updateContactLog(1, { Notes: 'Updated' });

      expect(mockRequireSecurityRole).toHaveBeenCalledWith({
        table: 'Contact_Log',
        operation: 'update',
      });
      expect(mockUpdateContactLog).toHaveBeenCalledWith(1, { Notes: 'Updated' });
      expect(result).toEqual(mockLog);
    });

    it('F4: forwards no Made_By — the service stamps it from the gate', async () => {
      // Attribution has exactly one source: the authorization gate's return
      // value, applied inside ContactLogService. The action forwards nothing.
      mockUpdateContactLog.mockResolvedValueOnce({ Contact_Log_ID: 1 });

      await updateContactLog(1, { Notes: 'Updated' });

      expect(mockUpdateContactLog).toHaveBeenCalledWith(
        1,
        expect.not.objectContaining({ Made_By: expect.anything() })
      );
    });

    it('F4: forwards no Contact_ID, so an edit cannot re-parent a log', async () => {
      mockUpdateContactLog.mockResolvedValueOnce({ Contact_Log_ID: 1 });

      await updateContactLog(1, { Notes: 'Updated' });

      expect(mockUpdateContactLog).toHaveBeenCalledWith(
        1,
        expect.not.objectContaining({ Contact_ID: expect.anything() })
      );
    });

    it('F4: a crafted payload carrying Made_By and Contact_ID still gates first', async () => {
      // The gate runs before anything is forwarded, and ContactLogService
      // strips both keys; see contactLogService.test.ts for the assertion that
      // neither reaches updateTableRecords.
      mockRequireSecurityRole.mockRejectedValueOnce(
        new UnauthorizedError('Not authorized: an MP security role is required')
      );

      await expect(
        updateContactLog(1, {
          Notes: 'Updated',
          Made_By: 999,
          Contact_ID: 999,
        } as never)
      ).rejects.toThrow('Not authorized: an MP security role is required');

      expect(mockUpdateContactLog).not.toHaveBeenCalled();
    });

    it('should not write when the caller holds no security role', async () => {
      mockRequireSecurityRole.mockRejectedValueOnce(
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
      mockUpdateContactLog.mockResolvedValueOnce({ Contact_Log_ID: 7, Made_By: 12345 });

      await expect(updateContactLog(7, { Notes: 'Corrected typo' })).resolves.toEqual({
        Contact_Log_ID: 7,
        Made_By: 12345,
      });
      // No read of the target log is performed to compare Made_By.
      expect(mockGetContactLogById).not.toHaveBeenCalled();
    });

    it('should wrap a non-Error rejection from the service', async () => {
      mockUpdateContactLog.mockRejectedValueOnce('boom');

      await expect(updateContactLog(1, { Notes: 'x' })).rejects.toThrow(
        'Failed to update contact log'
      );
    });
  });

  describe('deleteContactLog', () => {
    it('refuses a session with no Ministry Platform user', async () => {
      mockRequireSecurityRole.mockRejectedValueOnce(noMpUser());

      await expect(deleteContactLog(1)).rejects.toThrow(
        /no Ministry Platform user is attached/
      );
      expect(mockDeleteContactLog).not.toHaveBeenCalled();
    });

    it('should throw for invalid contactLogId', async () => {
      await expect(deleteContactLog(0)).rejects.toThrow('Invalid Contact Log ID');
      expect(mockDeleteContactLog).not.toHaveBeenCalled();
    });

    it('should delete after the security-role gate passes', async () => {
      mockDeleteContactLog.mockResolvedValueOnce(undefined);

      await deleteContactLog(42);

      expect(mockRequireSecurityRole).toHaveBeenCalledWith({
        table: 'Contact_Log',
        operation: 'delete',
      });
      expect(mockDeleteContactLog).toHaveBeenCalledWith(42);
    });

    it('should NOT delete when the caller holds no security role', async () => {
      // This is the sharpest edge the gate closes: previously any authenticated
      // session could delete any contact log in the domain by ID.
      mockRequireSecurityRole.mockRejectedValueOnce(
        new UnauthorizedError('Not authorized: an MP security role is required')
      );

      await expect(deleteContactLog(42)).rejects.toThrow(
        'Not authorized: an MP security role is required'
      );
      expect(mockDeleteContactLog).not.toHaveBeenCalled();
    });

    it('should permit deleting a log made by a different user', async () => {
      // POLICY: ownership is not a factor — see updateContactLog above.
      mockDeleteContactLog.mockResolvedValueOnce(undefined);

      await deleteContactLog(7);

      expect(mockDeleteContactLog).toHaveBeenCalledWith(7);
      expect(mockGetContactLogById).not.toHaveBeenCalled();
    });

    it('should wrap a non-Error rejection from the service', async () => {
      mockDeleteContactLog.mockRejectedValueOnce('boom');

      await expect(deleteContactLog(42)).rejects.toThrow('Failed to delete contact log');
    });
  });

  describe('Authorization guards', () => {
    it('refuses every write for a session with no MP user behind it', async () => {
      mockRequireSecurityRole.mockRejectedValue(noMpUser());

      await expect(createContactLog(validCreateInput)).rejects.toThrow(UnauthorizedError);
      await expect(updateContactLog(1, { Notes: 'x' })).rejects.toThrow(UnauthorizedError);
      await expect(deleteContactLog(1)).rejects.toThrow(UnauthorizedError);

      expect(mockCreateContactLog).not.toHaveBeenCalled();
      expect(mockUpdateContactLog).not.toHaveBeenCalled();
      expect(mockDeleteContactLog).not.toHaveBeenCalled();
    });

    it('refuses every read for a session with no MP user behind it', async () => {
      // F1: this used to succeed for any session at all.
      mockRequireSecurityRole.mockRejectedValue(noMpUser());

      await expect(getContactLogTypes()).rejects.toThrow(UnauthorizedError);

      expect(mockGetContactLogTypes).not.toHaveBeenCalled();
    });

    it('exports only the actions the contact-log UI calls', () => {
      // Every export of a "use server" file is a callable POST endpoint. The
      // unused getContactLogsByContactId / getContactLogById reads were removed
      // (2026-09-28); this keeps them, or any other unused endpoint, from
      // quietly coming back.
      expect(Object.keys(actions).sort()).toEqual([
        'createContactLog',
        'deleteContactLog',
        'getContactLogTypes',
        'updateContactLog',
      ]);
    });

    it('every exported action calls the gate — none is reachable on a session alone', async () => {
      // Guards against a new action (or a restored one) shipping ungated.
      mockGetContactLogTypes.mockResolvedValue([]);
      mockCreateContactLog.mockResolvedValue({ Contact_Log_ID: 1 });
      mockUpdateContactLog.mockResolvedValue({ Contact_Log_ID: 1 });
      mockDeleteContactLog.mockResolvedValue(undefined);

      await getContactLogTypes();
      await createContactLog(validCreateInput);
      await updateContactLog(1, { Notes: 'x' });
      await deleteContactLog(1);

      expect(mockRequireSecurityRole.mock.calls.map((c) => c[0])).toEqual([
        { table: 'Contact_Log', operation: 'read' },
        { table: 'Contact_Log', operation: 'create' },
        { table: 'Contact_Log', operation: 'update' },
        { table: 'Contact_Log', operation: 'delete' },
      ]);
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

    it.each(injectionPayloads)('updateContactLog rejects %j before the service', async (payload) => {
      await expect(
        updateContactLog(payload as unknown as number, { Notes: 'x' })
      ).rejects.toThrow('Invalid Contact Log ID');
      expect(mockUpdateContactLog).not.toHaveBeenCalled();
    });

    it.each(injectionPayloads)('deleteContactLog rejects %j before the service', async (payload) => {
      await expect(deleteContactLog(payload as unknown as number)).rejects.toThrow(
        'Invalid Contact Log ID'
      );
      expect(mockDeleteContactLog).not.toHaveBeenCalled();
    });

    it('refuses an unauthorized caller before it even validates the ID', async () => {
      // Authorization runs before argument parsing, so a caller with no role
      // gets one answer — "not authorized" — and learns nothing about which
      // IDs the endpoint would have accepted.
      mockRequireSecurityRole.mockRejectedValueOnce(noMpUser());

      await expect(deleteContactLog('1 OR 1=1' as unknown as number)).rejects.toThrow(
        /no Ministry Platform user is attached/
      );
    });

    it('passes a digits-only ID through to the service as a number', async () => {
      mockDeleteContactLog.mockResolvedValueOnce(undefined);

      await deleteContactLog('42' as unknown as number);

      expect(mockDeleteContactLog).toHaveBeenCalledWith(42);
    });
  });

  describe('Logging safety (F5)', () => {
    // Pastoral notes and record content must never reach info-level logs, and
    // an error log must never echo them either. See
    // .claude/references/auth.md § Logging policy.
    let logSpy: ReturnType<typeof vi.fn>;
    let errorSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    const sensitiveNotes = 'Confidential: disclosed a personal crisis in confidence';

    it('should not log Notes when creating a contact log succeeds', async () => {
      mockCreateContactLog.mockResolvedValueOnce({ Contact_Log_ID: 1 });

      await createContactLog({ ...validCreateInput, Notes: sensitiveNotes });

      expect(logSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should not log Notes when creating a contact log fails', async () => {
      mockCreateContactLog.mockRejectedValueOnce(new Error('MP write failed'));

      await expect(
        createContactLog({ ...validCreateInput, Notes: sensitiveNotes })
      ).rejects.toThrow('MP write failed');

      expect(logSpy).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledTimes(1);
      const loggedArgs = errorSpy.mock.calls[0].map(String).join(' ');
      expect(loggedArgs).not.toContain(sensitiveNotes);
    });

    it('should not log Notes when updating a contact log fails', async () => {
      mockUpdateContactLog.mockRejectedValueOnce(new Error('MP write failed'));

      await expect(
        updateContactLog(1, { Notes: sensitiveNotes })
      ).rejects.toThrow('MP write failed');

      expect(logSpy).not.toHaveBeenCalled();
      const loggedArgs = errorSpy.mock.calls
        .map((args: unknown[]) => args.map(String).join(' '))
        .join(' ');
      expect(loggedArgs).not.toContain(sensitiveNotes);
    });

    it('should not log anything when deleting a contact log succeeds', async () => {
      mockDeleteContactLog.mockResolvedValueOnce(undefined);

      await deleteContactLog(1);

      expect(logSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });

  // 2026-09-28 review (log injection). A role-holder could send a
  // `Contact_Date` containing a newline and a fake JSON event; the service used
  // to echo it into the error message and this file logged that verbatim, so
  // it landed as a separate, forged structured log line.
  describe('Structured failure logging', () => {
    let errorSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    const forged =
      'x\n{"event":"mp.write.unauthorized","userId":1,"reason":"forged"}';

    it.each([
      ['getContactLogTypes', () => { mockGetContactLogTypes.mockRejectedValueOnce(new Error(forged)); return getContactLogTypes(); }],
      ['createContactLog', () => { mockCreateContactLog.mockRejectedValueOnce(new Error(forged)); return createContactLog(validCreateInput); }],
      ['updateContactLog', () => { mockUpdateContactLog.mockRejectedValueOnce(new Error(forged)); return updateContactLog(1, { Notes: 'x' }); }],
      ['deleteContactLog', () => { mockDeleteContactLog.mockRejectedValueOnce(new Error(forged)); return deleteContactLog(1); }],
    ])('%s logs one single-line JSON event, whatever the error says', async (action, run) => {
      await expect(run()).rejects.toThrow();

      expect(errorSpy).toHaveBeenCalledTimes(1);
      const args = errorSpy.mock.calls[0];
      expect(args).toHaveLength(1);
      const line = args[0] as string;
      expect(line).not.toContain('\n');
      expect(JSON.parse(line)).toEqual({
        event: 'contact_log.action_failed',
        action,
        error: { name: 'Error', message: forged },
      });
    });

    it('logs only the type of a non-Error rejection', async () => {
      mockCreateContactLog.mockRejectedValueOnce('boom\n{"event":"x"}');

      await expect(createContactLog(validCreateInput)).rejects.toThrow(
        'Failed to create contact log'
      );

      expect(JSON.parse(errorSpy.mock.calls[0][0] as string)).toEqual({
        event: 'contact_log.action_failed',
        action: 'createContactLog',
        error: { name: 'string' },
      });
    });
  });
});

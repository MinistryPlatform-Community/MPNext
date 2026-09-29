import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockGetTableRecords,
  mockCreateTableRecords,
  mockUpdateTableRecords,
  mockDeleteTableRecords,
  mockGetDomainInfo,
  mockRequireSecurityRole,
} = vi.hoisted(() => ({
  mockGetTableRecords: vi.fn(),
  mockCreateTableRecords: vi.fn(),
  mockUpdateTableRecords: vi.fn(),
  mockDeleteTableRecords: vi.fn(),
  mockGetDomainInfo: vi.fn(),
  mockRequireSecurityRole: vi.fn(),
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

import {
  ContactLogService,
  CONTACT_LOGS_PER_CONTACT_LIMIT,
} from '@/services/contactLogService';
import { DomainTimezoneService } from '@/services/domainTimezoneService';
import { UnauthorizedError } from '@/services/authorizationService';

const KNOWN_LOG_TYPES = [
  { Contact_Log_Type_ID: 1, Contact_Log_Type: 'Email', Description: null },
  { Contact_Log_Type_ID: 2, Contact_Log_Type: 'Phone', Description: null },
];

describe('ContactLogService', () => {
  beforeEach(() => {
    mockGetTableRecords.mockReset();
    mockCreateTableRecords.mockReset();
    mockUpdateTableRecords.mockReset();
    mockDeleteTableRecords.mockReset();
    mockGetDomainInfo.mockReset();
    mockRequireSecurityRole.mockReset();
    // Default: an authorized role-holder with MP User_ID 500.
    mockRequireSecurityRole.mockResolvedValue(500);
    // Default lookup: the log types a write's Contact_Log_Type_ID is checked
    // against. Tests that care about a specific read queue their own result
    // with mockResolvedValueOnce, which takes precedence.
    mockGetTableRecords.mockImplementation(async ({ table }: { table: string }) =>
      table === 'Contact_Log_Types' ? KNOWN_LOG_TYPES : [],
    );
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

    it('caps the read with an explicit $top', async () => {
      const service = await ContactLogService.getInstance();
      await service.getContactLogsByContactId(42);

      expect(CONTACT_LOGS_PER_CONTACT_LIMIT).toBe(500);
      expect(mockGetTableRecords).toHaveBeenCalledWith(
        expect.objectContaining({ top: CONTACT_LOGS_PER_CONTACT_LIMIT })
      );
    });
  });

  /**
   * F1 (2026-09-12). These reads used to be gated on nothing but an
   * authenticated session, at the action layer only. Contact logs are pastoral
   * records and MP data comes back through this app's client-credentials
   * service account, so the service re-checks: a caller that bypasses the
   * actions must still be refused.
   */
  describe('read authorization', () => {
    it.each([
      ['getContactLogTypes', 'Contact_Log_Types', (s: ContactLogService) => s.getContactLogTypes()],
      ['getContactLogById', 'Contact_Log', (s: ContactLogService) => s.getContactLogById(1)],
      [
        'getContactLogsByContactId',
        'Contact_Log',
        (s: ContactLogService) => s.getContactLogsByContactId(42),
      ],
    ])('%s gates on a security role for a read of %s', async (_name, table, call) => {
      mockGetTableRecords.mockResolvedValueOnce([]);

      const service = await ContactLogService.getInstance();
      await call(service);

      expect(mockRequireSecurityRole).toHaveBeenCalledWith({ table, operation: 'read' });
    });

    it.each([
      ['getContactLogTypes', (s: ContactLogService) => s.getContactLogTypes()],
      ['getContactLogById', (s: ContactLogService) => s.getContactLogById(1)],
      [
        'getContactLogsByContactId',
        (s: ContactLogService) => s.getContactLogsByContactId(42),
      ],
    ])('%s reads nothing when the caller holds no security role', async (_name, call) => {
      mockRequireSecurityRole.mockRejectedValueOnce(
        new UnauthorizedError('Not authorized: an MP security role is required'),
      );

      const service = await ContactLogService.getInstance();
      await expect(call(service)).rejects.toThrow(UnauthorizedError);
      expect(mockGetTableRecords).not.toHaveBeenCalled();
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
        Notes: 'Test note',
      });

      expect(mockCreateTableRecords).toHaveBeenCalledWith(
        'Contact_Log',
        [
          expect.objectContaining({
            Contact_ID: 42,
            Contact_Date: '2026-05-17 00:00:00',
            Notes: 'Test note',
            // Server-stamped from the authorization gate, not the caller (F4).
            Made_By: 500,
          }),
        ],
        { $userId: 500 },
      );
      expect(mockRequireSecurityRole).toHaveBeenCalledWith({
        table: 'Contact_Log',
        operation: 'create',
      });
      expect(result).toEqual(mockCreated);
    });

    it('does NOT create when the gate refuses (no MP user or no security role)', async () => {
      mockRequireSecurityRole.mockRejectedValueOnce(
        new UnauthorizedError('Not authorized: an MP security role is required'),
      );

      const service = await ContactLogService.getInstance();
      await expect(
        service.createContactLog({
          Contact_ID: 42,
          Contact_Date: '2026-05-17',
          Contact_Log_Type_ID: 1,
          Notes: 'Test note',
        }),
      ).rejects.toThrow(UnauthorizedError);

      expect(mockCreateTableRecords).not.toHaveBeenCalled();
    });

    it('stamps $userId with the User_ID the gate returned', async () => {
      mockRequireSecurityRole.mockResolvedValueOnce(4242);
      mockCreateTableRecords.mockResolvedValueOnce([{ Contact_Log_ID: 1 }]);

      const service = await ContactLogService.getInstance();
      await service.createContactLog({
        Contact_ID: 42,
        Contact_Date: '2026-05-17',
        Contact_Log_Type_ID: 1,
        Notes: 'Test note',
      });

      expect(mockCreateTableRecords).toHaveBeenCalledWith(
        'Contact_Log',
        expect.any(Array),
        { $userId: 4242 },
      );
    });

    it('converts a UTC-tagged Contact_Date into MP-TZ wall-clock', async () => {
      mockCreateTableRecords.mockResolvedValueOnce([{ Contact_Log_ID: 1 }]);

      const service = await ContactLogService.getInstance();
      // 2026-05-17T03:33:00Z = 2026-05-16 23:33:00 in America/New_York (EDT, UTC-4)
      await service.createContactLog({
        Contact_ID: 42,
        Contact_Date: '2026-05-17T03:33:00.000Z',
        Contact_Log_Type_ID: 1,
        Notes: 'Test',
      });

      expect(mockCreateTableRecords).toHaveBeenCalledWith(
        'Contact_Log',
        [expect.objectContaining({ Contact_Date: '2026-05-16 23:33:00' })],
        { $userId: 500 },
      );
    });

    it('throws when API returns empty result', async () => {
      mockCreateTableRecords.mockResolvedValueOnce([]);

      const service = await ContactLogService.getInstance();
      await expect(
        service.createContactLog({
          Contact_ID: 42,
          Contact_Date: '2026-05-17',
          Contact_Log_Type_ID: 1,
          Notes: 'Test',
        })
      ).rejects.toThrow('Failed to create contact log record');
    });

    // --- F4: Made_By and Contact_ID are server-authoritative ---------------
    //
    // A server action is a POST endpoint whose payload shape the caller
    // controls; TypeScript is erased at runtime, so these drive the service
    // with the shapes a crafted request could actually send.

    it('F4: ignores a caller-supplied Made_By and stamps the gate User_ID', async () => {
      mockRequireSecurityRole.mockResolvedValueOnce(4242);
      mockCreateTableRecords.mockResolvedValueOnce([{ Contact_Log_ID: 1 }]);

      const service = await ContactLogService.getInstance();
      await service.createContactLog({
        Contact_ID: 42,
        Contact_Date: '2026-05-17',
        Contact_Log_Type_ID: 1,
        Made_By: 999,
        Notes: 'Test note',
      } as never);

      const [, records] = mockCreateTableRecords.mock.calls[0];
      expect(records[0].Made_By).toBe(4242);
      expect(records[0].Made_By).not.toBe(999);
    });

    it('F4: rejects a non-positive Contact_ID instead of writing it', async () => {
      const service = await ContactLogService.getInstance();

      await expect(
        service.createContactLog({
          Contact_ID: 0,
          Contact_Date: '2026-05-17',
          Contact_Log_Type_ID: 1,
          Notes: 'Test note',
        } as never),
      ).rejects.toThrow();

      expect(mockCreateTableRecords).not.toHaveBeenCalled();
    });

    // 2026-09-28 review: after Zod validation against the full ContactLogSchema
    // these caller-chosen links and flags reached MP unchanged, so a
    // role-holder could point a log at any other contact's log or feedback.
    it('sends only the allowlisted fields — smuggled links and flags are dropped', async () => {
      mockCreateTableRecords.mockResolvedValueOnce([{ Contact_Log_ID: 1 }]);

      const service = await ContactLogService.getInstance();
      await service.createContactLog({
        Contact_ID: 42,
        Contact_Date: '2026-05-17',
        Contact_Log_Type_ID: 1,
        Notes: 'Test note',
        Planned_Contact_ID: 77,
        Contact_Successful: true,
        Original_Contact_Log_Entry: 12345,
        Feedback_Entry_ID: 67890,
        Contact_Log_ID: 999,
      } as never);

      const [, records] = mockCreateTableRecords.mock.calls[0];
      expect(records).toEqual([
        {
          Contact_ID: 42,
          Contact_Log_Type_ID: 1,
          Notes: 'Test note',
          Contact_Date: '2026-05-17 00:00:00',
          Made_By: 500,
        },
      ]);
    });

    it('accepts a create with no log type and does no type lookup', async () => {
      mockCreateTableRecords.mockResolvedValueOnce([{ Contact_Log_ID: 1 }]);

      const service = await ContactLogService.getInstance();
      await service.createContactLog({
        Contact_ID: 42,
        Contact_Date: '2026-05-17',
        Notes: 'Test note',
      });

      expect(mockGetTableRecords).not.toHaveBeenCalled();
      const [, records] = mockCreateTableRecords.mock.calls[0];
      expect(records[0]).not.toHaveProperty('Contact_Log_Type_ID');
    });

    it('validates the log type against Contact_Log_Types without a second gate call', async () => {
      mockCreateTableRecords.mockResolvedValueOnce([{ Contact_Log_ID: 1 }]);

      const service = await ContactLogService.getInstance();
      await service.createContactLog({
        Contact_ID: 42,
        Contact_Date: '2026-05-17',
        Contact_Log_Type_ID: 2,
        Notes: 'Test note',
      });

      expect(mockGetTableRecords).toHaveBeenCalledWith(
        expect.objectContaining({ table: 'Contact_Log_Types' })
      );
      // The create gate already covers this read.
      expect(mockRequireSecurityRole).toHaveBeenCalledTimes(1);
    });

    it.each([-7, 0, 3, 999])(
      'rejects Contact_Log_Type_ID %s when it is not a known log type',
      async (typeId) => {
        const service = await ContactLogService.getInstance();
        await expect(
          service.createContactLog({
            Contact_ID: 42,
            Contact_Date: '2026-05-17',
            Contact_Log_Type_ID: typeId,
            Notes: 'Test note',
          }),
        ).rejects.toThrow('Invalid Contact Log Type ID');
        expect(mockCreateTableRecords).not.toHaveBeenCalled();
      },
    );

    it('rejects invalid non-date fields via Zod validation', async () => {
      const service = await ContactLogService.getInstance();

      await expect(
        service.createContactLog({
          Contact_ID: 42,
          Contact_Date: '2026-05-17',
          Contact_Log_Type_ID: null,
          // Notes must be a string
          Notes: 12345,
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

      expect(mockUpdateTableRecords).toHaveBeenCalledWith(
        'Contact_Log',
        [
          expect.objectContaining({
            Contact_Log_ID: 1,
            Notes: 'Updated note',
          }),
        ],
        { $userId: 500 },
      );
      expect(mockRequireSecurityRole).toHaveBeenCalledWith({
        table: 'Contact_Log',
        operation: 'update',
      });
      expect(result).toEqual(mockUpdated);
    });

    it('converts a date-only Contact_Date to MP-TZ midnight on update', async () => {
      mockUpdateTableRecords.mockResolvedValueOnce([{ Contact_Log_ID: 1 }]);

      const service = await ContactLogService.getInstance();
      await service.updateContactLog(1, { Contact_Date: '2026-05-17' });

      expect(mockUpdateTableRecords).toHaveBeenCalledWith(
        'Contact_Log',
        [
          expect.objectContaining({
            Contact_Log_ID: 1,
            Contact_Date: '2026-05-17 00:00:00',
          }),
        ],
        { $userId: 500 },
      );
    });

    it('does NOT update when the gate refuses (no MP user or no security role)', async () => {
      mockRequireSecurityRole.mockRejectedValueOnce(
        new UnauthorizedError('Not authorized: an MP security role is required'),
      );

      const service = await ContactLogService.getInstance();
      await expect(
        service.updateContactLog(1, { Notes: 'Anon update' }),
      ).rejects.toThrow(UnauthorizedError);

      expect(mockUpdateTableRecords).not.toHaveBeenCalled();
    });

    it('stamps $userId with the User_ID the gate returned', async () => {
      mockRequireSecurityRole.mockResolvedValueOnce(4242);
      mockUpdateTableRecords.mockResolvedValueOnce([{ Contact_Log_ID: 1 }]);

      const service = await ContactLogService.getInstance();
      await service.updateContactLog(1, { Notes: 'Updated note' });

      expect(mockUpdateTableRecords).toHaveBeenCalledWith(
        'Contact_Log',
        expect.any(Array),
        { $userId: 4242 },
      );
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
        expect(call[2]).toEqual({ $userId: 500 });
      }
    });

    // --- F4: Made_By and Contact_ID are server-authoritative ---------------

    it('F4: strips a caller-supplied Made_By and sends none at all', async () => {
      mockRequireSecurityRole.mockResolvedValueOnce(4242);
      mockUpdateTableRecords.mockResolvedValueOnce([{ Contact_Log_ID: 1 }]);

      const service = await ContactLogService.getInstance();
      await service.updateContactLog(1, {
        Notes: 'Updated note',
        Made_By: 999,
      } as never);

      const [, records, options] = mockUpdateTableRecords.mock.calls[0];
      expect(records[0]).not.toHaveProperty('Made_By');
      // Who edited it still reaches MP's audit log.
      expect(options).toEqual({ $userId: 4242 });
    });

    it('F4: never sends Contact_ID, so a log cannot be re-parented', async () => {
      mockUpdateTableRecords.mockResolvedValueOnce([{ Contact_Log_ID: 1 }]);

      const service = await ContactLogService.getInstance();
      await service.updateContactLog(1, {
        Notes: 'Updated note',
        Contact_ID: 999,
      } as never);

      const [, records] = mockUpdateTableRecords.mock.calls[0];
      expect(records[0]).not.toHaveProperty('Contact_ID');
    });

    // 2026-09-28 review: stamping the editor into Made_By on every edit let
    // any role-holder's trivial change erase who wrote the pastoral note. The
    // PUT now omits it, so MP keeps the original author.
    it('does not overwrite the original author on an ordinary edit', async () => {
      mockUpdateTableRecords.mockResolvedValueOnce([{ Contact_Log_ID: 1 }]);

      const service = await ContactLogService.getInstance();
      await service.updateContactLog(1, { Notes: 'Updated note' });

      const [, records, options] = mockUpdateTableRecords.mock.calls[0];
      expect(records[0]).toEqual({ Notes: 'Updated note', Contact_Log_ID: 1 });
      expect(options).toEqual({ $userId: 500 });
    });

    it('sends only the allowlisted fields plus Contact_Log_ID', async () => {
      mockUpdateTableRecords.mockResolvedValueOnce([{ Contact_Log_ID: 1 }]);

      const service = await ContactLogService.getInstance();
      await service.updateContactLog(1, {
        Contact_Date: '2026-05-17',
        Contact_Log_Type_ID: 2,
        Notes: 'Updated note',
        Planned_Contact_ID: 77,
        Contact_Successful: true,
        Original_Contact_Log_Entry: 12345,
        Feedback_Entry_ID: 67890,
        Contact_Log_ID: 999,
      } as never);

      const [, records] = mockUpdateTableRecords.mock.calls[0];
      expect(records[0]).toEqual({
        Contact_Log_Type_ID: 2,
        Notes: 'Updated note',
        Contact_Date: '2026-05-17 00:00:00',
        Contact_Log_ID: 1,
      });
    });

    it('allows clearing the log type with null without a lookup', async () => {
      mockUpdateTableRecords.mockResolvedValueOnce([{ Contact_Log_ID: 1 }]);

      const service = await ContactLogService.getInstance();
      await service.updateContactLog(1, { Contact_Log_Type_ID: null });

      const [, records] = mockUpdateTableRecords.mock.calls[0];
      expect(records[0]).toEqual({ Contact_Log_Type_ID: null, Contact_Log_ID: 1 });
      expect(mockGetTableRecords).not.toHaveBeenCalled();
    });

    it.each([-7, 0, 999])(
      'rejects Contact_Log_Type_ID %s when it is not a known log type',
      async (typeId) => {
        const service = await ContactLogService.getInstance();
        await expect(
          service.updateContactLog(1, { Contact_Log_Type_ID: typeId }),
        ).rejects.toThrow('Invalid Contact Log Type ID');
        expect(mockUpdateTableRecords).not.toHaveBeenCalled();
      },
    );

    it.each(['5 OR 1=1', [1], 0, -1, '1e3'])(
      'rejects a non-ID contactLogId (%j) before any MP call',
      async (bad) => {
        const service = await ContactLogService.getInstance();
        await expect(
          service.updateContactLog(bad as never, { Notes: 'x' }),
        ).rejects.toThrow('Invalid Contact Log ID');
        expect(mockUpdateTableRecords).not.toHaveBeenCalled();
      },
    );

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

      expect(mockDeleteTableRecords).toHaveBeenCalledWith(
        'Contact_Log',
        [42],
        { $userId: 500 },
      );
      expect(mockRequireSecurityRole).toHaveBeenCalledWith({
        table: 'Contact_Log',
        operation: 'delete',
      });
    });

    it('does NOT delete when the gate refuses (no MP user or no security role)', async () => {
      mockRequireSecurityRole.mockRejectedValueOnce(
        new UnauthorizedError('Not authorized: an MP security role is required'),
      );

      const service = await ContactLogService.getInstance();
      await expect(service.deleteContactLog(42)).rejects.toThrow(UnauthorizedError);

      expect(mockDeleteTableRecords).not.toHaveBeenCalled();
    });

    it('should propagate delete errors', async () => {
      mockDeleteTableRecords.mockRejectedValueOnce(new Error('Record not found'));

      const service = await ContactLogService.getInstance();
      await expect(service.deleteContactLog(999)).rejects.toThrow('Record not found');
    });

    it.each(['5 OR 1=1', [1, 2], 0, -1, 1.5, '1e3'])(
      'rejects a non-ID contactLogId (%j) before any MP call',
      async (bad) => {
        const service = await ContactLogService.getInstance();
        await expect(service.deleteContactLog(bad as never)).rejects.toThrow(
          'Invalid Contact Log ID',
        );
        expect(mockDeleteTableRecords).not.toHaveBeenCalled();
      },
    );

    it('passes a digits-only string ID to MP as a number', async () => {
      mockDeleteTableRecords.mockResolvedValueOnce(undefined);

      const service = await ContactLogService.getInstance();
      await service.deleteContactLog('42' as never);

      expect(mockDeleteTableRecords).toHaveBeenCalledWith('Contact_Log', [42], { $userId: 500 });
    });
  });

  // Regression guard for the numeric-ID `$filter` injection fix.
  //
  // Every method here declares `number`, but that annotation is erased at
  // runtime and server actions compile to POST endpoints whose payload shape the
  // caller controls — so a string does reach these methods. Before the fix,
  // `getContactLogById('1 OR 1=1')` built the filter `Contact_Log_ID = 1 OR 1=1`
  // and widened a single-record read into a full-table read. Asserting the filter
  // string and that no request is issued is what statement coverage could not see:
  // this file was at 100% while the defect was live.
  describe('filter injection via numeric IDs', () => {
    const injectionPayloads = [
      '1 OR 1=1',
      '5; DROP',
      "1' OR '1'='1",
      '1 UNION SELECT Password FROM dp_Users',
      '1 --',
      '1.5',
      '-1',
      '  7  ',
      '',
      'abc',
    ];

    it.each(injectionPayloads)('getContactLogById rejects %j without calling MP', async (payload) => {
      const service = await ContactLogService.getInstance();

      await expect(
        service.getContactLogById(payload as unknown as number)
      ).rejects.toThrow('Invalid Contact Log ID');
      expect(mockGetTableRecords).not.toHaveBeenCalled();
    });

    it.each(injectionPayloads)('getContactLogsByContactId rejects %j without calling MP', async (payload) => {
      const service = await ContactLogService.getInstance();

      await expect(
        service.getContactLogsByContactId(payload as unknown as number)
      ).rejects.toThrow('Invalid Contact ID');
      expect(mockGetTableRecords).not.toHaveBeenCalled();
    });

    it('interpolates a digits-only string as a bare number', async () => {
      mockGetTableRecords.mockResolvedValueOnce([]);

      const service = await ContactLogService.getInstance();
      await service.getContactLogById('42' as unknown as number);

      expect(mockGetTableRecords).toHaveBeenCalledWith(
        expect.objectContaining({ filter: 'Contact_Log_ID = 42' })
      );
    });
  });

  describe('Logging safety (F5)', () => {
    // Pastoral notes must never reach info-level logs. See
    // .claude/references/auth.md § Logging policy.
    let logSpy: ReturnType<typeof vi.fn>;
    let errorSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    const sensitiveNotes = 'Confidential: disclosed a personal crisis in confidence';

    it('should not log Notes when creating a contact log', async () => {
      mockCreateTableRecords.mockResolvedValueOnce([{ Contact_Log_ID: 1, Contact_ID: 42 }]);

      const service = await ContactLogService.getInstance();
      await service.createContactLog({
        Contact_ID: 42,
        Contact_Date: '2026-05-17',
        Contact_Log_Type_ID: 1,
        Notes: sensitiveNotes,
      });

      expect(logSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should not log Notes when updating a contact log, even on failure', async () => {
      mockUpdateTableRecords.mockRejectedValueOnce(new Error('Record not found'));

      const service = await ContactLogService.getInstance();
      await expect(
        service.updateContactLog(1, { Notes: sensitiveNotes })
      ).rejects.toThrow('Record not found');

      expect(logSpy).not.toHaveBeenCalled();
      // This method has no catch block of its own (the error propagates to the
      // action layer), so nothing here should log at all.
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should not log anything when deleting a contact log', async () => {
      mockDeleteTableRecords.mockResolvedValueOnce(undefined);

      const service = await ContactLogService.getInstance();
      await service.deleteContactLog(42);

      expect(logSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });
});

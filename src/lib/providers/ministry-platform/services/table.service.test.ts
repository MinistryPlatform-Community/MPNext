import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TableService } from '@/lib/providers/ministry-platform/services/table.service';
import type { MinistryPlatformClient } from '@/lib/providers/ministry-platform/client';
import type { HttpClient } from '@/lib/providers/ministry-platform/utils/http-client';

/**
 * TableService Tests
 *
 * Tests for the TableService that handles CRUD operations on Ministry Platform tables.
 * Tests cover:
 * - Getting table records with various query parameters
 * - Creating new records
 * - Updating existing records
 * - Deleting records
 * - Error handling for all operations
 */

describe('TableService', () => {
  let tableService: TableService;
  let mockClient: MinistryPlatformClient;
  let mockHttpClient: HttpClient;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock HTTP client methods
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      buildUrl: vi.fn(),
      postFormData: vi.fn(),
      putFormData: vi.fn(),
    } as unknown as HttpClient;

    // Create mock MinistryPlatformClient
    mockClient = {
      ensureValidToken: vi.fn().mockResolvedValue(undefined),
      getHttpClient: vi.fn().mockReturnValue(mockHttpClient),
    } as unknown as MinistryPlatformClient;

    tableService = new TableService(mockClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getTableRecords', () => {
    it('should fetch records from table', async () => {
      const mockRecords = [
        { Contact_ID: 1, Display_Name: 'John Doe' },
        { Contact_ID: 2, Display_Name: 'Jane Doe' },
      ];

      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockRecords);

      const result = await tableService.getTableRecords('Contacts');

      expect(mockClient.ensureValidToken).toHaveBeenCalledTimes(1);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/tables/Contacts', undefined);
      expect(result).toEqual(mockRecords);
    });

    it('should pass query parameters to HTTP client', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      const params = {
        $select: 'Contact_ID,Display_Name',
        $filter: 'Active=1',
        $top: 10,
        $skip: 20,
        $orderby: 'Last_Name',
      };

      await tableService.getTableRecords('Contacts', params);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/tables/Contacts', params);
    });

    it('should URL-encode table name with special characters', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      await tableService.getTableRecords('Contact_Log');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/tables/Contact_Log', undefined);
    });

    it('should handle empty result set', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      const result = await tableService.getTableRecords('Contacts', {
        $filter: 'Contact_ID = -1',
      });

      expect(result).toEqual([]);
    });

    it('should throw error when table does not exist', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('GET /tables/NonExistent failed: 404 Not Found')
      );

      await expect(tableService.getTableRecords('NonExistent')).rejects.toThrow(
        '404 Not Found'
      );
    });

    it('should throw error on authentication failure', async () => {
      (mockClient.ensureValidToken as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Token refresh failed')
      );

      await expect(tableService.getTableRecords('Contacts')).rejects.toThrow(
        'Token refresh failed'
      );
    });

    it('should return typed records', async () => {
      interface Contact {
        Contact_ID: number;
        Display_Name: string;
        Email_Address: string;
      }

      const mockContacts: Contact[] = [
        { Contact_ID: 1, Display_Name: 'Test', Email_Address: 'test@example.com' },
      ];

      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockContacts);

      const result = await tableService.getTableRecords<Contact>('Contacts');

      expect(result[0].Contact_ID).toBe(1);
      expect(result[0].Email_Address).toBe('test@example.com');
    });
  });

  describe('createTableRecords', () => {
    it('should create records in table', async () => {
      const newRecords = [
        { First_Name: 'John', Last_Name: 'Doe' },
        { First_Name: 'Jane', Last_Name: 'Doe' },
      ];

      const createdRecords = [
        { Contact_ID: 1, ...newRecords[0] },
        { Contact_ID: 2, ...newRecords[1] },
      ];

      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce(createdRecords);

      const result = await tableService.createTableRecords('Contacts', newRecords);

      expect(mockClient.ensureValidToken).toHaveBeenCalledTimes(1);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/tables/Contacts',
        newRecords,
        undefined
      );
      expect(result).toEqual(createdRecords);
    });

    it('should pass $select and $userId parameters', async () => {
      const newRecords = [{ First_Name: 'Test' }];

      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
        { Contact_ID: 1, First_Name: 'Test' },
      ]);

      await tableService.createTableRecords('Contacts', newRecords, {
        $select: 'Contact_ID,First_Name',
        $userId: 123,
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/tables/Contacts',
        newRecords,
        { $select: 'Contact_ID,First_Name', $userId: 123 }
      );
    });

    it('should throw error on validation failure', async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('POST /tables/Contacts failed: 400 Bad Request')
      );

      await expect(
        tableService.createTableRecords('Contacts', [{ Invalid: 'data' }])
      ).rejects.toThrow('400 Bad Request');
    });

    it('should throw error on duplicate key violation', async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('POST /tables/Contacts failed: 409 Conflict')
      );

      await expect(
        tableService.createTableRecords('Contacts', [{ Contact_ID: 1 }])
      ).rejects.toThrow('409 Conflict');
    });
  });

  describe('updateTableRecords', () => {
    it('should update records in table', async () => {
      const records = [
        { Contact_ID: 1, First_Name: 'Updated' },
      ];

      (mockHttpClient.put as ReturnType<typeof vi.fn>).mockResolvedValueOnce(records);

      const result = await tableService.updateTableRecords('Contacts', records);

      expect(mockClient.ensureValidToken).toHaveBeenCalledTimes(1);
      expect(mockHttpClient.put).toHaveBeenCalledWith(
        '/tables/Contacts',
        records,
        undefined
      );
      expect(result).toEqual(records);
    });

    it('should pass $allowCreate parameter for upsert', async () => {
      const records = [{ Contact_ID: 1, First_Name: 'Upsert' }];

      (mockHttpClient.put as ReturnType<typeof vi.fn>).mockResolvedValueOnce(records);

      await tableService.updateTableRecords('Contacts', records, {
        $allowCreate: true,
        $userId: 1,
      });

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        '/tables/Contacts',
        records,
        { $allowCreate: true, $userId: 1 }
      );
    });

    it('should throw error when record not found', async () => {
      (mockHttpClient.put as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('PUT /tables/Contacts failed: 404 Not Found')
      );

      await expect(
        tableService.updateTableRecords('Contacts', [{ Contact_ID: 999999 }])
      ).rejects.toThrow('404 Not Found');
    });

    it('should handle multiple record updates', async () => {
      const records = [
        { Contact_ID: 1, First_Name: 'First' },
        { Contact_ID: 2, First_Name: 'Second' },
        { Contact_ID: 3, First_Name: 'Third' },
      ];

      (mockHttpClient.put as ReturnType<typeof vi.fn>).mockResolvedValueOnce(records);

      const result = await tableService.updateTableRecords('Contacts', records);

      expect(result).toHaveLength(3);
    });
  });

  describe('deleteTableRecords', () => {
    it('should delete records from table', async () => {
      const deletedRecords = [{ Contact_ID: 1, Display_Name: 'Deleted' }];

      (mockHttpClient.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce(deletedRecords);

      const result = await tableService.deleteTableRecords('Contacts', [1]);

      expect(mockClient.ensureValidToken).toHaveBeenCalledTimes(1);
      expect(mockHttpClient.delete).toHaveBeenCalledWith('/tables/Contacts', {
        id: [1],
      });
      expect(result).toEqual(deletedRecords);
    });

    it('should delete multiple records', async () => {
      const deletedRecords = [
        { Contact_ID: 1 },
        { Contact_ID: 2 },
        { Contact_ID: 3 },
      ];

      (mockHttpClient.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce(deletedRecords);

      const result = await tableService.deleteTableRecords('Contacts', [1, 2, 3]);

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/tables/Contacts', {
        id: [1, 2, 3],
      });
      expect(result).toHaveLength(3);
    });

    it('should pass additional parameters', async () => {
      (mockHttpClient.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      await tableService.deleteTableRecords('Contact_Log', [1], {
        $select: 'Contact_Log_ID',
        $userId: 123,
      });

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/tables/Contact_Log', {
        id: [1],
        $select: 'Contact_Log_ID',
        $userId: 123,
      });
    });

    it('should throw error when record not found', async () => {
      (mockHttpClient.delete as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('DELETE /tables/Contacts failed: 404 Not Found')
      );

      await expect(
        tableService.deleteTableRecords('Contacts', [999999])
      ).rejects.toThrow('404 Not Found');
    });

    it('should throw error on permission denied', async () => {
      (mockHttpClient.delete as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('DELETE /tables/Contacts failed: 403 Forbidden')
      );

      await expect(tableService.deleteTableRecords('Contacts', [1])).rejects.toThrow(
        '403 Forbidden'
      );
    });
  });

  describe('Token Validation', () => {
    it('should ensure valid token before each operation', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (mockHttpClient.put as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (mockHttpClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await tableService.getTableRecords('Test');
      await tableService.createTableRecords('Test', [{}]);
      await tableService.updateTableRecords('Test', [{}]);
      await tableService.deleteTableRecords('Test', [1]);

      expect(mockClient.ensureValidToken).toHaveBeenCalledTimes(4);
    });
  });

  describe('Logging safety (F5)', () => {
    // Member PII and pastoral notes must never reach info-level logs. See
    // .claude/references/auth.md § Logging policy.
    let logSpy: ReturnType<typeof vi.spyOn>;
    let errorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should not log anything when fetching records succeeds', async () => {
      const sensitiveRecords = [
        { Contact_ID: 1, Display_Name: 'Jane Doe', Notes: 'Struggling with grief after a loss' },
      ];
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(sensitiveRecords);

      await tableService.getTableRecords('Contact_Log', {
        $filter: "Notes LIKE '%grief%'",
      });

      expect(logSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should not include the $filter value or record content in the failure log', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('GET /tables/Contact_Log failed: 500 Internal Server Error')
      );

      await expect(
        tableService.getTableRecords('Contact_Log', {
          $filter: "Notes LIKE '%grief%' AND Display_Name = 'Jane Doe'",
        })
      ).rejects.toThrow();

      expect(logSpy).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledTimes(1);
      const loggedArgs = errorSpy.mock.calls[0].map(String).join(' ');
      expect(loggedArgs).not.toContain('grief');
      expect(loggedArgs).not.toContain('Jane Doe');
      expect(loggedArgs).not.toContain('$filter');
    });

    it('should not log request records when creating fails', async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('POST /tables/Contact_Log failed: 400 Bad Request')
      );

      await expect(
        tableService.createTableRecords('Contact_Log', [
          { Notes: 'Confidential pastoral note' },
        ])
      ).rejects.toThrow();

      expect(logSpy).not.toHaveBeenCalled();
      const loggedArgs = errorSpy.mock.calls
        .map((args: unknown[]) => args.map(String).join(' '))
        .join(' ');
      expect(loggedArgs).not.toContain('Confidential pastoral note');
    });

    it('should log only the error name, not a message that embeds the response body', async () => {
      // V8's JSON SyntaxError quotes the body it failed to parse.
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new SyntaxError('Unexpected token J, "Jane Doe, 12 Main St" is not valid JSON')
      );

      await expect(tableService.getTableRecords('Contacts')).rejects.toThrow(SyntaxError);

      expect(errorSpy).toHaveBeenCalledWith(
        'Error fetching records from table Contacts:',
        'SyntaxError'
      );
    });
  });

  describe('Table name validation', () => {
    // encodeURIComponent('..') === '..', which the URL parser resolves to the
    // API root, so the name must be a plain identifier before it is encoded.
    it.each([
      '..',
      '../procs/api_Some_Proc',
      'Contacts/..',
      'Contacts?$top=1',
      'Contacts#',
      'Contacts\\x',
      '%2e%2e',
      'Con tacts',
      '1Contacts',
      '',
      'a'.repeat(129),
      42,
      undefined,
    ])('should refuse the table name %j in every method before any token or network work', async (bad) => {
      const table = bad as unknown as string;
      await expect(tableService.getTableRecords(table)).rejects.toThrow('Invalid table name');
      await expect(tableService.createTableRecords(table, [])).rejects.toThrow('Invalid table name');
      await expect(tableService.updateTableRecords(table, [])).rejects.toThrow('Invalid table name');
      await expect(tableService.deleteTableRecords(table, [1])).rejects.toThrow('Invalid table name');

      expect(mockClient.ensureValidToken).not.toHaveBeenCalled();
      expect(mockHttpClient.get).not.toHaveBeenCalled();
      expect(mockHttpClient.post).not.toHaveBeenCalled();
      expect(mockHttpClient.put).not.toHaveBeenCalled();
      expect(mockHttpClient.delete).not.toHaveBeenCalled();
    });

    it('should accept MP-style names with underscores and a dp_ prefix', async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await tableService.getTableRecords('dp_User_Roles');
      await tableService.getTableRecords('_Custom1');

      expect(mockHttpClient.get).toHaveBeenNthCalledWith(1, '/tables/dp_User_Roles', undefined);
      expect(mockHttpClient.get).toHaveBeenNthCalledWith(2, '/tables/_Custom1', undefined);
    });

    it('should not echo a refused table name in the error or the log', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const error = await tableService
        .getTableRecords('../tables/dp_API_Clients')
        .catch((e: Error) => e);

      expect((error as Error).message).toBe('Invalid table name');
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });

  describe('Delete ID validation', () => {
    it.each([[[0]], [[1, -2]], [[1.5]], [['1 OR 1=1']], [[null]], ['1,2'], [undefined]])(
      'should refuse ids %j before any token or network work',
      async (ids) => {
        await expect(
          tableService.deleteTableRecords('Contact_Log', ids as unknown as number[])
        ).rejects.toThrow(/Invalid record ID/);
        expect(mockClient.ensureValidToken).not.toHaveBeenCalled();
        expect(mockHttpClient.delete).not.toHaveBeenCalled();
      }
    );

    it('should normalise digit-string ids to numbers', async () => {
      (mockHttpClient.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      await tableService.deleteTableRecords('Contact_Log', ['12', 13] as unknown as number[]);

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/tables/Contact_Log', { id: [12, 13] });
    });
  });
});

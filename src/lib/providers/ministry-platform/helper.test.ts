import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { MPHelper } from '@/lib/providers/ministry-platform/helper';

/**
 * MPHelper Tests
 *
 * Tests for the MPHelper class - the main public API for Ministry Platform operations.
 * Tests cover:
 * - Table CRUD operations (getTableRecords, createTableRecords, updateTableRecords, deleteTableRecords)
 * - Query parameter transformation
 * - Zod schema validation for create and update operations
 * - Partial validation for updates
 * - Error handling and propagation
 */

// Mock the provider
const mockGetTableRecords = vi.fn();
const mockCreateTableRecords = vi.fn();
const mockUpdateTableRecords = vi.fn();
const mockDeleteTableRecords = vi.fn();
const mockGetDomainInfo = vi.fn();
const mockGetGlobalFilters = vi.fn();
const mockRefreshMetadata = vi.fn();
const mockGetTables = vi.fn();

vi.mock('@/lib/providers/ministry-platform/provider', () => ({
  MinistryPlatformProvider: {
    getInstance: vi.fn(() => ({
      getTableRecords: mockGetTableRecords,
      createTableRecords: mockCreateTableRecords,
      updateTableRecords: mockUpdateTableRecords,
      deleteTableRecords: mockDeleteTableRecords,
      getDomainInfo: mockGetDomainInfo,
      getGlobalFilters: mockGetGlobalFilters,
      refreshMetadata: mockRefreshMetadata,
      getTables: mockGetTables,
    })),
  },
}));

describe('MPHelper', () => {
  let mpHelper: MPHelper;

  beforeEach(() => {
    vi.clearAllMocks();
    mpHelper = new MPHelper();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getTableRecords', () => {
    it('should fetch records with basic parameters', async () => {
      const mockRecords = [{ Contact_ID: 1, Display_Name: 'Test' }];
      mockGetTableRecords.mockResolvedValueOnce(mockRecords);

      const result = await mpHelper.getTableRecords({
        table: 'Contacts',
      });

      expect(mockGetTableRecords).toHaveBeenCalledWith('Contacts', {
        $select: undefined,
        $filter: undefined,
        $orderby: undefined,
        $groupby: undefined,
        $having: undefined,
        $top: undefined,
        $skip: undefined,
        $distinct: undefined,
        $userId: undefined,
        $globalFilterId: undefined,
      });
      expect(result).toEqual(mockRecords);
    });

    it('should transform simplified params to MP query format', async () => {
      mockGetTableRecords.mockResolvedValueOnce([]);

      await mpHelper.getTableRecords({
        table: 'Contacts',
        select: 'Contact_ID,Display_Name',
        filter: 'Active=1',
        orderBy: 'Last_Name',
        top: 10,
        skip: 20,
        distinct: true,
        userId: 123,
      });

      expect(mockGetTableRecords).toHaveBeenCalledWith('Contacts', {
        $select: 'Contact_ID,Display_Name',
        $filter: 'Active=1',
        $orderby: 'Last_Name',
        $groupby: undefined,
        $having: undefined,
        $top: 10,
        $skip: 20,
        $distinct: true,
        $userId: 123,
        $globalFilterId: undefined,
      });
    });

    it('should handle groupBy and having parameters', async () => {
      mockGetTableRecords.mockResolvedValueOnce([]);

      await mpHelper.getTableRecords({
        table: 'Contact_Log',
        select: 'Contact_ID, COUNT(*) as LogCount',
        groupBy: 'Contact_ID',
        having: 'COUNT(*) > 5',
      });

      expect(mockGetTableRecords).toHaveBeenCalledWith('Contact_Log', expect.objectContaining({
        $groupby: 'Contact_ID',
        $having: 'COUNT(*) > 5',
      }));
    });

    it('should handle globalFilterId parameter', async () => {
      mockGetTableRecords.mockResolvedValueOnce([]);

      await mpHelper.getTableRecords({
        table: 'Contacts',
        globalFilterId: 5,
      });

      expect(mockGetTableRecords).toHaveBeenCalledWith('Contacts', expect.objectContaining({
        $globalFilterId: 5,
      }));
    });
  });

  describe('createTableRecords', () => {
    it('should create records without validation', async () => {
      const newRecords = [{ First_Name: 'John', Last_Name: 'Doe' }];
      const createdRecords = [{ Contact_ID: 1, ...newRecords[0] }];
      mockCreateTableRecords.mockResolvedValueOnce(createdRecords);

      const result = await mpHelper.createTableRecords('Contacts', newRecords, {
        $userId: 1,
      });

      expect(mockCreateTableRecords).toHaveBeenCalledWith(
        'Contacts',
        newRecords,
        { $userId: 1 }
      );
      expect(result).toEqual(createdRecords);
    });

    it('should validate records with Zod schema before creation', async () => {
      const ContactLogSchema = z.object({
        Contact_ID: z.number(),
        Contact_Date: z.string(),
        Notes: z.string().max(2000).optional(),
      });

      const validRecords = [
        { Contact_ID: 1, Contact_Date: '2024-01-01', Notes: 'Test note' },
      ];

      mockCreateTableRecords.mockResolvedValueOnce(validRecords);

      const result = await mpHelper.createTableRecords('Contact_Log', validRecords, {
        schema: ContactLogSchema,
        $userId: 1,
      });

      expect(mockCreateTableRecords).toHaveBeenCalledWith(
        'Contact_Log',
        validRecords,
        { $userId: 1 }
      );
      expect(result).toEqual(validRecords);
    });

    it('should throw validation error for invalid records', async () => {
      const ContactLogSchema = z.object({
        Contact_ID: z.number(),
        Notes: z.string().max(10), // Very short max for testing
      });

      const invalidRecords = [
        { Contact_ID: 1, Notes: 'This note is way too long for the schema' },
      ];

      await expect(
        mpHelper.createTableRecords('Contact_Log', invalidRecords, {
          schema: ContactLogSchema,
        })
      ).rejects.toThrow('Validation failed for record 0');
    });

    it('should include record index in validation error', async () => {
      const Schema = z.object({
        Name: z.string().min(1),
      });

      const records = [
        { Name: 'Valid' },
        { Name: '' }, // Invalid - empty string
      ];

      await expect(
        mpHelper.createTableRecords('Test', records, { schema: Schema })
      ).rejects.toThrow('Validation failed for record 1');
    });

    it('should pass $select parameter with validation', async () => {
      const Schema = z.object({ Name: z.string() });
      const records = [{ Name: 'Test' }];

      mockCreateTableRecords.mockResolvedValueOnce(records);

      await mpHelper.createTableRecords('Test', records, {
        schema: Schema,
        $select: 'ID,Name',
        $userId: 1,
      });

      expect(mockCreateTableRecords).toHaveBeenCalledWith(
        'Test',
        records,
        { $select: 'ID,Name', $userId: 1 }
      );
    });
  });

  describe('updateTableRecords', () => {
    it('should update records without validation', async () => {
      const records = [{ Contact_ID: 1, First_Name: 'Updated' }];
      mockUpdateTableRecords.mockResolvedValueOnce(records);

      const result = await mpHelper.updateTableRecords('Contacts', records);

      expect(mockUpdateTableRecords).toHaveBeenCalledWith('Contacts', records, undefined);
      expect(result).toEqual(records);
    });

    it('should use partial validation by default for updates', async () => {
      const FullSchema = z.object({
        Contact_ID: z.number(),
        First_Name: z.string(),
        Last_Name: z.string(),
        Email: z.string().email(),
      });

      // Only updating First_Name - should pass with partial validation
      const partialRecords = [{ Contact_ID: 1, First_Name: 'Updated' }];

      mockUpdateTableRecords.mockResolvedValueOnce(partialRecords);

      const result = await mpHelper.updateTableRecords('Contacts', partialRecords, {
        schema: FullSchema,
        // partial: true is default
      });

      expect(mockUpdateTableRecords).toHaveBeenCalled();
      expect(result).toEqual(partialRecords);
    });

    it('should fail strict validation when partial=false', async () => {
      const FullSchema = z.object({
        Contact_ID: z.number(),
        First_Name: z.string(),
        Last_Name: z.string(),
      });

      // Missing Last_Name - should fail with strict validation
      const partialRecords = [{ Contact_ID: 1, First_Name: 'Updated' }];

      await expect(
        mpHelper.updateTableRecords('Contacts', partialRecords, {
          schema: FullSchema,
          partial: false, // Require all fields
        })
      ).rejects.toThrow('Validation failed for record 0');
    });

    it('should pass with strict validation when all fields provided', async () => {
      const FullSchema = z.object({
        Contact_ID: z.number(),
        First_Name: z.string(),
        Last_Name: z.string(),
      });

      const fullRecords = [{
        Contact_ID: 1,
        First_Name: 'John',
        Last_Name: 'Doe',
      }];

      mockUpdateTableRecords.mockResolvedValueOnce(fullRecords);

      const result = await mpHelper.updateTableRecords('Contacts', fullRecords, {
        schema: FullSchema,
        partial: false,
      });

      expect(result).toEqual(fullRecords);
    });

    it('should pass $allowCreate parameter for upsert', async () => {
      const records = [{ Contact_ID: 1, Name: 'Upsert' }];
      mockUpdateTableRecords.mockResolvedValueOnce(records);

      await mpHelper.updateTableRecords('Test', records, {
        $allowCreate: true,
        $userId: 1,
      });

      expect(mockUpdateTableRecords).toHaveBeenCalledWith(
        'Test',
        records,
        { $allowCreate: true, $userId: 1 }
      );
    });
  });

  describe('deleteTableRecords', () => {
    it('should delete records by IDs', async () => {
      const deletedRecords = [{ Contact_ID: 1 }];
      mockDeleteTableRecords.mockResolvedValueOnce(deletedRecords);

      const result = await mpHelper.deleteTableRecords('Contacts', [1]);

      expect(mockDeleteTableRecords).toHaveBeenCalledWith('Contacts', [1], undefined);
      expect(result).toEqual(deletedRecords);
    });

    it('should delete multiple records', async () => {
      const deletedRecords = [
        { Contact_Log_ID: 1 },
        { Contact_Log_ID: 2 },
        { Contact_Log_ID: 3 },
      ];
      mockDeleteTableRecords.mockResolvedValueOnce(deletedRecords);

      const result = await mpHelper.deleteTableRecords('Contact_Log', [1, 2, 3], {
        $userId: 123,
      });

      expect(mockDeleteTableRecords).toHaveBeenCalledWith(
        'Contact_Log',
        [1, 2, 3],
        { $userId: 123 }
      );
      expect(result).toHaveLength(3);
    });

    it('should pass $select parameter', async () => {
      mockDeleteTableRecords.mockResolvedValueOnce([]);

      await mpHelper.deleteTableRecords('Test', [1], {
        $select: 'ID,Name',
      });

      expect(mockDeleteTableRecords).toHaveBeenCalledWith(
        'Test',
        [1],
        { $select: 'ID,Name' }
      );
    });
  });

  describe('Domain Service Methods', () => {
    it('should get domain info', async () => {
      const domainInfo = {
        DisplayName: 'Test Church',
        TimeZoneName: 'America/Chicago',
        CultureName: 'en-US',
      };
      mockGetDomainInfo.mockResolvedValueOnce(domainInfo);

      const result = await mpHelper.getDomainInfo();

      expect(mockGetDomainInfo).toHaveBeenCalled();
      expect(result).toEqual(domainInfo);
    });

    it('should get global filters', async () => {
      const filters = [
        { Key: 1, Value: 'Filter 1' },
        { Key: 2, Value: 'Filter 2' },
      ];
      mockGetGlobalFilters.mockResolvedValueOnce(filters);

      const result = await mpHelper.getGlobalFilters({ $userId: 1 });

      expect(mockGetGlobalFilters).toHaveBeenCalledWith({ $userId: 1 });
      expect(result).toEqual(filters);
    });
  });

  describe('Metadata Service Methods', () => {
    it('should refresh metadata', async () => {
      mockRefreshMetadata.mockResolvedValueOnce(undefined);

      await mpHelper.refreshMetadata();

      expect(mockRefreshMetadata).toHaveBeenCalled();
    });

    it('should get tables list', async () => {
      const tables = [
        { Table_ID: 1, Table_Name: 'Contacts', Display_Name: 'Contacts' },
      ];
      mockGetTables.mockResolvedValueOnce(tables);

      const result = await mpHelper.getTables();

      expect(mockGetTables).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(tables);
    });

    it('should search tables by name', async () => {
      const tables = [
        { Table_ID: 1, Table_Name: 'Contacts', Display_Name: 'Contacts' },
        { Table_ID: 2, Table_Name: 'Contact_Log', Display_Name: 'Contact Log' },
      ];
      mockGetTables.mockResolvedValueOnce(tables);

      const result = await mpHelper.getTables('contact');

      expect(mockGetTables).toHaveBeenCalledWith('contact');
      expect(result).toEqual(tables);
    });
  });

  describe('Error Handling', () => {
    it('should propagate errors from provider', async () => {
      mockGetTableRecords.mockRejectedValueOnce(new Error('API Error'));

      await expect(
        mpHelper.getTableRecords({ table: 'Test' })
      ).rejects.toThrow('API Error');
    });

    it('should propagate create errors', async () => {
      mockCreateTableRecords.mockRejectedValueOnce(new Error('Create failed'));

      await expect(
        mpHelper.createTableRecords('Test', [{ Name: 'Test' }])
      ).rejects.toThrow('Create failed');
    });

    it('should propagate update errors', async () => {
      mockUpdateTableRecords.mockRejectedValueOnce(new Error('Update failed'));

      await expect(
        mpHelper.updateTableRecords('Test', [{ ID: 1 }])
      ).rejects.toThrow('Update failed');
    });

    it('should propagate delete errors', async () => {
      mockDeleteTableRecords.mockRejectedValueOnce(new Error('Delete failed'));

      await expect(mpHelper.deleteTableRecords('Test', [1])).rejects.toThrow(
        'Delete failed'
      );
    });
  });

  describe('Zod Validation Edge Cases', () => {
    it('should handle schema with optional fields', async () => {
      const Schema = z.object({
        ID: z.number(),
        Name: z.string(),
        Description: z.string().optional(),
      });

      const records = [{ ID: 1, Name: 'Test' }]; // No Description
      mockCreateTableRecords.mockResolvedValueOnce(records);

      const result = await mpHelper.createTableRecords('Test', records, {
        schema: Schema,
      });

      expect(result).toEqual(records);
    });

    it('should handle schema with nullable fields', async () => {
      const Schema = z.object({
        ID: z.number(),
        Value: z.string().nullable(),
      });

      const records = [{ ID: 1, Value: null }];
      mockCreateTableRecords.mockResolvedValueOnce(records);

      const result = await mpHelper.createTableRecords('Test', records, {
        schema: Schema,
      });

      expect(result).toEqual(records);
    });

    it('should handle schema with transformed values', async () => {
      const Schema = z.object({
        ID: z.number(),
        Name: z.string().trim().toUpperCase(),
      });

      const inputRecords = [{ ID: 1, Name: '  test  ' }];
      const expectedRecords = [{ ID: 1, Name: 'TEST' }];

      mockCreateTableRecords.mockResolvedValueOnce(expectedRecords);

      await mpHelper.createTableRecords('Test', inputRecords, {
        schema: Schema,
      });

      // Zod transforms the value before sending to provider
      expect(mockCreateTableRecords).toHaveBeenCalledWith(
        'Test',
        expectedRecords,
        {}
      );
    });

    it('should validate multiple records and report first failure', async () => {
      const Schema = z.object({
        ID: z.number(),
        Value: z.number().positive(),
      });

      const records = [
        { ID: 1, Value: 10 },
        { ID: 2, Value: -5 }, // Invalid
        { ID: 3, Value: 20 },
      ];

      await expect(
        mpHelper.createTableRecords('Test', records, { schema: Schema })
      ).rejects.toThrow('Validation failed for record 1');
    });
  });
});

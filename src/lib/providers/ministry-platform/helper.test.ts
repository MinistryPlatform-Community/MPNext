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

// Procedure Service mocks
const mockGetProcedures = vi.fn();
const mockExecuteProcedure = vi.fn();
const mockExecuteProcedureWithBody = vi.fn();

// Communication Service mocks
const mockCreateCommunication = vi.fn();
const mockSendMessage = vi.fn();

// File Service mocks
const mockGetFilesByRecord = vi.fn();
const mockUploadFiles = vi.fn();
const mockUpdateFile = vi.fn();
const mockDeleteFile = vi.fn();
const mockGetFileContentByUniqueId = vi.fn();
const mockGetFileMetadata = vi.fn();
const mockGetFileMetadataByUniqueId = vi.fn();

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
      // Procedure Service
      getProcedures: mockGetProcedures,
      executeProcedure: mockExecuteProcedure,
      executeProcedureWithBody: mockExecuteProcedureWithBody,
      // Communication Service
      createCommunication: mockCreateCommunication,
      sendMessage: mockSendMessage,
      // File Service
      getFilesByRecord: mockGetFilesByRecord,
      uploadFiles: mockUploadFiles,
      updateFile: mockUpdateFile,
      deleteFile: mockDeleteFile,
      getFileContentByUniqueId: mockGetFileContentByUniqueId,
      getFileMetadata: mockGetFileMetadata,
      getFileMetadataByUniqueId: mockGetFileMetadataByUniqueId,
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

  describe('Procedure Service Methods', () => {
    it('should get procedures list', async () => {
      const procedures = [
        { Procedure_ID: 1, Procedure_Name: 'api_Get_Contact_Info' },
        { Procedure_ID: 2, Procedure_Name: 'api_Update_Contact' },
      ];
      mockGetProcedures.mockResolvedValueOnce(procedures);

      const result = await mpHelper.getProcedures();

      expect(mockGetProcedures).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(procedures);
    });

    it('should search procedures by name', async () => {
      const procedures = [
        { Procedure_ID: 1, Procedure_Name: 'api_Get_Contact_Info' },
      ];
      mockGetProcedures.mockResolvedValueOnce(procedures);

      const result = await mpHelper.getProcedures('contact');

      expect(mockGetProcedures).toHaveBeenCalledWith('contact');
      expect(result).toEqual(procedures);
    });

    it('should execute procedure with query params', async () => {
      const procedureResult = [[{ Contact_ID: 1, Display_Name: 'John Doe' }]];
      mockExecuteProcedure.mockResolvedValueOnce(procedureResult);

      const result = await mpHelper.executeProcedure('api_Get_Contact_Info', {
        ContactID: 1,
      });

      expect(mockExecuteProcedure).toHaveBeenCalledWith('api_Get_Contact_Info', {
        ContactID: 1,
      });
      expect(result).toEqual(procedureResult);
    });

    it('should execute procedure without params', async () => {
      const procedureResult = [[{ Count: 100 }]];
      mockExecuteProcedure.mockResolvedValueOnce(procedureResult);

      const result = await mpHelper.executeProcedure('api_Get_Stats');

      expect(mockExecuteProcedure).toHaveBeenCalledWith('api_Get_Stats', undefined);
      expect(result).toEqual(procedureResult);
    });

    it('should execute procedure with body parameters', async () => {
      const procedureResult = [[{ Success: true }]];
      mockExecuteProcedureWithBody.mockResolvedValueOnce(procedureResult);

      const parameters = {
        ContactID: 1,
        Notes: 'Test notes',
        Date: '2024-01-01',
      };

      const result = await mpHelper.executeProcedureWithBody(
        'api_Create_Contact_Log',
        parameters
      );

      expect(mockExecuteProcedureWithBody).toHaveBeenCalledWith(
        'api_Create_Contact_Log',
        parameters
      );
      expect(result).toEqual(procedureResult);
    });

    it('should propagate procedure execution errors', async () => {
      mockExecuteProcedure.mockRejectedValueOnce(new Error('Procedure not found'));

      await expect(
        mpHelper.executeProcedure('NonExistent')
      ).rejects.toThrow('Procedure not found');
    });
  });

  describe('Communication Service Methods', () => {
    it('should create communication without attachments', async () => {
      const communicationInfo = {
        Author_User_ID: 1,
        Subject: 'Test Subject',
        Body: '<p>Test body</p>',
        Start_Date: '2024-01-01',
        From_Contact: 123,
        Reply_to_Contact: 123,
        To_Contact_List: '456,789',
      };
      const createdCommunication = {
        Communication_ID: 1,
        ...communicationInfo,
      };
      mockCreateCommunication.mockResolvedValueOnce(createdCommunication);

      const result = await mpHelper.createCommunication(communicationInfo);

      expect(mockCreateCommunication).toHaveBeenCalledWith(communicationInfo, undefined);
      expect(result).toEqual(createdCommunication);
    });

    it('should create communication with attachments', async () => {
      const communicationInfo = {
        Author_User_ID: 1,
        Subject: 'Test with Attachment',
        Body: '<p>See attached</p>',
        Start_Date: '2024-01-01',
        From_Contact: 123,
        Reply_to_Contact: 123,
        To_Contact_List: '456',
      };
      const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const createdCommunication = { Communication_ID: 1, ...communicationInfo };
      mockCreateCommunication.mockResolvedValueOnce(createdCommunication);

      const result = await mpHelper.createCommunication(communicationInfo, [mockFile]);

      expect(mockCreateCommunication).toHaveBeenCalledWith(communicationInfo, [mockFile]);
      expect(result).toEqual(createdCommunication);
    });

    it('should send message without attachments', async () => {
      const messageInfo = {
        From: 'sender@example.com',
        To: 'recipient@example.com',
        Subject: 'Test Message',
        Body: '<p>Hello</p>',
      };
      const sentMessage = { Communication_ID: 1, ...messageInfo };
      mockSendMessage.mockResolvedValueOnce(sentMessage);

      const result = await mpHelper.sendMessage(messageInfo);

      expect(mockSendMessage).toHaveBeenCalledWith(messageInfo, undefined);
      expect(result).toEqual(sentMessage);
    });

    it('should send message with attachments', async () => {
      const messageInfo = {
        From: 'sender@example.com',
        To: 'recipient@example.com',
        Subject: 'Test with Attachment',
        Body: '<p>Please see attached</p>',
      };
      const mockFile = new File(['data'], 'report.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const sentMessage = { Communication_ID: 2, ...messageInfo };
      mockSendMessage.mockResolvedValueOnce(sentMessage);

      const result = await mpHelper.sendMessage(messageInfo, [mockFile]);

      expect(mockSendMessage).toHaveBeenCalledWith(messageInfo, [mockFile]);
      expect(result).toEqual(sentMessage);
    });
  });

  describe('File Service Methods', () => {
    describe('getFilesByRecord', () => {
      it('should get files for a record', async () => {
        const files = [
          { File_ID: 1, File_Name: 'photo.jpg', Unique_Name: 'abc-123' },
          { File_ID: 2, File_Name: 'document.pdf', Unique_Name: 'def-456' },
        ];
        mockGetFilesByRecord.mockResolvedValueOnce(files);

        const result = await mpHelper.getFilesByRecord({
          table: 'Contacts',
          recordId: 123,
        });

        expect(mockGetFilesByRecord).toHaveBeenCalledWith('Contacts', 123, undefined);
        expect(result).toEqual(files);
      });

      it('should get only default file when defaultOnly is true', async () => {
        const files = [{ File_ID: 1, File_Name: 'default.jpg', Is_Default: true }];
        mockGetFilesByRecord.mockResolvedValueOnce(files);

        const result = await mpHelper.getFilesByRecord({
          table: 'Contacts',
          recordId: 123,
          defaultOnly: true,
        });

        expect(mockGetFilesByRecord).toHaveBeenCalledWith('Contacts', 123, true);
        expect(result).toEqual(files);
      });
    });

    describe('uploadFiles', () => {
      it('should upload files to a record', async () => {
        const mockFile = new File(['image data'], 'photo.jpg', { type: 'image/jpeg' });
        const uploadedFiles = [
          { File_ID: 1, File_Name: 'photo.jpg', Unique_Name: 'new-123' },
        ];
        mockUploadFiles.mockResolvedValueOnce(uploadedFiles);

        const result = await mpHelper.uploadFiles({
          table: 'Contacts',
          recordId: 123,
          files: [mockFile],
        });

        expect(mockUploadFiles).toHaveBeenCalledWith('Contacts', 123, [mockFile], undefined);
        expect(result).toEqual(uploadedFiles);
      });

      it('should upload files with upload parameters', async () => {
        const mockFile = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
        const uploadParams = { IsDefault: true, Description: 'Main document' };
        const uploadedFiles = [{ File_ID: 2, File_Name: 'doc.pdf' }];
        mockUploadFiles.mockResolvedValueOnce(uploadedFiles);

        const result = await mpHelper.uploadFiles({
          table: 'Events',
          recordId: 456,
          files: [mockFile],
          uploadParams,
        });

        expect(mockUploadFiles).toHaveBeenCalledWith('Events', 456, [mockFile], uploadParams);
        expect(result).toEqual(uploadedFiles);
      });
    });

    describe('updateFile', () => {
      it('should update file metadata only', async () => {
        const updateParams = { Description: 'Updated description' };
        const updatedFile = { File_ID: 1, File_Name: 'photo.jpg', Description: 'Updated description' };
        mockUpdateFile.mockResolvedValueOnce(updatedFile);

        const result = await mpHelper.updateFile({
          fileId: 1,
          updateParams,
        });

        expect(mockUpdateFile).toHaveBeenCalledWith(1, undefined, updateParams);
        expect(result).toEqual(updatedFile);
      });

      it('should update file content and metadata', async () => {
        const mockFile = new File(['new content'], 'updated.jpg', { type: 'image/jpeg' });
        const updateParams = { Description: 'New photo' };
        const updatedFile = { File_ID: 1, File_Name: 'updated.jpg' };
        mockUpdateFile.mockResolvedValueOnce(updatedFile);

        const result = await mpHelper.updateFile({
          fileId: 1,
          file: mockFile,
          updateParams,
        });

        expect(mockUpdateFile).toHaveBeenCalledWith(1, mockFile, updateParams);
        expect(result).toEqual(updatedFile);
      });
    });

    describe('deleteFile', () => {
      it('should delete file by ID', async () => {
        mockDeleteFile.mockResolvedValueOnce(undefined);

        await mpHelper.deleteFile({ fileId: 1 });

        expect(mockDeleteFile).toHaveBeenCalledWith(1, undefined);
      });

      it('should delete file with user ID for auditing', async () => {
        mockDeleteFile.mockResolvedValueOnce(undefined);

        await mpHelper.deleteFile({ fileId: 1, userId: 123 });

        expect(mockDeleteFile).toHaveBeenCalledWith(1, 123);
      });
    });

    describe('getFileContentByUniqueId', () => {
      it('should get file content by unique ID', async () => {
        const fileBlob = new Blob(['file content'], { type: 'image/jpeg' });
        mockGetFileContentByUniqueId.mockResolvedValueOnce(fileBlob);

        const result = await mpHelper.getFileContentByUniqueId({
          uniqueFileId: 'abc-123-def',
        });

        expect(mockGetFileContentByUniqueId).toHaveBeenCalledWith('abc-123-def', undefined);
        expect(result).toEqual(fileBlob);
      });

      it('should get thumbnail when requested', async () => {
        const thumbnailBlob = new Blob(['thumbnail'], { type: 'image/jpeg' });
        mockGetFileContentByUniqueId.mockResolvedValueOnce(thumbnailBlob);

        const result = await mpHelper.getFileContentByUniqueId({
          uniqueFileId: 'abc-123-def',
          thumbnail: true,
        });

        expect(mockGetFileContentByUniqueId).toHaveBeenCalledWith('abc-123-def', true);
        expect(result).toEqual(thumbnailBlob);
      });
    });

    describe('getFileMetadata', () => {
      it('should get file metadata by ID', async () => {
        const fileMetadata = {
          File_ID: 1,
          File_Name: 'photo.jpg',
          File_Size: 12345,
          Content_Type: 'image/jpeg',
        };
        mockGetFileMetadata.mockResolvedValueOnce(fileMetadata);

        const result = await mpHelper.getFileMetadata({ fileId: 1 });

        expect(mockGetFileMetadata).toHaveBeenCalledWith(1);
        expect(result).toEqual(fileMetadata);
      });
    });

    describe('getFileMetadataByUniqueId', () => {
      it('should get file metadata by unique ID', async () => {
        const fileMetadata = {
          File_ID: 1,
          Unique_Name: 'abc-123-def',
          File_Name: 'document.pdf',
          File_Size: 54321,
        };
        mockGetFileMetadataByUniqueId.mockResolvedValueOnce(fileMetadata);

        const result = await mpHelper.getFileMetadataByUniqueId({
          uniqueFileId: 'abc-123-def',
        });

        expect(mockGetFileMetadataByUniqueId).toHaveBeenCalledWith('abc-123-def');
        expect(result).toEqual(fileMetadata);
      });
    });

    describe('File Service Error Handling', () => {
      it('should propagate file upload errors', async () => {
        mockUploadFiles.mockRejectedValueOnce(new Error('Upload failed: file too large'));

        await expect(
          mpHelper.uploadFiles({
            table: 'Contacts',
            recordId: 1,
            files: [new File(['x'.repeat(10000000)], 'large.bin')],
          })
        ).rejects.toThrow('Upload failed: file too large');
      });

      it('should propagate file not found errors', async () => {
        mockGetFileMetadata.mockRejectedValueOnce(new Error('File not found'));

        await expect(
          mpHelper.getFileMetadata({ fileId: 99999 })
        ).rejects.toThrow('File not found');
      });
    });
  });
});

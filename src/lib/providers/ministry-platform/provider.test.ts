import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockGetTableRecords,
  mockCreateTableRecords,
  mockUpdateTableRecords,
  mockDeleteTableRecords,
  mockGetDomainInfo,
  mockGetGlobalFilters,
  mockRefreshMetadata,
  mockGetTables,
  mockGetProcedures,
  mockExecuteProcedure,
  mockExecuteProcedureWithBody,
  mockCreateCommunication,
  mockSendMessage,
  mockGetFilesByRecord,
  mockUploadFiles,
  mockUpdateFile,
  mockDeleteFile,
  mockGetFileContentByUniqueId,
  mockGetFileMetadata,
  mockGetFileMetadataByUniqueId,
} = vi.hoisted(() => ({
  mockGetTableRecords: vi.fn(),
  mockCreateTableRecords: vi.fn(),
  mockUpdateTableRecords: vi.fn(),
  mockDeleteTableRecords: vi.fn(),
  mockGetDomainInfo: vi.fn(),
  mockGetGlobalFilters: vi.fn(),
  mockRefreshMetadata: vi.fn(),
  mockGetTables: vi.fn(),
  mockGetProcedures: vi.fn(),
  mockExecuteProcedure: vi.fn(),
  mockExecuteProcedureWithBody: vi.fn(),
  mockCreateCommunication: vi.fn(),
  mockSendMessage: vi.fn(),
  mockGetFilesByRecord: vi.fn(),
  mockUploadFiles: vi.fn(),
  mockUpdateFile: vi.fn(),
  mockDeleteFile: vi.fn(),
  mockGetFileContentByUniqueId: vi.fn(),
  mockGetFileMetadata: vi.fn(),
  mockGetFileMetadataByUniqueId: vi.fn(),
}));

vi.mock('./client', () => ({
  MinistryPlatformClient: class {
    constructor() {}
  },
}));

vi.mock('./services', () => ({
  TableService: class {
    getTableRecords = mockGetTableRecords;
    createTableRecords = mockCreateTableRecords;
    updateTableRecords = mockUpdateTableRecords;
    deleteTableRecords = mockDeleteTableRecords;
  },
  ProcedureService: class {
    getProcedures = mockGetProcedures;
    executeProcedure = mockExecuteProcedure;
    executeProcedureWithBody = mockExecuteProcedureWithBody;
  },
  CommunicationService: class {
    createCommunication = mockCreateCommunication;
    sendMessage = mockSendMessage;
  },
  MetadataService: class {
    refreshMetadata = mockRefreshMetadata;
    getTables = mockGetTables;
  },
  DomainService: class {
    getDomainInfo = mockGetDomainInfo;
    getGlobalFilters = mockGetGlobalFilters;
  },
  FileService: class {
    getFilesByRecord = mockGetFilesByRecord;
    uploadFiles = mockUploadFiles;
    updateFile = mockUpdateFile;
    deleteFile = mockDeleteFile;
    getFileContentByUniqueId = mockGetFileContentByUniqueId;
    getFileMetadata = mockGetFileMetadata;
    getFileMetadataByUniqueId = mockGetFileMetadataByUniqueId;
  },
}));

import { MinistryPlatformProvider } from './provider';

describe('MinistryPlatformProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (MinistryPlatformProvider as any).instance = undefined;
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = MinistryPlatformProvider.getInstance();
      const instance2 = MinistryPlatformProvider.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Table operations', () => {
    it('should delegate getTableRecords to TableService', async () => {
      const mockRecords = [{ id: 1, name: 'Test' }];
      mockGetTableRecords.mockResolvedValueOnce(mockRecords);

      const provider = MinistryPlatformProvider.getInstance();
      const result = await provider.getTableRecords('Contacts', { $filter: 'Active=1' });

      expect(mockGetTableRecords).toHaveBeenCalledWith('Contacts', { $filter: 'Active=1' });
      expect(result).toEqual(mockRecords);
    });

    it('should delegate createTableRecords to TableService', async () => {
      const records = [{ First_Name: 'John' }];
      mockCreateTableRecords.mockResolvedValueOnce(records);

      const provider = MinistryPlatformProvider.getInstance();
      await provider.createTableRecords('Contacts', records);

      expect(mockCreateTableRecords).toHaveBeenCalledWith('Contacts', records, undefined);
    });

    it('should delegate updateTableRecords to TableService', async () => {
      const records = [{ Contact_ID: 1, First_Name: 'Jane' }];
      mockUpdateTableRecords.mockResolvedValueOnce(records);

      const provider = MinistryPlatformProvider.getInstance();
      await provider.updateTableRecords('Contacts', records);

      expect(mockUpdateTableRecords).toHaveBeenCalledWith('Contacts', records, undefined);
    });

    it('should delegate deleteTableRecords to TableService', async () => {
      mockDeleteTableRecords.mockResolvedValueOnce([]);

      const provider = MinistryPlatformProvider.getInstance();
      await provider.deleteTableRecords('Contacts', [1, 2]);

      expect(mockDeleteTableRecords).toHaveBeenCalledWith('Contacts', [1, 2], undefined);
    });
  });

  describe('Procedure operations', () => {
    it('should delegate executeProcedure to ProcedureService', async () => {
      mockExecuteProcedure.mockResolvedValueOnce([[{ result: 1 }]]);

      const provider = MinistryPlatformProvider.getInstance();
      await provider.executeProcedure('sp_test', { '@Param1': 'value' });

      expect(mockExecuteProcedure).toHaveBeenCalledWith('sp_test', { '@Param1': 'value' });
    });

    it('should delegate executeProcedureWithBody to ProcedureService', async () => {
      mockExecuteProcedureWithBody.mockResolvedValueOnce([[{ result: 1 }]]);

      const provider = MinistryPlatformProvider.getInstance();
      await provider.executeProcedureWithBody('sp_test', { '@Param1': 'value' });

      expect(mockExecuteProcedureWithBody).toHaveBeenCalledWith('sp_test', { '@Param1': 'value' });
    });
  });

  describe('Domain operations', () => {
    it('should delegate getDomainInfo to DomainService', async () => {
      const mockDomain = { DomainId: 1, DomainName: 'Test' };
      mockGetDomainInfo.mockResolvedValueOnce(mockDomain);

      const provider = MinistryPlatformProvider.getInstance();
      const result = await provider.getDomainInfo();

      expect(result).toEqual(mockDomain);
    });
  });

  describe('Metadata operations', () => {
    it('should delegate getTables to MetadataService', async () => {
      const mockTables = [{ TableName: 'Contacts' }];
      mockGetTables.mockResolvedValueOnce(mockTables);

      const provider = MinistryPlatformProvider.getInstance();
      const result = await provider.getTables('Contacts');

      expect(mockGetTables).toHaveBeenCalledWith('Contacts');
      expect(result).toEqual(mockTables);
    });

    it('should delegate refreshMetadata to MetadataService', async () => {
      mockRefreshMetadata.mockResolvedValueOnce(undefined);

      const provider = MinistryPlatformProvider.getInstance();
      await provider.refreshMetadata();

      expect(mockRefreshMetadata).toHaveBeenCalledTimes(1);
    });

    it('should forward an omitted search term as undefined', async () => {
      mockGetTables.mockResolvedValueOnce([]);

      const provider = MinistryPlatformProvider.getInstance();
      await provider.getTables();

      expect(mockGetTables).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Communication operations', () => {
    // These pass-throughs sit in front of the endpoints that send real email and
    // SMS to real church members. The DomainService/FileService/CommunicationService
    // classes are mocked at the module boundary above, so nothing here reaches MP.
    it('should delegate createCommunication to CommunicationService', async () => {
      const communication = { Subject: 'Sunday update' } as never;
      mockCreateCommunication.mockResolvedValueOnce({ Communication_ID: 555 });

      const provider = MinistryPlatformProvider.getInstance();
      const result = await provider.createCommunication(communication);

      expect(mockCreateCommunication).toHaveBeenCalledWith(communication, undefined);
      expect(result).toEqual({ Communication_ID: 555 });
    });

    it('should forward attachments to createCommunication', async () => {
      const communication = { Subject: 'Sunday update' } as never;
      const attachments = [new File(['bulletin'], 'bulletin.pdf')];
      mockCreateCommunication.mockResolvedValueOnce({ Communication_ID: 556 });

      const provider = MinistryPlatformProvider.getInstance();
      await provider.createCommunication(communication, attachments);

      expect(mockCreateCommunication).toHaveBeenCalledWith(communication, attachments);
    });

    it('should delegate sendMessage to CommunicationService', async () => {
      const message = { Subject: 'Welcome' } as never;
      mockSendMessage.mockResolvedValueOnce({ Communication_ID: 557 });

      const provider = MinistryPlatformProvider.getInstance();
      const result = await provider.sendMessage(message);

      expect(mockSendMessage).toHaveBeenCalledWith(message, undefined);
      expect(result).toEqual({ Communication_ID: 557 });
    });

    it('should forward attachments to sendMessage', async () => {
      const message = { Subject: 'Welcome' } as never;
      const attachments = [new File(['receipt'], 'receipt.pdf')];
      mockSendMessage.mockResolvedValueOnce({ Communication_ID: 558 });

      const provider = MinistryPlatformProvider.getInstance();
      await provider.sendMessage(message, attachments);

      expect(mockSendMessage).toHaveBeenCalledWith(message, attachments);
    });
  });

  describe('Domain filter operations', () => {
    it('should delegate getGlobalFilters to DomainService', async () => {
      const filters = [{ Key: 1, Value: 'Main Campus' }];
      mockGetGlobalFilters.mockResolvedValueOnce(filters);

      const provider = MinistryPlatformProvider.getInstance();
      const result = await provider.getGlobalFilters({ $userId: 7 });

      expect(mockGetGlobalFilters).toHaveBeenCalledWith({ $userId: 7 });
      expect(result).toEqual(filters);
    });
  });

  describe('Procedure listing', () => {
    it('should delegate getProcedures to ProcedureService', async () => {
      mockGetProcedures.mockResolvedValueOnce([{ Name: 'api_Custom', Parameters: [] }]);

      const provider = MinistryPlatformProvider.getInstance();
      const result = await provider.getProcedures('api_');

      expect(mockGetProcedures).toHaveBeenCalledWith('api_');
      expect(result).toHaveLength(1);
    });
  });

  describe('File operations', () => {
    it('should delegate getFilesByRecord to FileService', async () => {
      mockGetFilesByRecord.mockResolvedValueOnce([{ FileId: 501 }]);

      const provider = MinistryPlatformProvider.getInstance();
      const result = await provider.getFilesByRecord('Contacts', 42, true);

      expect(mockGetFilesByRecord).toHaveBeenCalledWith('Contacts', 42, true);
      expect(result).toEqual([{ FileId: 501 }]);
    });

    it('should delegate uploadFiles to FileService', async () => {
      const files = [new File(['x'], 'x.jpg')];
      mockUploadFiles.mockResolvedValueOnce([{ FileId: 502 }]);

      const provider = MinistryPlatformProvider.getInstance();
      await provider.uploadFiles('Contacts', 42, files, { description: 'Photo' });

      expect(mockUploadFiles).toHaveBeenCalledWith('Contacts', 42, files, {
        description: 'Photo',
      });
    });

    it('should delegate updateFile to FileService', async () => {
      const file = new File(['x'], 'x.jpg');
      mockUpdateFile.mockResolvedValueOnce({ FileId: 501 });

      const provider = MinistryPlatformProvider.getInstance();
      await provider.updateFile(501, file, { fileName: 'renamed.jpg' });

      expect(mockUpdateFile).toHaveBeenCalledWith(501, file, { fileName: 'renamed.jpg' });
    });

    it('should delegate deleteFile to FileService with the audit userId', async () => {
      mockDeleteFile.mockResolvedValueOnce(undefined);

      const provider = MinistryPlatformProvider.getInstance();
      await provider.deleteFile(501, 7);

      expect(mockDeleteFile).toHaveBeenCalledWith(501, 7);
    });

    it('should delegate getFileContentByUniqueId to FileService', async () => {
      const blob = new Blob(['bytes']);
      mockGetFileContentByUniqueId.mockResolvedValueOnce(blob);

      const provider = MinistryPlatformProvider.getInstance();
      const result = await provider.getFileContentByUniqueId('unique-id', true);

      expect(mockGetFileContentByUniqueId).toHaveBeenCalledWith('unique-id', true);
      expect(result).toBe(blob);
    });

    it('should delegate getFileMetadata to FileService', async () => {
      mockGetFileMetadata.mockResolvedValueOnce({ FileId: 501 });

      const provider = MinistryPlatformProvider.getInstance();
      const result = await provider.getFileMetadata(501);

      expect(mockGetFileMetadata).toHaveBeenCalledWith(501);
      expect(result).toEqual({ FileId: 501 });
    });

    it('should delegate getFileMetadataByUniqueId to FileService', async () => {
      mockGetFileMetadataByUniqueId.mockResolvedValueOnce({ FileId: 501 });

      const provider = MinistryPlatformProvider.getInstance();
      const result = await provider.getFileMetadataByUniqueId('unique-id');

      expect(mockGetFileMetadataByUniqueId).toHaveBeenCalledWith('unique-id');
      expect(result).toEqual({ FileId: 501 });
    });
  });
});

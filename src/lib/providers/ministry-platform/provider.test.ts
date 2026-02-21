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
  CommunicationService: class {},
  MetadataService: class {
    refreshMetadata = mockRefreshMetadata;
    getTables = mockGetTables;
  },
  DomainService: class {
    getDomainInfo = mockGetDomainInfo;
    getGlobalFilters = mockGetGlobalFilters;
  },
  FileService: class {},
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
  });
});

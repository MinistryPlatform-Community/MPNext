import { MinistryPlatformClient } from "./client";
import {
    TableService,
    ProcedureService,
    CommunicationService,
    MetadataService,
    DomainService,
    FileService
} from "./services";
import {
    TableQueryParams,
    ProcedureInfo,
    CommunicationInfo,
    Communication,
    MessageInfo,
    DomainInfo,
    GlobalFilterItem,
    GlobalFilterParams,
    TableRecord,
    FileDescription,
    FileUploadParams,
    FileUpdateParams,
    TableMetadata,
    QueryParams
} from "./types";

/**
 * MinistryPlatformProvider - Core Provider
 *
 * Central orchestrator for all Ministry Platform operations. Supports two modes:
 *
 * 1. **Singleton (client credentials)** — via `getInstance()`. Shared across all
 *    requests, authenticates as the API Client User. Used for system-level operations
 *    (dashboard cache, type generation, auth callbacks).
 *
 * 2. **Per-request (user token)** — via `withAccessToken()`. Creates a fresh instance
 *    that authenticates as the logged-in user, respecting their MP permissions and
 *    producing accurate audit logs.
 *
 * Manages service instances and provides a unified interface for:
 * - Table operations (CRUD)
 * - Stored procedure execution
 * - Communication/messaging
 * - File management
 * - Metadata operations
 * - Domain configuration
 */
export class MinistryPlatformProvider {

    // Singleton instance storage (client credentials mode only)
    private static instance: MinistryPlatformProvider;

    // Core client for HTTP operations and authentication
    private client: MinistryPlatformClient;

    // Specialized service instances for different domains of functionality
    private tableService: TableService;           // CRUD operations for all tables
    private procedureService: ProcedureService;   // Stored procedure execution
    private communicationService: CommunicationService; // Email/SMS communications
    private metadataService: MetadataService;     // Schema and metadata operations
    private domainService: DomainService;         // Domain configuration and filters
    private fileService: FileService;             // File upload/download operations

    /**
     * Private constructor — initializes the core client and all service instances.
     * @param accessToken Optional user access token. When provided, the client authenticates
     *                    as the user instead of using client credentials.
     */
    private constructor(accessToken?: string) {
        // Create the core HTTP client with authentication management
        this.client = accessToken
            ? new MinistryPlatformClient({ accessToken })
            : new MinistryPlatformClient();

        // Initialize all service instances with shared client
        this.tableService = new TableService(this.client);
        this.procedureService = new ProcedureService(this.client);
        this.communicationService = new CommunicationService(this.client);
        this.metadataService = new MetadataService(this.client);
        this.domainService = new DomainService(this.client);
        this.fileService = new FileService(this.client);
    }

    /**
     * Returns the singleton instance using client credentials authentication.
     * All API calls will run as the API Client User.
     * @returns The singleton MinistryPlatformProvider instance
     */
    public static getInstance(): MinistryPlatformProvider {
        // Create instance if it doesn't exist (lazy initialization)
        if (!this.instance) {
            this.instance = new MinistryPlatformProvider();
        }

        return this.instance;
    }

    /**
     * Creates a per-request provider that authenticates as the logged-in user.
     * API calls will respect the user's MP permissions and produce accurate audit logs.
     * @param accessToken The user's OIDC access token from the session
     * @returns A new (non-singleton) MinistryPlatformProvider instance
     */
    public static withAccessToken(accessToken: string): MinistryPlatformProvider {
        return new MinistryPlatformProvider(accessToken);
    }

    // Domain Service Methods
    /**
     * Returns the basic information about the current domain.
     * @returns Promise with the domain information
     */
    public async getDomainInfo(): Promise<DomainInfo> {
        return this.domainService.getDomainInfo();
    }

    /**
     * Returns the lookup values to be used as global filters.
     * @param params Optional parameters for the global filters request
     * @returns Promise with an array of global filter items
     */
    public async getGlobalFilters(params?: GlobalFilterParams): Promise<GlobalFilterItem[]> {
        return this.domainService.getGlobalFilters(params);
    }

    // Metadata Service Methods
    /**
     * Triggers an update of the metadata cache on all servers and in all applications.
     * @returns Promise with the response from the API
     */
    public async refreshMetadata(): Promise<void> {
        return this.metadataService.refreshMetadata();
    }

    /**
     * Returns the list of tables available to the current user with basic metadata.
     * @param search Optional search term to filter tables
     * @returns Promise with an array of TableInfo objects
     */
    public async getTables(search?: string): Promise<TableMetadata[]> {
        return this.metadataService.getTables(search);
    }
    // Table Service Methods
    /**
     * Returns the list of records from the specified table satisfying the provided search criteria.
     * @param table Table to retrieve records from
     * @param params Query parameters for filtering, sorting, etc.
     * @returns Promise with an array of records
     */
    public async getTableRecords<T>(table: string, params?: TableQueryParams): Promise<T[]> {
        return this.tableService.getTableRecords<T>(table, params);
    }

    /**
     * Creates new records in the specified table.
     * @param table Table where records need to be created
     * @param records Array of records to be added to the table
     * @param params Additional query parameters
     * @returns Promise with the created records
     */
    public async createTableRecords<T extends TableRecord = TableRecord>(
        table: string, 
        records: T[], 
        params?: Pick<TableQueryParams, '$select' | '$userId'>
    ): Promise<T[]> {
        return this.tableService.createTableRecords<T>(table, records, params);
    }

    /**
     * Updates provided records in the specified table.
     * @param table Table where records need to be updated
     * @param records Array of records to be updated in the table
     * @param params Additional query parameters
     * @returns Promise with the updated records
     */
    public async updateTableRecords<T extends TableRecord = TableRecord>(
        table: string, 
        records: T[], 
        params?: Pick<TableQueryParams, '$select' | '$userId' | '$allowCreate'>
    ): Promise<T[]> {
        return this.tableService.updateTableRecords<T>(table, records, params);
    }

    /**
     * Deletes multiple records from the specified table.
     * @param table Table where records need to be deleted
     * @param ids Array of identifiers corresponding to records to be deleted
     * @param params Additional query parameters
     * @returns Promise with the deleted records
     */
    public async deleteTableRecords<T extends TableRecord = TableRecord>(
        table: string, 
        ids: number[], 
        params?: Pick<TableQueryParams, '$select' | '$userId'>
    ): Promise<T[]> {
        return this.tableService.deleteTableRecords<T>(table, ids, params);
    }

    // Procedure Service Methods
    /**
     * Returns the list of procedures available to the current user with basic metadata.
     * @param search Optional search term to filter procedures
     * @returns Promise with an array of ProcedureInfo objects
     */
    public async getProcedures(search?: string): Promise<ProcedureInfo[]> {
        return this.procedureService.getProcedures(search);
    }

    /**
     * Executes the requested stored procedure retrieving parameters from the query string.
     * @param procedure Stored procedure name
     * @param params Query parameters to pass to the procedure
     * @returns Promise with the procedure results
     */
    public async executeProcedure(
        procedure: string, 
        params?: QueryParams
    ): Promise<unknown[][]> {
        return this.procedureService.executeProcedure(procedure, params);
    }

    /**
     * Executes the requested stored procedure with provided parameters in the request body.
     * @param procedure Stored procedure name
     * @param parameters Parameters to be used for calling stored procedure
     * @returns Promise with the procedure results
     */
    public async executeProcedureWithBody(
        procedure: string, 
        parameters: Record<string, unknown>
    ): Promise<unknown[][]> {
        return this.procedureService.executeProcedureWithBody(procedure, parameters);
    }

    // Communication Service Methods
    /**
     * Creates a new communication, immediately renders it and schedules for delivery.
     * Supports both simple JSON communication and multipart form data with file attachments.
     * @param communication Communication information object
     * @param attachments Optional array of file attachments
     * @returns Promise with the created communication
     */
    public async createCommunication(
        communication: CommunicationInfo,
        attachments?: File[]
    ): Promise<Communication> {
        return this.communicationService.createCommunication(communication, attachments);
    }

    /**
     * Creates email messages from the provided information and immediately schedules them for delivery.
     * Supports both simple JSON message and multipart form data with file attachments.
     * @param message Message information object
     * @param attachments Optional array of file attachments
     * @returns Promise with the created communication
     */
    public async sendMessage(
        message: MessageInfo,
        attachments?: File[]
    ): Promise<Communication> {
        return this.communicationService.sendMessage(message, attachments);
    }

    // File Service Methods
    /**
     * Returns the metadata (descriptions) of the files attached to the specified record.
     * @param table Table name where the record exists
     * @param recordId ID of the record to get files for
     * @param defaultOnly Optional flag to return only default files
     * @returns Promise with an array of file descriptions
     */
    public async getFilesByRecord(
        table: string,
        recordId: number,
        defaultOnly?: boolean
    ): Promise<FileDescription[]> {
        return this.fileService.getFilesByRecord(table, recordId, defaultOnly);
    }

    /**
     * Uploads and attaches multiple files to the specified record.
     * @param table Table name where the record exists
     * @param recordId ID of the record to attach files to
     * @param files Array of files to upload
     * @param params Optional upload parameters
     * @returns Promise with an array of uploaded file descriptions
     */
    public async uploadFiles(
        table: string,
        recordId: number,
        files: File[],
        params?: FileUploadParams
    ): Promise<FileDescription[]> {
        return this.fileService.uploadFiles(table, recordId, files, params);
    }

    /**
     * Updates the content and/or metadata of the file corresponding to provided identifier.
     * @param fileId ID of the file to update
     * @param file Optional new file content
     * @param params Optional update parameters
     * @returns Promise with the updated file description
     */
    public async updateFile(
        fileId: number,
        file?: File,
        params?: FileUpdateParams
    ): Promise<FileDescription> {
        return this.fileService.updateFile(fileId, file, params);
    }

    /**
     * Deletes the file corresponding to provided identifier.
     * @param fileId ID of the file to delete
     * @param userId Optional user ID for auditing
     * @returns Promise that resolves when file is deleted
     */
    public async deleteFile(
        fileId: number,
        userId?: number
    ): Promise<void> {
        return this.fileService.deleteFile(fileId, userId);
    }

    /**
     * Returns the content of the file corresponding to provided globally unique identifier.
     * This method does NOT require authentication.
     * @param uniqueFileId Globally unique file identifier
     * @param thumbnail Optional flag to get thumbnail version
     * @returns Promise with the file content as a Blob
     */
    public async getFileContentByUniqueId(
        uniqueFileId: string,
        thumbnail?: boolean
    ): Promise<Blob> {
        return this.fileService.getFileContentByUniqueId(uniqueFileId, thumbnail);
    }

    /**
     * Returns the file metadata (description) corresponding to provided database identifier.
     * @param fileId Database ID of the file
     * @returns Promise with the file description
     */
    public async getFileMetadata(fileId: number): Promise<FileDescription> {
        return this.fileService.getFileMetadata(fileId);
    }

    /**
     * Returns the file metadata (description) corresponding to provided globally unique identifier.
     * @param uniqueFileId Globally unique file identifier
     * @returns Promise with the file description
     */
    public async getFileMetadataByUniqueId(uniqueFileId: string): Promise<FileDescription> {
        return this.fileService.getFileMetadataByUniqueId(uniqueFileId);
    }
}

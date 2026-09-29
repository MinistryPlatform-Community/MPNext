import { MinistryPlatformClient } from "./client";
import { 
    TableService,
    ProcedureService,
    ALLOWED_PROCEDURES,
    CommunicationService,
    MetadataService,
    DomainService,
    FileService
} from "./services";
import type { CommunicationSender, MessageSender } from "./services";
import { 
    TableQueryParams, 
    ProcedureInfo, 
    CommunicationInfo, 
    CommunicationContent,
    Communication, 
    MessageInfo,
    MessageContent,
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
 * MinistryPlatformProvider - Core Provider Singleton
 * 
 * Central orchestrator for all Ministry Platform operations using the Singleton pattern.
 * Manages service instances and provides a unified interface for:
 * - Table operations (CRUD)
 * - Stored procedure execution
 * - Communication/messaging
 * - File management
 * - Metadata operations
 * - Domain configuration
 * 
 * All services share a single MinistryPlatformClient instance for consistent
 * authentication and configuration management.
 */
export class MinistryPlatformProvider {
    
    // Singleton instance storage
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
     * Private constructor for Singleton pattern
     * Initializes the core client and all specialized service instances
     */
    private constructor() {
        // Create the core HTTP client with authentication management
        this.client = new MinistryPlatformClient();
        
        // Initialize all service instances with shared client
        this.tableService = new TableService(this.client);
        this.procedureService = new ProcedureService(this.client);
        this.communicationService = new CommunicationService(this.client);
        this.metadataService = new MetadataService(this.client);
        this.domainService = new DomainService(this.client);
        this.fileService = new FileService(this.client);
    }    
    
    /**
     * Returns the singleton instance of the Ministry Platform provider
     * Creates the instance on first call, returns existing instance on subsequent calls
     * @returns The singleton MinistryPlatformProvider instance
     */
    public static getInstance(): MinistryPlatformProvider {
        // Create instance if it doesn't exist (lazy initialization)
        if (!this.instance) {
            this.instance = new MinistryPlatformProvider();
        }

        return this.instance;
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
     * @param allowedProcedures Extra procedure names this call may run, on top of
     *   {@link ALLOWED_PROCEDURES}. Supplied by `MPHelper` from its constructor
     *   option; it must be a fixed list in code, never derived from request input.
     * @returns Promise with the procedure results
     */
    public async executeProcedure(
        procedure: string, 
        params?: QueryParams,
        allowedProcedures?: Iterable<string>
    ): Promise<unknown[][]> {
        return this.procedureServiceFor(allowedProcedures).executeProcedure(procedure, params);
    }

    /**
     * Executes the requested stored procedure with provided parameters in the request body.
     * @param procedure Stored procedure name
     * @param parameters Parameters to be used for calling stored procedure
     * @param allowedProcedures As for {@link executeProcedure}
     * @returns Promise with the procedure results
     */
    public async executeProcedureWithBody(
        procedure: string, 
        parameters: Record<string, unknown>,
        allowedProcedures?: Iterable<string>
    ): Promise<unknown[][]> {
        return this.procedureServiceFor(allowedProcedures).executeProcedureWithBody(procedure, parameters);
    }

    /**
     * The shared ProcedureService (built-in allowlist only) when no extra names
     * are given; otherwise a short-lived one whose allowlist is the built-in
     * list plus those names. ProcedureService holds only the shared client and
     * a Set, so building one per call is cheap and keeps each caller's
     * allowlist from leaking into anyone else's.
     */
    private procedureServiceFor(allowedProcedures?: Iterable<string>): ProcedureService {
        if (allowedProcedures === undefined) {
            return this.procedureService;
        }
        return new ProcedureService(this.client, {
            allowedProcedures: [...ALLOWED_PROCEDURES, ...allowedProcedures],
        });
    }

    // Communication Service Methods
    /**
     * Creates a new communication, immediately renders it and schedules for delivery.
     * Supports both simple JSON communication and multipart form data with file attachments.
     *
     * The author and From contact come only from `sender`, which the caller must
     * build from trusted server state (see `MPHelper.createCommunication`).
     * @param communication Communication content (author/from fields, if present, are ignored)
     * @param sender Trusted author `User_ID` and From `Contact_ID`
     * @param attachments Optional array of file attachments
     * @returns Promise with the created communication
     */
    public async createCommunication(
        communication: CommunicationContent,
        sender: CommunicationSender,
        attachments?: File[]
    ): Promise<Communication> {
        // CommunicationService rebuilds the payload and stamps AuthorUserId /
        // FromContactId from `sender`, so the content never needs them.
        return this.communicationService.createCommunication(
            communication as CommunicationInfo,
            attachments,
            sender
        );
    }

    /**
     * Creates email messages from the provided information and immediately schedules them for delivery.
     * Supports both simple JSON message and multipart form data with file attachments.
     *
     * The From address comes only from `sender` (see `MPHelper.sendMessage`).
     * @param message Message content (a `FromAddress`, if present, is ignored)
     * @param sender Trusted From address
     * @param attachments Optional array of file attachments
     * @returns Promise with the created communication
     */
    public async sendMessage(
        message: MessageContent,
        sender: MessageSender,
        attachments?: File[]
    ): Promise<Communication> {
        return this.communicationService.sendMessage(message as MessageInfo, attachments, sender);
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

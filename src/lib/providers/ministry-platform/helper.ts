import { MinistryPlatformProvider } from "./provider";
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
  QueryParams,
} from "./types";

/**
 * MPHelper - Main Public API for Ministry Platform Operations
 *
 * Provides a simplified, type-safe interface for all Ministry Platform functionality.
 * Acts as a facade over the ministryPlatformProvider singleton, offering:
 * - Simplified parameter handling
 * - Type safety with generics
 * - Comprehensive error handling and logging
 * - Consistent API patterns across all operations
 *
 * This is the primary entry point for all Ministry Platform operations in the application.
 */
export class MPHelper {
  private provider: MinistryPlatformProvider; // Reference to the singleton provider instance

  /**
   * Creates a new MPHelper instance
   * Gets the singleton provider instance for all operations
   */
  constructor() {
    this.provider = MinistryPlatformProvider.getInstance();
  }

  // =================================================================
  // TABLE SERVICE METHODS
  // =================================================================

  /**
   * Retrieves records from any Ministry Platform table with comprehensive query capabilities
   * @template T The type to deserialize the response records to
   * @param params Configuration object containing table name and query parameters
   * @param params.table - Name of the Ministry Platform table (e.g., 'Contacts', 'Contact_Log')
   * @param params.select - Comma-separated list of columns to retrieve (e.g., 'Contact_ID,Display_Name,Email_Address')
   * @param params.filter - WHERE clause filter (e.g., 'Contact_Status_ID=1 AND Last_Name LIKE "Smith%"')
   * @param params.orderBy - ORDER BY clause (e.g., 'Last_Name,First_Name' or 'Contact_Date DESC')
   * @param params.groupBy - GROUP BY clause for aggregation (e.g., 'Congregation_ID')
   * @param params.having - HAVING clause for grouped results (e.g., 'COUNT(*) > 5')
   * @param params.top - Maximum number of records to return (for pagination)
   * @param params.skip - Number of records to skip (for pagination, use with top)
   * @param params.distinct - Whether to remove duplicate records
   * @param params.userId - User context for security and auditing
   * @param params.globalFilterId - Apply domain global filter by ID
   * @returns Promise resolving to array of records typed as T
   * @throws Error if table doesn't exist, filter is invalid, or authentication fails
   *
   * @example
   * // Get active contacts with basic information
   * const contacts = await mp.getTableRecords<Contact>({
   *   table: 'Contacts',
   *   select: 'Contact_ID,Display_Name,Email_Address,Mobile_Phone',
   *   filter: 'Contact_Status_ID=1',
   *   orderBy: 'Last_Name,First_Name',
   *   top: 100
   * });
   *
   * @example
   * // Get paginated results (second page of 50 records)
   * const contactsPage2 = await mp.getTableRecords<Contact>({
   *   table: 'Contacts',
   *   filter: 'Contact_Status_ID=1',
   *   orderBy: 'Contact_ID',
   *   top: 50,
   *   skip: 50
   * });
   */
  public async getTableRecords<T>(params: {
    table: string;
    select?: string;
    filter?: string;
    orderBy?: string;
    groupBy?: string;
    having?: string;
    top?: number;
    skip?: number;
    distinct?: boolean;
    userId?: number;
    globalFilterId?: number;
  }): Promise<T[]> {
    // Destructure parameters for easier access
    const {
      table,
      select,
      filter,
      orderBy,
      groupBy,
      having,
      top,
      skip,
      distinct,
      userId,
      globalFilterId,
    } = params;

    // Convert simplified parameters to Ministry Platform query format
    const queryParams: TableQueryParams = {
      $select: select,
      $filter: filter,
      $orderby: orderBy,
      $groupby: groupBy,
      $having: having,
      $top: top,
      $skip: skip,
      $distinct: distinct,
      $userId: userId,
      $globalFilterId: globalFilterId,
    };

    // Delegate to provider with formatted parameters
    return await this.provider.getTableRecords<T>(table, queryParams);
  }

  /**
   * Creates new records in the specified Ministry Platform table
   * @template T The type of records being created (must extend TableRecord)
   * @param table - Name of the Ministry Platform table where records will be created
   * @param records - Array of record objects to be created (without IDs, which will be auto-generated)
   * @param params - Optional parameters for the creation operation
   * @param params.$select - Comma-separated list of columns to return in response
   * @param params.$userId - User ID for auditing and security context
   * @returns Promise resolving to array of created records with generated IDs
   * @throws Error if table doesn't exist, records are invalid, or authentication fails
   *
   * @example
   * // Create a single contact record
   * const newContacts = await mp.createTableRecords('Contacts', [{
   *   First_Name: 'John',
   *   Last_Name: 'Doe',
   *   Email_Address: 'john.doe@example.com',
   *   Contact_Status_ID: 1
   * }], {
   *   $select: 'Contact_ID,Display_Name',
   *   $userId: 1
   * });
   *
   * @example
   * // Create multiple contact log entries
   * const contactLogs = await mp.createTableRecords('Contact_Log', [
   *   {
   *     Contact_ID: 12345,
   *     Contact_Date: new Date().toISOString(),
   *     Made_By: 1,
   *     Notes: 'Initial contact via phone'
   *   },
   *   {
   *     Contact_ID: 12346,
   *     Contact_Date: new Date().toISOString(),
   *     Made_By: 1,
   *     Notes: 'Follow-up email sent'
   *   }
   * ]);
   */
  public async createTableRecords<T extends TableRecord = TableRecord>(
    table: string,
    records: T[],
    params?: Pick<TableQueryParams, "$select" | "$userId">
  ): Promise<T[]> {
    // Enhanced logging for debugging and monitoring
    console.log("MPHELPER: createTableRecords called");
    console.log("MPHELPER: table:", table);
    console.log("MPHELPER: records:", JSON.stringify(records, null, 2));
    console.log("MPHELPER: params:", JSON.stringify(params, null, 2));

    try {
      console.log("MPHELPER: About to call provider.createTableRecords");

      // Delegate to provider for actual creation
      const result = await this.provider.createTableRecords<T>(
        table,
        records,
        params
      );

      console.log(
        "MPHELPER: provider.createTableRecords completed successfully"
      );
      console.log(
        "MPHELPER: Result from provider:",
        JSON.stringify(result, null, 2)
      );

      return result;
    } catch (error) {
      // Comprehensive error logging for debugging
      console.error("MPHELPER: Error in createTableRecords:");
      console.error("MPHELPER: Error type:", error?.constructor?.name);
      console.error("MPHELPER: Error message:", (error as Error)?.message);
      console.error("MPHELPER: Error stack:", (error as Error)?.stack);
      console.error("MPHELPER: Full error object:", error);

      // Re-throw the original error to maintain error chain
      throw error;
    }
  }

  /**
   * Updates existing records in the specified Ministry Platform table
   * @template T The type of records being updated (must extend TableRecord)
   * @param table - Name of the Ministry Platform table where records will be updated
   * @param records - Array of record objects to update (must include primary key IDs)
   * @param params - Optional parameters for the update operation
   * @param params.$select - Comma-separated list of columns to return in response
   * @param params.$userId - User ID for auditing and security context
   * @param params.$allowCreate - Whether to create records if they don't exist (upsert functionality)
   * @returns Promise resolving to array of updated records
   * @throws Error if table doesn't exist, records are invalid, IDs not found, or authentication fails
   *
   * @example
   * // Update contact information
   * const updatedContacts = await mp.updateTableRecords('Contacts', [{
   *   Contact_ID: 12345,
   *   First_Name: 'John',
   *   Last_Name: 'Smith', // Changed last name
   *   Email_Address: 'john.smith@example.com',
   *   Mobile_Phone: '555-0123'
   * }]);
   *
   * @example
   * // Update with upsert capability (create if doesn't exist)
   * const upsertedRecords = await mp.updateTableRecords('Contact_Log', [{
   *   Contact_Log_ID: 67890,
   *   Notes: 'Updated notes after follow-up'
   * }], {
   *   $allowCreate: true, // Will create if ID doesn't exist
   *   $userId: 1
   * });
   */
  public async updateTableRecords<T extends TableRecord = TableRecord>(
    table: string,
    records: T[],
    params?: Pick<TableQueryParams, "$select" | "$userId" | "$allowCreate">
  ): Promise<T[]> {
    // Delegate to provider for update operation
    return await this.provider.updateTableRecords<T>(table, records, params);
  }

  /**
   * Deletes multiple records from the specified Ministry Platform table
   * @template T The type of records being deleted (must extend TableRecord)
   * @param table - Name of the Ministry Platform table where records will be deleted
   * @param ids - Array of primary key IDs corresponding to records to be deleted
   * @param params - Optional parameters for the delete operation
   * @param params.$select - Comma-separated list of columns to return for deleted records
   * @param params.$userId - User ID for auditing and security context
   * @returns Promise resolving to array of deleted records (as they existed before deletion)
   * @throws Error if table doesn't exist, IDs not found, or authentication fails
   *
   * @example
   * // Delete specific contact logs
   * const deletedLogs = await mp.deleteTableRecords('Contact_Log', [67890, 67891], {
   *   $userId: 1
   * });
   *
   * @example
   * // Delete multiple contacts and get basic info back
   * const deletedContacts = await mp.deleteTableRecords('Contacts', [12345, 12346], {
   *   $select: 'Contact_ID,Display_Name',
   *   $userId: 1
   * });
   */
  public async deleteTableRecords<T extends TableRecord = TableRecord>(
    table: string,
    ids: number[],
    params?: Pick<TableQueryParams, "$select" | "$userId">
  ): Promise<T[]> {
    // Delegate to provider for delete operation
    return await this.provider.deleteTableRecords<T>(table, ids, params);
  }

  // =================================================================
  // DOMAIN SERVICE METHODS
  // =================================================================

  /**
   * Retrieves basic information about the current Ministry Platform domain
   * @returns Promise resolving to domain configuration and settings
   * @throws Error if authentication fails or domain is inaccessible
   *
   * @example
   * // Get domain configuration
   * const domainInfo = await mp.getDomainInfo();
   * console.log('Organization:', domainInfo.DisplayName);
   * console.log('Time Zone:', domainInfo.TimeZoneName);
   * console.log('Culture:', domainInfo.CultureName);
   * console.log('MFA Enabled:', domainInfo.IsSmsMfaEnabled);
   */
  public async getDomainInfo(): Promise<DomainInfo> {
    // Delegate to provider for domain information retrieval
    return await this.provider.getDomainInfo();
  }

  /**
   * Retrieves available global filters for the domain
   * Global filters provide domain-wide data filtering capabilities
   * @param params - Optional parameters for the global filters request
   * @param params.$ignorePermissions - Whether to ignore user permissions when retrieving filters
   * @param params.$userId - User context for permission-based filter access
   * @returns Promise resolving to array of global filter items with keys and display values
   * @throws Error if authentication fails or filters are inaccessible
   *
   * @example
   * // Get all available global filters
   * const filters = await mp.getGlobalFilters();
   * filters.forEach(filter => {
   *   console.log(`Filter ${filter.Key}: ${filter.Value}`);
   * });
   *
   * @example
   * // Get filters for specific user context
   * const userFilters = await mp.getGlobalFilters({
   *   $userId: 123
   * });
   */
  public async getGlobalFilters(
    params?: GlobalFilterParams
  ): Promise<GlobalFilterItem[]> {
    // Delegate to provider for global filters retrieval
    return await this.provider.getGlobalFilters(params);
  }

  // =================================================================
  // METADATA SERVICE METHODS
  // =================================================================

  /**
   * Triggers an update of the metadata cache on all servers and in all applications
   * Use this method after making schema changes or when experiencing metadata-related issues
   * @returns Promise that resolves when metadata refresh is complete
   * @throws Error if authentication fails or refresh operation is not permitted
   *
   * @example
   * // Refresh metadata cache after schema changes
   * await mp.refreshMetadata();
   * console.log('Metadata cache refreshed successfully');
   */
  public async refreshMetadata(): Promise<void> {
    // Delegate to provider for metadata cache refresh
    return await this.provider.refreshMetadata();
  }

  /**
   * Retrieves the list of tables available to the current user with basic metadata
   * Includes access level information and table descriptions
   * @param search - Optional search term to filter tables by name (case-insensitive)
   * @returns Promise resolving to array of table metadata objects
   * @throws Error if authentication fails or metadata is inaccessible
   *
   * @example
   * // Get all available tables
   * const allTables = await mp.getTables();
   * allTables.forEach(table => {
   *   console.log(`${table.Name}: ${table.AccessLevel}`);
   * });
   *
   * @example
   * // Search for contact-related tables
   * const contactTables = await mp.getTables('contact');
   * contactTables.forEach(table => {
   *   console.log(`Found: ${table.Name} - ${table.AccessLevel}`);
   * });
   */
  public async getTables(search?: string): Promise<TableMetadata[]> {
    // Delegate to provider for table metadata retrieval
    return await this.provider.getTables(search);
  }

  // Procedure Service Methods
  /**
   * Returns the list of procedures available to the current user with basic metadata.
   * @param search Optional search term to filter procedures
   * @returns Promise with an array of ProcedureInfo objects
   */
  public async getProcedures(search?: string): Promise<ProcedureInfo[]> {
    return await this.provider.getProcedures(search);
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
    return await this.provider.executeProcedure(procedure, params);
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
    return await this.provider.executeProcedureWithBody(procedure, parameters);
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
    return await this.provider.createCommunication(communication, attachments);
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
    return await this.provider.sendMessage(message, attachments);
  }

  // File Service Methods
  /**
   * Returns the metadata (descriptions) of the files attached to the specified record.
   * @param params Object containing table name, record ID, and optional parameters
   * @returns Promise with an array of file descriptions
   */
  public async getFilesByRecord(params: {
    table: string;
    recordId: number;
    defaultOnly?: boolean;
  }): Promise<FileDescription[]> {
    const { table, recordId, defaultOnly } = params;
    return await this.provider.getFilesByRecord(table, recordId, defaultOnly);
  }

  /**
   * Uploads and attaches multiple files to the specified record.
   * @param params Object containing table name, record ID, files, and optional upload parameters
   * @returns Promise with an array of uploaded file descriptions
   */
  public async uploadFiles(params: {
    table: string;
    recordId: number;
    files: File[];
    uploadParams?: FileUploadParams;
  }): Promise<FileDescription[]> {
    const { table, recordId, files, uploadParams } = params;
    return await this.provider.uploadFiles(
      table,
      recordId,
      files,
      uploadParams
    );
  }

  /**
   * Updates the content and/or metadata of the file corresponding to provided identifier.
   * @param params Object containing file ID, optional new file content, and update parameters
   * @returns Promise with the updated file description
   */
  public async updateFile(params: {
    fileId: number;
    file?: File;
    updateParams?: FileUpdateParams;
  }): Promise<FileDescription> {
    const { fileId, file, updateParams } = params;
    return await this.provider.updateFile(fileId, file, updateParams);
  }

  /**
   * Deletes the file corresponding to provided identifier.
   * @param params Object containing file ID and optional user ID for auditing
   * @returns Promise that resolves when file is deleted
   */
  public async deleteFile(params: {
    fileId: number;
    userId?: number;
  }): Promise<void> {
    const { fileId, userId } = params;
    return await this.provider.deleteFile(fileId, userId);
  }

  /**
   * Returns the content of the file corresponding to provided globally unique identifier.
   * This method does NOT require authentication.
   * @param params Object containing unique file ID and optional thumbnail flag
   * @returns Promise with the file content as a Blob
   */
  public async getFileContentByUniqueId(params: {
    uniqueFileId: string;
    thumbnail?: boolean;
  }): Promise<Blob> {
    const { uniqueFileId, thumbnail } = params;
    return await this.provider.getFileContentByUniqueId(
      uniqueFileId,
      thumbnail
    );
  }

  /**
   * Returns the file metadata (description) corresponding to provided database identifier.
   * @param params Object containing file ID
   * @returns Promise with the file description
   */
  public async getFileMetadata(params: {
    fileId: number;
  }): Promise<FileDescription> {
    const { fileId } = params;
    return await this.provider.getFileMetadata(fileId);
  }

  /**
   * Returns the file metadata (description) corresponding to provided globally unique identifier.
   * @param params Object containing unique file ID
   * @returns Promise with the file description
   */
  public async getFileMetadataByUniqueId(params: {
    uniqueFileId: string;
  }): Promise<FileDescription> {
    const { uniqueFileId } = params;
    return await this.provider.getFileMetadataByUniqueId(uniqueFileId);
  }
}

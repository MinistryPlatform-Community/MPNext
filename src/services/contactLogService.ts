import { ContactLog } from "@/lib/providers/ministry-platform/models/ContactLog";
import { ContactLogTypes } from "@/lib/providers/ministry-platform/models/ContactLogTypes";
import { ContactLogSchema, ContactLogInput } from "@/lib/providers/ministry-platform/models/ContactLogSchema";
import { MPHelper } from "@/lib/providers/ministry-platform";
import { DomainTimezoneService } from "@/services/domainTimezoneService";

/**
 * ContactLogService - Singleton service for managing contact log operations
 * 
 * This service provides methods to interact with contact log data from Ministry Platform,
 * including searching, retrieving, creating, updating, and deleting contact log records.
 * Uses the singleton pattern to ensure a single instance across the application.
 */
export class ContactLogService {
  private static instance: ContactLogService;
  private mp: MPHelper | null = null;

  /**
   * Private constructor to enforce singleton pattern
   * Initializes the service when instantiated
   */
  private constructor() {
    this.initialize();
  }

  /**
   * Gets the singleton instance of ContactLogService
   * Creates a new instance if one doesn't exist and ensures it's properly initialized
   * 
   * @returns Promise<ContactLogService> - The initialized ContactLogService instance
   */
  public static async getInstance(): Promise<ContactLogService> {
    if (!ContactLogService.instance) {
      ContactLogService.instance = new ContactLogService();
      await ContactLogService.instance.initialize();
    }
    return ContactLogService.instance;
  }

  /**
   * Initializes the ContactLogService by creating a new MPHelper instance
   * This method sets up the Ministry Platform connection helper
   * 
   * @returns Promise<void>
   */
  private async initialize(): Promise<void> {
    this.mp = new MPHelper();
  }

  /**
   * Retrieves all contact log types
   * 
   * @returns Promise<ContactLogTypes[]> - Array of all contact log type records
   */
  public async getContactLogTypes(): Promise<ContactLogTypes[]> {
    const records = await this.mp!.getTableRecords<ContactLogTypes>({
      table: "Contact_Log_Types",
      select: "Contact_Log_Type_ID,Contact_Log_Type,Description",
      top: 100,
      orderBy: "Contact_Log_Type"
    });

    return records;
  }

  /**
   * Searches for contact log records based on contact ID
   * 
   * @param contactId - The contact ID to search for logs
   * @param limit - Maximum number of records to return (default: 50)
   * @returns Promise<ContactLog[]> - Array of matching contact log records
   */
  public async searchContactLogs(contactId?: number, limit: number = 50): Promise<ContactLog[]> {
    let filter = "";
    
    if (contactId) {
      filter = `Contact_ID = ${contactId}`;
    }

    const records = await this.mp!.getTableRecords<ContactLog>({
      table: "Contact_Log",
      filter: filter,
      select: "Contact_Log_ID,Contact_ID,Contact_Date,Made_By,Notes,Contact_Log_Type_ID,Planned_Contact_ID,Contact_Successful,Original_Contact_Log_Entry,Feedback_Entry_ID",
      top: limit,
      orderBy: "Contact_Date DESC"
    });
    
    return records;
  }

  /**
   * Retrieves a specific contact log record by its ID
   * 
   * @param contactLogId - The unique ID of the contact log record
   * @returns Promise<ContactLog | null> - The matching contact log record or null if not found
   */
  public async getContactLogById(contactLogId: number): Promise<ContactLog | null> {
    const records = await this.mp!.getTableRecords<ContactLog>({
      table: "Contact_Log",
      filter: `Contact_Log_ID = ${contactLogId}`,
      select: "Contact_Log_ID,Contact_ID,Contact_Date,Made_By,Notes,Contact_Log_Type_ID,Planned_Contact_ID,Contact_Successful,Original_Contact_Log_Entry,Feedback_Entry_ID",
      top: 1
    });
    
    return records.length > 0 ? records[0] : null;
  }

  /**
   * Retrieves all contact log records for a specific contact
   * 
   * @param contactId - The contact ID to get logs for
   * @returns Promise<ContactLog[]> - Array of contact log records for the contact
   */
  public async getContactLogsByContactId(contactId: number): Promise<ContactLog[]> {
    const records = await this.mp!.getTableRecords<ContactLog>({
      table: "Contact_Log",
      filter: `Contact_ID = ${contactId}`,
      select: "Contact_Log_ID,Contact_ID,Contact_Date,Made_By,Notes,Contact_Log_Type_ID,Planned_Contact_ID,Contact_Successful,Original_Contact_Log_Entry,Feedback_Entry_ID",
      orderBy: "Contact_Date DESC"
    });
    
    return records;
  }

  /**
   * Creates a new contact log record with validation
   * 
   * @param contactLogData - The contact log data to create
   * @param schema - Optional Zod schema for runtime validation (defaults to ContactLogSchema)
   * @returns Promise<ContactLog> - The created contact log record
   */
  public async createContactLog(
    contactLogData: Omit<ContactLogInput, 'Contact_Log_ID'>,
  ): Promise<ContactLog> {
    console.log('ContactLogService.createContactLog - Creating with data:', JSON.stringify(contactLogData, null, 2));

    // Validate non-date fields with the generated schema; Contact_Date is
    // handled separately by DomainTimezoneService since the generated schema
    // expects ISO and MP needs SQL wall-clock in the domain time zone.
    const { Contact_Date, ...rest } = contactLogData;
    const validatedRest = ContactLogSchema
      .omit({ Contact_Log_ID: true, Contact_Date: true })
      .parse(rest);

    const tz = DomainTimezoneService.getInstance();
    const mpDate = await tz.toMpSqlDatetime(Contact_Date);
    console.log('ContactLogService.createContactLog - MP-TZ SQL date:', mpDate);

    const result = await this.mp!.createTableRecords(
      "Contact_Log",
      [{ ...validatedRest, Contact_Date: mpDate }]
    );

    if (!result || result.length === 0) {
      throw new Error('Failed to create contact log record');
    }

    return result[0] as ContactLog;
  }

  /**
   * Updates an existing contact log record with validation
   * 
   * @param contactLogId - The ID of the contact log record to update
   * @param contactLogData - The updated contact log data (partial)
   * @returns Promise<ContactLog> - The updated contact log record
   */
  public async updateContactLog(
    contactLogId: number,
    contactLogData: Partial<Omit<ContactLogInput, 'Contact_Log_ID'>>
  ): Promise<ContactLog> {
    console.log('ContactLogService.updateContactLog - Updating log:', contactLogId);
    console.log('ContactLogService.updateContactLog - Update data:', JSON.stringify(contactLogData, null, 2));

    const { Contact_Date, ...rest } = contactLogData;
    const validatedRest = ContactLogSchema
      .omit({ Contact_Log_ID: true, Contact_Date: true })
      .partial()
      .parse(rest);

    let mpDate: string | undefined;
    if (Contact_Date !== undefined && Contact_Date !== null) {
      const tz = DomainTimezoneService.getInstance();
      mpDate = await tz.toMpSqlDatetime(Contact_Date);
      console.log('ContactLogService.updateContactLog - MP-TZ SQL date:', mpDate);
    }

    const updateData = {
      Contact_Log_ID: contactLogId,
      ...validatedRest,
      ...(mpDate !== undefined ? { Contact_Date: mpDate } : {}),
    };

    const result = await this.mp!.updateTableRecords(
      "Contact_Log",
      [updateData]
    );

    if (!result || result.length === 0) {
      throw new Error('Failed to update contact log record');
    }

    return result[0] as ContactLog;
  }

  /**
   * Deletes a contact log record
   * 
   * @param contactLogId - The ID of the contact log record to delete
   * @returns Promise<void>
   */
  public async deleteContactLog(contactLogId: number): Promise<void> {
    console.log('ContactLogService.deleteContactLog - Deleting log:', contactLogId);
    
    await this.mp!.deleteTableRecords(
      "Contact_Log",
      [contactLogId]
    );
    
    console.log('ContactLogService.deleteContactLog - Successfully deleted');
  }
}

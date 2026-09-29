import "server-only";
import { ContactLog } from "@/lib/providers/ministry-platform/models/ContactLog";
import { ContactLogTypes } from "@/lib/providers/ministry-platform/models/ContactLogTypes";
import { ContactLogSchema, ContactLogInput } from "@/lib/providers/ministry-platform/models/ContactLogSchema";
import { MPHelper } from "@/lib/providers/ministry-platform";
import { sanitizeNumericId } from "@/lib/providers/ministry-platform/utils/filter-sanitize";
import { DomainTimezoneService } from "@/services/domainTimezoneService";
import { AuthorizationService } from "@/services/authorizationService";

/**
 * What a caller may supply when creating a contact log: the subject contact
 * plus the three fields the UI edits (`Contact_Date`, `Contact_Log_Type_ID`,
 * `Notes`).
 *
 * Everything else is absent by construction and stripped at runtime.
 * `Made_By` is stamped server-side from the authorization gate, never accepted
 * from the caller (F4; see `.claude/references/auth.md` § Authorization). The
 * cross-record links and flags — `Planned_Contact_ID`, `Contact_Successful`,
 * `Original_Contact_Log_Entry`, `Feedback_Entry_ID` — are never sent, so MP
 * leaves them at their defaults: no flow in this app sets them, and accepting
 * them would let a caller point a log at any other record (2026-09-28 review).
 */
export type ContactLogCreateInput = Pick<
  ContactLogInput,
  "Contact_ID" | "Contact_Date" | "Notes"
> &
  Partial<Pick<ContactLogInput, "Contact_Log_Type_ID">>;

/**
 * What a caller may supply when updating a contact log: only the three fields
 * the UI edits.
 *
 * `Contact_ID` is absent so a log cannot be re-parented onto a different
 * contact's record, `Made_By` is absent so an edit cannot rewrite who wrote
 * the note (F4, 2026-09-28), and the cross-record links and flags are absent
 * for the same reason as on create. All of them are stripped at runtime.
 */
export type ContactLogUpdateInput = Partial<
  Pick<ContactLogInput, "Contact_Date" | "Contact_Log_Type_ID" | "Notes">
>;

/**
 * Runtime allowlists for the two write paths. A Zod object parse strips keys
 * it does not declare, so anything outside these — `Made_By`, `Contact_ID` on
 * an update, `Feedback_Entry_ID`, `Original_Contact_Log_Entry`, … — is dropped
 * rather than merely untyped. TypeScript is erased at runtime and these
 * payloads arrive over a server action POST, so the types alone guard nothing.
 * `Contact_Date` is validated separately by `DomainTimezoneService`, since the
 * generated schema expects ISO and MP needs SQL wall-clock in the domain zone.
 */
const ContactLogCreateFieldsSchema = ContactLogSchema.pick({
  Contact_ID: true,
  Contact_Log_Type_ID: true,
  Notes: true,
}).partial({ Contact_Log_Type_ID: true });

const ContactLogUpdateFieldsSchema = ContactLogSchema.pick({
  Contact_Log_Type_ID: true,
  Notes: true,
}).partial();

/**
 * Upper bound on the logs returned for one contact. The list page renders them
 * all, newest first, so this only bites on a pathological record — but an
 * unbounded `$top` is a read whose size nobody chose.
 */
export const CONTACT_LOGS_PER_CONTACT_LIMIT = 500;

/**
 * ContactLogService - Singleton service for managing contact log operations
 * 
 * This service provides methods to interact with contact log data from Ministry Platform,
 * including searching, retrieving, creating, updating, and deleting contact log records.
 * Uses the singleton pattern to ensure a single instance across the application.
 *
 * ## Authorization
 *
 * Every method here — reads included — goes through `AuthorizationService`, so
 * a caller that bypasses the gated server actions still cannot reach contact
 * logs without an MP security role. Writes take their `$userId` attribution
 * from the gate's return value rather than resolving the acting user
 * separately. See `.claude/references/auth.md` § Authorization.
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
   * @throws UnauthorizedError when the caller holds no MP security role
   */
  public async getContactLogTypes(): Promise<ContactLogTypes[]> {
    await AuthorizationService.getInstance().requireSecurityRole({
      table: "Contact_Log_Types",
      operation: "read",
    });

    return this.fetchContactLogTypes();
  }

  /**
   * Ungated read of the log-type lookup table. Private: callers either go
   * through {@link getContactLogTypes} or have already passed a stronger gate
   * (a `Contact_Log` write) in the same method.
   */
  private async fetchContactLogTypes(): Promise<ContactLogTypes[]> {
    return this.mp!.getTableRecords<ContactLogTypes>({
      table: "Contact_Log_Types",
      select: "Contact_Log_Type_ID,Contact_Log_Type,Description",
      top: 100,
      orderBy: "Contact_Log_Type"
    });
  }

  /**
   * Refuses a `Contact_Log_Type_ID` that is not a row of `Contact_Log_Types`
   * (e.g. `-7`). `null`/absent means "no type" and is allowed — the UI sends
   * null when none is selected. Call only after the method's write gate.
   */
  private async assertKnownContactLogType(
    typeId: number | null | undefined,
  ): Promise<void> {
    if (typeId === null || typeId === undefined) return;
    const types = await this.fetchContactLogTypes();
    if (!types.some((t) => t.Contact_Log_Type_ID === typeId)) {
      throw new Error("Invalid Contact Log Type ID");
    }
  }

  /**
   * Retrieves a specific contact log record by its ID
   * 
   * @param contactLogId - The unique ID of the contact log record
   * @returns Promise<ContactLog | null> - The matching contact log record or null if not found
   * @throws Error if contactLogId is not a positive integer ID
   * @throws UnauthorizedError when the caller holds no MP security role
   */
  public async getContactLogById(contactLogId: number): Promise<ContactLog | null> {
    await AuthorizationService.getInstance().requireSecurityRole({
      table: "Contact_Log",
      operation: "read",
    });

    const records = await this.mp!.getTableRecords<ContactLog>({
      table: "Contact_Log",
      filter: `Contact_Log_ID = ${sanitizeNumericId(contactLogId, "Contact Log ID")}`,
      select: "Contact_Log_ID,Contact_ID,Contact_Date,Made_By,Notes,Contact_Log_Type_ID,Planned_Contact_ID,Contact_Successful,Original_Contact_Log_Entry,Feedback_Entry_ID",
      top: 1
    });
    
    return records.length > 0 ? records[0] : null;
  }

  /**
   * Retrieves the contact log records for a specific contact, newest first,
   * capped at {@link CONTACT_LOGS_PER_CONTACT_LIMIT}
   *
   * @param contactId - The contact ID to get logs for
   * @returns Promise<ContactLog[]> - Array of contact log records for the contact
   * @throws Error if contactId is not a positive integer ID
   * @throws UnauthorizedError when the caller holds no MP security role
   */
  public async getContactLogsByContactId(contactId: number): Promise<ContactLog[]> {
    await AuthorizationService.getInstance().requireSecurityRole({
      table: "Contact_Log",
      operation: "read",
    });

    const records = await this.mp!.getTableRecords<ContactLog>({
      table: "Contact_Log",
      filter: `Contact_ID = ${sanitizeNumericId(contactId, "Contact ID")}`,
      select: "Contact_Log_ID,Contact_ID,Contact_Date,Made_By,Notes,Contact_Log_Type_ID,Planned_Contact_ID,Contact_Successful,Original_Contact_Log_Entry,Feedback_Entry_ID",
      top: CONTACT_LOGS_PER_CONTACT_LIMIT,
      orderBy: "Contact_Date DESC"
    });

    return records;
  }

  /**
   * Creates a new contact log record with validation
   *
   * @param contactLogData - The contact log data to create; only `Contact_ID`,
   *   `Contact_Date`, `Contact_Log_Type_ID` and `Notes` are used
   * @returns Promise<ContactLog> - The created contact log record
   * @throws Error if a field fails validation or the log type is unknown
   * @throws UnauthorizedError when the caller holds no MP security role
   */
  public async createContactLog(
    contactLogData: ContactLogCreateInput,
  ): Promise<ContactLog> {
    // Gate first. Its return value is the ONLY source of `Made_By` — nothing a
    // caller sends can become the author of a pastoral record (F4).
    const $userId = await AuthorizationService.getInstance().requireSecurityRole({
      table: "Contact_Log",
      operation: "create",
    });

    // Allowlist, not blocklist: see ContactLogCreateFieldsSchema. A smuggled
    // `Made_By`, `Feedback_Entry_ID`, `Original_Contact_Log_Entry`, … is
    // dropped here.
    const { Contact_Date, ...rest } = contactLogData;
    const validatedRest = ContactLogCreateFieldsSchema.parse(rest);

    // The subject contact legitimately comes from the caller (it is the record
    // being viewed), so it is validated as a positive integer ID, not trusted.
    const contactId = sanitizeNumericId(validatedRest.Contact_ID, "Contact ID");

    await this.assertKnownContactLogType(validatedRest.Contact_Log_Type_ID);

    const tz = DomainTimezoneService.getInstance();
    const mpDate = await tz.toMpSqlDatetime(Contact_Date);

    const result = await this.mp!.createTableRecords(
      "Contact_Log",
      [{
        ...validatedRest,
        Contact_ID: contactId,
        Contact_Date: mpDate,
        // Last, so no spread above can override server-stamped attribution.
        Made_By: $userId,
      }],
      { $userId }
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
   * @param contactLogData - The updated contact log data (partial); only
   *   `Contact_Date`, `Contact_Log_Type_ID` and `Notes` are used
   * @returns Promise<ContactLog> - The updated contact log record
   * @throws Error if contactLogId is not a positive integer ID, a field fails
   *   validation, or the log type is unknown
   * @throws UnauthorizedError when the caller holds no MP security role
   */
  public async updateContactLog(
    contactLogId: number,
    contactLogData: ContactLogUpdateInput
  ): Promise<ContactLog> {
    // Gate first. Its return value is the audit attribution (`$userId`) for
    // the edit.
    const $userId = await AuthorizationService.getInstance().requireSecurityRole({
      table: "Contact_Log",
      operation: "update",
    });

    // Validated here as well as in the action: this ID goes into the PUT body,
    // and the service must not rely on its callers for that.
    const logId = sanitizeNumericId(contactLogId, "Contact Log ID");

    // Allowlist, not blocklist: see ContactLogUpdateFieldsSchema. `Contact_ID`
    // and `Made_By` are dropped from whatever the caller sent, and neither is
    // included in the PUT at all:
    //  - MP preserves the contact the log was created against, so a log cannot
    //    be moved onto someone else's record (F4).
    //  - MP preserves the original author. `Made_By` means "who wrote this
    //    note"; stamping the editor here would let any role-holder's trivial
    //    edit erase that (2026-09-28 review). Who edited it is still recorded
    //    in MP's audit log via `$userId`.
    const { Contact_Date, ...rest } = contactLogData;
    const validatedRest = ContactLogUpdateFieldsSchema.parse(rest);

    await this.assertKnownContactLogType(validatedRest.Contact_Log_Type_ID);

    let mpDate: string | undefined;
    if (Contact_Date !== undefined && Contact_Date !== null) {
      const tz = DomainTimezoneService.getInstance();
      mpDate = await tz.toMpSqlDatetime(Contact_Date);
    }

    const updateData = {
      ...validatedRest,
      ...(mpDate !== undefined ? { Contact_Date: mpDate } : {}),
      // Last, so nothing spread above can re-target the write.
      Contact_Log_ID: logId,
    };

    const result = await this.mp!.updateTableRecords(
      "Contact_Log",
      [updateData],
      { $userId }
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
   * @throws Error if contactLogId is not a positive integer ID
   * @throws UnauthorizedError when the caller holds no MP security role
   */
  public async deleteContactLog(contactLogId: number): Promise<void> {
    const $userId = await AuthorizationService.getInstance().requireSecurityRole({
      table: "Contact_Log",
      operation: "delete",
    });

    // Validated here as well as in the action: an array or `"5 OR 1=1"` must
    // never reach the `id=` list of the DELETE.
    const logId = sanitizeNumericId(contactLogId, "Contact Log ID");

    await this.mp!.deleteTableRecords("Contact_Log", [logId], { $userId });
  }
}

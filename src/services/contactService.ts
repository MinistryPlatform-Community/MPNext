import "server-only";
import { CONTACT_SEARCH_MAX_LENGTH, ContactSearch } from "@/lib/dto";
import { MPHelper } from "@/lib/providers/ministry-platform";
import { ContactsSchema } from "@/lib/providers/ministry-platform/models/ContactsSchema";
import {
  sanitizeLikeValue,
  sanitizeGuid,
  sanitizeNumericId,
} from "@/lib/providers/ministry-platform/utils/filter-sanitize";
import { AuthorizationService } from "@/services/authorizationService";

/**
 * The only Contacts columns `updateContact` may write. A Zod object parse
 * strips keys it does not declare, so `Household_ID`, `Contact_Status_ID`,
 * `Contact_ID` or anything else a caller smuggles in is dropped before the PUT
 * — the TypeScript `Pick` on the parameter is erased at runtime and guards
 * nothing.
 */
const ContactUpdateFieldsSchema = ContactsSchema.pick({
  Email_Address: true,
  Mobile_Phone: true,
}).partial();

/**
 * ContactService - Singleton service for managing contact-related operations
 * 
 * This service provides methods to interact with contact data from Ministry Platform,
 * including searching for contacts and retrieving individual contact information.
 * Uses the singleton pattern to ensure a single instance across the application.
 *
 * ## Authorization
 *
 * Every method here — reads included — goes through `AuthorizationService`, so
 * a caller that bypasses the gated server actions still cannot reach MP data
 * without an MP security role. MP data is fetched with this app's
 * client-credentials service account, so MP's own per-user record security
 * never applies; this gate is the only thing that does. See
 * `.claude/references/auth.md` § Authorization.
 */
export class ContactService {
  private static instance: ContactService;
  private mp: MPHelper | null = null;

  /**
   * Private constructor to enforce singleton pattern
   * Initializes the service when instantiated
   */
  private constructor() {
    this.initialize();
  }

  /**
   * Gets the singleton instance of ContactService
   * Creates a new instance if one doesn't exist and ensures it's properly initialized
   * 
   * @returns Promise<ContactService> - The initialized ContactService instance
   */
  public static async getInstance(): Promise<ContactService> {
    if (!ContactService.instance) {
      ContactService.instance = new ContactService();
      await ContactService.instance.initialize();
    }
    return ContactService.instance;
  }

  /**
   * Initializes the ContactService by creating a new MPHelper instance
   * This method sets up the Ministry Platform connection helper
   * 
   * @returns Promise<void>
   */
  private async initialize(): Promise<void> {
    this.mp = new MPHelper();
  }

  /**
   * Searches for contacts based on a search term
   * Performs a fuzzy search across multiple contact fields including name, email, and phone
   * 
   * @param search - The search term to match against contact fields; at most
   *   {@link CONTACT_SEARCH_MAX_LENGTH} characters
   * @returns Promise<ContactSearch[]> - Array of matching contacts (limited to 20 results)
   * @throws Error if the term is not a string, is too long, or contains control characters
   * @throws UnauthorizedError when the caller holds no MP security role
   */
  public async contactSearch(search: string): Promise<ContactSearch[]> {
    await AuthorizationService.getInstance().requireSecurityRole({
      table: "Contacts",
      operation: "read",
    });

    // Capped here, at the interpolation site, not only in the action: the term
    // lands in five LIKE clauses, so an uncapped one from any future caller
    // turns into a multi-megabyte query string.
    if (typeof search === "string" && search.length > CONTACT_SEARCH_MAX_LENGTH) {
      throw new Error(
        `Search term must be ${CONTACT_SEARCH_MAX_LENGTH} characters or fewer`,
      );
    }

    // Every clause below carries `ESCAPE '\'`, which `sanitizeLikeValue`'s
    // escapes depend on. It also rejects non-strings and control characters.
    const term = sanitizeLikeValue(search);
    const filter = ["First_Name", "Last_Name", "Nickname", "Email_Address", "Mobile_Phone"]
      .map((col) => `${col} LIKE '%${term}%' ESCAPE '\\'`)
      .join(" OR ");
    const records = await this.mp!.getTableRecords<ContactSearch>({
      table: "Contacts",
      filter,
      select: "Contact_ID, Contact_GUID,First_Name,Nickname,Last_Name,Email_Address,Mobile_Phone,dp_fileUniqueId AS Image_GUID",
      top: 20
    });
    
    return records;
  }

  /**
   * Retrieves a specific contact by their GUID
   * 
   * @param contactGuid - The unique GUID identifier for the contact
   * @returns Promise<ContactSearch | null> - The matching contact record or null if not found
   * @throws UnauthorizedError when the caller holds no MP security role
   */
  public async getContactByGuid(contactGuid: string): Promise<ContactSearch | null> {
    await AuthorizationService.getInstance().requireSecurityRole({
      table: "Contacts",
      operation: "read",
    });

    const records = await this.mp!.getTableRecords<ContactSearch>({
      table: "Contacts",
      filter: `Contact_GUID = '${sanitizeGuid(contactGuid)}'`,
      select: "Contact_ID, Contact_GUID,First_Name,Nickname,Last_Name,Email_Address,Mobile_Phone,dp_fileUniqueId AS Image_GUID",
      top: 1
    });
    
    // Return the first (and should be only) matching record, or null if not found
    return records.length > 0 ? records[0] : null;
  }

  /**
   * Updates specific fields for a contact
   * 
   * @param contactId - The Contact_ID of the contact to update
   * @param fields - Partial object containing the fields to update (Email_Address, Mobile_Phone);
   *   any other key is dropped
   * @returns Promise<void>
   * @throws Error if contactId is not a positive integer ID or a field fails validation
   * @throws UnauthorizedError when the caller holds no MP security role
   */
  public async updateContact(
    contactId: number,
    fields: Partial<Pick<ContactSearch, "Email_Address" | "Mobile_Phone">>
  ): Promise<void> {
    // F10 (2026-09-12): this write previously took its acting user straight from
    // SessionContextService, which logs and proceeds when none resolves — so an
    // unattributed, unauthorized update to Contacts would have gone through. The
    // gate routes through the same service (the `mp.write.non_user` warning is
    // still emitted) and then refuses. Gate first, so an unauthorized caller
    // gets no argument feedback at all.
    const $userId = await AuthorizationService.getInstance().requireSecurityRole({
      table: "Contacts",
      operation: "update",
    });

    const id = sanitizeNumericId(contactId, "Contact ID");
    const allowed = ContactUpdateFieldsSchema.parse(fields);

    // `Contact_ID` last, so nothing spread above can re-target the write at a
    // different contact than the one that was authorized and logged.
    const record = { ...allowed, Contact_ID: id };

    await this.mp!.updateTableRecords("Contacts", [record], { $userId });
  }
}
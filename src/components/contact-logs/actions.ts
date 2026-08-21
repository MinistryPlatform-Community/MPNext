"use server";

import { ContactLog } from "@/lib/providers/ministry-platform/models/ContactLog";
import { ContactLogTypes } from "@/lib/providers/ministry-platform/models/ContactLogTypes";
import { ContactLogInput } from "@/lib/providers/ministry-platform/models/ContactLogSchema";
import { ContactLogService } from "@/services/contactLogService";
import { AuthorizationService } from "@/services/authorizationService";
import { sanitizeNumericId } from "@/lib/providers/ministry-platform/utils/filter-sanitize";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Contact-log server actions.
 *
 * ## Authorization policy (decided 2026-08-21)
 *
 * **Writes** (`createContactLog`, `updateContactLog`, `deleteContactLog`) require
 * an authenticated session AND an MP security role. Any user holding a security
 * role may edit or delete **any** contact log, including one another user
 * created — ownership (`Made_By`) is deliberately not a factor, because staff
 * need to be able to correct and remove each other's logs. `AuthorizationService`
 * owns the gate; see `.claude/references/auth.md` for the full rationale.
 *
 * **Reads** (`getContactLogTypes`, `getContactLogsByContactId`,
 * `getContactLogById`) require authentication only. Every authenticated user of
 * this app is MP staff who can already see this data in MP itself, so the gate's
 * purpose is write safety, not read confidentiality.
 */

/** Confirms an authenticated session exists. Reads need nothing more than this. */
async function requireSession(): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw new Error("Authentication required");
  }
}

/**
 * Confirms the caller may write to `Contact_Log` and returns their MP `User_ID`.
 *
 * The acting user comes from `SessionContextService` via `AuthorizationService`
 * — the session already carries a resolved `userId` (baked in by `customSession`
 * and cached process-wide by `resolveMpUserId`), so this costs no `dp_Users`
 * round-trip.
 */
async function requireContactLogWriteAccess(
  operation: "create" | "update" | "delete"
): Promise<number> {
  return AuthorizationService.getInstance().requireSecurityRoleForWrite({
    table: "Contact_Log",
    operation,
  });
}

export async function getContactLogTypes(): Promise<ContactLogTypes[]> {
  try {
    await requireSession();

    const contactLogService = await ContactLogService.getInstance();
    const types = await contactLogService.getContactLogTypes();

    return types;
  } catch (error) {
    console.error("Error fetching contact log types:", error);
    throw error instanceof Error ? error : new Error("Failed to fetch contact log types");
  }
}

export async function createContactLog(
  contactLogData: Omit<ContactLogInput, "Contact_Log_ID" | "Made_By">
): Promise<ContactLog> {
  try {
    await requireSession();

    if (!contactLogData.Contact_ID || !contactLogData.Contact_Date || !contactLogData.Notes) {
      throw new Error("Required fields are missing: Contact_ID, Contact_Date, and Notes are required");
    }

    const userId = await requireContactLogWriteAccess("create");

    // Made_By records who made the contact, taken from the acting session.
    const logDataWithUser = {
      ...contactLogData,
      Made_By: userId,
    };

    console.log("createContactLog action - Creating with data:", JSON.stringify(logDataWithUser, null, 2));

    const contactLogService = await ContactLogService.getInstance();
    const contactLog = await contactLogService.createContactLog(logDataWithUser);

    console.log("createContactLog action - Successfully created");
    return contactLog;
  } catch (error) {
    console.error("Error creating contact log:", error);
    throw error instanceof Error ? error : new Error("Failed to create contact log");
  }
}

export async function updateContactLog(
  contactLogId: number,
  contactLogData: Partial<Omit<ContactLogInput, "Contact_Log_ID" | "Made_By">>
): Promise<ContactLog> {
  try {
    await requireSession();

    // Validates at the boundary. TypeScript's `number` is erased at runtime and a
    // caller controls this POST payload's shape, so the ID must be checked here
    // rather than trusted downstream.
    const logId = sanitizeNumericId(contactLogId, "Contact Log ID");

    // Gate the write. The returned User_ID is deliberately NOT written to
    // Made_By: that column records who made the *contact*, not who last edited
    // the row. Under this policy any role-holder may edit anyone's log, so
    // stamping the editor would rewrite the pastoral record's authorship. MP's
    // audit trail already captures the editor via `$userId` in ContactLogService.
    await requireContactLogWriteAccess("update");

    console.log("updateContactLog action - Updating log:", logId);
    console.log("updateContactLog action - Update data:", JSON.stringify(contactLogData, null, 2));

    const contactLogService = await ContactLogService.getInstance();
    const contactLog = await contactLogService.updateContactLog(logId, contactLogData);

    console.log("updateContactLog action - Successfully updated");
    return contactLog;
  } catch (error) {
    console.error("Error updating contact log:", error);
    throw error instanceof Error ? error : new Error("Failed to update contact log");
  }
}

export async function deleteContactLog(contactLogId: number): Promise<void> {
  try {
    await requireSession();

    const logId = sanitizeNumericId(contactLogId, "Contact Log ID");

    await requireContactLogWriteAccess("delete");

    console.log("deleteContactLog action - Deleting log:", logId);

    const contactLogService = await ContactLogService.getInstance();
    await contactLogService.deleteContactLog(logId);

    console.log("deleteContactLog action - Successfully deleted");
  } catch (error) {
    console.error("Error deleting contact log:", error);
    throw error instanceof Error ? error : new Error("Failed to delete contact log");
  }
}

export async function getContactLogsByContactId(contactId: number): Promise<ContactLog[]> {
  try {
    await requireSession();

    const id = sanitizeNumericId(contactId, "Contact ID");

    const contactLogService = await ContactLogService.getInstance();
    const results = await contactLogService.getContactLogsByContactId(id);

    return results;
  } catch (error) {
    console.error("Error fetching contact logs by contact ID:", error);
    throw error instanceof Error ? error : new Error("Failed to fetch contact logs");
  }
}

export async function getContactLogById(contactLogId: number): Promise<ContactLog | null> {
  try {
    await requireSession();

    const logId = sanitizeNumericId(contactLogId, "Contact Log ID");

    const contactLogService = await ContactLogService.getInstance();
    const result = await contactLogService.getContactLogById(logId);

    return result;
  } catch (error) {
    console.error("Error fetching contact log by ID:", error);
    throw error instanceof Error ? error : new Error("Failed to fetch contact log");
  }
}

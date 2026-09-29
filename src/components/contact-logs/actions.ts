"use server";

import { ContactLog } from "@/lib/providers/ministry-platform/models/ContactLog";
import { ContactLogTypes } from "@/lib/providers/ministry-platform/models/ContactLogTypes";
import { ContactLogService } from "@/services/contactLogService";
import type {
  ContactLogCreateInput,
  ContactLogUpdateInput,
} from "@/services/contactLogService";
import { AuthorizationService } from "@/services/authorizationService";
import { sanitizeNumericId } from "@/lib/providers/ministry-platform/utils/filter-sanitize";
import type { MpOperation } from "@/services/authorizationService";

/**
 * Contact-log server actions.
 *
 * ## Authorization policy (writes decided 2026-08-21; reads added 2026-09-12)
 *
 * **Every action here — reads and writes alike — requires an authenticated
 * session AND an MP security role.** Any user holding a security role may read,
 * edit, or delete **any** contact log, including one another user created —
 * ownership (`Made_By`) is deliberately not a factor, because staff need to be
 * able to correct and remove each other's logs.
 *
 * Reads used to require only a session. That was F1 (2026-09-12): MP's OIDC
 * endpoint authenticates ANY `dp_Users` record, and this app reads MP with its
 * own client-credentials service account (`dataplatform/scopes/all`), so MP's
 * per-user record security never applies to what these actions return. A
 * session by itself therefore proved nothing about whether the caller may see
 * pastoral records.
 *
 * Only the actions the contact-log UI calls are exported. Every export of a
 * `"use server"` file is a callable POST endpoint whether or not anything
 * imports it, so the unused `getContactLogsByContactId` / `getContactLogById`
 * reads were removed (2026-09-28). The contact detail page reads its logs
 * through `@/components/contact-lookup-details/actions` instead.
 *
 * `AuthorizationService` owns the gate; see `.claude/references/auth.md` for
 * the full rationale.
 */

/**
 * Confirms the caller may perform `operation` on `Contact_Log` and returns
 * their MP `User_ID`.
 *
 * The gate implies an authenticated session (it fails closed when no MP user
 * resolves), so it replaces the bare session check the reads used to make. The
 * acting user comes from `SessionContextService` via `AuthorizationService` —
 * the session already carries a resolved `userId` (baked in by `customSession`
 * and cached process-wide by `resolveMpUserId`), so this costs no `dp_Users`
 * round-trip. The `dp_User_Roles` read is NOT shared with the service's own
 * gate call: server actions run outside a React render, where the role memo's
 * `cache()` is a passthrough, so each gate call here costs one role read.
 */
async function requireContactLogAccess(operation: MpOperation): Promise<number> {
  return AuthorizationService.getInstance().requireSecurityRole({
    table: "Contact_Log",
    operation,
  });
}

/**
 * Logs an action failure as ONE JSON line. `JSON.stringify` escapes newlines
 * and quotes, so nothing inside the error — which can carry caller-supplied
 * text — can forge a separate structured log line such as a fake
 * `mp.write.unauthorized` event. Carries the action name and the error's name
 * and message only: never the payload, which holds pastoral notes.
 */
function logActionError(action: string, error: unknown): void {
  console.error(
    JSON.stringify({
      event: "contact_log.action_failed",
      action,
      error:
        error instanceof Error
          ? { name: error.name, message: error.message }
          : { name: typeof error },
    }),
  );
}

export async function getContactLogTypes(): Promise<ContactLogTypes[]> {
  try {
    await requireContactLogAccess("read");

    const contactLogService = await ContactLogService.getInstance();
    const types = await contactLogService.getContactLogTypes();

    return types;
  } catch (error) {
    logActionError("getContactLogTypes", error);
    throw error instanceof Error ? error : new Error("Failed to fetch contact log types");
  }
}

export async function createContactLog(
  contactLogData: ContactLogCreateInput
): Promise<ContactLog> {
  try {
    // Gate first: an unauthorized caller gets no argument feedback at all.
    await requireContactLogAccess("create");

    if (!contactLogData.Contact_ID || !contactLogData.Contact_Date || !contactLogData.Notes) {
      throw new Error("Required fields are missing: Contact_ID, Contact_Date, and Notes are required");
    }

    // `Made_By` is deliberately NOT assembled here. The service stamps it from
    // the authorization gate and strips any value the caller sent, so there is
    // exactly one place authorship can come from (F4). The service also drops
    // every field outside its allowlist and checks the log type.
    const contactLogService = await ContactLogService.getInstance();
    const contactLog = await contactLogService.createContactLog(contactLogData);

    return contactLog;
  } catch (error) {
    logActionError("createContactLog", error);
    throw error instanceof Error ? error : new Error("Failed to create contact log");
  }
}

export async function updateContactLog(
  contactLogId: number,
  contactLogData: ContactLogUpdateInput
): Promise<ContactLog> {
  try {
    // Gate first: an unauthorized caller gets no argument feedback at all.
    await requireContactLogAccess("update");

    // Validates at the boundary. TypeScript's `number` is erased at runtime and a
    // caller controls this POST payload's shape, so the ID must be checked here
    // rather than trusted downstream. (The service re-checks it too.)
    const logId = sanitizeNumericId(contactLogId, "Contact Log ID");

    // Neither `Made_By` nor `Contact_ID` is forwarded from the caller, and the
    // service sends neither in the PUT, so an edit can neither move a log onto
    // a different contact's record nor rewrite who wrote it (F4, 2026-09-28).
    // `Made_By` keeps meaning "the original author"; MP's audit trail records
    // every edit, and who made it, via `$userId`.
    const contactLogService = await ContactLogService.getInstance();
    const contactLog = await contactLogService.updateContactLog(logId, contactLogData);

    return contactLog;
  } catch (error) {
    logActionError("updateContactLog", error);
    throw error instanceof Error ? error : new Error("Failed to update contact log");
  }
}

export async function deleteContactLog(contactLogId: number): Promise<void> {
  try {
    await requireContactLogAccess("delete");

    const logId = sanitizeNumericId(contactLogId, "Contact Log ID");

    const contactLogService = await ContactLogService.getInstance();
    await contactLogService.deleteContactLog(logId);
  } catch (error) {
    logActionError("deleteContactLog", error);
    throw error instanceof Error ? error : new Error("Failed to delete contact log");
  }
}

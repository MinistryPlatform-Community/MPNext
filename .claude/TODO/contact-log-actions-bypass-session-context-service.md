# TODO: Contact-log actions re-implement User_ID resolution instead of using `SessionContextService`

**Created:** 2026-08-21
**Severity:** Medium — redundant MP round-trips per write, duplicated logic, and it contradicts the
project's own decided policy on unattributed writes.
**Status:** Open. Refactor, not a bug — behavior is currently correct-ish but the wrong shape.

## Symptom

`src/components/contact-logs/actions.ts` resolves the acting user's MP `User_ID` inline, and does it
**twice** — once in `createContactLog` and again, byte-for-byte, in `updateContactLog`:

```ts
const { MPHelper } = await import("@/lib/providers/ministry-platform");
const mp = new MPHelper();
const users = await mp.getTableRecords<{ User_ID: number }>({
  table: "dp_Users",
  filter: `User_GUID = '${sanitizeGuid(userGuid)}'`,
  select: "User_ID",
  top: 1
});
if (!users || users.length === 0 || !users[0].User_ID) {
  throw new Error("Unable to determine user User_ID");
}
```

Three separate things are wrong with this:

### 1. The work is already done

`src/lib/auth.ts` has `resolveMpUserId`, which performs exactly this `dp_Users` lookup, caches it
process-wide by `User_GUID`, and bakes the result into the session as `session.user.userId` via
`customSession`. The actions ignore that and pay an uncached MP round-trip on **every single write**.

### 2. `SessionContextService` exists for precisely this call site

`src/services/sessionContextService.ts` is documented as the canonical way to get the acting user for
a write:

> "Use this — not `getCurrentUserId` — at every MP write boundary."

`getActingUserIdForWrite({ table, operation })` reads `session.user.userId` (free, already resolved)
and emits a structured `mp.write.non_user` warning when it comes back null. It is fully tested at
100%. Nothing in `contact-logs/actions.ts` calls it.

### 3. Throwing on an unresolved user contradicts the decided policy

The actions throw `"Unable to determine user User_ID"` and abandon the write. `SessionContextService`
was built on the opposite premise — anonymous writes are legitimate and should be *logged*, not
*blocked*, so the unattributed write is visible in production logs and can be investigated. Right now
a user whose `dp_Users` row is missing or whose lookup transiently fails simply cannot save a contact
log at all.

## Fix

Replace both inline blocks with:

```ts
import { sessionContextService } from "@/services/sessionContextService";
...
const userId = await sessionContextService.getActingUserIdForWrite({
  table: "Contact_Log",
  operation: "create",   // or "update"
});
const logDataWithUser = { ...contactLogData, Made_By: userId };
```

Then delete the now-unused `getUserGuid` helper and the `MPHelper`/`sanitizeGuid` imports if nothing
else in the file needs them.

Confirm before doing this that `Made_By` accepts null on the MP side. If it does not, the graceful
path is to omit the field rather than to fail the write — decide and document which.

## Test impact

`src/components/contact-logs/actions.test.ts` mocks `MPHelper.getTableRecords` to satisfy the inline
lookup; those mocks get replaced with a `sessionContextService` mock. Add a case asserting that a
null acting user still performs the write and emits `mp.write.non_user`, which is the behavior change
this refactor is really about.

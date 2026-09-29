# TODO: `next dev` prints server-action arguments by default — pastoral notes and search terms land in the console

**Created:** 2026-09-28
**Severity:** Low — development only, but dev servers point at the shared production MP and handle real member data.
**Confidence:** Confirmed by repro using Next's own formatter; `logging.serverFunctions` defaults to `true` (`node_modules/next/dist/server/config-shared.d.ts:296, 1668`).
**Source:** Auth security review 2026-09-28 (MP-client reviewer).

## Finding

`next.config.ts` has no `logging` key. Next 16's dev server-action logger (`node_modules/next/dist/server/dev/server-action-logger.js`) prints each invoked action with its arguments:

- `updateContactLog(123, {…})` → `{"Contact_Date":…,"Contact_Log_Type_ID":2,"Notes":"CONFIDENTIAL grief counseling note"}`
- `searchContacts` → the search term (an email address or phone number)
- create-log calls happen to be truncated after 3 sorted keys, so `Notes` isn't shown there

This is outside `src/`, so the ESLint `no-console` rule (CLAUDE.md rule 12) cannot catch it.

## Fix

```ts
// next.config.ts
logging: { serverFunctions: false },
```

## How to verify a fix

- Under `next dev`, run a **read-only** action (a contact search with a dummy term) and confirm no `└─ ƒ searchContacts(` line appears. Do not test with a write.
- Optionally a unit test on `next.config.ts` asserting `logging.serverFunctions === false` (there is already `src/lib/next-config-headers.test.ts`).

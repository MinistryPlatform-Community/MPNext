# TODO: Contact-log create/update pass caller-chosen foreign keys and flags straight to MP

**Created:** 2026-09-28
**Severity:** Low — integrity: a role-holder can corrupt cross-record links as MP displays them.
**Confidence:** Confirmed by repro.
**Source:** Auth security review 2026-09-28 (authorization reviewer).

## Finding

`src/services/contactLogService.ts:208-229` (create) and `:262-285` (update) — after Zod validation against `ContactLogSchema`, these caller-supplied fields reach the MP write unchanged:

- `Planned_Contact_ID`, `Original_Contact_Log_Entry`, `Feedback_Entry_ID` — any integer, pointing at any record (including another contact's log/feedback)
- `Contact_Successful`
- `Contact_Log_Type_ID` — even `-7` is accepted

Update can re-point these on any log ID. The UI always sends null on create and never sends them on update, so no legitimate flow needs them. (`Made_By`/`Contact_ID` smuggling — F4 — is correctly closed.)

## Fix

- Allowlist caller input to the fields the UI edits (`Contact_Date`, `Contact_Log_Type_ID`, `Notes`), and have the server set the rest (or omit them).
- If any must stay: validate positive integers that exist and belong to the same `Contact_ID` (read-only lookups).
- Validate `Contact_Log_Type_ID` against `getContactLogTypes()`.

## How to verify a fix

- Tests: a smuggled `Feedback_Entry_ID` / `Original_Contact_Log_Entry` is not sent to `updateTableRecords`/`createTableRecords`; `Contact_Log_Type_ID: -7` is rejected.

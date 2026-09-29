# TODO: Every contact-log edit overwrites `Made_By` (original author), and the docs contradict each other

**Created:** 2026-09-28
**Severity:** Low — integrity of pastoral records: any role-holder's trivial edit erases who wrote the note (only MP's audit log retains it).
**Confidence:** Confirmed by repro (`Made_By: 99` stamped on update) and code reading.
**Source:** Auth security review 2026-09-28 (authorization reviewer).

## Finding

`src/services/contactLogService.ts:279-285`:

```ts
const updateData = { Contact_Log_ID: contactLogId, ...validatedRest, ...,
  // Last, so no spread above can override server-stamped attribution.
  Made_By: $userId };
```

Docs disagree:

- `.claude/references/auth.md:834-836` — deliberate (2026-09-12): `Made_By` on an edited log reads as "the staff member who last wrote the row".
- `.claude/docs/TestCoverage.md:273-276` — "`updateContactLog` no longer stamps `Made_By` with the editor … stamping the editor rewrote the pastoral record's authorship."

Since any role-holder may edit any log (see [Additional Security Hardening](../../docs/security/Additional_Security_Hardening.md)), authorship is trivially rewritable.

## Fix

- Decide and reconcile. Recommended: omit `Made_By` from the update PUT (MP keeps the existing value); edit attribution still flows to `dp_Audit_Log` via `$userId`. Keep stamping on **create**.
- Update whichever doc is wrong.

## How to verify a fix

- Test: `updateContactLog` payload has no `Made_By` (and a caller-supplied `Made_By` is still stripped).

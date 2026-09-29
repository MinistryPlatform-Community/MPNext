# TODO: Service methods rely on the action layer to validate IDs and limits

**Created:** 2026-09-28
**Severity:** Low / Info (latent — no action exposes these paths unvalidated today).
**Confidence:** Confirmed by repro.
**Source:** Auth security review 2026-09-28 (authorization and MP-client reviewers).

## Finding

The rule in `.claude/references/ministryplatform.query-syntax.md:252` is "sanitize at the interpolation site (the service)". Exceptions:

- `src/services/contactLogService.ts:111-131` `searchContactLogs(contactId?, limit?)`: `searchContactLogs(undefined, 1_000_000)` reads **every** pastoral log unfiltered; `limit` goes into `$top` unvalidated (`"50; x"` passes through). No callers today.
- `contactLogService.ts:247-285` / `:307-313` `updateContactLog` / `deleteContactLog`: the log ID isn't validated in the service (`"5 OR 1=1"` reaches the PUT body; an array reaches `id=`). The actions do validate.
- `src/services/authorizationService.ts:159-164` `readSecurityRolesFromMp` is **public** and interpolates `User_ID = ${userId}` unsanitized; only its wrapper sanitizes.
- `contactLogService.ts:166` `getContactLogsByContactId` has no `top` cap.

## Fix

- `sanitizeNumericId` inside each service method that interpolates or writes an ID.
- Cap `limit` (e.g. 1–100) and require `contactId` in `searchContactLogs`, or delete the unused method.
- Make `readSecurityRolesFromMp` private (or sanitize inside it).

## How to verify a fix

- Unit tests calling the service methods directly with `"5 OR 1=1"`, arrays, `1e3`, and huge limits → rejected before any MP call.

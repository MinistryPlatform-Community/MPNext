# TODO: Security roles are matched by editable name, not by Role_ID

**Created:** 2026-09-28
**Severity:** Low — exploiting it needs MP rights to create/rename/assign roles.
**Confidence:** Confirmed by code reading.
**Source:** Auth security review 2026-09-28 (authorization reviewer).
**Related:** [security-mp-security-roles-parsing-fails-open.md](security-mp-security-roles-parsing-fails-open.md)

## Finding

`src/services/authorizationService.ts:58-60, 159-168, 231`: the gate reads role *names* and compares case-insensitively after trimming. MP role names are free text, not guaranteed unique, and editable. A newly created or renamed role called `"pastoral staff "` matches a configured `"Pastoral Staff"`; so does any second role someone gives the same name.

## Fix

- Add `MP_SECURITY_ROLE_IDS` (comma-separated integers, validated with `sanitizeNumericId`) and match `dp_User_Roles.Role_ID`; keep name matching as a deprecated fallback or drop it.

## How to verify a fix

- Tests: a user whose role has the configured *name* but a different ID is refused when IDs are configured.

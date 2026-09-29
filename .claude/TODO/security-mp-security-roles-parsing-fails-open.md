# TODO: `MP_SECURITY_ROLES` cannot express a role name that contains a comma

**Created:** 2026-09-28 (narrowed 2026-09-28)
**Severity:** Low — requires a role whose name contains a comma.
**Source:** Auth security review 2026-09-28 (authorization reviewer).
**Related:** [security-roles-matched-by-name.md](security-roles-matched-by-name.md), [Additional Security Hardening](../../docs/security/Additional_Security_Hardening.md)

## Status

The fail-open half of this finding is **fixed** (2026-09-28): a value that is non-blank
but parses to no names (`","`, `" , , "`) is now treated as unset — it falls through to
`MP_WRITE_SECURITY_ROLES`, and failing that the gate refuses everyone
(`roles_not_configured`) and logs an `mp.authz.config` warning. It is never "any role".
Covered in `src/services/authorizationService.test.ts`.

## Remaining

`MP_SECURITY_ROLES="Staff, Pastoral"` is split on commas, so a single MP role literally
named "Staff, Pastoral" cannot be listed — the value instead permits any role named
"Staff" *or* "Pastoral". Widening, but only if such role names exist.

## Fix

- Match on Role_IDs (integers cannot contain commas) — see
  [security-roles-matched-by-name.md](security-roles-matched-by-name.md). Doing that
  closes this TODO too.

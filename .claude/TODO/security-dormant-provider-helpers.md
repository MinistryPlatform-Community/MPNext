# TODO: Dormant high-privilege provider helpers have no input discipline

**Created:** 2026-09-28
**Severity:** Low / Info (latent — nothing in `src/` reaches these with caller input today).
**Confidence:** Confirmed by code reading.
**Source:** Auth security review 2026-09-28 (MP-client reviewer).
**Related:** [security-file-service-path-traversal.md](security-file-service-path-traversal.md), [security-contact-service-update-contact-mass-assignment.md](security-contact-service-update-contact-mass-assignment.md)

The docs call the services "the last line of defense"; these helpers are thin passthroughs to an admin-level service account.

## Items

- [ ] `services/communication.service.ts:14-50` — caller-controlled `AuthorUserId`, `FromContactId`, `IsBulkEmail`, `FromAddress`: mail can go out "from" anyone through MP. Fix: stamp author/from from the authorization gate's `userId`; allowlist `FromAddress`.
- [ ] `services/procedure.service.ts:29-64` — any procedure name. Fix: identifier regex + an allowlist of procedures the app actually calls.
- [ ] `services/domain.service.ts:32-35` — `$ignorePermissions` passed through. Fix: drop it or hard-code `false` unless a specific caller needs it.
- [ ] `src/services/contactLogService.ts:111-132` — unbounded `limit` (tracked in [security-service-layer-input-validation-gaps.md](security-service-layer-input-validation-gaps.md)).

## How to verify a fix

- Unit tests that smuggled author/from fields are overwritten, unknown procedure names are refused, and `$ignorePermissions` never reaches the request.

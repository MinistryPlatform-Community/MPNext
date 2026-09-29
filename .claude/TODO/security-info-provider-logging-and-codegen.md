# TODO: Info-level provider-layer logging and codegen notes (grouped)

**Created:** 2026-09-28
**Severity:** Info
**Source:** Auth security review 2026-09-28 (MP-client reviewer).
**Related:** [security-log-injection-from-caller-input.md](security-log-injection-from-caller-input.md), [security-resolve-mp-user-id-logs-guid-and-no-negative-cache.md](security-resolve-mp-user-id-logs-guid-and-no-negative-cache.md)

## Items

- [ ] **Raw error objects are logged**, contrary to `docs/security/downstream-hardening-playbook.md:505`, at `services/table.service.ts:23, 43, 62, 84`, the other provider services, `client.ts:65`, `src/services/sessionContextService.ts:45` and the actions. Safe today, but `.json()` is called on any 2xx regardless of Content-Type/size, and V8's `SyntaxError` embeds a fragment of a non-JSON body (repro: `"Jane Doe, "... is not valid JSON`). Fix: log `err.name` + a fixed message; check `content-type` before `.json()`.
- [ ] **File unique IDs in error messages/logs.** `services/file.service.ts:176, 181` and `utils/http-client.ts:24-29` include `uniqueFileId`; MP serves `/files/{uniqueId}` unauthenticated (`file.service.ts:156`), so the ID is a download capability. Fix: replace with `{uniqueId}` in messages.
- [ ] **The type generator writes MP metadata into TypeScript unescaped** (`scripts/generate-types.ts:165, 233, 411, 418`). A `"` in a column name, `*/` in `SpecialPermissions`, or a non-numeric `Size` becomes code injection into committed models. Theoretical — needs MP schema-admin access. Fix: `JSON.stringify` string literals; sanitize comment text; validate numeric fields.
- [ ] **HttpClient POST / DELETE / form-data paths don't log failures** (GET/PUT do, safely). Consistency only.
- [ ] **Token-refresh error log isn't tested for secret omission.** Add a negative test that the client secret never appears in `console.error` args.

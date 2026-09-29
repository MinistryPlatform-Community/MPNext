# TODO: `FileService` builds unencoded URLs, and `..` survives table/proc-name encoding — the service bearer can be aimed at any MP API path

**Created:** 2026-09-28
**Severity:** Low today (not reachable: nothing in `src/` calls FileService, and table/proc names are hard-coded). **High** the moment any server action forwards caller input to these methods.
**Confidence:** Confirmed by repro against a localhost MP mock.
**Source:** Auth security review 2026-09-28 (MP-client reviewer).
**Related:** [security-dormant-provider-helpers.md](security-dormant-provider-helpers.md)

## Finding

- `src/lib/providers/ministry-platform/services/file.service.ts:28, 73, 122, 147, 168, 193, 207`: `table`, `uniqueFileId`, `fileId`, `recordId` are interpolated into paths raw. The URL parser then resolves `..`, and `?`/`#` truncate the rest. `fileId`/`recordId` are typed `number`, but types are erased at runtime.
- `table.service.ts:18, 39, 58, 79` and `procedure.service.ts:36, 56` use `encodeURIComponent`, but `encodeURIComponent("..") === ".."`.
- `utils/http-client.ts:140-158`: `buildQueryString` does not encode keys (`:153`, `:155`).

## Evidence (requests the mock received, each with `Authorization: Bearer SERVICE-TOKEN`)

| Call | Request received |
|---|---|
| `getFileMetadataByUniqueId('../tables/Contacts?$select=Contact_ID,Email_Address&$top=1000#')` | `GET /ministryplatformapi/tables/Contacts?$select=Contact_ID,Email_Address&$top=1000` |
| `getFilesByRecord('../procs/api_Some_Proc?@ContactID=1#', 1)` | `GET /ministryplatformapi/procs/api_Some_Proc?@ContactID=1` |
| `deleteFile('../tables/Contacts?id=1#')` | `DELETE /ministryplatformapi/tables/Contacts?id=1` |
| `getTableRecords('..')` | `GET /ministryplatformapi/` |

## Scenario

A downstream feature adds `getPhotoMetadata(guid)` or `removeAttachment(fileId)` and passes client input through → the caller can read `dp_API_Clients`, run procedures, or delete arbitrary records with the (admin-level) service account.

## Fix

- In FileService: `sanitizeGuid` for unique IDs, `sanitizeNumericId` for `fileId`/`recordId`, `^[A-Za-z_][A-Za-z0-9_]*$` for table names; then `encodeURIComponent` each segment.
- Same identifier regex for table/procedure names in TableService/ProcedureService.
- Central guard in `HttpClient.buildUrl`: reject endpoints containing `..`, `?`, `#`, `\`, `%2e`/`%2f`; assert the resolved URL still starts with `baseUrl + "/"`. Encode query keys.

## How to verify a fix

- Rerun the four calls above → each throws before `fetch`. `file.service.test.ts:508-515` currently pins the unencoded path and must be updated.

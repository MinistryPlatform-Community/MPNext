# Changelog

## [Unreleased]

### Added

- **CreateMpSelection component** — reusable dialog that saves a list of record IDs as a named Selection in Ministry Platform and returns a deep-link URL.
  - Page picker dropdown when multiple `pageOptions` are provided; single-page mode when only one option or a fixed `pageId` is given.
  - Auto-generated timestamped selection name (regenerated on each dialog open).
  - Copy-to-clipboard and "Open in MP" deep-link buttons on success.
  - Client-side and server-side guard against exceeding `MAX_SELECTION_RECORDS` (1,500).
  - `onSuccess` and `onPageChange` callback props.
- **SelectionService** — singleton service wrapping stored procedure calls for selection management.
  - `createSelection()` — calls `api_custom_CreateSelection` stored procedure.
  - `getPages()` — calls `api_custom_GetPages` stored procedure to retrieve page options dynamically.
- **Demo page** (`/create-mp-selection`) — interactive demo that loads 20 contacts with checkboxes, fetches page options from the API, maps record IDs per page type (Contact, Household, Participant, Donor), and wires up the `CreateMpSelection` component.
- **DTO types** — `SelectionResult`, `CreateSelectionInput`, `MpPage` in `src/lib/dto/selections.ts`.
- **Home page card** linking to the Create MP Selection demo.
- **Environment variables**:
  - `MINISTRY_PLATFORM_DOMAIN_ID` — domain ID for stored procedure calls (default `1`).
  - `NEXT_PUBLIC_MINISTRY_PLATFORM_URL` — MP application URL used for deep-link construction (updated docs to clarify this is NOT the API URL).

### Changed

- **HttpClient POST error handling** — POST failures now log the response body and include it in the thrown error message, matching the existing GET behavior.
- **selections DTO cleanup** — removed unused `DpSelectionCreate`, `DpSelectionRecord`, and `DpSelectedRecordCreate` interfaces that referenced inaccessible `dp_*` tables.
- **SelectionService rewrite** — replaced direct `dp_Selections`/`dp_Selected_Records` table inserts (which fail due to API permissions) with the `api_custom_CreateSelection` stored procedure.

### Required Database Objects

This feature depends on two custom stored procedures that must be installed on the Ministry Platform database. See the PR description for full SQL definitions.

#### `api_custom_CreateSelection`

Creates a selection header and its selected records in a single transaction.

| Parameter        | Type           | Description                                      |
| ---------------- | -------------- | ------------------------------------------------ |
| `@DomainID`      | INT            | MP domain ID (usually `1`)                       |
| `@PageID`        | INT            | The MP page the records belong to                |
| `@UserID`        | INT            | `dp_Users.User_ID` of the logged-in user         |
| `@SelectionName` | NVARCHAR(255)  | Display name for the selection                   |
| `@RecordIDs`     | NVARCHAR(MAX)  | Comma-separated record IDs (e.g., `1001,1002`)   |

**Returns:** `{ Selection_ID, Selection_Name, Record_Count }`

#### `api_custom_GetPages`

Returns page metadata from `dp_Pages` (which is not accessible via the REST API).

| Parameter     | Type          | Description                                |
| ------------- | ------------- | ------------------------------------------ |
| `@SearchName` | NVARCHAR(255) | Optional filter on `Display_Name` (LIKE)   |

**Returns:** `{ Page_ID, Display_Name }`

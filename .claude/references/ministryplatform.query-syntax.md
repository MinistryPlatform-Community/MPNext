# MP Query Syntax Reference

This document captures the query syntax accepted by the Ministry Platform REST API's table endpoint —
`GET /tables/{table}` with the query parameters below — which is what `MPHelper.getTableRecords` calls
(`src/lib/providers/ministry-platform/services/table.service.ts`). Use this when writing or reviewing
`select` / `filter` / `orderBy` / `groupBy` / `having` strings.

The syntax is **SQL-style**, not OData. Most "weird" error messages from MP boil down to one of the rules below.

## Parameter names

`MPHelper.getTableRecords` takes a single options object with camelCase keys and maps them onto the
wire parameters. Both spellings appear in this document; the mapping is one-to-one:

| `getTableRecords` option | Wire parameter |
|---|---|
| `select` | `$select` |
| `filter` | `$filter` |
| `orderBy` | `$orderby` |
| `groupBy` | `$groupby` |
| `having` | `$having` |
| `top` | `$top` |
| `skip` | `$skip` |
| `distinct` | `$distinct` |
| `userId` | `$userId` |
| `globalFilterId` | `$globalFilterId` |

`$userId` supplies the MP user context for security and auditing; omitting it runs the read as the
application's service account, which is what every service in `src/services/` does today.
`$globalFilterId` applies a domain global filter by ID. Neither is a substitute for
`AuthorizationService.requireSecurityRole` — see `.claude/references/auth.md` § Authorization.

`HttpClient.buildUrl` runs every parameter **value** through `encodeURIComponent`, so write filters as
plain SQL — do not percent-encode spaces, quotes or `%` wildcards yourself, or they will be
double-encoded.

## Filters (`$filter`) — SQL-style WHERE clauses

- **Null checks**: `Contact_Status_ID IS NULL`, `Email_Address IS NOT NULL` (never use OData `eq null`).
- **Comparisons**: `Contact_Status_ID = 1`, `Start_Date >= '2026-01-01'` (dates must be quoted strings).
- **Multiple conditions**: use `AND` / `OR` (not `&&` / `||`).
- **Wildcards**: `First_Name LIKE 'Chris%'`, `Email_Address LIKE '%@gmail.com'`, `Display_Name LIKE '%Smith%'` (no `CONTAINS` operator).
- **IN lists**: `Contact_Status_ID IN (1, 2, 3)`.
- **Date ranges**: `Start_Date >= '2026-01-01' AND Start_Date < '2026-04-01'` (`BETWEEN` not supported).
- **Subqueries**: strictly prohibited — no `SELECT` inside `$filter`. Use `_TABLE` traversal instead.
- **Date functions**: `GETDATE()` is allowed in comparisons (e.g. `End_Date > GETDATE()`).

## Aggregate Functions in `$select`

- Always include the column name **and** an alias: `COUNT(Contact_ID) AS Count`, `SUM(Donation_Amount) AS Total`, `AVG(Donation_Amount) AS Average`.
- Mix with columns: `Gender_ID, COUNT(Contact_ID) AS Count`.

## GroupBy (`$groupby`) — required with aggregates + non-aggregate columns

- Every non-aggregated column in `$select` must also appear in `$groupby`.
  - `select=Congregation_ID, COUNT(Contact_ID) AS Count`, `groupby=Congregation_ID`.
- Never group by an aggregate or alias — use the actual column name.

## Having (`$having`) — filter on aggregated results

- Used with `$groupby`. Example: `having=COUNT(Contact_ID) > 10`.

## Counting records efficiently

- Prefer `COUNT(<PK>) AS Count` over fetching all rows: `select=COUNT(Contact_ID) AS Count, filter=Contact_Status_ID = 1` returns `[{ "Count": 5432 }]`.
- For counts by category, add `groupby`: `select=Contact_Status_ID, COUNT(Contact_ID) AS Count`, `groupby=Contact_Status_ID`.

## Sorting (`$orderby`)

- `Last_Name ASC`, `Start_Date DESC`, `Last_Name ASC, First_Name ASC`. No `ORDER BY` prefix.

## Pagination

- `top` (max rows) and `skip` (offset). Always set a `top` limit on large datasets.

## Distinct

- Set `distinct=true` to return only unique rows.

## Default Image / File (`dp_fileUniqueId`)

- For photos / images / avatars, add `dp_fileUniqueId AS FileGUID` to `$select`.
- Resolve via `{mp_base_url}/ministryplatformapi/files/{FileGUID}` (null if no file).
- `dp_fileUniqueId` is `$select`-only — cannot be used in `$filter`, `$orderby`, or `$groupby`.

## Foreign Key Traversal (`_TABLE`)

Walk FK relationships inline by suffixing the FK column with `_TABLE`:

```text
select: Contacts.Contact_ID, Contacts.First_Name, Household_ID_TABLE.Address_ID_TABLE.City
filter: Contact_Status_ID = 1
```

**Two critical rules** that bite in practice:

### Rule 1 — Qualify base-table columns when `_TABLE` appears anywhere

When `_TABLE` appears in **any** clause (`$select`, `$filter`, `$orderby`, `$groupby`), every base-table column in `$select` must be qualified with the table name. The underlying SQL becomes a multi-table join and any column name shared with a joined table becomes ambiguous.

**Symptom** — without qualification:

```text
filter: (End_Date IS NULL OR End_Date > GETDATE())
       ↑ also joining via Meeting_Day_ID_TABLE / Congregation_ID_TABLE
→ 500: {"Message":"Ambiguous column name 'End_Date'."}
```

**Fix** — qualify with the base table name:

```text
select: Groups.Group_ID, Groups.Group_Name, Groups.Description, Groups.End_Date,
        Meeting_Day_ID_TABLE.Meeting_Day AS Meeting_Day,
        Congregation_ID_TABLE.Congregation_Name AS Congregation_Name
filter: (Groups.End_Date IS NULL OR Groups.End_Date > GETDATE())
orderBy: Groups.Group_Name
```

This applies even when `_TABLE` is only in `$filter` or `$orderby` — qualify everywhere in `$select` as soon as any clause does FK traversal.

### Rule 2 — Multi-hop traversal: underscore-concatenated, not dotted

For two or more hops, the API expects the FK columns concatenated with `_TABLE_` between them. The leading dot-style chain rejects the second hop as an unknown column.

**Fails**:

```text
select: Group_ID_TABLE.Meeting_Day_ID_TABLE.Meeting_Day AS Meeting_Day
→ 500: {"Message":"Invalid column name 'Meeting_Day_ID_TABLE'."}
```

**Works**:

```text
select: Group_ID_TABLE_Meeting_Day_ID_TABLE.Meeting_Day AS Meeting_Day
```

So a two-hop traversal that starts on `Group_Participants` and reaches the meeting day name on the related group's meeting-day type is:

```text
Group_ID_TABLE_Meeting_Day_ID_TABLE.Meeting_Day AS Meeting_Day
```

Cap traversals at **4 hops max**.

### Aliasing rules across `_TABLE` columns

Joined columns come back with the leaf column name (e.g. `Meeting_Day`). When two joined paths could produce the same leaf name, alias each one explicitly with `AS ...` to avoid collisions in the JSON response.

## Worked Example — "Groups led by a contact"

Illustrative, not lifted from this repo — there is no group feature here today. It is kept because it is
the smallest case that exercises both `_TABLE` rules at once. The option keys are the real
`MPHelper.getTableRecords` surface. For live in-repo examples of `_TABLE` traversal see
`src/services/userService.ts` and `src/services/authorizationService.ts`.

Two parallel queries on `MPHelper.getTableRecords` covering (a) primary contact of the group, and (b) leader-role participation:

```typescript
import { sanitizeNumericId } from "@/lib/providers/ministry-platform/utils/filter-sanitize";

// Validate once; throws "Invalid Contact ID" unless it is a positive safe integer
// (a number, or a digits-only string)
const id = sanitizeNumericId(contactId, "Contact ID");

// Query A: groups where the user is Primary_Contact
{
  table: "Groups",
  select: [
    "Groups.Group_ID",
    "Groups.Group_Name",
    "Groups.Description",
    "Groups.Meeting_Time",
    "Meeting_Day_ID_TABLE.Meeting_Day AS Meeting_Day",
    "Meeting_Frequency_ID_TABLE.Meeting_Frequency AS Meeting_Frequency",
    "Congregation_ID_TABLE.Congregation_Name AS Congregation_Name",
    "Groups.Primary_Contact",
    "Groups.Start_Date",
    "Groups.End_Date",
  ].join(", "),
  filter:
    `Groups.Primary_Contact = ${id} ` +
    `AND (Groups.End_Date IS NULL OR Groups.End_Date > GETDATE())`,
  orderBy: "Groups.Group_Name",
}

// Query B: groups where the user is a leader-role Group_Participant
{
  table: "Group_Participants",
  select: [
    "Group_ID_TABLE.Group_ID AS Group_ID",
    "Group_ID_TABLE.Group_Name AS Group_Name",
    "Group_ID_TABLE.Description AS Description",
    "Group_ID_TABLE.Meeting_Time AS Meeting_Time",
    "Group_ID_TABLE_Meeting_Day_ID_TABLE.Meeting_Day AS Meeting_Day",
    "Group_ID_TABLE_Meeting_Frequency_ID_TABLE.Meeting_Frequency AS Meeting_Frequency",
    "Group_ID_TABLE_Congregation_ID_TABLE.Congregation_Name AS Congregation_Name",
    "Group_ID_TABLE.Primary_Contact AS Primary_Contact",
    "Group_ID_TABLE.Start_Date AS Start_Date",
    "Group_ID_TABLE.End_Date AS End_Date",
  ].join(", "),
  filter:
    `Participant_ID_TABLE.Contact_ID = ${id} ` +
    `AND Group_Role_ID_TABLE.Group_Role_Type_ID = 1 ` +
    `AND (Group_Participants.End_Date IS NULL OR Group_Participants.End_Date > GETDATE()) ` +
    `AND (Group_ID_TABLE.End_Date IS NULL OR Group_ID_TABLE.End_Date > GETDATE())`,
}
```

Notice in Query B that bare `End_Date` is qualified as `Group_Participants.End_Date` and the joined group's end date is `Group_ID_TABLE.End_Date` — both forms exist in the same filter and both are required to avoid ambiguity.

## Quick error-to-fix map

| Error from MP | Likely cause | Fix |
|---|---|---|
| `Ambiguous column name 'X'` | `_TABLE` used somewhere; bare `X` exists on both base and joined tables | Qualify every base-table column with `<Table>.X` in `$select` and any clause that references it |
| `Invalid column name 'X_ID_TABLE'` | Multi-hop traversal written with dots between hops | Concatenate hops with `_TABLE_` instead: `A_ID_TABLE_B_ID_TABLE.Column` |
| `Invalid column name 'X'` (no `_TABLE` suffix) | Column name mis-cased or table mis-chosen | Re-verify against `.claude/references/ministryplatform.schema.md` or the generated model in `src/lib/providers/ministry-platform/models/` |
| Subquery rejected | Used `SELECT` inside `$filter` | Rewrite using `_TABLE` traversal; if not expressible, run two queries and merge in code |
| `BETWEEN` rejected | Used SQL BETWEEN in `$filter` | Rewrite as two comparisons (`>= 'start' AND < 'end'`) |

## Sanitizing interpolated values — MANDATORY

`$filter` becomes a SQL `WHERE` clause, so **every** value interpolated into a filter string must pass
through a sanitizer from `src/lib/providers/ministry-platform/utils/filter-sanitize.ts` first:

| Value | Helper | Pattern (as written in a TS template literal) |
|---|---|---|
| String (equality) | `sanitizeFilterValue(value: string): string` | `Column = '${sanitizeFilterValue(v)}'` |
| String (LIKE) | `sanitizeLikeValue(value: string): string` | `Column LIKE '%${sanitizeLikeValue(v)}%' ESCAPE '\\'` |
| GUID | `sanitizeGuid(guid: string): string` | `Column = '${sanitizeGuid(v)}'` — throws `Invalid GUID format` on non-GUID |
| Numeric ID | `sanitizeNumericId(value: unknown, field?: string): number` | `Column = ${sanitizeNumericId(v, 'Contact ID')}` — unquoted; throws `Invalid <field>` on anything else |

What each one actually enforces:

All three string helpers throw on a non-string (an array or object never gets stringified into the
filter) and on any ASCII control character (C0 range and DEL — NUL, tab, newline, …). Errors name the
kind of value, never the value.

- **`sanitizeFilterValue`** doubles single quotes (`O'Brien` → `O''Brien`). It only makes a value safe
  *inside* a single-quoted literal — it does not otherwise validate, so never use it unquoted. It also
  throws on a non-ASCII single-quote look-alike (U+2018, U+2019, U+201B, U+02BC, U+FF07): doubling only
  escapes U+0027, and whether anything between the API and SQL Server narrows a look-alike to `'` is
  unknown, so an equality match fails closed.
- **`sanitizeLikeValue`** escapes `\`, then the T-SQL LIKE metacharacters `%`, `_` and `[` (`[` opens a
  character class such as `[0-9]` or `[^a]`; `]` and `^` mean nothing outside one), then doubles single
  quotes — so the value is matched literally. Each quote look-alike becomes the `_` wildcard, which can
  never be narrowed into a quote and lets `O’Brien` match `O'Brien` too. The escape character is a
  backslash, so the caller **must** append `ESCAPE '\'` or the escapes are ignored and the wildcards stay
  live. In TypeScript that is written `ESCAPE '\\'`; see `ContactService.contactSearch`, the one place in
  the app that builds a LIKE filter. Length limits are the caller's job: `contactSearch` and the
  `searchContacts` action cap terms at `CONTACT_SEARCH_MAX_LENGTH` (100, in `src/lib/dto/contacts.ts`),
  since the term lands in five `LIKE '%…%'` clauses.
- **`sanitizeGuid`** checks `typeof` first (a one-element array would otherwise stringify into a passing
  value), then validates the canonical 8-4-4-4-12 hex shape, case-insensitively, for any UUID variant
  (MP GUIDs are not all v4). It returns the value unchanged, so it doubles as a shape check —
  `src/lib/auth.ts` uses it that way on the OAuth `sub` claim.
- **`sanitizeNumericId`** accepts a `number`, or a **digits-only** string, and returns a `number`. It
  rejects whitespace padding, signs, decimals, hex, exponent notation, the empty string, `NaN`,
  `Infinity`, zero, negatives, objects, arrays, booleans and bigints, and it caps at
  `Number.isSafeInteger` so a huge value cannot stringify into `1e+21`. The error message names the
  `field` and never echoes the offending value.

A `number` parameter is not exempt. TypeScript annotations are erased at runtime, and server actions
compile to POST endpoints whose payload *shape* the caller controls — so a string does arrive where
the signature says `number`. `getContactLogById('1 OR 1=1')` used to build
`Contact_Log_ID = 1 OR 1=1`, widening a single-record read into a full-table read; see
`.claude/docs/TestCoverage.md` §5.1. Guards of the form `if (!id || id <= 0)` do **not** catch this:
a non-empty string is truthy and `'1 OR 1=1' <= 0` is false.

Sanitize at the interpolation site (the service) — and for an ID written into a request body or an
`id=` list (`updateTableRecords`, `deleteTableRecords`), in the service that builds it — so the service
is safe whoever calls it. Validate again at the action boundary so bad input fails before the service
and the network call. In both layers the **authorization gate runs first** and validation second, so a
caller without a permitted role gets one answer ("not authorized") and learns nothing about which
arguments the endpoint would have accepted.

The **path** is guarded too, independently of the filter. Table and procedure names must be plain
identifiers (`sanitizeIdentifier` in `src/lib/providers/ministry-platform/services/guards.ts`: `^[A-Za-z_][A-Za-z0-9_]*$`, ≤ 128 chars;
throws `Invalid <field>`), so `GET /tables/{table}` cannot be pointed at another endpoint. Below that,
`HttpClient` refuses any endpoint that does not start with `/` or that contains `..`, `?`, `#`, `\`,
`%2e`/`%2f`/`%5c` (any case) or a control character, and re-checks that the resolved URL stays under
the MP base URL — throwing `Refusing unsafe MP API endpoint` (or `Invalid MP API base URL` when the
base URL itself is unset or unparseable). Query parameters go in the params object, never appended to
the endpoint string.

## See also

- `src/lib/providers/ministry-platform/helper.ts` — `MPHelper.getTableRecords` signature.
- `src/lib/providers/ministry-platform/services/table.service.ts` — the endpoint and HTTP verb.
- `src/lib/providers/ministry-platform/utils/filter-sanitize.ts` (+ `.test.ts`) — the four sanitizers and the full rejected-input list.
- `src/services/userService.ts`, `src/services/authorizationService.ts` — services that use `_TABLE` traversal.
- `.claude/references/ministryplatform.schema.md` — table / column / FK reference.

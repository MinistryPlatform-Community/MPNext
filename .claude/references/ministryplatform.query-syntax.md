# MP Query Syntax Reference

This document captures the query syntax accepted by the Ministry Platform REST API's `/tables/{table}/get` endpoint — the surface that `MPHelper.getTableRecords` and the `mp_query` MCP tool both call. Use this when writing or reviewing `select` / `filter` / `orderBy` / `groupBy` / `having` strings.

The syntax is **SQL-style**, not OData. Most "weird" error messages from MP boil down to one of the rules below.

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

Two parallel queries on `MPHelper.getTableRecords` covering (a) primary contact of the group, and (b) leader-role participation:

```typescript
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
    `Groups.Primary_Contact = ${contactId} ` +
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
    `Participant_ID_TABLE.Contact_ID = ${contactId} ` +
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
| `Invalid column name 'X'` (no `_TABLE` suffix) | Column name mis-cased or table mis-chosen | Re-verify via `mp_lookup` — MP names are case-sensitive |
| Subquery rejected | Used `SELECT` inside `$filter` | Rewrite using `_TABLE` traversal; if not expressible, run two queries and merge in code |
| `BETWEEN` rejected | Used SQL BETWEEN in `$filter` | Rewrite as two comparisons (`>= 'start' AND < 'end'`) |

## See also

- `src/lib/providers/ministry-platform/helper.ts` — `MPHelper.getTableRecords` signature.
- `src/services/userService.ts`, `src/services/groupService.ts` — services that use `_TABLE` traversal and table-qualified selects.
- `.claude/references/ministryplatform.schema.md` — table / column / FK reference.

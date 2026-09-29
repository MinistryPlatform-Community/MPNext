# SQL Snippets — MP database side

Scratch notes for work done **directly against the Ministry Platform SQL database**, not through the
REST API. Nothing in `src/` reads any of this; it is here so the recipe is not re-derived each time.

> Requires direct DB access and is outside the API safety rails this app runs under. Treat every
> statement here as a production change to a shared church database.

## Column description metadata (floating helper text in MP)

MP renders a column's SQL extended property `MS_Description` as the floating helper text next to that
field in the MP UI. The generated TypeScript models in
`src/lib/providers/ministry-platform/models/` do **not** carry these descriptions, so this is purely a
DBA-side affordance for MP users.

> **Confirm first.** Adding or updating an extended property is a write to the MP database. Per
> `CLAUDE.md` § Ministry Platform Data Safety, show the user exactly what will change (table, column,
> old → new description) and get an explicit yes before running either procedure.

```sql
EXEC sys.sp_addextendedproperty
  @name = N'MS_Description',
  @value = N'Indicates whether this contact has given express consent to receive text messages.',
  @level0type = N'SCHEMA', @level0name = N'dbo',
  @level1type = N'TABLE',  @level1name = N'Contacts',
  @level2type = N'COLUMN', @level2name = N'Texting_Opt_In_Type_ID'
GO
```

Use `sys.sp_updateextendedproperty` with the same arguments if the property already exists —
`sp_addextendedproperty` errors on a duplicate.

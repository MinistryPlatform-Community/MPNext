# Ministry Platform Code Generators

Two CLI utilities that read your Ministry Platform schema and write source/reference files:

| Script | Purpose | npm script |
|--------|---------|------------|
| `generate-types.ts` | TypeScript interfaces + Zod schemas, one pair per table | `mp:generate`, `mp:generate:models` |
| `generate-storedprocs.ts` | Markdown reference of every stored procedure | `mp:generate:storedprocs` |

## Prerequisites

Both scripts require the same Ministry Platform configuration:

```env
MINISTRY_PLATFORM_BASE_URL=https://your-domain.ministryplatformapi.com
MINISTRY_PLATFORM_CLIENT_ID=your_client_id
MINISTRY_PLATFORM_CLIENT_SECRET=your_client_secret
```

Supports `.env.local`, `.env.development`, and `.env` files (loaded in that order).

---

# Type Generator (`generate-types.ts`)

Generates TypeScript interfaces and Zod schemas from your Ministry Platform database schema.

## Features

- ✅ **Column Metadata**: Generates precise TypeScript interfaces from Ministry Platform's column schema
- ✅ **Type Mapping**: Maps Ministry Platform data types to appropriate TypeScript types
- ✅ **Length Constraints**: Includes max length information for string fields with JSDoc comments
- ✅ **Type Annotations**: Rich type information (email, phone, URL, GUID, etc.)
- ✅ **Foreign Key Documentation**: Automatically documents foreign key relationships
- ✅ **Field Annotations**: Includes comments for primary keys, foreign keys, read-only, and computed fields
- ✅ **Access Level Info**: Documents table access levels and special permissions
- ✅ **Nullable Handling**: Properly handles required vs optional fields
- ✅ **Zod Schema Generation**: Optional runtime validation schemas with length and type constraints
- ✅ **Flexible Output**: Choose your output directory
- ✅ **Search Filtering**: Generate types for specific tables only
- ✅ **Auto-generated Index**: Creates barrel exports for easy importing
- ✅ **Schema Documentation**: Also writes `.claude/references/ministryplatform.schema.md`

## Usage

> **Always pass `--conditions=react-server` to `tsx`.** The generators import `MPHelper`,
> whose MP client starts with `import "server-only"`. Without the flag, `server-only`
> resolves to its throwing entry and the script dies with "This module cannot be imported
> from a Client Component module". The `npm run mp:generate*` scripts already pass it.

### Basic Usage

```bash
# Generate types for all tables
npx tsx --conditions=react-server src/lib/providers/ministry-platform/scripts/generate-types.ts

# Generate with Zod schemas
npx tsx --conditions=react-server src/lib/providers/ministry-platform/scripts/generate-types.ts --zod

# Generate to models directory
npx tsx --conditions=react-server src/lib/providers/ministry-platform/scripts/generate-types.ts -o src/lib/providers/ministry-platform/models
```

### Advanced Options

```bash
# Generate detailed types by sampling records
npx tsx --conditions=react-server src/lib/providers/ministry-platform/scripts/generate-types.ts --detailed

# Generate types for specific tables
npx tsx --conditions=react-server src/lib/providers/ministry-platform/scripts/generate-types.ts --search "Contact"

# Custom output directory with Zod schemas
npx tsx --conditions=react-server src/lib/providers/ministry-platform/scripts/generate-types.ts --output ./src/types/mp --zod

# Detailed mode with custom sample size
npx tsx --conditions=react-server src/lib/providers/ministry-platform/scripts/generate-types.ts --detailed --sample-size 10

# Wipe the output directory before writing
npx tsx --conditions=react-server src/lib/providers/ministry-platform/scripts/generate-types.ts --clean --zod

# Combine options
npx tsx --conditions=react-server src/lib/providers/ministry-platform/scripts/generate-types.ts \
  --detailed \
  --search "Contact" \
  --output ./types \
  --sample-size 5 \
  --zod
```

## Command Line Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--output` | `-o` | Output directory for generated types | `./generated-types` |
| `--search` | `-s` | Filter tables by search term | (none) |
| `--detailed` | `-d` | Generate detailed types by sampling records | `false` |
| `--sample-size` | | Number of records to sample in detailed mode | `5` |
| `--zod` | `-z` | Generate Zod schemas for runtime validation | `false` |
| `--clean` | `-c` | Remove all existing files in output directory before generating | `false` |
| `--help` | `-h` | Show help message | |

Any unrecognized argument beginning with `-` exits with code 1.

`--detailed` only samples records for tables where the API returned no column
metadata; tables that already carry column metadata are generated from it either way.

## Output

For each table the generator writes `<TypeName>.ts`, plus `<TypeName>Schema.ts` when
`--zod` is set, then a barrel `index.ts`. It also writes
`.claude/references/ministryplatform.schema.md` (always, relative to the current working
directory — not to `--output`).

The completion line counts type and schema files only; `index.ts` is written on top of
that total. A full run of `npm run mp:generate:models` currently produces **301 table
types + 301 Zod schemas + `index.ts` = 603 files** in
`src/lib/providers/ministry-platform/models/`, matching the 301 tables listed in
`.claude/references/ministryplatform.schema.md`.

## Output Examples

### Standard Interface

```typescript
/**
 * Interface for Contacts
* Table: Contacts
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Contacts {

  Contact_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 125 characters
   */
  Display_Name: string /* max 125 chars */;

  Prefix_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Prefixes.Prefix_ID

  /**
   * Max length: 254 characters
   */
  Email_Address?: string /* email, max 254 chars */ | null;

  Mobile_Phone?: string /* phone number */ | null;

  Contact_GUID: string /* GUID/UUID */; // Has Default

  // ... additional fields
}

export type ContactsRecord = Contacts;
```

The interface takes the table's name; `<Name>Record` is the alias.

### Zod Schema (with --zod flag)

```typescript
import { z } from 'zod';

export const ContactsSchema = z.object({
  Contact_ID: z.number().int(),
  Display_Name: z.string().max(125),
  Email_Address: z.string().email().max(254).nullable(),
  Mobile_Phone: z.string().nullable(),
  Contact_GUID: z.string().uuid(),
  // ... additional fields
});

export type ContactsInput = z.infer<typeof ContactsSchema>;
```

## Using Generated Types

```typescript
import { MPHelper } from '@/lib/providers/ministry-platform';
import { Contacts, ContactsSchema } from '@/lib/providers/ministry-platform/models';

const mp = new MPHelper();

// Type-safe queries
const contacts = await mp.getTableRecords<Contacts>({
  table: 'Contacts',
  filter: 'Email_Address IS NOT NULL'
});

// With Zod validation at the API boundary
await mp.createTableRecords('Contacts', [incomingData], {
  schema: ContactsSchema
});
```

## Recommended Workflow

1. Regenerate the models directory:
   ```bash
   npm run mp:generate:models
   ```

2. Import and use in your app:
   ```typescript
   import { ContactLog, ContactLogSchema } from '@/lib/providers/ministry-platform/models';
   ```

3. Re-run when the MP schema changes to keep types in sync

Note that `mp:generate:models` passes `--clean`, so it wipes the output directory first.
Do not combine `--clean` with `--search`: the run would delete every existing model file
and regenerate only the matching subset.

---

# Stored Procedure Generator (`generate-storedprocs.ts`)

Generates a Markdown reference of the stored procedures the API account can see, grouped
by name prefix, with a compact signature listing and a per-procedure parameter table.

## Usage

```bash
# Write the default reference document
npm run mp:generate:storedprocs

# Only procedures matching a search term
npx tsx --conditions=react-server src/lib/providers/ministry-platform/scripts/generate-storedprocs.ts -s "Contact"

# Custom output file
npx tsx --conditions=react-server src/lib/providers/ministry-platform/scripts/generate-storedprocs.ts -o ./my-procs-reference.md
```

## Command Line Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--output` | `-o` | Output **file** path | `.claude/references/ministryplatform.storedprocs.md` |
| `--search` | `-s` | Filter procedures by search term | (none) |
| `--help` | `-h` | Show help message | |

There is no `--clean`, `--zod`, `--detailed`, or `--sample-size` here; the script writes a
single file and overwrites it in place. Missing parent directories are created.

## Output

```markdown
# Ministry Platform Stored Procedures Reference

**Generated:** 2026-04-14T16:29:04.473Z
**Procedures:** 532

## Quick Reference
### api_* (526 procedures)
- `api_Advanced_EventsAndRoomsByRecord(@RecordID: Integer32)`

## Detailed Reference
#### api_Advanced_EventsAndRoomsByRecord
| Parameter | Direction | Data Type | Size |
|-----------|-----------|-----------|------|
| @RecordID | Input | Integer32 | -1 |
```

Procedures are grouped by the text before the first underscore, alphabetically, with an
`Other` group last for names that have no underscore.

---

## Package.json Scripts

The repo already defines:

```json
{
  "scripts": {
    "mp:generate": "tsx --conditions=react-server src/lib/providers/ministry-platform/scripts/generate-types.ts",
    "mp:generate:models": "tsx --conditions=react-server src/lib/providers/ministry-platform/scripts/generate-types.ts -o src/lib/providers/ministry-platform/models --zod --clean",
    "mp:generate:storedprocs": "tsx --conditions=react-server src/lib/providers/ministry-platform/scripts/generate-storedprocs.ts"
  }
}
```

Then run with:
```bash
npm run mp:generate
npm run mp:generate:models
npm run mp:generate:storedprocs
```

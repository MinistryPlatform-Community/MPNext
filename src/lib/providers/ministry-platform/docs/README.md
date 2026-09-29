# Ministry Platform Provider

A comprehensive TypeScript SDK for integrating with the Ministry Platform REST API.

## Architecture

The provider follows a clean, layered architecture:

```
MPHelper (Public API)
    ↓
MinistryPlatformProvider (Singleton)
    ↓
Services (Domain-specific logic)
    ↓
MinistryPlatformClient (Core HTTP client)
    ↓
HttpClient (Low-level HTTP operations)
```

## Directory Structure

```
ministry-platform/
├── index.ts                    # Main barrel export
├── client.ts                   # Core MP client (OAuth token lifecycle)
├── provider.ts                 # Main provider class (singleton)
├── helper.ts                   # Public API helper
├── auth/                       # Authentication
│   ├── client-credentials.ts   # OAuth client credentials grant
│   ├── types.ts                # MinistryPlatformProfile (OIDC claims)
│   └── index.ts                # Barrel export
├── services/                   # Service layer
│   ├── table.service.ts
│   ├── procedure.service.ts
│   ├── communication.service.ts
│   ├── metadata.service.ts
│   ├── domain.service.ts
│   ├── file.service.ts
│   ├── guards.ts               # sanitizeIdentifier, errorName (path-segment + log guards)
│   └── index.ts                # Barrel export
├── models/                     # Generated types + Zod schemas (one pair per MP table)
│   ├── Contacts.ts
│   ├── ContactsSchema.ts
│   ├── ...
│   └── index.ts                # Auto-generated barrel export
├── types/                      # Type definitions
│   ├── provider.types.ts
│   ├── user-profile.types.ts
│   └── index.ts
├── utils/                      # Utilities
│   ├── http-client.ts
│   ├── filter-sanitize.ts      # $filter injection guards
│   └── index.ts
├── scripts/                    # Code generation CLIs
│   ├── generate-types.ts
│   ├── generate-storedprocs.ts
│   └── README.md
└── docs/                       # Documentation
    └── README.md
```

`models/` is generated — never edit it by hand. See [scripts/README.md](../scripts/README.md).

## Quick Start

```typescript
import { MPHelper } from '@/lib/providers/ministry-platform';
import { Contacts } from '@/lib/providers/ministry-platform/models';
import { DomainTimezoneService } from '@/services/domainTimezoneService';

const mp = new MPHelper();

// Get contacts
const contacts = await mp.getTableRecords<Contacts>({
  table: 'Contacts',
  filter: 'Contact_Status_ID=1',
  select: 'Contact_ID,Display_Name,Email_Address'
});

// Create contact log. MP stores wall-clock values in the domain's time zone,
// so datetimes must be converted at the boundary — never `new Date().toISOString()`.
const tz = DomainTimezoneService.getInstance();

await mp.createTableRecords('Contact_Log', [{
  Contact_ID: 12345,
  Contact_Date: await tz.toMpSqlDatetime(new Date()),
  Made_By: 1,
  Notes: 'Follow-up call completed'
}]);
```

## Environment Variables

```env
MINISTRY_PLATFORM_BASE_URL=https://your-instance.ministryplatform.com/ministryplatformapi
MINISTRY_PLATFORM_CLIENT_ID=your_client_id
MINISTRY_PLATFORM_CLIENT_SECRET=your_client_secret
```

`MinistryPlatformClient` reads the base URL; `getClientCredentialsToken()` reads the
client ID and secret and requests a token from `{base}/oauth/connect/token`. Tokens are
cached on the client and refreshed 5 minutes ahead of the reported expiry.

## Features

- ✅ Full TypeScript support with comprehensive types
- ✅ Automatic OAuth2 token management
- ✅ Service-oriented architecture
- ✅ Optional Zod schema validation on create/update
- ✅ File upload/download support
- ✅ `$filter` sanitization helpers
- ✅ Clean, standards-compliant code organization
- ✅ Type and stored-procedure generation CLIs from MP schema

## API

Every method below is on `MPHelper`, a facade over the provider singleton.

### Table Operations

```typescript
mp.getTableRecords<T>(params: {
  table: string;
  select?: string;
  filter?: string;
  orderBy?: string;
  groupBy?: string;
  having?: string;
  top?: number;
  skip?: number;
  distinct?: boolean;
  userId?: number;
  globalFilterId?: number;
}): Promise<T[]>

mp.createTableRecords<T>(
  table: string,
  records: T[],
  params?: { $select?: string; $userId?: number; schema?: ZodObject }
): Promise<T[]>

mp.updateTableRecords<T>(
  table: string,
  records: T[],
  params?: {
    $select?: string;
    $userId?: number;
    $allowCreate?: boolean;
    schema?: ZodObject;
    partial?: boolean;
  }
): Promise<T[]>

mp.deleteTableRecords<T>(
  table: string,
  ids: number[],
  params?: { $select?: string; $userId?: number }
): Promise<T[]>
```

`getTableRecords` takes camelCase keys and maps them onto MP's `$`-prefixed query
parameters internally. The write methods take the `$`-prefixed keys directly.

Table names must be plain identifiers (`/^[A-Za-z_][A-Za-z0-9_]*$/`, at most 128
characters); anything else throws `Invalid table name` before a request is built.

### Procedures

```typescript
mp.getProcedures(search?: string): Promise<ProcedureInfo[]>
mp.executeProcedure(procedure: string, params?: QueryParams): Promise<unknown[][]>
mp.executeProcedureWithBody(
  procedure: string,
  parameters: Record<string, unknown>
): Promise<unknown[][]>
```

Both execute methods return an array of result sets (`unknown[][]`), not a flat row array.

**Execution is allowlisted, and the default list is empty.** The service account can run
any procedure MP exposes, including ones that mutate data, so both execute methods refuse
a name unless it is a plain identifier (`/^[A-Za-z_][A-Za-z0-9_]*$/`, at most 128
characters) *and* on the allowlist. Matching is exact and case-sensitive, and the refusal
happens before any token or network work. Out of the box `ALLOWED_PROCEDURES` is `[]`, so
every execute call fails with `Procedure is not on the allowlist`. `getProcedures` is
metadata only and is not gated.

To enable a procedure, give the `MPHelper` that calls it a fixed list. (Hypothetical
example — there is no `StatsService` or `api_MyChurch_Get_Stats` in this repo.)

```typescript
// Hypothetical src/services/statsService.ts: the allowlist sits next to its only caller
const STATS_PROCEDURES = ['api_MyChurch_Get_Stats'] as const;

export class StatsService {
  private mp = new MPHelper({ allowedProcedures: STATS_PROCEDURES });

  async getStats(congregationId: number) {
    await AuthorizationService.getInstance().requireSecurityRole({ /* ... */ });
    return this.mp.executeProcedure('api_MyChurch_Get_Stats', {
      '@CongregationID': sanitizeNumericId(congregationId, 'congregation ID'),
    });
  }
}
```

- The list is per `MPHelper` instance and adds to `ALLOWED_PROCEDURES`. Other helper
  instances, including every existing service's `new MPHelper()`, stay deny-all.
- Names are validated when the helper is constructed. An invalid name throws
  `Invalid allowed procedure name` at startup, not on first use.
- Keep the list a constant in code, never built from request input. The allowlist is
  the only thing stopping a caller-chosen name from reaching a mutating procedure.
- No library file changes, so a fork can enable procedures without editing
  `services/procedure.service.ts`. Adding a name app-wide by editing `ALLOWED_PROCEDURES`
  there still works, but then every helper instance can run it.

### Communications

```typescript
mp.createCommunication(
  communication: CommunicationContent,   // CommunicationInfo minus AuthorUserId / FromContactId
  sender: CommunicationSender,           // { authorUserId, fromContactId }
  attachments?: File[]
): Promise<Communication>

mp.sendMessage(
  message: MessageContent,               // MessageInfo minus FromAddress
  sender: MessageSender,                 // { fromAddress: { DisplayName, Address } }
  attachments?: File[]
): Promise<Communication>
```

When `attachments` is non-empty the request goes out as multipart form data, otherwise as JSON.

**The sender is a required, separate argument, and it must be trusted.** The service
account can send as anyone, and `MPHelper` has no session and no authorization gate of
its own. So the author and From contact (or From address) come only from `sender`. Any
`AuthorUserId`, `FromContactId` or `FromAddress` left on the content is ignored and
overwritten. The call is refused before anything is sent if `sender` is missing or
malformed.

The caller is a service method that has already run
`AuthorizationService.requireSecurityRole`. It builds `sender` from the `User_ID` that gate
returned and a contact (or address) that user may send as, looked up server-side. It never
builds `sender` from request input such as form fields, server action arguments or query
strings.

```typescript
const userId = await AuthorizationService.getInstance().requireSecurityRole({
  table: 'dp_Communications',
  operation: 'create',
});
const fromContactId = await this.getContactIdForUser(userId); // server-side lookup
await mp.createCommunication(content, { authorUserId: userId, fromContactId });
```

The content itself is validated too. The payload is rebuilt from the known fields only, so
extra keys are dropped. `CommunicationType` must be `Email`, `Text` or `Letter`. IDs must be
positive integers. Subjects and display names must not contain control characters, and
addresses must be single plain addresses.

### Files

```typescript
mp.getFilesByRecord(params: {
  table: string;
  recordId: number;
  defaultOnly?: boolean;
}): Promise<FileDescription[]>

mp.uploadFiles(params: {
  table: string;
  recordId: number;
  files: File[];
  uploadParams?: FileUploadParams;
}): Promise<FileDescription[]>

mp.updateFile(params: {
  fileId: number;
  file?: File;
  updateParams?: FileUpdateParams;
}): Promise<FileDescription>

mp.deleteFile(params: { fileId: number; userId?: number }): Promise<void>

mp.getFileMetadata(params: { fileId: number }): Promise<FileDescription>

mp.getFileMetadataByUniqueId(params: {
  uniqueFileId: string;
}): Promise<FileDescription>

// Does NOT require authentication.
mp.getFileContentByUniqueId(params: {
  uniqueFileId: string;
  thumbnail?: boolean;
}): Promise<Blob>
```

`FileUploadParams` is `{ description?, isDefaultImage?, longestDimension?, userId? }`;
`FileUpdateParams` adds `fileName?`.

### Metadata

```typescript
mp.getTables(search?: string): Promise<TableMetadata[]>
mp.refreshMetadata(): Promise<void>
```

### Domain

```typescript
mp.getDomainInfo(): Promise<DomainInfo>
mp.getGlobalFilters(params?: { $userId?: number }): Promise<GlobalFilterItem[]>
```

`$ignorePermissions` is not supported. Requests already run as the admin-level service
account, and `DomainService` drops the flag even if a JavaScript caller sends it.

## Zod Validation

`createTableRecords` and `updateTableRecords` accept an optional `schema`. When it is
present each record is parsed before the API call and the parsed result — not the original
object — is what gets sent. A failure throws `Validation failed for record {index}: ...`,
naming the offending array index, and the `schema` key is stripped from the params
forwarded to Ministry Platform.

`partial` applies to `updateTableRecords` only:

- `partial: true` (the default) validates against `schema.partial()`, so a record carrying
  just a primary key and one changed field passes.
- `partial: false` validates against the full schema, so every required field must be present.

`createTableRecords` has no `partial` option — creates are always validated against the
full schema.

```typescript
import { ContactLogSchema } from '@/lib/providers/ministry-platform/models';

await mp.updateTableRecords('Contact_Log', [{
  Contact_Log_ID: 67890,
  Notes: 'Updated notes after follow-up'
}], {
  schema: ContactLogSchema,
  partial: true,
  $userId: 1
});
```

## Filter Sanitization

`$filter` maps to a SQL `WHERE` clause, so every interpolated value must be sanitized.
`utils/filter-sanitize.ts` exports:

```typescript
sanitizeFilterValue(value: string): string  // doubles single quotes, for `= '...'`
sanitizeLikeValue(value: string): string    // also escapes % _ \ ; caller adds ESCAPE
sanitizeGuid(guid: string): string          // validates 8-4-4-4-12 hex, throws otherwise
sanitizeNumericId(value: unknown, field?: string): number  // positive safe integer, throws otherwise
```

These are not re-exported from the `utils` barrel; import them by path:

```typescript
import { sanitizeNumericId } from '@/lib/providers/ministry-platform/utils/filter-sanitize';
```

## Best Practices

1. Always use TypeScript generics for type safety
2. Sanitize every value interpolated into a `filter` string
3. Convert datetimes with `DomainTimezoneService` at the MP boundary
4. Use Zod schemas for validation on create and update
5. Call the provider from a service class in `src/services/`, not from components
6. Batch operations when possible

## Code Generation

```bash
# Generate types for all tables into ./generated-types
npm run mp:generate

# Regenerate models/ with Zod schemas, cleaning the directory first
npm run mp:generate:models

# Regenerate the stored procedure reference
npm run mp:generate:storedprocs

# Or use directly with options
npx tsx --conditions=react-server src/lib/providers/ministry-platform/scripts/generate-types.ts --help
```

See [scripts/README.md](../scripts/README.md) for full documentation.

For detailed API documentation, see Ministry Platform API docs.

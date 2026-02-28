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
├── client.ts                   # Core MP client
├── provider.ts                 # Main provider class
├── helper.ts                   # Public API helper
├── auth/                       # Authentication
│   ├── client-credentials.ts   # OAuth client credentials
│   ├── types.ts                # Auth-related types
│   └── index.ts                # Barrel export
├── services/                   # Service layer
│   ├── table.service.ts
│   ├── procedure.service.ts
│   ├── communication.service.ts
│   ├── metadata.service.ts
│   ├── domain.service.ts
│   └── file.service.ts
├── models/                     # Data models
│   ├── congregations.ts
│   ├── contact-log.ts
│   └── contact-log-types.ts
├── types/                      # Type definitions
│   ├── provider.types.ts
│   └── user-profile.types.ts
├── utils/                      # Utilities
│   └── http-client.ts
└── docs/                       # Documentation
    └── README.md
```

## Quick Start

```typescript
import { MPHelper } from '@/lib/providers/ministry-platform';

const mp = new MPHelper();

// Get contacts
const contacts = await mp.getTableRecords<Contact>({
  table: 'Contacts',
  filter: 'Contact_Status_ID=1',
  select: 'Contact_ID,Display_Name,Email_Address'
});

// Create contact log
await mp.createTableRecords('Contact_Log', [{
  Contact_ID: 12345,
  Contact_Date: new Date().toISOString(),
  Made_By: 1,
  Notes: 'Follow-up call completed'
}]);
```

## Environment Variables

```env
MINISTRY_PLATFORM_BASE_URL=https://your-instance.ministryplatform.com
MINISTRY_PLATFORM_CLIENT_ID=your_client_id
MINISTRY_PLATFORM_CLIENT_SECRET=your_client_secret
```

## Features

- ✅ Full TypeScript support with comprehensive types
- ✅ Automatic OAuth2 token management
- ✅ Service-oriented architecture
- ✅ Zod schema validation
- ✅ Better Auth integration
- ✅ File upload/download support
- ✅ Comprehensive error handling
- ✅ Clean, standards-compliant code organization
- ✅ Type generation CLI from MP schema

## API

### Table Operations

```typescript
mp.getTableRecords<T>(params)
mp.createTableRecords<T>(table, records, params?)
mp.updateTableRecords<T>(table, records, params?)
mp.deleteTableRecords<T>(table, ids, params?)
```

### Procedures

```typescript
mp.executeProcedure(procedure, params?)
mp.executeProcedureWithBody(procedure, parameters)
```

### Communications

```typescript
mp.createCommunication(communication, attachments?)
mp.sendMessage(message, attachments?)
```

### Files

```typescript
mp.uploadFiles(params)
mp.getFilesByRecord(params)
mp.updateFile(params)
mp.deleteFile(params)
```

### Metadata

```typescript
mp.getTables(search?)
mp.refreshMetadata()
mp.getDomainInfo()
mp.getGlobalFilters(params?)
```

## Best Practices

1. Always use TypeScript generics for type safety
2. Handle errors with try-catch blocks
3. Cache frequently accessed data
4. Use Zod schemas for validation
5. Batch operations when possible

## Type Generation

Generate TypeScript interfaces and Zod schemas from your MP schema:

```bash
# Generate types for all tables
npm run mp:generate

# Generate to models directory with Zod schemas
npm run mp:generate:models

# Or use directly with options
npx tsx src/lib/providers/ministry-platform/scripts/generate-types.ts --help
```

See [scripts/README.md](../scripts/README.md) for full documentation.

For detailed API documentation, see Ministry Platform API docs.

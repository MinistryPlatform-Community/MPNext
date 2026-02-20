# CLAUDE.md - MPNext Development Guide

This guide provides essential information for AI assistants (like Claude) working on the MPNext project.

## Commands

- **Dev**: `npm run dev` (Next.js dev server)
- **Build**: `npm run build` (production build with Turbopack, runs type checking)
- **Lint**: `npm run lint` (ESLint CLI — `next lint` was removed in Next.js 16)
- **Generate MP Types**: `npm run mp:generate:models` (generates TypeScript types + Zod schemas from Ministry Platform API, cleans output directory first)
- **Tests**: `npm test` (Vitest in watch mode), `npm run test:run` (single run), `npm run test:coverage` (with coverage)
- **Setup**: `npm run setup` (interactive project setup wizard), `npm run setup:check` (validate setup without changes)

### Type Generation Notes

- Generated types automatically quote field names with special characters (e.g., `"Allow_Check-in"`)
- The `mp:generate:models` script uses `--clean` flag to remove old files before regenerating
- Manual generation with options: `tsx src/lib/providers/ministry-platform/scripts/generate-types.ts --help`

## Architecture

- **Framework**: Next.js 16 (App Router, Turbopack) with React 19, TypeScript strict mode
- **Ministry Platform Integration**: Custom provider at `src/lib/providers/ministry-platform/` with REST API client, auth, and type-safe models
- **Auth**: Better Auth with Ministry Platform OAuth via genericOAuth plugin — see **[Auth Reference](.claude/references/auth.md)** for full details
  - **Key files**: `src/lib/auth.ts` (server config), `src/lib/auth-client.ts` (client), `src/proxy.ts` (route protection)
  - **Critical**: `session.user.id` is Better Auth's internal ID, NOT the MP User_GUID. Use `session.user.userGuid` for all MP API lookups.
  - **Stateless Sessions**: JWT cookie cache, no database; `customSession` does name splitting only (no API calls)
  - **Required Environment Variables**: `MINISTRY_PLATFORM_BASE_URL`, `BETTER_AUTH_URL` (or `NEXTAUTH_URL` fallback), `BETTER_AUTH_SECRET` (or `NEXTAUTH_SECRET` fallback)
- **Services Layer**: Singleton service classes in `src/services/` wrap MPHelper for domain logic (ContactService, ContactLogService, ToolService, UserService)
- **Contexts**: React context providers in `src/contexts/` (UserProvider) composed in `src/app/providers.tsx`; `useAppSession()` wraps Better Auth's `authClient.useSession()`
- **UI**: Radix UI primitives + shadcn/ui components in `src/components/ui/`, Tailwind CSS v4
- **Validation**: Zod v4 (`zod@^4.3`) — note: different API from Zod v3 (e.g., `z.object()` vs `z.interface()`)
- **Path Alias**: `@/*` maps to `src/*`

## Next.js 16 Notes

- **Proxy (formerly Middleware)**: Route protection lives in `src/proxy.ts` with an exported `proxy()` function (not `middleware.ts`/`middleware()`)
- **Turbopack**: Default bundler for both `dev` and `build` — no `--turbopack` flag needed
- **ESLint**: Uses `eslint .` directly (not `next lint`); config is native flat config in `eslint.config.mjs`
- **Async Dynamic APIs**: `params`, `searchParams`, `cookies()`, `headers()` must always be awaited — synchronous access is removed
- **Dev output**: `next dev` outputs to `.next/dev` (not `.next`)

## Code Style

- **Imports**: Use `@/` alias for all internal imports
- **Components**: React Server Components by default, "use client" only when needed for interactivity
- **Types**: TypeScript interfaces exported from models, Zod schemas for validation
- **Naming**:
  - PascalCase for components/types
  - camelCase for functions/variables
  - kebab-case for all component files and folders
  - snake_case for Ministry Platform API fields
- **Exports**: Use named exports for all components (no default exports)
- **UI Components**: Keep in `src/components/ui/` following shadcn conventions
- **Feature Components**: Organize in kebab-case folders with index.ts barrel exports
- **Actions**:
  - Feature-specific actions: co-locate in component folder as `actions.ts`
  - Shared actions: place in `src/components/shared-actions/`
- **Ministry Platform Structure**:
  - Database models (generated): `src/lib/providers/ministry-platform/models/` - auto-generated from DBMS
  - Zod schemas (generated): `src/lib/providers/ministry-platform/models/*Schema.ts` - for optional runtime validation
  - DTOs/ViewModels (hand-written): `src/lib/dto/` - application-level data transfer objects
  - Services (hand-written): `src/services/` - singleton classes wrapping MPHelper for domain operations
- **Validation**: 
  - Use optional `schema` parameter in `createTableRecords()` and `updateTableRecords()` for runtime validation before API calls
  - For updates, set `partial: false` to require all fields (default is `partial: true` for partial updates)
  - Validation errors provide detailed feedback with record index and field-level issues

## Component Organization

```
src/components/
├── layout/               # Layout components (AuthWrapper, Header, Sidebar, DynamicBreadcrumb)
├── shared-actions/       # Shared actions used across features
├── ui/                   # shadcn/ui components
└── feature-name/         # Feature components (kebab-case)
    ├── feature-name.tsx
    ├── actions.ts        # Feature-specific server actions
    └── index.ts          # Barrel exports
```

## Data Flow

Server actions in `actions.ts` should call **service classes** (not MPHelper directly):

```
Component → Server Action → Service (singleton) → MPHelper → Ministry Platform API
```

## Import Patterns

```typescript
// Feature components (using barrel exports)
import { ContactLookup } from '@/components/contact-lookup';

// Layout components (using barrel export)
import { AuthWrapper, Header, Sidebar } from '@/components/layout';

// Application DTOs
import { ContactSearch, ContactLookupDetails } from '@/lib/dto';

// Service classes (used in server actions)
import { ContactService } from '@/services/contactService';

// React contexts
import { UserProvider, useUser, useAppSession } from '@/contexts';

// Better Auth (server-side)
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
const session = await auth.api.getSession({ headers: await headers() });

// Better Auth (client-side)
import { authClient } from '@/lib/auth-client';
const { data: session, isPending } = authClient.useSession();

// Ministry Platform models (generated)
import { ContactLog, Congregation } from '@/lib/providers/ministry-platform/models';

// Ministry Platform Zod schemas (for runtime validation)
import { ContactLogSchema } from '@/lib/providers/ministry-platform/models';

// Ministry Platform helper (used by services, not directly by components)
import { MPHelper } from '@/lib/providers/ministry-platform';

// Feature-specific actions (relative path within same folder)
import { searchContacts } from './actions';

// Shared actions (used across multiple features)
import { getCurrentUserProfile } from '@/components/shared-actions/user';

// Named exports (required)
export function MyComponent() { ... }  // ✅ Correct
export default MyComponent;            // ❌ Avoid
```

## Key Development Practices

1. **Always use the `@/` path alias** for imports instead of relative paths
2. **Prefer Server Components** - only use "use client" when absolutely necessary
3. **Follow naming conventions strictly** - kebab-case for files/folders, PascalCase for components
4. **Use named exports** - no default exports
5. **Co-locate feature code** - keep actions.ts with their related components
6. **Never manually edit generated files** - regenerate types using `npm run mp:generate:models`
7. **Use TypeScript strict mode** - all code must be type-safe
8. **Validate at API boundaries** - use Zod schemas with the `schema` parameter in `createTableRecords()` and `updateTableRecords()` for runtime validation
9. **Use service classes in server actions** - call services from `src/services/`, not MPHelper directly from components or actions

## Validation Best Practices

When working with Ministry Platform data:

```typescript
import { MPHelper } from '@/lib/providers/ministry-platform';
import { ContactLogSchema } from '@/lib/providers/ministry-platform/models';

const mp = new MPHelper();

// ✅ Good: Validate data before creating records
await mp.createTableRecords('Contact_Log', records, {
  schema: ContactLogSchema,
  $userId: currentUser.Contact_ID
});

// ✅ Good: Partial validation for updates (default)
await mp.updateTableRecords('Contact_Log', partialRecords, {
  schema: ContactLogSchema,
  partial: true, // default, allows partial updates
  $userId: currentUser.Contact_ID
});

// ✅ Good: Strict validation for full record updates
await mp.updateTableRecords('Contact_Log', fullRecords, {
  schema: ContactLogSchema,
  partial: false, // require all fields
  $userId: currentUser.Contact_ID
});

// ⚠️ Acceptable: Skip validation (backward compatible)
await mp.createTableRecords('Contact_Log', records, {
  $userId: currentUser.Contact_ID
});
```

## Reference Documents

For detailed context on specific areas, see:

- **[Auth Reference](.claude/references/auth.md)** - Better Auth configuration, OAuth flow, session access patterns, `userGuid` vs `user.id`, and known limitations
- **[Components Reference](.claude/references/components.md)** - Detailed inventory of all components, their purposes, server actions, and compliance status
- **[Ministry Platform Schema](.claude/references/ministryplatform.schema.md)** - Auto-generated summary of Ministry Platform database tables, primary keys, and foreign key relationships

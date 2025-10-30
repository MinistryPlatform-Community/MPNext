# AGENTS.md - MPNext Development Guide

## Commands
- **Dev**: `npm run dev` (Next.js dev server)
- **Build**: `npm run build` (production build, runs type checking)
- **Lint**: `npm run lint` (ESLint)
- **Generate MP Types**: `npm run mp:generate:models` (generates TypeScript types + Zod schemas from Ministry Platform API, cleans output directory first)
- **Tests**: No test framework configured yet

### Type Generation Notes
- Generated types automatically quote field names with special characters (e.g., `"Allow_Check-in"`)
- The `mp:generate:models` script uses `--clean` flag to remove old files before regenerating
- Manual generation with options: `tsx src/lib/providers/ministry-platform/scripts/generate-types.ts --help`

## Architecture
- **Framework**: Next.js 15 (App Router) with React 19, TypeScript strict mode
- **Ministry Platform Integration**: Custom provider at `src/lib/providers/ministry-platform/` with REST API client, auth, and type-safe models
- **Auth**: NextAuth v5 (beta) with Ministry Platform OAuth provider (`src/auth.ts`)
  - **OIDC Logout**: Implements RP-initiated logout flow to properly end Ministry Platform OAuth sessions
  - **Required Environment Variables**: `MINISTRY_PLATFORM_BASE_URL`, `NEXTAUTH_URL`
  - **MP OAuth Setup**: Requires Post-Logout Redirect URIs configured in Ministry Platform OAuth client (see README.md)
- **UI**: Radix UI primitives + shadcn/ui components in `src/components/ui/`, Tailwind CSS v4
- **Path Alias**: `@/*` maps to `src/*`

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
  - Shared actions: place in `src/components/actions/`
- **Ministry Platform Structure**:
  - Database models (generated): `src/lib/providers/ministry-platform/models/` - auto-generated from DBMS
  - Zod schemas (generated): `src/lib/providers/ministry-platform/models/*Schema.ts` - for optional runtime validation
  - DTOs/ViewModels (hand-written): `src/lib/dto/` - application-level data transfer objects
- **Validation**: Use optional `schema` parameter in `createTableRecords()` and `updateTableRecords()` for runtime validation before API calls

## Component Organization
```
src/components/
├── actions/              # Shared actions used across features
├── ui/                   # shadcn/ui components
├── feature-name/         # Feature components (kebab-case)
│   ├── feature-name.tsx
│   ├── actions.ts        # Feature-specific server actions
│   └── index.ts          # Barrel exports
└── shared-component.tsx  # Shared/layout components
```

## Import Patterns
```typescript
// Feature components (using barrel exports)
import { ContactLookup } from '@/components/contact-lookup';

// Application DTOs
import { ContactSearch, ContactLookupDetails } from '@/lib/dto';

// Ministry Platform models (generated)
import { ContactLog, Congregation } from '@/lib/providers/ministry-platform/models';

// Ministry Platform Zod schemas (for validation)
import { ContactLogSchema } from '@/lib/providers/ministry-platform/models';

// Ministry Platform helper
import { MPHelper } from '@/lib/providers/ministry-platform';

// Feature-specific actions (relative path within same folder)
import { searchContacts } from './actions';

// Cross-feature actions
import { getCurrentUserProfile } from '@/components/user-menu/actions';

// Shared actions
import { sharedAction } from '@/components/actions/shared';

// Named exports (required)
export function MyComponent() { ... }  // ✅ Correct
export default MyComponent;            // ❌ Avoid
```

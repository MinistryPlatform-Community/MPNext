# AGENTS.md - MPNext Development Guide

## Commands
- **Dev**: `pnpm dev` (Next.js dev server)
- **Build**: `pnpm build` (production build, runs type checking)
- **Lint**: `pnpm lint` (ESLint)
- **Generate MP Types**: `pnpm mp:generate:models` (generates Zod schemas and types from Ministry Platform API)
- **Tests**: No test framework configured yet

## Architecture
- **Framework**: Next.js 15 (App Router) with React 19, TypeScript strict mode
- **Ministry Platform Integration**: Custom provider at `src/lib/providers/ministry-platform/` with REST API client, auth, and type-safe models
- **Auth**: NextAuth v5 (beta) with Ministry Platform OAuth provider (`src/auth.ts`)
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
  - DTOs/ViewModels (hand-written): `src/lib/dto/` - application-level data transfer objects

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

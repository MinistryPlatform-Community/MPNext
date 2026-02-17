# CLAUDE.md - MPNext Development Guide

This guide provides essential information for AI assistants (like Claude) working on the MPNext project.

## Git & Pull Request Workflow

**IMPORTANT: This is a FORK repository**

- **Origin**: `The-Moody-Church/mp-charts` (THIS fork - where we work)
- **Upstream**: `MinistryPlatform-Community/MPNext` (upstream project)

### Creating Pull Requests

**CRITICAL**: ALWAYS create PRs on the FORK repository, NEVER on upstream!

```bash
# ✅ CORRECT: Create PR on fork
gh pr create --repo The-Moody-Church/mp-charts --title "..." --body "..."

# ❌ WRONG: Do NOT create PRs on upstream
gh pr create --title "..." --body "..."  # This defaults to upstream!
```

**Why this matters**:
- This is a fork of the upstream project
- PRs should be created on the fork (The-Moody-Church/mp-charts) for review
- Only create PRs on upstream when explicitly requested
- Always use `--repo The-Moody-Church/mp-charts` flag with gh pr create

### Auto-Commit `.claude/settings.local.json`

When committing changes, if `.claude/settings.local.json` has pending modifications, include it in the commit. This file tracks Claude Code permission settings and should stay in sync.

### Handling `package-lock.json` and `next-env.d.ts`

Both files are committed to the repo and must NOT be added to `.gitignore`.

- **`package-lock.json`**: Commit when dependencies are intentionally added, removed, or updated. Discard changes caused by running `npm install` without modifying `package.json` (e.g., switching branches, peer dependency metadata churn).
- **`next-env.d.ts`**: Commit when upgrading Next.js versions (the file content may legitimately change). Discard changes caused by running `next dev` or `next build` locally that only shuffle import paths or reference styles.

**Rule of thumb**: If the change is a side effect of running a local command (not an intentional dependency or framework change), discard it with `git checkout -- <file>`.

## Commands

- **Dev**: `npm run dev` (Next.js dev server)
- **Build**: `npm run build` (production build, runs type checking)
- **Lint**: `npm run lint` (ESLint)
- **Generate MP Types**: `npm run mp:generate:models` (generates TypeScript types + Zod schemas from Ministry Platform API, cleans output directory first)
- **Tests**: `npm test` (Vitest in watch mode), `npm run test:run` (single run), `npm run test:coverage` (with coverage)

### Type Generation Notes

- Generated types automatically quote field names with special characters (e.g., `"Allow_Check-in"`)
- The `mp:generate:models` script uses `--clean` flag to remove old files before regenerating
- Manual generation with options: `tsx src/lib/providers/ministry-platform/scripts/generate-types.ts --help`

## Architecture

- **Framework**: Next.js 16 (App Router) with React 19, TypeScript strict mode
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
  - Shared actions: place in `src/components/shared-actions/`
- **Ministry Platform Structure**:
  - Database models (generated): `src/lib/providers/ministry-platform/models/` - auto-generated from DBMS
  - Zod schemas (generated): `src/lib/providers/ministry-platform/models/*Schema.ts` - for optional runtime validation
  - DTOs/ViewModels (hand-written): `src/lib/dto/` - application-level data transfer objects
- **Validation**: 
  - Use optional `schema` parameter in `createTableRecords()` and `updateTableRecords()` for runtime validation before API calls
  - For updates, set `partial: false` to require all fields (default is `partial: true` for partial updates)
  - Validation errors provide detailed feedback with record index and field-level issues

## Component Organization

```
src/components/
├── shared-actions/       # Shared actions used across features
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

// Ministry Platform Zod schemas (for runtime validation)
import { ContactLogSchema } from '@/lib/providers/ministry-platform/models';

// Ministry Platform helper (main API entry point)
import { MPHelper } from '@/lib/providers/ministry-platform';

// Feature-specific actions (relative path within same folder)
import { searchContacts } from './actions';

// Shared actions (used across multiple features)
import { getCurrentUserProfile } from '@/components/shared-actions/user';

// Named exports (required)
export function MyComponent() { ... }  // ✅ Correct
export default MyComponent;            // ❌ Avoid
```

## Chart Formatting Standards

All time-series charts must use consistent short date labels on the X-axis:

| View | Format | Example | `toLocaleDateString` options |
|------|--------|---------|------------------------------|
| **Monthly** | `Mon YY` | "Feb 26", "Sep 25" | `{ month: 'short', year: '2-digit' }` |
| **Weekly** | `Mon D` | "Feb 1", "Feb 8" | `{ month: 'short', day: 'numeric' }` |

**Do NOT** use full month names ("February", "September") as X-axis labels — they take too much space and are inconsistent across charts.

Charts that follow this standard:
- `AttendanceChart` — monthly and weekly views
- `CommunityAttendanceChart` — monthly and weekly views
- `SmallGroupTrends` — monthly only

When adding new time-series charts, use the same `toLocaleDateString('en-US', ...)` pattern with the options above.

## Key Development Practices

1. **Always use the `@/` path alias** for imports instead of relative paths
2. **Prefer Server Components** - only use "use client" when absolutely necessary
3. **Follow naming conventions strictly** - kebab-case for files/folders, PascalCase for components
4. **Use named exports** - no default exports
5. **Co-locate feature code** - keep actions.ts with their related components
6. **Never manually edit generated files** - regenerate types using `npm run mp:generate:models`
7. **Use TypeScript strict mode** - all code must be type-safe
8. **Validate at API boundaries** - use Zod schemas with the `schema` parameter in `createTableRecords()` and `updateTableRecords()` for runtime validation
9. **Report file changes** - after completing work, always report in chat which files were **created**, **modified**, or **removed**

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

## Memory & Context Management

AI assistants should maintain context files in `.claude/` to track project state:

### Context Files

- **[work-in-progress.md](.claude/work-in-progress.md)** - Current implementation status, known issues, recent changes
- **[session-summary-YYYY-MM-DD.md](.claude/)** - Dated session summaries (create new file per session)
- **[community-attendance-debugging.md](.claude/community-attendance-debugging.md)** - Feature-specific debugging notes
- **[references/components.md](.claude/references/components.md)** - Component inventory
- **[references/ministryplatform.schema.md](.claude/references/ministryplatform.schema.md)** - DB schema (auto-generated)

### Update Workflow

**When to update context files:**
1. **Before every push to remote** → Update `session-summary-YYYY-MM-DD.md` with what was committed and pushed
2. **Before creating PRs** → Ensure `session-summary-YYYY-MM-DD.md` and `work-in-progress.md` are up to date and included in the PR
3. **After completing significant features** → Update `work-in-progress.md` with current status
4. **When fixing bugs** → Update feature-specific debugging docs
5. **When patterns change** → Update this CLAUDE.md file

**Key rule**: Session notes are updated **incrementally as work happens**, not batched at the end. Every `git push` should include updated session notes reflecting the changes being pushed.

**Detecting session end:**
- AI assistants cannot automatically detect session end
- **Respond to user cues**: "thanks", "that's all", "we're done", "end of session"
- **User can request**: "Create a session summary" or "Update context files"
- At session end, ensure the session summary is complete and committed

**What to include in session summaries:**
- File paths with line numbers for changes
- Algorithm/approach descriptions
- Before/after comparisons for significant refactors
- Known issues and their status
- Testing notes and verification steps
- Files modified organized by category (Core Logic, Components, Documentation)

**Best practices:**
- Keep dated session summaries separate (don't overwrite old ones)
- Update `work-in-progress.md` as single source of truth for current state
- Use clear status markers: ✅ COMPLETED, ⚠️ IN PROGRESS, ❌ BLOCKED
- Session summaries are historical records; work-in-progress is living document
- **IMPORTANT**: Before every `git push` or PR creation:
  1. Update `session-summary-YYYY-MM-DD.md` with the changes being pushed
  2. Update `work-in-progress.md` if implementation status changed
  3. Include the updated context files in the commit being pushed
  4. This ensures documentation stays in sync with code changes at every push, not just at session end

## Reference Documents

For detailed context on specific areas, see:

- **[Components Reference](.claude/references/components.md)** - Detailed inventory of all components, their purposes, server actions, and compliance status
- **[Ministry Platform Schema](.claude/references/ministryplatform.schema.md)** - Auto-generated summary of Ministry Platform database tables, primary keys, and foreign key relationships

# CLAUDE.md - MPNext Development Guide

This guide provides essential information for AI assistants (like Claude) working on the MPNext project.

## Ministry Platform Data Safety — MANDATORY

**NEVER delete, update, or create records in Ministry Platform without explicit user confirmation first.** No exceptions. No agents. No scripts. No "cleanup" operations. No "it's just one record." No "it's obviously safe."

Ministry Platform is a shared production database containing real church member data — contacts, communications, subscriptions, donations, groups, events. Unauthorized writes can affect thousands of people.

**Before ANY write operation** (`DELETE`, `UPDATE`, `INSERT`, or any API call that modifies data — including `deleteTableRecords`, `updateTableRecords`, `createTableRecords`, stored procedures that mutate state, or any HTTP `POST`/`PUT`/`DELETE` to the MP API):

1. **Stop.** Do not execute the operation.
2. **Show the user** exactly what will be affected: the table name, the record IDs, the fields that will change, and the old → new values where applicable.
3. **Wait for the user to explicitly say yes** before proceeding.
4. If the user says no, do not retry or suggest alternatives unless asked.

**Read-only operations are always fine** — `SELECT` queries, `GET` requests, `getTableRecords` calls. Only writes require confirmation.

**This rule applies to:**
- The main agent
- All subagents and background agents
- All general-purpose, Explore, and Plan agents
- All one-off scripts (e.g., `npx tsx` scripts)
- All automated cleanup, migration, or fix operations
- All hooks and scheduled tasks

**There are zero exceptions.** If you think "this is obviously safe and I don't need to ask," you are wrong. Ask anyway.

## Commands

- **Dev**: `npm run dev` (Next.js dev server)
- **Build**: `npm run build` (production build with Turbopack, runs type checking)
- **Lint**: `npm run lint` (ESLint CLI — `next lint` was removed in Next.js 16)
- **Generate MP Types**: `npm run mp:generate:models` (generates TypeScript types + Zod schemas from Ministry Platform API, cleans output directory first)
- **Generate MP Types (custom)**: `npm run mp:generate` (same generator, no preset flags — pass your own)
- **Generate MP Stored Procs**: `npm run mp:generate:storedprocs` (regenerates `.claude/references/ministryplatform.storedprocs.md`)
- **Tests**: `npm test` (Vitest in watch mode), `npm run test:run` (single run), `npm run test:coverage` (with coverage — thresholds are enforced, see Testing)
- **Setup**: `npm run setup` (interactive project setup wizard), `npm run setup:check` (validate setup without changes)
- **Dependencies**: `npm run deps:relock` (regenerate `package-lock.json` — the only supported way), `npm run deps:verify` (check it for platform drift)

### Dependency Rule — MANDATORY

**Never regenerate `package-lock.json` with a bare `npm install` or `npm dedupe` on Windows.** Use `npm run deps:relock`.

This repo's lockfile is authored on Windows and installed by CI on Linux. npm resolves optional and bundled subtrees per platform, so a Windows-generated lockfile can omit entries `npm ci` on Linux requires — CI then dies at the install step before any test runs. This broke `main` twice (2026-05-17 `@emnapi/*`, 2026-08-21 `ajv`). One `npm dedupe` on Windows is enough to reproduce it.

Critically, **`npm ci --dry-run` cannot detect this on Windows** — it exits 0 there against a lockfile that fails on Linux, and `--os`/`--cpu` do not change that. So a green local check proves nothing; run `npm run deps:verify`, which asserts the lockfile already matches Linux resolution.

A pre-commit hook (`.githooks/pre-commit`, auto-installed via the `prepare` script) and a `lockfile` CI job both enforce this. Full detail: **[Dependency Known Issues](.claude/references/deps-known-issues.md)** § Lockfile platform drift.

Also: do not run `npm ci` while `next dev` is running — it deletes `node_modules` first, then aborts on a locked native `.node` file, leaving the tree half-installed. Stop the dev server first.

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
  - **Stateless Sessions**: JWT cookie cache, no database; `customSession` splits the name *and* resolves the MP `User_ID` from `dp_Users` (one call per user per process, cached; failures are not cached and never block session creation)
  - **Required Environment Variables**: `MINISTRY_PLATFORM_BASE_URL`, `BETTER_AUTH_URL` (or `NEXTAUTH_URL` fallback), `BETTER_AUTH_SECRET` (or `NEXTAUTH_SECRET` fallback), `OIDC_CLIENT_ID`/`OIDC_CLIENT_SECRET` (end-user OAuth login), `MINISTRY_PLATFORM_CLIENT_ID`/`MINISTRY_PLATFORM_CLIENT_SECRET` (all server-side MP data access, including the role gate)
  - **Authorization Environment Variables**: `MP_SECURITY_ROLES` (comma-separated MP security role names permitted to use the gated features, reads *and* writes; blank means "any MP security role will do"). Deprecated write-only predecessor `MP_WRITE_SECURITY_ROLES` is still read when `MP_SECURITY_ROLES` is unset.
- **Services Layer**: Singleton service classes in `src/services/` wrap MPHelper for domain logic
  - Domain: `ContactService`, `ContactLogService`, `UserService`
  - Cross-cutting: `AuthorizationService` (MP security-role gate, exports `UnauthorizedError`), `SessionContextService` (resolves the acting MP `User_ID` for audit attribution), `DomainTimezoneService` (all datetime conversion at the MP boundary)
- **Contexts**: React context providers in `src/contexts/` (`UserProvider`/`useUser` from `user-context.tsx`) composed in `src/app/providers.tsx`; `useAppSession()` (`session-context.tsx`) wraps Better Auth's `authClient.useSession()`
- **Error Boundaries**: `src/app/global-error.tsx` (root, replaces the whole document), `src/app/error.tsx` (root segment), and `src/app/(web)/error.tsx` (protected shell, keeps header/sidebar alive) — so one throw no longer takes the whole page
- **Security Headers**: `src/lib/security-headers.ts` builds the policy; `src/proxy.ts` applies it with a fresh per-request nonce. See **[Security Headers](.claude/references/security-headers.md)**.
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
- **Exports**: Use named exports for all components (no default exports). One exception: `src/app/` route files — `page.tsx`, `layout.tsx`, `error.tsx`, `global-error.tsx` — must default-export, because the App Router requires it.
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
├── shared-actions/       # Shared actions used across features (user.ts, domain.ts)
├── ui/                   # shadcn/ui components (19)
└── feature-name/         # Feature components (kebab-case)
    ├── feature-name.tsx
    ├── feature-name.test.tsx  # Co-located test
    ├── actions.ts        # Feature-specific server actions
    ├── actions.test.ts
    └── index.ts          # Barrel exports
```

Current feature folders: `contact-logs/`, `contact-lookup/`, `contact-lookup-details/`, `home-demos/`, `sign-in/`, `user-menu/`.

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
import { ContactLog, Congregations } from '@/lib/providers/ministry-platform/models';

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
10. **Authorize, don't just authenticate** - feature server actions AND service methods that touch Ministry Platform data must call `AuthorizationService` (`requireSecurityRole`, for reads as well as writes), never a bare `auth.api.getSession()` check. A session proves only that some MP user signed in; all MP data is fetched with the app's service account, so the role gate is the only thing that decides who may see or change it. See **[Auth Reference](.claude/references/auth.md)** § Authorization.
    - **Deliberate carve-outs**: three call sites touch no per-person MP data and use a plain session check instead — `layout/auth-wrapper.tsx` (it *is* the session gate), `shared-actions/user.ts` (the user's own profile), and `shared-actions/domain.ts` (the domain-wide time zone). Each documents why in-file. Adding a fourth needs the same justification.
11. **Convert all date/time values at the MP boundary** - use `DomainTimezoneService` (never raw `new Date(x).toISOString()` or `getFullYear()`) when sending or receiving datetime fields, since MP stores wall-clock values in the domain's time zone, not UTC. See **[Date/Time Handling Reference](.claude/references/ministryplatform.datetimehandling.md)**.
12. **No debug logging in `src/`** - `console.log`/`.info`/`.debug` are not allowed outside `scripts/`; log errors with identifiers (table, IDs, status), never record content, `$filter` strings, or request bodies. MP data is member PII and pastoral notes. This is enforced, not advisory: `eslint.config.mjs` sets `no-console: ["error", { allow: ["warn", "error"] }]` over `src/**`, exempting only the generator scripts and test files. (A naive grep also hits `console.log` inside `@example` JSDoc blocks in `helper.ts` — those are documentation, not executable code.)
13. **Sanitize every value interpolated into a `$filter`** - use `sanitizeFilterValue`, `sanitizeLikeValue`, `sanitizeGuid`, or `sanitizeNumericId` from `@/lib/providers/ministry-platform/utils/filter-sanitize`. A `number`-typed parameter is *not* exempt: types are erased at runtime and server actions are caller-shaped POST endpoints, so an attacker controls the value regardless of its declared type. See **[MP Query Syntax](.claude/references/ministryplatform.query-syntax.md)** § Sanitizing interpolated values.
14. **Treat better-auth endpoint bodies as attacker-shaped** - better-auth endpoints accept body options the app never sends (`/sign-in/social` has an `idToken` branch that skips the OAuth code exchange entirely). So `POST /sign-in/social` is filtered to `allowedSignInSocialKeys` in `src/app/api/auth/[...all]/route.ts`, *and* `idToken` is refused in `hooks.before` in `src/lib/auth.ts` (which also covers in-process `auth.api` calls). Keep both; re-check them, and what any new endpoint accepts, on every better-auth upgrade. See **[Sign-in Hardening Advisory](docs/security/2026-09-25-signin-hardening.md)**.

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

## Testing

- **Framework**: Vitest with jsdom environment, `@testing-library/react` for hooks/components, v8 coverage
- **Config**: `vitest.config.mts` (runner), `src/test-setup.ts` (env vars + jest-dom)
- **Co-location**: Test files live next to source — `foo.ts` → `foo.test.ts`
- **Critical**: Use `vi.hoisted()` for any mock variables referenced inside `vi.mock()` factories (hoisting causes `ReferenceError` otherwise)
- **MPHelper mock**: Use mock class (`MPHelper: class { method = mockFn; }`), not `vi.fn().mockImplementation()`
- **Singleton reset**: Reset `(ServiceClass as any).instance = undefined` in `beforeEach` to prevent state leakage
- **Server action tests**: Mock `@/services/authorizationService` (`requireSecurityRole`/`hasSecurityRole`) and the service singletons. Only session-only subjects — `auth-wrapper`, `shared-actions/user`, `shared-actions/domain`, `user-menu/actions`, `sessionContextService` — still mock `@/lib/auth` + `next/headers`.
- **Coverage is gated, not advisory**: `vitest.config.mts` sets per-glob thresholds (`src/app/**`, `src/components/**/*.tsx`, `src/services/**`, `src/lib/**/*.ts`, `src/contexts/**`, and `src/proxy.ts` at 100%) plus a global backstop (98% statements / 95% branches / 97% functions / 98% lines). The global gate is what catches a newly added, entirely untested file. `src/components/ui/` and the generated `models/` are excluded from the denominator.
- **CI**: `.github/workflows/test.yml` runs `npx vitest run --coverage` on Node 22 and uploads to Codecov, alongside a separate `lockfile` job
- See **[Testing Reference](.claude/references/testing.md)** for all mock patterns, coverage data, and test inventory

## Reference Documents

For detailed context on specific areas, see:

- **[Auth Reference](.claude/references/auth.md)** - Better Auth configuration, OAuth flow, session access patterns, `userGuid` vs `user.id`, and known limitations
- **[Components Reference](.claude/references/components.md)** - Detailed inventory of all components, their purposes, server actions, and compliance status
- **[Ministry Platform Schema](.claude/references/ministryplatform.schema.md)** - Auto-generated summary of Ministry Platform database tables, primary keys, and foreign key relationships
- **[Ministry Platform Query Syntax](.claude/references/ministryplatform.query-syntax.md)** - SQL-style query syntax for `GET /tables/{table}` (filters, aggregates, `_TABLE` FK traversal rules, common errors and fixes)
- **[Ministry Platform Date/Time Handling](.claude/references/ministryplatform.datetimehandling.md)** - How to send/receive MP datetimes safely via `DomainTimezoneService`, anti-patterns, Windows↔IANA mapping, and test guidance
- **[Ministry Platform Stored Procedures](.claude/references/ministryplatform.storedprocs.md)** - Auto-generated inventory of callable stored procedures and their parameters (regenerate with `npm run mp:generate:storedprocs`)
- **[Testing Reference](.claude/references/testing.md)** - Vitest setup, mock patterns (`vi.hoisted`, MPHelper, auth), coverage data, and test file inventory
- **[Security Headers](.claude/references/security-headers.md)** - The nonce-based CSP and the rest of the header set, why nonces force dynamic rendering, and the deliberate loosenings not to "tighten"
- **[Dependency Known Issues](.claude/references/deps-known-issues.md)** - Lockfile platform drift (why `npm run deps:relock` is the only supported regeneration path) and the triaged vendor advisories `npm audit` does not report
- **[Session Identity Advisory](docs/security/2026-09-12-session-identity.md)** - The 2026-09-12 session-identity vulnerability, who is affected, and remediation
- **[Sign-in Hardening Advisory](docs/security/2026-09-25-signin-hardening.md)** - The 2026-09-25 `callbackUrl` control-character bypass (F3b) and ID-token sign-in (F12), who is affected, and remediation
- **[Security Policy](SECURITY.md)** - Supported versions and how to report a vulnerability privately
- **[OAuth Logout Setup](docs/OAUTH_LOGOUT_SETUP.md)** - OIDC RP-initiated logout configuration and post-logout redirect URIs
- **[SQL Snippets](.claude/references/sql.db.md)** - Recipes for work done directly against the MP SQL database, outside the API safety rails

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

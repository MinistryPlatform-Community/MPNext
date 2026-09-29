# Component Reference Guide

This document provides detailed context about the `src/components/` folder and
the `src/app/` route tree for LLM assistants working on the MPNext project.

## Folder Overview

```
src/components/
├── layout/                     # App shell (barrel export via index.ts)
│   ├── auth-wrapper.tsx        # Session gate (Server Component)
│   ├── header.tsx              # App header, owns the Sidebar + UserMenu
│   ├── sidebar.tsx             # Slide-out navigation
│   ├── dynamic-breadcrumb.tsx  # Breadcrumb navigation
│   ├── session-guard.tsx       # Client-side session watch → /signed-out
│   └── index.ts                # Barrel exports
├── shared-actions/             # Cross-feature server actions (no components)
│   ├── user.ts                 # getCurrentUserProfile
│   ├── domain.ts               # getMpTimezone
│   └── README.md               # Shared vs co-located guidance
├── ui/                         # shadcn/ui components (19 files)
├── contact-logs/               # Contact log CRUD feature
├── contact-lookup/             # Contact search feature
├── contact-lookup-details/     # Contact details view
├── home-demos/                 # Dashboard demo tiles (access-gated)
├── sign-in/                    # Sign-in page body + restart-loop counter (sign-in-attempts.ts)
└── user-menu/                  # User dropdown menu + stand-alone SignOutButton
```

Outside `src/components/`: `src/contexts/sign-out-broadcast.ts` (the cross-tab
sign-out signal) and `src/lib/dto/user-profile.ts` (`CurrentUserProfile`).

## Route Inventory (`src/app/`)

Every file below has a co-located `*.test.tsx` / `*.test.ts`.

| Route file | Type | Purpose |
|---|---|---|
| `layout.tsx` | Server | Root layout — `<html>`/`<body>` and `globals.css` only. No shell, no fonts, no metadata (those live in `(web)/layout.tsx`) |
| `providers.tsx` | Client | `Providers` wraps children in `UserProvider`, forwarding the `profilePromise` prop. Named export, mounted by `server-providers.tsx` |
| `server-providers.tsx` | Server | `ServerProviders` starts `getCurrentUserProfile()` during the server render and passes the un-awaited promise to `Providers`. Must sit below `AuthWrapper` |
| `error.tsx` | Client | Root-segment boundary: the routes OUTSIDE `(web)` (`/signin`, `/session-error`, `/auth-error`, `/signed-out`) and anything the `(web)` shell itself throws outside its own boundary (e.g. `Header`). Bare centred layout, offers retry, a plain link to `/signin`, and a `SignOutButton` |
| `global-error.tsx` | Client | Last-resort boundary for a throw in the root layout itself. Renders its own `<html>`/`<body>`, imports nothing from the app, styles inline (the CSP's `style-src` has `'unsafe-inline'` and no nonce). Next always prerenders it (`/_global-error`), so it carries no nonce and recovers through a plain link, not JS |
| `(web)/layout.tsx` | Server | The authenticated shell: `AuthWrapper` → `ServerProviders` → `SessionGuard` → `Header` (in a `<Suspense>` whose fallback is the fixed `HeaderSkeleton`) + `DynamicBreadcrumb`. Owns `metadata` and `viewport` |
| `(web)/error.tsx` | Client | Error boundary for the shell. Deliberately INSIDE `(web)` so the Header — and therefore sign-out — keeps rendering around the error card; the card has its own `SignOutButton` too |
| `(web)/page.tsx` | Server | Dashboard. Synchronous, makes no MP call; mounts `ContactLookupDemoCard` in `<Suspense>` because `useUser()` suspends |
| `(web)/home/page.tsx` | Server | Three-line legacy redirect to `/` |
| `(web)/no-access/page.tsx` | Server | Static explanation for a signed-in user with no MP security role. Inside `(web)` so the header and sign-out still render. No auto-redirect, no retry |
| `(web)/contactlookup/layout.tsx` | Server | UX redirect over `/contactlookup/**`: `hasSecurityRole` → `redirect("/no-access")`. **Not** an enforcement point for child pages — Next renders a child page as its own segment, so each page gates itself |
| `(web)/contactlookup/page.tsx` | Client | Search page; renders `<ContactLookup />` |
| `(web)/contactlookup/[guid]/page.tsx` | Server | Detail page. Calls `requireSecurityRole` itself first (the layout above does not protect it), awaits `params`, kicks off `getContactDetails` / `getContactLogsByContactId` as promises and `await`s `getMpTimezone()`, then streams them into `ContactLookupDetails` through `<Suspense>` |
| `signin/page.tsx` | Server | `export const dynamic = "force-dynamic"` (F9 — a prerendered page has no CSP nonce and never hydrates) and renders `<SignIn />` |
| `session-error/page.tsx` | Server | Recovery for a session with no `userGuid`. `force-dynamic`. Posts to `handleSignOut` from `user-menu/actions`. Outside `(web)` so `AuthWrapper` cannot loop |
| `auth-error/page.tsx` | Server | Landing page for a failed MP OAuth callback. Maps a known `error` code to plain English; never renders `error_description` |
| `signed-out/page.tsx` | Server | Where a tab lands when its session ends (`SessionGuard`, cross-tab sign-out). Public, `force-dynamic`, reads no session and never starts OAuth — only a plain link to `/signin` — so a live MP SSO session cannot silently sign the tab back in |
| `api/auth/[...all]/route.ts` | Route handler | Deny-by-default allowlist in front of better-auth: `GET /get-session`, `GET /callback/ministry-platform`, `POST /sign-in/social`. Everything else 404s |

Notes on route-file exports: App Router *requires* a default export from
`page.tsx`, `layout.tsx`, `error.tsx` and `global-error.tsx`. The "named exports
only" rule in `CLAUDE.md` applies to components in `src/components/`; the
framework files in `src/app/` are the documented exception. `route.ts` exports
named `GET`/`POST` as the framework requires.

## Component Categories

### Layout Components (`layout/` folder)

| File | Type | Tested | Purpose |
|------|------|--------|---------|
| `layout/auth-wrapper.tsx` | Server | Yes | Redirects to `/signin` with no session, and to `/session-error` when the session carries no `userGuid` |
| `layout/header.tsx` | Client | Yes | Fixed top bar; owns `sidebarOpen` state, renders `Sidebar` and `UserMenu`. Only its avatar reads `useUser()` + `useAppSession()`, behind its own same-size `<Suspense>`, so the bar never suspends. Also exports `HeaderSkeleton`, the layout's pixel-identical fallback |
| `layout/sidebar.tsx` | Client | Yes | Slide-out nav, `next/link` entries (a plain `<a>` reloads the document and the profile). Dashboard always shown; Contact Lookup appended, behind its own `<Suspense>`, only when `userProfile?.canAccessContactFeatures === true` (UX only, fails closed) |
| `layout/dynamic-breadcrumb.tsx` | Client | Yes | Builds breadcrumbs from `usePathname()`, or from a `customSegments` prop |
| `layout/session-guard.tsx` | Client | Yes | Watches the client session; when it goes from present to none (sign-out in any tab, expiry) stops rendering the page and `location.replace("/signed-out")`. Re-checks on a cross-tab sign-out broadcast; clears the `/signin` restart counter once a session is seen |
| `layout/index.ts` | - | - | Barrel exports: `AuthWrapper`, `Header`, `HeaderSkeleton`, `Sidebar`, `DynamicBreadcrumb`, `SessionGuard` |

`Sidebar` is *not* mounted by `(web)/layout.tsx` — `Header` mounts it. Only
`AuthWrapper`, `SessionGuard`, `Header` and `DynamicBreadcrumb` are imported by
the layout.

When the MP profile is missing (no `dp_Users` match, or the load failed and
`UserProvider` resolved it to `null`), `Header` still renders the user menu
with a no-profile label, so **Sign out** stays reachable.

### Feature Components

| Folder | Files | Type | Tested | Has Actions |
|--------|-------|------|--------|-------------|
| `contact-logs/` | `contact-logs.tsx` | Client | Yes | Yes |
| `contact-lookup/` | `contact-lookup.tsx`, `contact-lookup-search.tsx`, `contact-lookup-results.tsx` | Client | Yes (all three) | Yes |
| `contact-lookup-details/` | `contact-lookup-details.tsx` | Client | Yes | Yes |
| `home-demos/` | `contact-lookup-demo-card.tsx` | Client | Yes | No |
| `sign-in/` | `sign-in.tsx`, `sign-in-attempts.ts` | Client | `sign-in-attempts` yes; `sign-in.tsx` via `app/signin/page.test.tsx` | No |
| `user-menu/` | `user-menu.tsx`, `sign-out-button.tsx` | Client | Yes (both) | Yes |

### UI Components (shadcn/ui)

19 components following shadcn conventions. None have co-located tests; they are
exercised indirectly through the feature component tests.

- `alert.tsx`, `alert-dialog.tsx`, `avatar.tsx`, `breadcrumb.tsx`
- `button.tsx`, `card.tsx`, `checkbox.tsx`, `dialog.tsx`
- `drawer.tsx`, `dropdown-menu.tsx`, `form.tsx`, `input.tsx`
- `label.tsx`, `radio-group.tsx`, `select.tsx`, `skeleton.tsx`
- `switch.tsx`, `textarea.tsx`, `tooltip.tsx`

## Server Actions Location

Actions are co-located with their feature components. Every actions file carries
a `"use server"` directive.

| Feature | Actions File | Functions |
|---------|--------------|-----------|
| contact-logs | `contact-logs/actions.ts` | `getContactLogTypes`, `createContactLog`, `updateContactLog`, `deleteContactLog` |
| contact-lookup | `contact-lookup/actions.ts` | `searchContacts` |
| contact-lookup-details | `contact-lookup-details/actions.ts` | `getContactDetails`, `getContactLogsByContactId` |
| user-menu | `user-menu/actions.ts` | `handleSignOut` |
| **shared** | `shared-actions/user.ts` | `getCurrentUserProfile` |
| **shared** | `shared-actions/domain.ts` | `getMpTimezone` |

What each one does:

- **`getContactLogTypes`** — the `Contact_Log_Types` lookup list for the create/edit form.
- **`createContactLog` / `updateContactLog`** — gate first, then delegate to
  `ContactLogService`, which keeps only allowlisted fields. Neither forwards
  `Made_By`: create stamps it from the authorization gate, and update omits it
  entirely so the original author is kept (the editor is recorded through
  `$userId` in `dp_Audit_Log`) (F4). `updateContactLog` also never forwards
  `Contact_ID`, so an edit cannot move a log to another contact. IDs pass
  through `sanitizeNumericId` before they reach the service.
- **`deleteContactLog`** — gate, `sanitizeNumericId`, service.
- **Log reads** live in `contact-lookup-details`: its `getContactLogsByContactId`
  is a gated read that joins the log-type name onto each row (one indexed lookup
  fetch, not one per log) and returns `ContactLogDisplay[]`. (The unused
  `contact-logs` read actions were removed on 2026-09-29.)
- **`searchContacts`** — gate is deliberately OUTSIDE the `try`, so `UnauthorizedError`
  reaches the caller instead of being flattened into "Failed to search contacts".
- **`getContactDetails`** — gated read by `Contact_GUID`.
- **`handleSignOut`** — `auth.api.signOut` (clears this browser's cookies
  first), then `redirect()` to MP's `/oauth/connect/endsession` with
  `post_logout_redirect_uri`, `client_id` and, when this instance still has it,
  `id_token_hint` (RP-initiated logout). Refuses an unset or unusable MP URL /
  `BETTER_AUTH_URL` (`src/lib/env.ts`). Touches no MP table. Client code calls it
  through `signOutEverywhere()` (`user-menu/sign-out-button.tsx`), which also
  broadcasts the sign-out to other tabs.
- **`getCurrentUserProfile`** — takes no parameters by design; the `User_GUID`
  comes from the session, never the caller. Returns the six-field
  `CurrentUserProfile` DTO (`First_Name`, `Last_Name`, `Nickname`,
  `Email_Address`, `Image_GUID`, `canAccessContactFeatures`) built field by
  field — no IDs, GUID, phone, roles or groups reach the client.
  `canAccessContactFeatures` comes from `AuthorizationService.hasSecurityRole`
  (the non-throwing form) so nav and enforcement cannot disagree about policy.
- **`getMpTimezone`** — the domain's IANA zone, for client-side `Intl` rendering
  of MP wall-clock values. Cached for the life of the server process.

### Authorization (every action, reads included)

Since 2026-09-12 (F1) **every** action in `contact-logs/`, `contact-lookup/` and
`contact-lookup-details/` calls
`AuthorizationService.getInstance().requireSecurityRole({ table, operation })`
rather than a bare session check — reads as well as writes. The gate implies an
authenticated session, so it replaces `auth.api.getSession()` in those files
outright. Full rationale: `.claude/references/auth.md` § Authorization.

Three files deliberately do **not** call `requireSecurityRole`:

| File | What it uses instead | Why |
|---|---|---|
| `shared-actions/user.ts` | `auth.api.getSession()` + `hasSecurityRole` for the `canAccessContactFeatures` flag | Any MP user may sign in and must be able to load their own profile (avatar, name, sign-out) with no security role |
| `shared-actions/domain.ts` | `auth.api.getSession()` | One domain-wide configuration string, not per-person data (F11 added this check; before it, the action had none at all) |
| `user-menu/actions.ts` | Nothing beyond better-auth's own `signOut` | Reads and writes no MP table; signing out must work for any session, including a broken one |

`layout/auth-wrapper.tsx` also uses a bare `auth.api.getSession()` — correctly,
since it is the session gate, not a data gate.

Routes carrying the page-layer half of the gate:

| Route file | Purpose |
|---|---|
| `src/app/(web)/contactlookup/layout.tsx` | UX redirect over `/contactlookup/**`: `redirect("/no-access")` for a user with no MP security role. Not an enforcement point — `[guid]/page.tsx` calls `requireSecurityRole` itself. Uses the non-throwing `hasSecurityRole`, so a failed `dp_User_Roles` read still throws rather than reading as "you are not allowed" — but a failed session or `User_ID` lookup reports `no_mp_user` and does land on `/no-access` |
| `src/app/(web)/no-access/page.tsx` | Static explanation page, inside `(web)` so the header and sign-out still render |

**Shared Actions Folder**: `src/components/shared-actions/` contains actions used
across multiple features. See the README in that folder for guidelines on when to
use shared vs co-located actions.

## Import Patterns

```typescript
// Feature components (use barrel exports)
import { ContactLookup } from '@/components/contact-lookup';
import { ContactLogs } from '@/components/contact-logs';
import { ContactLookupDetails } from '@/components/contact-lookup-details';
import { ContactLookupDemoCard } from '@/components/home-demos';
import { SignIn } from '@/components/sign-in';
import { UserMenu } from '@/components/user-menu';

// UI components (individual imports)
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

// Layout components (barrel export)
import { AuthWrapper, Header, Sidebar, DynamicBreadcrumb } from '@/components/layout';

// Contexts (barrel export)
import { UserProvider, useUser, useAppSession } from '@/contexts';

// Co-located actions (relative import within feature)
import { searchContacts } from './actions';

// Shared actions
import { getCurrentUserProfile } from '@/components/shared-actions/user';
import { getMpTimezone } from '@/components/shared-actions/domain';
```

## Component Structure Template

Each feature folder should follow this structure:

```
feature-name/
├── index.ts                   # Barrel export: export { FeatureName } from './feature-name';
├── feature-name.tsx           # Main component file
├── feature-name.test.tsx      # Co-located component test
├── actions.ts                 # Server actions (if needed)
├── actions.test.ts            # Co-located action test
└── [sub-components].tsx       # Additional components (optional)
```

## Date/Time at the Client Boundary

MP stores wall-clock values in the domain's time zone with no zone marker, so
`new Date(mpValue)` in a browser parses them as browser-local and is wrong for
any user outside that zone.

The conversion at the MP boundary itself is `DomainTimezoneService`, inside
`ContactLogService` — no component or action calls it directly except the thin
`getMpTimezone` wrapper. The pattern for display is:

```
getMpTimezone() (server action) → [guid]/page.tsx → ContactLookupDetails → ContactLogs
```

`contact-logs.tsx` then formats with `Intl.DateTimeFormat` against that zone
(`formatDateTime`, `getNowInMpTz`, `toDatetimeLocalValue`) rather than with a
bare `Date`. `formatDateTime` degrades to a placeholder on an unparseable value;
its one remaining `new Date(dateString)` fallback (for a string that does not
match the MP shape at all) is browser-local by definition and is the only
untimezoned parse left in `src/components/`.

## Compliance Summary

Verified by inspection of the tree on 2026-09-29.

| Criterion | Status | Notes |
|-----------|--------|-------|
| File naming (kebab-case) | PASS | Every file and folder under `src/components/` and `src/app/` |
| Component naming (PascalCase) | PASS | |
| Named exports only (no default) | PASS in `src/components/` | Zero `export default` under `src/components/`. The 15 in `src/app/` (non-test files) are App Router framework requirements (`page`/`layout`/`error`/`global-error`) |
| `@/` alias for imports | PASS with one exception | `(web)/contactlookup/page.tsx` imports `@/components/contact-lookup/contact-lookup` — the deep path, bypassing the barrel |
| Barrel exports for features | PASS | All seven component folders with a component have `index.ts`; `shared-actions/` intentionally has none (it exports actions, not components) |
| `"use client"` where needed | PASS | |
| `"use server"` for actions | PASS | All six actions files |
| Actions call services, not MPHelper | PASS | No `MPHelper` import anywhere in `src/components/` or `src/app/` |
| `requireSecurityRole` on MP-touching actions | PASS with documented carve-outs | See the table in § Authorization |
| No `console.log`/`.info`/`.debug` in `src/` | PASS | Only `console.error` and `console.warn` are used (the lint rule allows both). The `console.log` hits in `src/lib/providers/ministry-platform/helper.ts` are inside `@example` JSDoc blocks, not executable code; the rest are in `scripts/`, which the rule exempts |
| Co-located tests | PASS except `ui/` | `sign-in/sign-in.test.tsx` unit-tests `sanitizeCallbackUrl`; the component itself is exercised through `src/app/signin/page.test.tsx`. Every `src/app/` route file has one |
| TypeScript strict typing | PASS | |

## Known Issues & Recommendations

### Open items

- **`(web)/contactlookup/page.tsx` deep-imports** `@/components/contact-lookup/contact-lookup`
  instead of the barrel `@/components/contact-lookup`.
- **Mixed component declaration styles.** `contact-lookup/*` and
  `contact-lookup-details` use `export const X: React.FC<Props> = …`; everything
  else uses `export function X(…)`. Both are named exports, so both comply, but
  the codebase is inconsistent.

### UI Component Notes

- **dialog.tsx**: Uses mixed patterns (direct assignment vs forwardRef) - works but inconsistent.
- **tooltip.tsx**: Auto-wraps with `TooltipProvider` internally - no need to wrap manually.

## Quick Reference: Component Responsibilities

### contact-logs
- **Purpose**: CRUD interface for contact log entries (627 lines, the largest component)
- **Features**: Create/edit dialogs, delete confirmation via `AlertDialog`, log-type select, `react-hook-form` + `zodResolver` validation
- **Props**: `contactLogs`, `contactId`, `contactNickname`, `contactLastName`, `mpTimezone`, `onRefresh`
- **Dependencies**: `./actions` → `ContactLogService`, React Hook Form, Zod

### contact-lookup
- **Purpose**: Search contacts by name/email/phone
- **Components**: `ContactLookup` (container, owns results/loading/error state),
  `ContactLookupSearch` (input; `useTransition` around `searchContacts`),
  `ContactLookupResults` (list; `router.push('/contactlookup/{Contact_GUID}')` on click)
- **Features**: Avatar display, optional `onContactSelect` callback, `showResultsImmediately` prop

### contact-lookup-details
- **Purpose**: Full contact profile plus its logs
- **Features**: Consumes the two streamed promises from `[guid]/page.tsx` with
  React's `use()`, renders profile info, and embeds `ContactLogs` — passing
  `mpTimezone` straight through

### home-demos
- **Purpose**: The dashboard's demo tiles
- **Components**: `ContactLookupDemoCard`
- **Features**: Reads `canAccessContactFeatures` off the MP profile via `useUser()` and renders `null` when it is not `true`. UX only — hiding a tile is not a security control; the layout, actions and services each enforce. Mounted inside a `<Suspense>` boundary by `src/app/(web)/page.tsx`, because `useUser()` suspends while the profile loads.

### sign-in
- **Purpose**: The body of `/signin`, extracted from the route file in F9
- **Why it exists separately**: route segment config (`export const dynamic`) is
  IGNORED in a `"use client"` module, so the page had to become a Server
  Component and the client work had to move here
- **Restart cap** (`sign-in-attempts.ts`): `/signin` starts OAuth on its own; a
  per-tab `sessionStorage` counter allows `MAX_AUTOMATIC_SIGN_IN_ATTEMPTS` (2)
  automatic starts per 2-minute window, then shows a "keeps restarting" message
  with a `SignOutButton` instead of looping. Storage failures never block
  sign-in.
- **Features**: `sanitizeCallbackUrl` accepts only a same-origin relative path
  (F3 open redirect). It mirrors better-auth's server-side `isSafeRelativeURL` —
  refusing protocol-relative `//`, any backslash, control characters (the F3b
  tab/CR/LF bypass, 2026-09-25) and `%2F`/`%5C` in the path — and returns the raw
  value, never the URL-normalized one; a `useRef` guard checked
  synchronously before the first `await` prevents StrictMode from starting two
  OAuth flows and racing the single `oauth_state` cookie

### user-menu
- **Purpose**: User profile dropdown with sign-out
- **Features**: Displays user name/email (or a "profile couldn't be loaded"
  label — sign-out is offered either way), implements OIDC logout flow
- **`SignOutButton` / `signOutEverywhere`** (`sign-out-button.tsx`): the one
  sign-out path every control shares — the user menu, both error boundaries,
  and `/signin` when sign-in keeps looping. `signOutEverywhere` runs
  `handleSignOut`, then (in `finally`) posts on the cross-tab channel
  (`src/contexts/sign-out-broadcast.ts`) so other tabs' `SessionGuard`s
  re-check and leave for `/signed-out`. It calls `unstable_rethrow(err)` as the
  first statement of its catch — `redirect()` is a thrown `NEXT_REDIRECT`
  signal, and without the rethrow every successful sign-out would surface as an
  error — and returns a message only for a genuine failure.

## Services Used

Components interact with these service classes:

| Service | Location | Used By |
|---------|----------|---------|
| ContactService | `@/services/contactService` | contact-lookup, contact-lookup-details |
| ContactLogService | `@/services/contactLogService` | contact-logs, contact-lookup-details |
| UserService | `@/services/userService` | shared-actions/user |
| AuthorizationService | `@/services/authorizationService` | contact-logs, contact-lookup, contact-lookup-details, shared-actions/user, `(web)/contactlookup/layout.tsx`, `(web)/contactlookup/[guid]/page.tsx` |
| DomainTimezoneService | `@/services/domainTimezoneService` | shared-actions/domain (and internally by ContactLogService) |

`SessionContextService` (`@/services/sessionContextService`) is not called from
components directly; `AuthorizationService` uses it to resolve the acting MP user.

All services ultimately use `MPHelper` from `@/lib/providers/ministry-platform` for API calls.

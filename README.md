# MPNext

[![Release](https://img.shields.io/github/v/release/MinistryPlatform-Community/MPNext?logo=github)](https://github.com/MinistryPlatform-Community/MPNext/releases/latest)
[![Tests](https://github.com/MinistryPlatform-Community/MPNext/actions/workflows/test.yml/badge.svg)](https://github.com/MinistryPlatform-Community/MPNext/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/MinistryPlatform-Community/MPNext/graph/badge.svg)](https://codecov.io/gh/MinistryPlatform-Community/MPNext)

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-new--york-000000?logo=shadcnui&logoColor=white)](https://ui.shadcn.com/)
[![Radix UI](https://img.shields.io/badge/Radix_UI-primitives-161618?logo=radixui&logoColor=white)](https://www.radix-ui.com/)
[![Lucide](https://img.shields.io/badge/Lucide-icons-F56565?logo=lucide&logoColor=white)](https://lucide.dev/)

A modern Next.js application integrated with Ministry Platform authentication and REST API, built with TypeScript, Next.js 16, React 19, and Better Auth.

## Security Notice

> ### ⚠️ Forks must merge a session-identity fix (2026-09-12)
>
> A **High** severity vulnerability (CVSS 8.1) let any *authenticated* user reassign
> their session to another user's Ministry Platform identity — inheriting that
> user's roles and groups, and forging their attribution in `dp_Audit_Log`.
> Fixed in [`436466d`](https://github.com/MinistryPlatform-Community/MPNext/commit/436466d).
>
> **The usual advice is inverted here.** MPNext is forked and copied, not
> installed, so the affected set is a commit range and nothing will alert you
> automatically:
>
> - **Affected** — your fork contains [`c9d80d4`](https://github.com/MinistryPlatform-Community/MPNext/commit/c9d80d4) (2026-07-09) but not `436466d`.
> - **Not affected** — your fork predates `c9d80d4`. Do **not** "update to latest"
>   reflexively; merging past `c9d80d4` without the fix would *introduce* the flaw.
>
> ```bash
> git merge-base --is-ancestor c9d80d4 HEAD && echo "has the flaw"
> git merge-base --is-ancestor 436466d HEAD && echo "has the fix"
> ```
>
> Patching does **not** revoke sessions already forged — they survive in the JWT
> cookie cache for up to an hour. See the
> **[full advisory](docs/security/2026-09-12-session-identity.md)** for
> verification steps, incident response, and `dp_Audit_Log` guidance.

## Table of Contents

- [Security Notice](#security-notice)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Quick Setup (Interactive)](#quick-setup-interactive)
  - [Manual Setup](#manual-setup)
  - [OAuth Setup](#oauth-setup)
- [Project Structure](#project-structure)
- [Ministry Platform Integration](#ministry-platform-integration)
- [Components](#components)
- [Services](#services)
- [Testing](#testing)
- [Development](#development)
- [Claude Code Commands](#claude-code-commands)
- [Documentation](#documentation)
- [Code Style & Conventions](#code-style--conventions)
- [Known Issues](#known-issues)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## Features

- **Authentication**: Better Auth with Ministry Platform OAuth (via genericOAuth plugin) and OIDC RP-initiated logout
- **Modern UI**: Radix UI primitives + shadcn/ui components with Tailwind CSS v4
- **Type-Safe API**: Full TypeScript support with auto-generated types from Ministry Platform schema
- **Next.js 16**: App Router with React Server Components and Turbopack
- **REST API Client**: Comprehensive Ministry Platform REST API integration
- **Type Generation**: CLI tool to generate TypeScript interfaces and Zod schemas from MP database
- **Schema Documentation**: Auto-generated markdown documentation with type file links
- **Validation**: Optional Zod v4 schema validation in MPHelper for runtime data validation before API calls
- **Authorization**: Ministry Platform security-role gate on reads *and* writes, not just an authentication check
- **Security Headers**: Nonce-based Content-Security-Policy, enforcing by default, applied per-request in the proxy
- **Audit Attribution**: Writes carry the acting user's MP `User_ID`, so `dp_Audit_Log` records who actually did what
- **Testing**: Vitest with 1,015 tests and enforced coverage thresholds in CI

## Architecture

### Framework
- **Next.js 16** with App Router and Turbopack (default bundler for dev and build)
- **React 19** with Server Components by default
- **TypeScript** in strict mode
- **Tailwind CSS v4** for styling
- **Vitest 4** for testing, with coverage thresholds gated in CI

### Ministry Platform Integration
Custom provider located at `src/lib/providers/ministry-platform/` featuring:
- REST API client with OAuth2 authentication
- Service-oriented architecture for domain-specific logic
- Type-safe models and Zod validation schemas for all 301 MP tables (603 generated files)
- Automatic token management with refresh
- Six specialized services: Table, Procedure, Communication, File, Metadata, Domain

### Authentication
Better Auth with Ministry Platform OAuth via genericOAuth plugin (`src/lib/auth.ts`)
- Stateless JWT cookie sessions (no database required)
- Session enrichment via `customSession` (name split plus the MP `User_ID`); the full `MPUserProfile` is started server-side by `ServerProviders` and streamed to `UserProvider`
- OIDC RP-initiated logout for proper session termination
- Security-role authorization via `AuthorizationService`, gating reads as well as writes
- Proxy-based route protection (`src/proxy.ts` — Next.js 16 replaces middleware with proxy)
- Client-side auth via `authClient` (`src/lib/auth-client.ts`)

## Prerequisites

- **Node.js**: v20 LTS or higher (Next.js 16 and React 19 require a modern Node runtime). `npm run setup` enforces this minimum; CI lints, type-checks, builds and tests on Node 22.
- **Package Manager**: npm (comes with Node.js)
- **Ministry Platform**: Active instance with API credentials and OAuth client configured (see [OAuth Setup](#oauth-setup))

## Getting Started

### Quick Setup (Interactive)

Run `npm run setup` for an interactive guided setup, or follow the [Manual Setup](#manual-setup) steps below. The setup script is a plain Node/tsx script — [Claude Code](https://claude.ai/code) is **not** required.

```bash
git clone https://github.com/MinistryPlatform-Community/MPNext.git
cd MPNext
npm ci
npm run setup
```

The interactive setup command will:
1. Verify Node.js version (v20 LTS+ required)
2. Detect a template clone and offer to keep, reinitialize, or set a new git origin
3. Check git status
4. Create `.env.local` from `.env.example` (if needed)
5. Prompt for missing environment variables — derives both `MINISTRY_PLATFORM_BASE_URL` and `NEXT_PUBLIC_MINISTRY_PLATFORM_FILE_URL` from a single MP host input (avoiding the copy/paste mismatch risk in the [Manual Setup](#manual-setup) path), and offers to auto-generate `BETTER_AUTH_SECRET` (a hand-entered one must be at least 32 characters). Values are quoted and escaped so Next loads them back exactly, and `.env.local` is written owner-only (`0600`)
6. Install dependencies with `npm ci` — exactly the versions in `package-lock.json`; the lockfile is never rewritten
7. Generate Ministry Platform types
8. Run a production build to verify configuration

> **Setup never runs `npm install` or `npm update`.** An unreviewed `better-auth` minor has broken sign-in and identity in this repo before, and on Windows either command can rewrite the lockfile into one CI cannot install. Upgrade dependencies deliberately (the `/audit-deps` command, then the Better Auth Upgrade Checklist in [`.claude/references/auth.md`](.claude/references/auth.md)) and relock with `npm run deps:relock` — see [Known Issues](#known-issues).

**Additional setup options:**
```bash
npm run setup:check     # Validation only (no changes); checks the secret length as Next loads it
npm run setup -- --skip-install # Skip the npm ci step
npm run setup -- --verbose     # Extra output
npm run setup -- --help        # Show all options
```

Once setup completes, run `npm run dev` and visit http://localhost:3000.

---

### Manual Setup

For a manual setup, follow these steps:

#### 1. Clone the Repository

```bash
git clone https://github.com/MinistryPlatform-Community/MPNext.git
cd MPNext
```

#### 2. Install Dependencies

```bash
npm ci        # Installs exactly what package-lock.json pins (same as npm run setup)
```

> **Do not relock casually.** Don't use `npm install` or `npm update` here: `npm update` can pull an unreviewed `better-auth` minor, and on Windows a bare `npm install`/`npm update`/`npm dedupe` produces a lockfile that fails CI on Linux. If you need to *regenerate* `package-lock.json`, use `npm run deps:relock`. See [Known Issues](#known-issues).

#### 3. Environment Configuration

Copy the example environment file and configure it with your Ministry Platform credentials:

```bash
cp .env.example .env.local
```

Update `.env.local` with your configuration:

```env
# Better Auth Configuration (used ONLY for end-user OAuth login).
# A dedicated MP API Client: Authorization Code flow only, exact redirect URIs.
OIDC_CLIENT_ID=MPNext
OIDC_CLIENT_SECRET=your_client_secret

# At least 32 characters. Generate with: openssl rand -base64 32
# If typed by hand, wrap it in double quotes and write each $ as \$.
BETTER_AUTH_SECRET=your_generated_secret

# Update for production
BETTER_AUTH_URL=http://localhost:3000

# MinistryPlatform API Configuration (used for server-side API access).
# A SEPARATE MP API Client: Client Credentials flow only, least-privilege Client User.
MINISTRY_PLATFORM_CLIENT_ID=MPNext.API
MINISTRY_PLATFORM_CLIENT_SECRET=your_client_secret
MINISTRY_PLATFORM_BASE_URL=https://your-instance.ministryplatform.com/ministryplatformapi

# Authorization — comma-separated MP security role names allowed to use the
# contact features (reads AND writes). Blank permits NOBODY; "*" permits any
# MP security role.
MP_SECURITY_ROLES="Administrators,Pastoral Staff"

# Public Keys
NEXT_PUBLIC_MINISTRY_PLATFORM_FILE_URL=https://your-instance.ministryplatform.com/ministryplatformapi/files
NEXT_PUBLIC_APP_NAME=MPNextApp

# Security headers — leave blank. The Content-Security-Policy ENFORCES by
# default; only the exact string "false" drops it back to report-only.
CSP_ENFORCE=
```

> **`MP_SECURITY_ROLES` is the access control, and it fails closed.** Leaving it unset or blank (or setting a value that names no roles, such as `,`) means *nobody* can use the gated features: every signed-in user is redirected to `/no-access`, and the server logs an `mp.authz.config` warning once. To permit anyone who holds at least one Ministry Platform security role, set `MP_SECURITY_ROLES=*` explicitly — `*` must be the whole value. `npm run setup` prompts for it and `npm run setup:check` warns when it is blank.
>
> ⚠️ **Breaking change (2026-09-28) for existing deployments and forks:** blank used to mean "any MP security role". If you relied on that, set `MP_SECURITY_ROLES=*` (or, better, a list of role names) before upgrading, or everyone loses access to the contact features.
>
> A deprecated write-only predecessor, `MP_WRITE_SECURITY_ROLES`, is still honored when `MP_SECURITY_ROLES` yields no usable value, but it now governs reads too. New deployments should set only `MP_SECURITY_ROLES`. See [`.claude/references/auth.md`](.claude/references/auth.md) for the full policy.
>
> Roles are matched by **name** (trimmed, case-insensitive), not by `Role_ID`. MP role names are editable and need not be unique, so anyone who can create, rename or assign Security Roles in Ministry Platform can satisfy the gate — restrict who can edit Security Roles there. A role whose name contains a comma cannot be listed.

> **`CSP_ENFORCE` is inverted on purpose.** Anything other than the literal string `false` — including leaving it unset — enforces the policy. A typo therefore fails loud (too strict) rather than silent (no policy at all). Set it to `false` only to diagnose a violation.

> **Use two dedicated API Clients.** `OIDC_CLIENT_ID` is the sign-in client (`MPNext` above: Authorization Code only). `MINISTRY_PLATFORM_CLIENT_ID` is the server-side data client (`MPNext.API` above: Client Credentials only). Do **not** reuse a shared client such as `TM.Widgets` for sign-in, and don't enable Implicit, Hybrid or Resource Owner flows on either client. Ministry Platform does not support PKCE, so a dedicated client with exact redirect URIs is the main defence against authorization-code injection — see the [Sign-in Hardening Note](docs/security/2026-09-25-signin-hardening.md). Both are set up below, under [API Client Setup](#api-client-setup).

> **Quoting values by hand.** Next's env loader treats an unquoted `#` as the start of a comment and expands `$NAME`, so an unquoted `Xy9$Qz7Lm#Kp2…` loads as `Xy9`. Wrap values that contain `$`, `#` or spaces in double quotes and write each `$` as `\$`. `npm run setup` does this for you, and `npm run setup:check` reports the length of `BETTER_AUTH_SECRET` as the app will actually load it.


#### API Client Setup

Before running the application, you must configure **two** API Clients in Ministry Platform: one OAuth 2.0 / OpenID Connect (OIDC) client for user sign-in, and one for the app's server-side data access.

Log in to your Ministry Platform instance as an administrator and navigate to **Administration > API Clients**.

##### 1. Sign-in client (`OIDC_CLIENT_ID`)

Create a new API Client dedicated to MPNext sign-in. Do not reuse a shared client such as `TM.Widgets`.

- **Client ID**: `MPNext` (or your custom client ID)
- **Client Secret**: Generate a secure secret (save this securely - you'll need it for `.env.local` as `OIDC_CLIENT_SECRET`)
- **Display Name**: `MPNext` (or your preferred name)
- **Authentication Flow**: **Authorization Code only.** Do not enable Implicit, Hybrid, Client Credentials or Resource Owner on this client. MPNext never refreshes the user's token (it doesn't request `offline_access`), so it doesn't need refresh tokens either.
- **Redirect URIs** and **Post-Logout Redirect URIs**: exactly the entries below, for each environment. No wildcards and no extra entries.

> **Why a dedicated client?** Ministry Platform does not support PKCE, and MP never returns the `nonce` claim. MPNext relies on this being a confidential client with a private secret and tightly registered redirect URIs — that's the main defence against authorization-code injection. A shared client, or one that allows implicit or hybrid flows, raises the risk described in the [Sign-in Hardening Note](docs/security/2026-09-25-signin-hardening.md).

##### 2. Data-access client (`MINISTRY_PLATFORM_CLIENT_ID`)

Create a second API Client for the app's server-side calls (every MP read and write, including the security-role gate).

- **Client ID**: `MPNext.API` (or your custom client ID)
- **Client Secret**: Generate a secure secret (`MINISTRY_PLATFORM_CLIENT_SECRET`)
- **Client User**: a dedicated, least-privilege MP user. Every server-side read and write runs with this user's permissions.
- **Authentication Flow**: **Client Credentials only.**
- **Redirect URIs**: none needed.

The redirect URIs below belong on the **sign-in** client.

##### Redirect URIs (Required)
Add these authorized redirect URIs where users will be sent after authentication - separate each entry by ending with a semi-colon(;):

**Development:**
```
http://localhost:3000/api/auth/callback/ministry-platform
```

**Production:**
```
https://yourdomain.com/api/auth/callback/ministry-platform
```

> **Important**: The redirect URI must match exactly (including protocol, domain, port, and path). Ministry Platform will reject any OAuth requests with mismatched redirect URIs. The callback path follows Better Auth's social-provider convention: `/api/auth/callback/{providerId}`.

> **Upgrading from a pre-1.7 Better Auth setup?** The callback path changed in
> Better Auth 1.7, from `/api/auth/oauth2/callback/ministry-platform` to
> `/api/auth/callback/ministry-platform`. Add the new URI to the Ministry
> Platform OAuth client before deploying; keep the old one until every
> environment is upgraded, then remove it.

##### Post-Logout Redirect URIs (Required)
Add these URIs where users will be redirected after signing out:

**Development:**
```
http://localhost:3000
```

**Production:**
```
https://yourdomain.com
```

> **Important**: Post-logout redirect URIs are **required** for proper logout functionality. The application implements OIDC RP-initiated logout to properly end Ministry Platform OAuth sessions. Without these configured, users will be auto-logged back in after clicking "Sign out" (SSO behavior).

#### Generate Better Auth Secret

Generate a secure secret for Better Auth session signing (must be at least 32 characters):

```bash
openssl rand -base64 32
```

Copy the generated secret to your `.env.local` file as `BETTER_AUTH_SECRET`.


### 4. Generate Ministry Platform Types

Before running the application, generate TypeScript types from your Ministry Platform database schema:

```bash
npm run mp:generate:models
```

This will:
- Connect to your Ministry Platform API
- Fetch all table metadata (301+ tables)
- Generate TypeScript interfaces for each table
- Generate Zod validation schemas for runtime validation
- Generate schema documentation with type file links
- Clean up any previously generated files
- Output to `src/lib/providers/ministry-platform/models/`

**Expected output:**
```
Generating TypeScript types from Ministry Platform schema...
Fetching table metadata from Ministry Platform...
Found 301 tables
Cleaning output directory: src/lib/providers/ministry-platform/models
   Removed 605 existing type files
Generating type definitions...
  Contacts.ts (Contacts) [51 columns]
  Events.ts (Events) [57 columns]
  ...
Successfully generated 301 table types + 301 Zod schemas (602 total files)
```

**Advanced options:**
```bash
# Generate types for specific tables only
npx tsx --conditions=react-server src/lib/providers/ministry-platform/scripts/generate-types.ts -s "Contact"

# Generate without Zod schemas
npx tsx --conditions=react-server src/lib/providers/ministry-platform/scripts/generate-types.ts -o ./types

# Generate with detailed mode (samples records for better type inference)
npx tsx --conditions=react-server src/lib/providers/ministry-platform/scripts/generate-types.ts -d --sample-size 10

# See all options
npx tsx --conditions=react-server src/lib/providers/ministry-platform/scripts/generate-types.ts --help
```

> **`--conditions=react-server` is required.** The generator imports `MPHelper`, whose MP client is guarded by `server-only`; plain `tsx` fails with "This module cannot be imported from a Client Component module". The `npm run mp:generate*` scripts already pass it.

> **Note**: Field names containing special characters (like `Allow_Check-in`) are automatically quoted in the generated types for valid TypeScript syntax.

### 5. Run the Development Server

Start the development server and test the authentication flow:

```bash
npm run dev
```

1. Navigate to [http://localhost:3000](http://localhost:3000)
2. Click "Sign In"
3. You should be redirected to Ministry Platform login
4. After successful login, you'll be redirected back to the application
5. Your session should be active

**Troubleshooting:**
- **"Redirect URI mismatch"**: Verify redirect URI in MP matches exactly
- **"Invalid client"**: Check client ID and secret are correct
- **"Unauthorized scope"**: Ensure all required scopes are enabled
- **Auto-login after logout**: Verify post-logout redirect URIs are configured in Ministry Platform OAuth client. The application requires these for proper OIDC logout (see [OAUTH_LOGOUT_SETUP.md](docs/OAUTH_LOGOUT_SETUP.md))


### Production Deployment

When deploying to production:

1. Update `BETTER_AUTH_URL` to your production origin. It is required and validated at startup (`src/lib/env.ts`): an origin only (no path, query or credentials), and `https://` for every real host — plain `http://` is accepted only for loopback (`localhost`, `127.0.0.1`, `[::1]`). `MINISTRY_PLATFORM_BASE_URL` must likewise be `https://` (loopback `http` only outside production)
2. Add production redirect URI (`https://yourdomain.com/api/auth/callback/ministry-platform`) to Ministry Platform OAuth client
3. Add production post-logout redirect URIs
4. Ensure environment variables are set in your hosting provider
5. Enable HTTPS/SSL certificates
6. Test the complete authentication flow in production environment

> `next build` loads the auth module while collecting page data, so better-auth makes its read-only OIDC discovery `GET` to `MINISTRY_PLATFORM_BASE_URL` during the build. With a real `.env.local` that contacts your real MP discovery endpoint; if it fails, the build logs "Discovery fetch failed" and carries on (CI builds against an unresolvable `mp.invalid` URL on purpose).

## Project Structure

```
MPNext/
├── src/
│   ├── app/                              # Next.js App Router pages
│   │   ├── (web)/                        # Protected route group
│   │   │   ├── contactlookup/            # Contact lookup demo
│   │   │   │   ├── [guid]/               # Dynamic contact detail page
│   │   │   │   ├── layout.tsx            # Authorization gate (redirects to /no-access)
│   │   │   │   └── page.tsx              # Search page
│   │   │   ├── home/                     # Home redirect
│   │   │   ├── no-access/                # Shown when the role gate denies
│   │   │   ├── error.tsx                 # Shell-preserving error boundary
│   │   │   ├── layout.tsx                # Web layout with auth
│   │   │   └── page.tsx                  # Dashboard/home page
│   │   ├── api/auth/[...all]/            # Better Auth API routes (deny-by-default allowlist)
│   │   ├── auth-error/                   # Failed MP OAuth callback landing page
│   │   ├── session-error/                # Recovery for a session with no userGuid
│   │   ├── signin/                       # Sign-in page
│   │   ├── error.tsx                     # Root segment error boundary
│   │   ├── global-error.tsx              # Replaces the document on a root throw
│   │   ├── layout.tsx                    # Root layout
│   │   └── providers.tsx                 # App providers wrapper
│   │
│   ├── components/                       # React components
│   │   ├── contact-logs/                 # Contact logs feature (CRUD)
│   │   ├── contact-lookup/               # Contact lookup feature
│   │   │   ├── contact-lookup.tsx
│   │   │   ├── contact-lookup-search.tsx
│   │   │   ├── contact-lookup-results.tsx
│   │   │   ├── actions.ts
│   │   │   └── index.ts
│   │   ├── contact-lookup-details/       # Contact details feature
│   │   ├── home-demos/                   # Dashboard demo cards
│   │   ├── sign-in/                      # Sign-in button / OAuth kickoff
│   │   ├── user-menu/                    # User menu feature
│   │   ├── layout/                       # Layout components
│   │   │   ├── auth-wrapper.tsx
│   │   │   ├── dynamic-breadcrumb.tsx
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── index.ts
│   │   ├── shared-actions/               # Cross-feature server actions
│   │   │   ├── domain.ts
│   │   │   ├── user.ts
│   │   │   └── README.md
│   │   └── ui/                           # shadcn/ui components (19 components)
│   │
│   ├── contexts/                         # React Context providers
│   │   ├── session-context.tsx           # useAppSession()
│   │   ├── user-context.tsx              # UserProvider / useUser()
│   │   └── index.ts
│   │
│   ├── lib/                              # Shared libraries
│   │   ├── auth.ts                       # Better Auth server configuration
│   │   ├── auth-client.ts                # Better Auth client (React hooks)
│   │   ├── security-headers.ts           # CSP + security header policy
│   │   ├── dto/                          # Application DTOs/ViewModels
│   │   │   ├── contacts.ts
│   │   │   ├── contact-logs.ts
│   │   │   └── index.ts
│   │   ├── utils.ts                      # General utilities
│   │   └── providers/
│   │       └── ministry-platform/        # Ministry Platform provider
│   │           ├── auth/                 # OAuth client-credentials flow
│   │           ├── services/             # API services
│   │           │   ├── table.service.ts
│   │           │   ├── procedure.service.ts
│   │           │   ├── communication.service.ts
│   │           │   ├── file.service.ts
│   │           │   ├── metadata.service.ts
│   │           │   └── domain.service.ts
│   │           ├── models/               # Generated: 301 types + 301 Zod schemas + barrel
│   │           ├── types/                # Type definitions
│   │           ├── utils/                # HTTP client, filter sanitization
│   │           ├── scripts/              # Type / stored-proc generation CLI
│   │           ├── docs/                 # Provider documentation
│   │           ├── client.ts             # Core MP client
│   │           ├── provider.ts           # Singleton provider
│   │           ├── helper.ts             # Public API (MPHelper)
│   │           └── index.ts              # Barrel export
│   │
│   ├── services/                         # Application services
│   │   ├── authorizationService.ts       # MP security-role gate (reads and writes)
│   │   ├── contactService.ts
│   │   ├── contactLogService.ts
│   │   ├── domainTimezoneService.ts      # MP datetime boundary conversion
│   │   ├── sessionContextService.ts      # Acting MP User_ID for audit attribution
│   │   └── userService.ts
│   │
│   ├── proxy.ts                          # Next.js 16 proxy (route protection)
│   └── test-setup.ts                     # Vitest setup
│
├── .claude/                              # Claude AI configuration
│   ├── commands/                         # Claude Code skills (/audit-deps, /release)
│   ├── references/                       # Documentation references
│   └── playbooks/                        # Porting playbooks
├── .githooks/                            # pre-commit lockfile guard
├── .github/workflows/                    # CI: tests, lint + tsc, build + prerender check, lockfile drift check
├── .github/dependabot.yml                # Weekly SHA bumps for GitHub Actions
├── docs/
│   ├── OAUTH_LOGOUT_SETUP.md
│   └── security/                         # Security advisories
├── scripts/                              # setup.ts (+ setup-env.ts, its .env.local writer), check-lockfile.mjs, check-prerender.mjs
├── public/                               # Static assets
├── coverage/                             # Test coverage reports
├── .env.example                          # Environment template
├── CLAUDE.md                             # Development guide
├── eslint.config.mjs                     # Flat ESLint config (incl. no-console rule)
├── vitest.config.mts                     # Vitest configuration + coverage gates
├── components.json                       # shadcn/ui configuration
├── next.config.ts                        # Next.js configuration
├── tailwind.config.js                    # Tailwind CSS configuration
├── tsconfig.json                         # TypeScript configuration
└── package.json                          # Dependencies and scripts
```

> Nearly every source file has a co-located `*.test.ts(x)` beside it; they are omitted from this tree for readability.

## Ministry Platform Integration

### MPHelper - Public API

The main entry point for interacting with Ministry Platform:

```typescript
import { MPHelper } from '@/lib/providers/ministry-platform';
import { ContactLogSchema } from '@/lib/providers/ministry-platform/models';
import { DomainTimezoneService } from '@/services/domainTimezoneService';

const mp = new MPHelper();
const tz = DomainTimezoneService.getInstance();

// Get contacts with query parameters
const contacts = await mp.getTableRecords({
  table: 'Contacts',
  filter: 'Contact_Status_ID=1',
  select: 'Contact_ID,Display_Name,Email_Address',
  orderBy: 'Last_Name',
  top: 50
});

// Create records (without validation - backward compatible)
// Note: datetimes crossing the MP boundary go through DomainTimezoneService.
// MP stores wall-clock values in the domain's time zone, NOT UTC, so a raw
// `new Date().toISOString()` writes the wrong instant.
await mp.createTableRecords('Contact_Log', [{
  Contact_ID: 12345,
  Contact_Date: await tz.toMpSqlDatetime(new Date()),
  Made_By: 1,
  Notes: 'Follow-up call completed'
}]);

// Create records with Zod validation (recommended)
await mp.createTableRecords('Contact_Log', [{
  Contact_ID: 12345,
  Contact_Date: await tz.toMpSqlDatetime(new Date()),
  Made_By: 1,
  Notes: 'Follow-up call completed'
}], {
  schema: ContactLogSchema,  // Validates data before API call
  $userId: 1
});

// Update with partial validation (default)
await mp.updateTableRecords('Contact_Log', records, {
  schema: ContactLogSchema,
  partial: true  // Allow partial updates
});

// Note: in real code `Made_By` and `Contact_ID` are server-authoritative —
// ContactLogService derives them from the authorized session, never from the
// caller. They are shown literally here only to keep the example self-contained.

// Execute stored procedures — deny-all by default. A procedure runs only if the
// helper instance that calls it lists it (exact name, fixed in code, never from
// request input):
const procs = new MPHelper({ allowedProcedures: ['api_Custom_Procedure'] });
const results = await procs.executeProcedureWithBody('api_Custom_Procedure', {
  '@ContactID': 12345
});

// File operations
const files = await mp.getFilesByRecord({
  table: 'Contacts',
  recordId: 12345
});
```

### Available Services

| Service | Purpose | Key Methods |
|---------|---------|-------------|
| **Table Service** | CRUD operations | `getTableRecords`, `createTableRecords`, `updateTableRecords`, `deleteTableRecords` |
| **Procedure Service** | Stored procedures | `getProcedures`, `executeProcedure`, `executeProcedureWithBody` |
| **Communication Service** | Email/SMS | `createCommunication(content, sender, attachments?)`, `sendMessage(content, sender, attachments?)` |
| **File Service** | File management | `getFilesByRecord`, `uploadFiles`, `updateFile`, `deleteFile`, `getFileContentByUniqueId`, `getFileMetadata`, `getFileMetadataByUniqueId` |
| **Metadata Service** | Schema info | `getTables`, `refreshMetadata` |
| **Domain Service** | Domain config | `getDomainInfo`, `getGlobalFilters` |

The communication methods take the sender as a separate, required argument; any author/From fields left on the content are ignored. Build `sender` only from trusted server state — the `User_ID` returned by `AuthorizationService.requireSecurityRole` and a contact looked up server-side — never from request input: the service account can send as anyone.

### Type Generation

Generate TypeScript interfaces and Zod schemas from your Ministry Platform database schema:

```bash
# Generate types for all tables with Zod schemas (recommended)
npm run mp:generate:models

# Generate types for specific tables
npx tsx --conditions=react-server src/lib/providers/ministry-platform/scripts/generate-types.ts --search "Contact"

# Generate to a custom directory with Zod schemas
npx tsx --conditions=react-server src/lib/providers/ministry-platform/scripts/generate-types.ts -o ./types --zod

# See all options
npx tsx --conditions=react-server src/lib/providers/ministry-platform/scripts/generate-types.ts --help
```

**CLI Options:**
- `-o, --output <dir>` - Output directory (default: ./generated-types)
- `-s, --search <term>` - Filter tables by search term
- `-z, --zod` - Generate Zod schemas for runtime validation
- `-c, --clean` - Remove existing files before generating (recommended)
- `-d, --detailed` - Sample records for better type inference (slower)
- `--sample-size <num>` - Number of records to sample in detailed mode
- `-h, --help` - Show the help message

**Generated Output:**
- 301 TypeScript interfaces (one per table)
- 301 Zod validation schemas
- A barrel `index.ts` re-exporting all of them (603 files in total)
- Schema documentation with type file links (`.claude/references/ministryplatform.schema.md`)

See [Ministry Platform Type Generator documentation](src/lib/providers/ministry-platform/scripts/README.md) for details.

## Components

### UI Components
Built with Radix UI primitives and styled with Tailwind CSS. Located in `src/components/ui/`:
- Alert, Alert Dialog, Avatar, Breadcrumb, Button, Card
- Checkbox, Dialog, Drawer, Dropdown Menu, Form, Input
- Label, Radio Group, Select, Skeleton, Switch, Textarea, Tooltip

### Layout Components (`src/components/layout/`)
- **AuthWrapper**: Server component for route protection with session validation
- **Header**: Application header with sidebar toggle and user menu
- **Sidebar**: Navigation sidebar with route links
- **DynamicBreadcrumb**: Auto-generated breadcrumbs from URL path

### Feature Components
- **contact-lookup**: Contact search by name, email or phone
- **contact-lookup-details**: Detailed contact view with logs
- **contact-logs**: Full CRUD for contact interaction history
- **home-demos**: Dashboard demo tiles, hidden for users without contact access
- **sign-in**: Sign-in page body; starts the OAuth flow with callback-URL sanitization
- **user-menu**: User profile dropdown with sign-out

### Error Boundaries
One throw no longer takes the whole page. Three boundaries, each scoped deliberately:
- **`src/app/(web)/error.tsx`** — inside the protected group, so the header and sign-out survive a feature crash
- **`src/app/error.tsx`** — the bare recovery routes outside the app shell
- **`src/app/global-error.tsx`** — last resort when the root layout itself throws; it renders its own `<html>` and inlines its styles

All components follow kebab-case naming and use named exports. Files in `src/app/` (`page.tsx`, `layout.tsx`, `error.tsx`, `global-error.tsx`) use default exports because the App Router requires it.

## Services

Application services provide business logic abstraction over the Ministry Platform API:

| Service | File | Purpose |
|---------|------|---------|
| **ContactService** | `contactService.ts` | Contact search and updates |
| **ContactLogService** | `contactLogService.ts` | Contact log CRUD with validation |
| **UserService** | `userService.ts` | User profile retrieval |
| **AuthorizationService** | `authorizationService.ts` | Ministry Platform security-role gate for reads *and* writes; throws `UnauthorizedError` |
| **SessionContextService** | `sessionContextService.ts` | Resolves the acting MP `User_ID` so writes are attributed correctly in `dp_Audit_Log` |
| **DomainTimezoneService** | `domainTimezoneService.ts` | Converts every datetime crossing the MP boundary, since MP stores wall-clock values in the domain's time zone |

All services follow the singleton pattern; all except `SessionContextService` use `MPHelper` for API communication.

> **Authorize, don't just authenticate.** A session only proves that *some* Ministry Platform user signed in. All MP data is fetched with the application's service account, so `AuthorizationService.requireSecurityRole` is the only thing deciding who may see or change a record — and it gates reads as well as writes. Server actions and service methods must call it rather than a bare `auth.api.getSession()` check.

## Testing

The project uses **Vitest 4** — 1,015 tests at 99.74% statement coverage, gated in CI.

The dev tooling in `scripts/` has its own small Node-only suite — `scripts/setup-env.test.ts` (the setup script's `.env.local` writer, round-tripped through Next's real env loader) and `scripts/check-prerender.test.ts` (the CI prerender guard). It is the `scripts` project in `vitest.config.mts`, so `npm test`, `npm run test:run` and `npm run test:coverage` run it alongside the app suite; `npm run test:scripts` runs it alone. It sits outside the `src/`-only coverage denominator, so it does not affect the coverage gates.

### Test Infrastructure

- **Framework**: Vitest with jsdom environment
- **Libraries**: @testing-library/react, @testing-library/jest-dom
- **Coverage**: v8 provider with HTML reports

### Running Tests

```bash
# Run tests in watch mode
npm test

# Single test run
npm run test:run

# Generate coverage report
npm run test:coverage
```

### Test Coverage

Tests are co-located with the code they cover — `foo.ts` sits next to `foo.test.ts`.

| Area | Coverage |
|------|----------|
| Overall | 99.74% statements, 97.21% branches (gated in CI) |
| Services (`src/services/`) | 100% |
| Server actions (`**/actions.ts`) | 100% |
| App routes (`src/app/**`) | 100% |
| React components | 99.69% |
| MP provider + sub-services | 99.72% |

**Total**: 1,015 tests across 59 test files — 99.74% statements, 97.21% branches, 99.31% functions, 99.91% lines.

### Test Configuration

Tests are configured in `vitest.config.mts`:
- Environment variables stubbed in `src/test-setup.ts`
- Auto-generated models and the dev-only codegen scripts are excluded from coverage
- `src/components/ui/` is excluded from the denominator — testing thin shadcn/Radix wrappers only asserts that Radix works
- Supports TypeScript path aliases

**Coverage is gated, not advisory.** `vitest.config.mts` sets per-area thresholds (`src/app/**`, `src/components/**/*.tsx`, `src/services/**`, `src/lib/**/*.ts`, `src/contexts/**`, and `src/proxy.ts` at 100%) plus a global backstop of 98% statements / 95% branches / 97% functions / 98% lines. The global gate is what catches a newly added, entirely untested file, since a new file inside a per-area glob would simply be diluted by everything already covered there.

CI (`.github/workflows/test.yml`) runs on Node 22:

- `test` — `npx vitest run --coverage` (both Vitest projects, `src` and `scripts`, once each). The Codecov upload is pinned `fail_ci_if_error: false` and cannot fail the build — **the coverage thresholds are the actual PR gate.**
- `lint` — `npm run lint` (including the `no-console` rule over `src/`) and `npx tsc --noEmit`.
- `lockfile` — the platform-drift check described under [Known Issues](#known-issues).
- `build` — `npm run build` with dummy environment values (a non-resolving `mp.invalid` Ministry Platform URL — the build never reaches a real instance), then `npm run build:check-prerender`, which fails if any app route other than Next's built-in `/_not-found` and `/_global-error` was prerendered as static (○). A prerendered page has no per-request CSP nonce, so under the enforced CSP it never hydrates. The allowlist is in `scripts/check-prerender.mjs`; after a local `npm run build` you can run the same check yourself.

Every action is pinned to a full commit SHA (Dependabot keeps them current via `.github/dependabot.yml`), and each workflow declares `permissions: contents: read`.

## Development

### Available Commands

```bash
# Start development server
npm run dev

# Build for production (Turbopack, includes type checking)
npm run build

# Start production server
npm start

# Run ESLint (native flat config — `next lint` was removed in Next.js 16)
npm run lint

# Run tests
npm test              # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage report
npm run test:scripts  # Only the scripts/ (dev tooling) project

# After a build: fail if a route other than /_not-found and /_global-error was prerendered
npm run build:check-prerender

# Generate MP types (basic, to custom location)
npm run mp:generate

# Generate MP types to models directory with Zod schemas (recommended)
npm run mp:generate:models

# Regenerate the stored-procedure reference
npm run mp:generate:storedprocs

# Dependencies — see Known Issues before touching the lockfile
npm run deps:verify   # Check package-lock.json for platform drift
npm run deps:relock   # The ONLY supported way to regenerate package-lock.json

# Interactive project setup
npm run setup
npm run setup:check   # Validate setup without making changes
```

### Building for Production

```bash
npm run build
npm start
```

> **Note**: The build process includes TypeScript type checking. Ensure all generated types are up to date by running `npm run mp:generate:models` before building.

## Claude Code Commands

This project includes custom [Claude Code](https://claude.ai/code) commands (skills) to streamline development workflows. These commands are invoked using the `/command` syntax in Claude Code.

### Available Commands

| Command | Description |
|---------|-------------|
| `/audit-deps [args]` | Dependency audit — advisories, exploitability triage, and guided upgrades |
| `/release [args]` | Cut a GitHub release with notes auto-generated from merged PRs |

### `/audit-deps` - Dependency Audit

Performs a complete review of dependencies: real vulnerability exposure, available updates, and — with approval where required — applies and verifies the upgrades.

**What it does:**
- Runs `npm audit` for vulnerability detection
- Triages each advisory for actual exploitability in this codebase, rather than treating the raw count as the signal
- Categorizes updates as safe (patch/minor) or major (breaking changes)
- Applies approved upgrades and verifies them against build, lint, and tests

**Usage:**
```
/audit-deps                  # Full audit, then guided upgrades
/audit-deps --report-only    # Audit and report; change nothing
/audit-deps --majors-only    # Only consider major-version upgrades
/audit-deps --major <pkg>    # Take a specific package to its next major
/audit-deps --no-verify      # Skip the post-upgrade verification run
```

> This command never reads or writes Ministry Platform data — it touches only local dependencies and report files. Run reports go to `.claude/reports/`, which is gitignored; lasting findings are recorded in [Dependency Known Issues](.claude/references/deps-known-issues.md).

### `/release` - GitHub Release

Creates a GitHub release with notes generated from the pull requests merged since the previous release.

**What it does:**
- Finds the last release tag and collects PRs merged since
- Computes a calver tag, `v{YYYY}.{MM}.{DD}.{HHmm}` (UTC), unless you pass `--tag`
- Groups PRs into Breaking Changes / Features / Bug Fixes / Documentation / Maintenance
- Shows you the draft notes for approval before publishing

**Usage:**
```
/release                       # Auto-compute the calver tag
/release --tag v2026.09.12.1200  # Use an explicit tag
```

### Command Files

Command definitions are stored in `.claude/commands/`:
```
.claude/commands/
├── audit-deps.md      # Dependency audit command
└── release.md         # GitHub release command
```

## Documentation

- **[CLAUDE.md](CLAUDE.md)** - Development guide with commands, architecture, and code style conventions
- **[OAUTH_LOGOUT_SETUP.md](docs/OAUTH_LOGOUT_SETUP.md)** - OAuth logout configuration and OIDC RP-initiated logout details
- **[Ministry Platform Provider](src/lib/providers/ministry-platform/docs/README.md)** - Complete provider documentation
- **[Type Generator](src/lib/providers/ministry-platform/scripts/README.md)** - CLI tool documentation
- **[Components Reference](.claude/references/components.md)** - Detailed component and route inventory with compliance status
- **[MP Schema Reference](.claude/references/ministryplatform.schema.md)** - Auto-generated database schema
- **[MP Stored Procedures](.claude/references/ministryplatform.storedprocs.md)** - Auto-generated stored-procedure inventory
- **[MP Query Syntax](.claude/references/ministryplatform.query-syntax.md)** - Filters, aggregates, and FK traversal rules for `GET /tables/{table}`
- **[MP Date/Time Handling](.claude/references/ministryplatform.datetimehandling.md)** - Sending and receiving MP datetimes safely via `DomainTimezoneService`
- **[Auth Reference](.claude/references/auth.md)** - Better Auth config, OAuth flow, the security-role gate, and session access patterns
- **[Testing Reference](.claude/references/testing.md)** - Vitest setup, mock patterns, coverage data, and test inventory
- **[Security Headers](.claude/references/security-headers.md)** - The nonce-based CSP and the deliberate loosenings not to "tighten"
- **[Dependency Known Issues](.claude/references/deps-known-issues.md)** - Lockfile platform drift and standing advisories
- **[Session Identity Advisory](docs/security/2026-09-12-session-identity.md)** - The 2026-09-12 vulnerability, who is affected, and remediation

## Code Style & Conventions

### Import Paths
Use the `@/*` path alias for all internal imports:
```typescript
import { MPHelper } from '@/lib/providers/ministry-platform';
import { Button } from '@/components/ui/button';
import { ContactSearch } from '@/lib/dto';
import { Header, Sidebar } from '@/components/layout';
```

### Component Style
- React Server Components by default
- Add `"use client"` only when needed for interactivity
- Keep UI components in `src/components/ui/`
- Follow shadcn/ui conventions
- Use named exports (no default exports) — except `src/app/` route files, which the App Router requires to default-export
- Organize feature components in folders with barrel exports

### Naming Conventions
- **PascalCase**: Component names, types, interfaces
- **camelCase**: Functions, variables
- **kebab-case**: All component files and folders
- **snake_case**: Ministry Platform API fields

### Component Organization
```
src/components/
├── shared-actions/       # Cross-feature server actions
├── ui/                   # shadcn/ui components
├── layout/               # Layout components (header, sidebar, etc.)
├── feature-name/         # Feature folder (kebab-case)
│   ├── feature-name.tsx  # Main component
│   ├── actions.ts        # Feature-specific server actions
│   └── index.ts          # Barrel exports
└── shared-component.tsx  # Shared standalone components
```

### Import Examples
```typescript
// Import feature components via barrel exports
import { ContactLookup } from '@/components/contact-lookup';
import { UserMenu } from '@/components/user-menu';

// Import layout components
import { Header, Sidebar, AuthWrapper } from '@/components/layout';

// Import application DTOs
import { ContactSearch, ContactLookupDetails } from '@/lib/dto';

// Import Ministry Platform models (generated)
import { ContactLog, Congregations } from '@/lib/providers/ministry-platform/models';

// Import Ministry Platform Zod schemas
import { ContactLogSchema } from '@/lib/providers/ministry-platform/models';

// Import Ministry Platform helper
import { MPHelper } from '@/lib/providers/ministry-platform';

// Import shared actions
import { getCurrentUserProfile } from '@/components/shared-actions/user';
```

### TypeScript
- Strict mode enabled
- Export interfaces from models
- Use Zod schemas for validation
- Leverage TypeScript generics for type safety

### Best Practices
1. **Regenerate types** after Ministry Platform schema changes: `npm run mp:generate:models`
2. Always use TypeScript generics for type-safe API calls
3. Handle errors with try-catch blocks
4. **Use Zod schemas for runtime validation** - Pass the optional `schema` parameter to `createTableRecords()` and `updateTableRecords()` to validate data before API calls:
   ```typescript
   import { ContactLogSchema } from '@/lib/providers/ministry-platform/models';

   await mp.createTableRecords('Contact_Log', records, {
     schema: ContactLogSchema,  // Catch validation errors before API call
     $userId: 1
   });
   ```
5. Keep Ministry Platform structure organized:
   - Generated database models: `src/lib/providers/ministry-platform/models/` (auto-generated, don't edit manually)
   - Application-level DTOs/ViewModels: `src/lib/dto/` (hand-written)
   - Export all from respective `index.ts` files
6. Access fields with special characters using bracket notation: `event["Allow_Check-in"]`
7. **Run tests** before committing: `npm run test:run`

## Known Issues

### Lockfile platform drift — do not run a bare `npm install` to relock

**Never regenerate `package-lock.json` with a bare `npm install` or `npm dedupe` on Windows.** Use `npm run deps:relock`.

This repo's lockfile is authored on Windows and installed by CI on Linux. npm resolves optional and bundled subtrees per platform, so a Windows-generated lockfile can omit entries that `npm ci` on Linux requires — CI then dies at the install step before a single test runs. This broke `main` twice (2026-05-17 `@emnapi/*`, 2026-08-21 `ajv`). One `npm dedupe` on Windows is enough to reproduce it.

Critically, **`npm ci --dry-run` cannot detect this on Windows.** It exits 0 there against a lockfile that fails on Linux, and `--os`/`--cpu` do not change that. A green local check proves nothing. Run `npm run deps:verify`, which asserts the lockfile already matches Linux resolution.

Two things enforce this: a pre-commit hook (`.githooks/pre-commit`, auto-installed by the `prepare` script) and a dedicated `lockfile` job in CI. Full detail: [Dependency Known Issues](.claude/references/deps-known-issues.md).

Also: **do not run `npm ci` while `next dev` is running.** It deletes `node_modules` first, then aborts on a locked native `.node` file, leaving the tree half-installed. Stop the dev server first.

### npm audit advisories

`npm audit` currently reports **0 vulnerabilities across 720 packages** (verified 2026-09-12). The moderate `postcss` advisories this section used to describe were resolved upstream: `next@16.3.7` bundles `postcss@8.5.23` and the top-level `postcss` resolves to `8.5.28`, both well clear of the `< 8.5.10` threshold.

**Never run `npm audit fix --force`.** It still "fixes" bundled-dependency findings by downgrading `next` to a major version this codebase cannot run on.

Re-check with `/audit-deps`, which triages each finding for real exploitability rather than treating the raw count as the signal. Triaged vendor advisories that `npm audit` does not surface are tracked in [Dependency Known Issues](.claude/references/deps-known-issues.md).

## Contributing

This project follows strict TypeScript conventions and code style. Please review [CLAUDE.md](CLAUDE.md) before contributing.

## License

[MIT](LICENSE). Fork it, customize it, and run it for your church; keep the copyright and license notice in your copy.

## Support

For Ministry Platform API documentation, refer to your instance's API documentation portal.

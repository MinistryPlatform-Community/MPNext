# MPNext

A modern Next.js application integrated with Ministry Platform authentication and REST API, built with TypeScript, Next.js 16, React 19, and NextAuth v5.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Quick Setup with Claude Code](#quick-setup-with-claude-code)
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

## Features

- **Authentication**: NextAuth v5 with Ministry Platform OAuth provider and OIDC RP-initiated logout
- **Modern UI**: Radix UI primitives + shadcn/ui components with Tailwind CSS v4
- **Type-Safe API**: Full TypeScript support with auto-generated types from Ministry Platform schema
- **Next.js 16**: App Router with React Server Components and Cache Components
- **REST API Client**: Comprehensive Ministry Platform REST API integration
- **Type Generation**: CLI tool to generate TypeScript interfaces and Zod schemas from MP database
- **Schema Documentation**: Auto-generated markdown documentation with type file links
- **Validation**: Optional Zod schema validation in MPHelper for runtime data validation before API calls
- **Testing**: Vitest test framework with comprehensive coverage for auth, middleware, and API services
- **Tools Framework**: Reusable tool components for building Ministry Platform page tools

## Architecture

### Framework
- **Next.js 16.1.6** with App Router
- **React 19** with Server Components by default
- **TypeScript** in strict mode
- **Tailwind CSS v4** for styling
- **Vitest 4.0** for testing

### Ministry Platform Integration
Custom provider located at `src/lib/providers/ministry-platform/` featuring:
- REST API client with OAuth2 authentication
- Service-oriented architecture for domain-specific logic
- Type-safe models and Zod validation schemas (603 generated files)
- Automatic token management with refresh
- Six specialized services: Table, Procedure, Communication, File, Metadata, Domain

### Authentication
NextAuth v5 (beta) with custom Ministry Platform OAuth provider (`src/auth.ts`)
- JWT session strategy with automatic token refresh
- OIDC RP-initiated logout for proper session termination
- Middleware-based route protection

## Prerequisites

- **Node.js**: v22 or higher (v20.9+ minimum, v22 LTS recommended)
- **Package Manager**: npm (comes with Node.js)
- **Ministry Platform**: Active instance with API credentials and OAuth client configured (see [OAuth Setup](#oauth-setup))

## Getting Started

### Quick Setup with Claude Code

If you have [Claude Code](https://claude.ai/code) installed, the setup process is automated:

```bash
git clone https://github.com/MinistryPlatform-Community/MPNext.git
cd MPNext
npm install
npm run setup
```

The interactive setup command will:
1. Verify Node.js version (v18+ required)
2. Check git status
3. Create `.env.local` from `.env.example` (if needed)
4. Prompt for missing environment variables
5. Auto-generate `NEXTAUTH_SECRET` (optional)
6. Install and update dependencies
7. Generate Ministry Platform types
8. Run a production build to verify configuration

**Additional setup options:**
```bash
npm run setup:check     # Validation only (no changes)
npm run setup -- --clean       # Clean install (delete node_modules first)
npm run setup -- --skip-install # Skip npm install/update
npm run setup -- --verbose     # Extra output
npm run setup -- --help        # Show all options
```

Once setup completes, run `npm run dev` and visit http://localhost:3000.

---

### Manual Setup

If you prefer manual setup or don't have Claude Code:

#### 1. Clone the Repository

```bash
git clone https://github.com/MinistryPlatform-Community/MPNext.git
cd MPNext
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Environment Configuration

Copy the example environment file and configure it with your Ministry Platform credentials:

```bash
cp .env.example .env.local
```

Update `.env.local` with your configuration:

```env
# NextAuth Provider Configuration
OIDC_PROVIDER_NAME="MinistryPlatform"
OIDC_CLIENT_ID=MPNext
OIDC_CLIENT_SECRET=your_client_secret
OIDC_WELL_KNOWN_URL=https://your-instance.ministryplatform.com/ministryplatformapi/oauth/.well-known/openid-configuration
OIDC_SCOPE=openid profile email offline_access http://www.thinkministry.com/dataplatform/scopes/all

# Generate this secret via: npx auth secret
NEXTAUTH_SECRET=your_generated_secret

# Update for production
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_DEBUG=false

# MinistryPlatform API Configuration
MINISTRY_PLATFORM_CLIENT_ID=MPNext
MINISTRY_PLATFORM_CLIENT_SECRET=your_client_secret
MINISTRY_PLATFORM_BASE_URL=https://your-instance.ministryplatform.com/ministryplatformapi

# Public Keys
NEXT_PUBLIC_MINISTRY_PLATFORM_FILE_URL=https://your-instance.ministryplatform.com/ministryplatformapi/files
NEXT_PUBLIC_APP_NAME=App
```


#### API Client Setup

Before running the application, you must configure an OAuth 2.0 / OpenID Connect (OIDC) client in Ministry Platform.

Log in to your Ministry Platform instance as an administrator and navigate to **Administration > API Clients**.

Create a new API Client with the following configuration:

##### Basic Settings
- **Client ID**: `MPNext` (or your custom client ID)
- **Client Secret**: Generate a secure secret (save this securely - you'll need it for `.env.local`)
- **Display Name**: `MPNext` (or your preferred name)
- **Client User**: Create a scoped user or use API User
- **Authentication Flow**: use the default: Authorization Code, Implicit, Hybrid, Client Credentials, or Resource Owner

##### Redirect URIs (Required)
Add these authorized redirect URIs where users will be sent after authentication - separate each entry by ending with a semi-colon(;):

**Development:**
```
http://localhost:3000/api/auth/callback/ministryplatform
```

**Production:**
```
https://yourdomain.com/api/auth/callback/ministryplatform
```

> **Important**: The redirect URI must match exactly (including protocol, domain, port, and path). Ministry Platform will reject any OAuth requests with mismatched redirect URIs.

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

##### Token Lifetimes (Default Settings)


#### Generate NextAuth Secret

Generate a secure secret for NextAuth session encryption:

```bash
npx auth secret
```

Copy the generated secret to your `.env.local` file as `NEXTAUTH_SECRET`.


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
npx tsx src/lib/providers/ministry-platform/scripts/generate-types.ts -s "Contact"

# Generate without Zod schemas
npx tsx src/lib/providers/ministry-platform/scripts/generate-types.ts -o ./types

# Generate with detailed mode (samples records for better type inference)
npx tsx src/lib/providers/ministry-platform/scripts/generate-types.ts -d --sample-size 10

# See all options
npx tsx src/lib/providers/ministry-platform/scripts/generate-types.ts --help
```

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

1. Update `NEXTAUTH_URL` to your production domain
2. Add production redirect URIs to Ministry Platform OAuth client
3. Add production post-logout redirect URIs
4. Ensure environment variables are set in your hosting provider
5. Enable HTTPS/SSL certificates
6. Test the complete authentication flow in production environment

## Project Structure

```
MPNext/
├── src/
│   ├── app/                              # Next.js App Router pages
│   │   ├── (web)/                        # Protected route group
│   │   │   ├── contactlookup/            # Contact lookup demo
│   │   │   │   └── [guid]/               # Dynamic contact detail page
│   │   │   ├── home/                     # Home redirect
│   │   │   ├── tools/                    # Tools framework
│   │   │   │   └── template/             # Template tool example
│   │   │   ├── layout.tsx                # Web layout with auth
│   │   │   └── page.tsx                  # Dashboard/home page
│   │   ├── api/auth/[...nextauth]/       # NextAuth API routes
│   │   ├── signin/                       # Sign-in page
│   │   ├── layout.tsx                    # Root layout
│   │   └── providers.tsx                 # App providers wrapper
│   │
│   ├── components/                       # React components
│   │   ├── contact-logs/                 # Contact logs feature (CRUD)
│   │   │   ├── contact-logs.tsx
│   │   │   ├── actions.ts
│   │   │   └── index.ts
│   │   ├── contact-lookup/               # Contact lookup feature
│   │   │   ├── contact-lookup.tsx
│   │   │   ├── contact-lookup-search.tsx
│   │   │   ├── contact-lookup-results.tsx
│   │   │   ├── actions.ts
│   │   │   └── index.ts
│   │   ├── contact-lookup-details/       # Contact details feature
│   │   │   ├── contact-lookup-details.tsx
│   │   │   ├── actions.ts
│   │   │   └── index.ts
│   │   ├── layout/                       # Layout components
│   │   │   ├── auth-wrapper.tsx
│   │   │   ├── dynamic-breadcrumb.tsx
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── index.ts
│   │   ├── tool/                         # Tool framework components
│   │   │   ├── tool-container.tsx
│   │   │   ├── tool-header.tsx
│   │   │   ├── tool-footer.tsx
│   │   │   ├── tool-params-debug.tsx
│   │   │   └── index.ts
│   │   ├── user-menu/                    # User menu feature
│   │   │   ├── user-menu.tsx
│   │   │   ├── actions.ts
│   │   │   └── index.ts
│   │   ├── user-tools-debug/             # Development debug helper
│   │   │   ├── user-tools-debug.tsx
│   │   │   ├── actions.ts
│   │   │   └── index.ts
│   │   ├── shared-actions/               # Cross-feature server actions
│   │   │   └── user.ts
│   │   └── ui/                           # shadcn/ui components (19 components)
│   │
│   ├── contexts/                         # React Context providers
│   │   ├── session-context.tsx
│   │   ├── user-context.tsx
│   │   └── index.ts
│   │
│   ├── lib/                              # Shared libraries
│   │   ├── dto/                          # Application DTOs/ViewModels
│   │   │   ├── contacts.ts
│   │   │   ├── contact-logs.ts
│   │   │   └── index.ts
│   │   ├── tool-params.ts                # Tool parameter utilities
│   │   ├── utils.ts                      # General utilities
│   │   └── providers/
│   │       └── ministry-platform/        # Ministry Platform provider
│   │           ├── auth/                 # OAuth authentication
│   │           │   ├── auth-provider.ts
│   │           │   ├── client-credentials.ts
│   │           │   └── types.ts
│   │           ├── services/             # API services
│   │           │   ├── table.service.ts
│   │           │   ├── procedure.service.ts
│   │           │   ├── communication.service.ts
│   │           │   ├── file.service.ts
│   │           │   ├── metadata.service.ts
│   │           │   └── domain.service.ts
│   │           ├── models/               # Generated types (603 files)
│   │           ├── types/                # Type definitions
│   │           ├── utils/                # HTTP client utilities
│   │           ├── scripts/              # Type generation CLI
│   │           ├── docs/                 # Provider documentation
│   │           ├── client.ts             # Core MP client
│   │           ├── provider.ts           # Singleton provider
│   │           ├── helper.ts             # Public API (MPHelper)
│   │           └── index.ts              # Barrel export
│   │
│   ├── services/                         # Application services
│   │   ├── contactService.ts
│   │   ├── contactLogService.ts
│   │   ├── userService.ts
│   │   └── toolService.ts
│   │
│   ├── types/                            # Application-wide types
│   │   └── next-auth.d.ts                # NextAuth type extensions
│   │
│   ├── auth.ts                           # NextAuth configuration
│   ├── auth.test.ts                      # Auth tests
│   ├── middleware.ts                     # Next.js middleware
│   ├── middleware.test.ts                # Middleware tests
│   └── test-setup.ts                     # Vitest setup
│
├── .claude/                              # Claude AI configuration
│   ├── commands/                         # Claude Code skills
│   └── references/                       # Documentation references
├── docs/                                 # Documentation
│   └── OAUTH_LOGOUT_SETUP.md
├── public/                               # Static assets
├── coverage/                             # Test coverage reports
├── .env.example                          # Environment template
├── CLAUDE.md                             # Development guide
├── vitest.config.ts                      # Vitest configuration
├── components.json                       # shadcn/ui configuration
├── next.config.ts                        # Next.js configuration
├── tailwind.config.js                    # Tailwind CSS configuration
├── tsconfig.json                         # TypeScript configuration
└── package.json                          # Dependencies and scripts
```

## Ministry Platform Integration

### MPHelper - Public API

The main entry point for interacting with Ministry Platform:

```typescript
import { MPHelper } from '@/lib/providers/ministry-platform';
import { ContactLogSchema } from '@/lib/providers/ministry-platform/models';

const mp = new MPHelper();

// Get contacts with query parameters
const contacts = await mp.getTableRecords({
  table: 'Contacts',
  filter: 'Contact_Status_ID=1',
  select: 'Contact_ID,Display_Name,Email_Address',
  orderBy: 'Last_Name',
  top: 50
});

// Create records (without validation - backward compatible)
await mp.createTableRecords('Contact_Log', [{
  Contact_ID: 12345,
  Contact_Date: new Date().toISOString(),
  Made_By: 1,
  Notes: 'Follow-up call completed'
}]);

// Create records with Zod validation (recommended)
await mp.createTableRecords('Contact_Log', [{
  Contact_ID: 12345,
  Contact_Date: new Date().toISOString(),
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

// Execute stored procedures
const results = await mp.executeProcedureWithBody('api_Custom_Procedure', {
  '@ContactID': 12345
});

// File operations
const files = await mp.getFilesByRecord({
  tableName: 'Contacts',
  recordId: 12345
});
```

### Available Services

| Service | Purpose | Key Methods |
|---------|---------|-------------|
| **Table Service** | CRUD operations | `getTableRecords`, `createTableRecords`, `updateTableRecords`, `deleteTableRecords` |
| **Procedure Service** | Stored procedures | `getProcedures`, `executeProcedure`, `executeProcedureWithBody` |
| **Communication Service** | Email/SMS | `createCommunication`, `sendMessage` |
| **File Service** | File management | `getFilesByRecord`, `uploadFiles`, `updateFile`, `deleteFile` |
| **Metadata Service** | Schema info | `getTables`, `refreshMetadata` |
| **Domain Service** | Domain config | `getDomainInfo`, `getGlobalFilters` |

### Type Generation

Generate TypeScript interfaces and Zod schemas from your Ministry Platform database schema:

```bash
# Generate types for all tables with Zod schemas (recommended)
npm run mp:generate:models

# Generate types for specific tables
npx tsx src/lib/providers/ministry-platform/scripts/generate-types.ts --search "Contact"

# Generate without cleaning old files
npx tsx src/lib/providers/ministry-platform/scripts/generate-types.ts -o ./types --zod

# See all options
npx tsx src/lib/providers/ministry-platform/scripts/generate-types.ts --help
```

**CLI Options:**
- `-o, --output <dir>` - Output directory (default: ./generated-types)
- `-s, --search <term>` - Filter tables by search term
- `-z, --zod` - Generate Zod schemas for runtime validation
- `-c, --clean` - Remove existing files before generating (recommended)
- `-d, --detailed` - Sample records for better type inference (slower)
- `--sample-size <num>` - Number of records to sample in detailed mode

**Generated Output:**
- 301 TypeScript interfaces (one per table)
- 301 Zod validation schemas
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
- **contact-lookup**: Contact search with fuzzy matching
- **contact-lookup-details**: Detailed contact view with logs
- **contact-logs**: Full CRUD for contact interaction history
- **user-menu**: User profile dropdown with sign-out

### Tool Components (`src/components/tool/`)
- **ToolContainer**: Main wrapper for tool pages
- **ToolHeader**: Tool title bar with optional info tooltip
- **ToolFooter**: Save/Close action buttons
- **ToolParamsDebug**: Development helper for debugging URL parameters

All components follow kebab-case naming and use named exports for consistency.

## Services

Application services provide business logic abstraction over the Ministry Platform API:

| Service | File | Purpose |
|---------|------|---------|
| **ContactService** | `contactService.ts` | Contact search and updates |
| **ContactLogService** | `contactLogService.ts` | Contact log CRUD with validation |
| **UserService** | `userService.ts` | User profile retrieval |
| **ToolService** | `toolService.ts` | Tool page data and user permissions |

All services follow the singleton pattern and use `MPHelper` for API communication.

## Building Custom Tools

### Template Tool

The project includes a template tool (`src/app/(web)/tools/template/`) that demonstrates best practices for building Ministry Platform tools that can be launched from within MP pages.

**Key features:**
- URL parameter parsing for MP page context (`pageID`, record selection, etc.)
- Dual-mode support (create new vs. edit existing records)
- Standard tool UI with save/close actions
- Development helpers for debugging tool params and user context
- Integration with `ToolContainer` component for consistent UX

**Structure:**
```
src/app/(web)/tools/template/
├── page.tsx           # Server component that parses URL params
└── template-tool.tsx  # Client component with tool UI
```

**Usage as a starting point:**
1. Copy the `template` folder to create your new tool
2. Rename files and components appropriately
3. Implement your tool logic inside the `ToolContainer`
4. Remove `ToolParamsDebug` and `UserToolsDebug` before production

**URL Parameters:**
Tools receive standard MP parameters like `pageID`, `s` (selection), and `recordDescription`. Use `parseToolParams()` to handle them consistently.

See the [template tool](src/app/(web)/tools/template/) for implementation details.

## Testing

The project uses **Vitest 4.0** with comprehensive test coverage for critical functionality.

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

| Area | Files | Coverage |
|------|-------|----------|
| Authentication | `auth.test.ts` | JWT callbacks, token refresh, session handling |
| Middleware | `middleware.test.ts` | Route protection, token validation |
| MP Client | `client.test.ts` | OAuth token management |
| MPHelper | `helper.test.ts` | All CRUD operations, validation |
| Table Service | `table.service.test.ts` | Table operations |
| HTTP Client | `http-client.test.ts` | HTTP methods, URL building |

**Total**: ~190+ test cases across 6 test files

### Test Configuration

Tests are configured in `vitest.config.ts`:
- Environment variables stubbed in `src/test-setup.ts`
- Auto-generated models excluded from coverage
- Supports TypeScript path aliases

## Development

### Available Commands

```bash
# Start development server
npm run dev

# Build for production (includes type checking)
npm run build

# Start production server
npm start

# Run ESLint
npm run lint

# Run tests
npm test              # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage report

# Generate MP types (basic, to custom location)
npm run mp:generate

# Generate MP types to models directory with Zod schemas (recommended)
npm run mp:generate:models
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
| `/audit-deps` | Security and update audit for dependencies |
| `/branch-commit [args]` | Create branch and commit changes, optionally linked to GitHub issue |
| `/pr [args]` | Create a pull request with validation |

### `/audit-deps` - Dependency Audit

Performs a comprehensive security and update analysis of project dependencies.

**What it does:**
- Runs `npm audit` for vulnerability detection
- Searches for recent CVEs affecting major dependencies
- Categorizes updates as safe (patch/minor) or major (breaking changes)
- Generates a prioritized action plan

**Usage:**
```
/audit-deps
```

### `/branch-commit` - Branch and Commit

Creates a new branch from the current branch, stages all changes, and commits with detailed notes. Can auto-generate branch name and commit message from a GitHub issue.

**Usage:**
```
/branch-commit                           # Prompts for branch name and commit message
/branch-commit #123                      # Auto-generates from GitHub issue #123
/branch-commit feature/my-change: Add new feature  # Manual branch and commit message
/branch-commit #123 fix/custom-name: Custom message  # Issue reference with custom names
```

**Branch naming convention:**
- `fix/issue-<id>-<slug>` - For bug fixes (issues with "bug" label)
- `feature/issue-<id>-<slug>` - For features/enhancements

### `/pr` - Pull Request

Creates a pull request after validating all prerequisites are met.

**Validations performed:**
- Not on main/master/dev branch
- No uncommitted changes
- Branch pushed to origin
- No existing open PR for branch

**Usage:**
```
/pr                    # Create PR to main branch
/pr --base dev         # Create PR to dev branch
/pr --draft            # Create as draft PR
/pr #123               # Link to specific GitHub issue
```

**PR format includes:**
- Summary section with bullet points
- Test plan checklist
- Issue links (auto-detected from commits)
- Claude Code attribution

### Command Files

Command definitions are stored in `.claude/commands/`:
```
.claude/commands/
├── audit-deps.md      # Dependency audit command
├── branch-commit.md   # Branch and commit command
└── pr.md              # Pull request command
```

## Documentation

- **[CLAUDE.md](CLAUDE.md)** - Development guide with commands, architecture, and code style conventions
- **[OAUTH_LOGOUT_SETUP.md](docs/OAUTH_LOGOUT_SETUP.md)** - OAuth logout configuration and OIDC RP-initiated logout details
- **[Ministry Platform Provider](src/lib/providers/ministry-platform/docs/README.md)** - Complete provider documentation
- **[Type Generator](src/lib/providers/ministry-platform/scripts/README.md)** - CLI tool documentation
- **[Components Reference](.claude/references/components.md)** - Detailed component inventory
- **[MP Schema Reference](.claude/references/ministryplatform.schema.md)** - Auto-generated database schema

## Code Style & Conventions

### Import Paths
Use the `@/*` path alias for all internal imports:
```typescript
import { MPHelper } from '@/lib/providers/ministry-platform';
import { Button } from '@/components/ui/button';
import { ContactSearch } from '@/lib/dto';
import { Header, Sidebar } from '@/components/layout';
import { ToolContainer } from '@/components/tool';
```

### Component Style
- React Server Components by default
- Add `"use client"` only when needed for interactivity
- Keep UI components in `src/components/ui/`
- Follow shadcn/ui conventions
- Use named exports (no default exports)
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
├── tool/                 # Tool framework components
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

// Import tool components
import { ToolContainer, ToolParamsDebug } from '@/components/tool';

// Import application DTOs
import { ContactSearch, ContactLookupDetails } from '@/lib/dto';

// Import Ministry Platform models (generated)
import { ContactLog, Congregation } from '@/lib/providers/ministry-platform/models';

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

## Contributing

This project follows strict TypeScript conventions and code style. Please review [CLAUDE.md](CLAUDE.md) before contributing.

## License

Private

## Support

For Ministry Platform API documentation, refer to your instance's API documentation portal.

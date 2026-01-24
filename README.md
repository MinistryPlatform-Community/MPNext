# MPNext

A modern Next.js application integrated with Ministry Platform authentication and REST API, built with TypeScript, Next.js 15, React 19, and NextAuth v5.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [OAuth Setup](#oauth-setup)
- [Project Structure](#project-structure)
- [Ministry Platform Integration](#ministry-platform-integration)
- [Components](#components)
- [Development](#development)
- [Documentation](#documentation)
- [Code Style & Conventions](#code-style--conventions)

## Features

- 🔐 **Authentication**: NextAuth v5 with Ministry Platform OAuth provider
- 🎨 **Modern UI**: Radix UI primitives + shadcn/ui components with Tailwind CSS v4
- 📊 **Type-Safe API**: Full TypeScript support with auto-generated types from Ministry Platform schema
- ⚡ **Next.js 15**: App Router with React Server Components
- 🔄 **REST API Client**: Comprehensive Ministry Platform REST API integration
- 🛠️ **Type Generation**: CLI tool to generate TypeScript interfaces and Zod schemas from MP database
- ✅ **Validation**: Optional Zod schema validation in MPHelper for runtime data validation before API calls

## Architecture

### Framework
- **Next.js 15** with App Router
- **React 19** with Server Components by default
- **TypeScript** in strict mode
- **Tailwind CSS v4** for styling

### Ministry Platform Integration
Custom provider located at `src/lib/providers/ministry-platform/` featuring:
- REST API client with OAuth2 authentication
- Service-oriented architecture for domain-specific logic
- Type-safe models and Zod validation schemas
- Automatic token management

### Authentication
NextAuth v5 (beta) with custom Ministry Platform OAuth provider (`src/auth.ts`)

## Prerequisites

- **Node.js**: v18 or higher
- **Package Manager**: npm (comes with Node.js)
- **Ministry Platform**: Active instance with API credentials and OAuth client configured (see [OAuth Setup](#oauth-setup))

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/MinistryPlatform-Community/MPNext.git
cd MPNext
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

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
- Clean up any previously generated files
- Output to `src/lib/providers/ministry-platform/models/`

**Expected output:**
```
🚀 Generating TypeScript types from Ministry Platform schema...
📡 Fetching table metadata from Ministry Platform...
✅ Found 301 tables
🧹 Cleaning output directory: src/lib/providers/ministry-platform/models
   Removed 605 existing type files
🔧 Generating type definitions...
  ✓ Contacts.ts (Contacts) [51 columns]
  ✓ Events.ts (Events) [57 columns]
  ...
🎉 Successfully generated 301 table types + 301 Zod schemas (602 total files)
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
- **Auto-login after logout**: Verify post-logout redirect URIs are configured in Ministry Platform OAuth client. The application requires these for proper OIDC logout (see [OAUTH_LOGOUT_SETUP.md](OAUTH_LOGOUT_SETUP.md))


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
│   ├── app/                          # Next.js App Router pages
│   ├── components/                   # React components
│   │   ├── actions/                  # Shared server actions
│   │   │   └── README.md             # Actions organization guide
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── contact-lookup/           # Contact lookup feature
│   │   │   ├── contact-lookup.tsx
│   │   │   ├── contact-lookup-search.tsx
│   │   │   ├── contact-lookup-results.tsx
│   │   │   ├── actions.ts            # Feature-specific actions
│   │   │   └── index.ts              # Barrel exports
│   │   ├── contact-lookup-details/   # Contact details feature
│   │   │   ├── contact-lookup-details.tsx
│   │   │   ├── actions.ts            # Feature-specific actions
│   │   │   └── index.ts              # Barrel exports
│   │   ├── user-menu/                # User menu component
│   │   │   ├── user-menu.tsx
│   │   │   ├── actions.ts            # Feature-specific actions
│   │   │   └── index.ts              # Barrel exports
│   │   ├── auth-wrapper.tsx          # Authentication wrapper
│   │   ├── dynamic-breadcrumb.tsx    # Breadcrumb navigation
│   │   ├── header.tsx                # App header
│   │   ├── session-provider.tsx      # NextAuth session provider
│   │   └── sidebar.tsx               # App sidebar
│   ├── lib/                          # Shared libraries
│   │   ├── dto/                      # Data Transfer Objects / ViewModels (application-level)
│   │   └── providers/
│   │       └── ministry-platform/    # Ministry Platform provider
│   │           ├── auth/             # Authentication logic
│   │           ├── services/         # API services (tables, procedures, files, etc.)
│   │           ├── models/           # Generated type-safe models (auto-generated from DBMS)
│   │           ├── types/            # Type definitions
│   │           ├── utils/            # Utility functions
│   │           ├── scripts/          # CLI tools (type generator)
│   │           ├── docs/             # Provider documentation
│   │           ├── client.ts         # Core MP client
│   │           ├── provider.ts       # Main provider class
│   │           ├── helper.ts         # Public API helper
│   │           └── index.ts          # Barrel export
│   ├── services/                     # Application services
│   ├── types/                        # Application-wide types
│   ├── auth.ts                       # NextAuth configuration
│   └── middleware.ts                 # Next.js middleware
├── public/                           # Static assets
├── .env.example                      # Environment variables template
├── AGENTS.md                         # Development guide for AI agents
├── components.json                   # shadcn/ui configuration
├── next.config.ts                    # Next.js configuration
├── tailwind.config.js                # Tailwind CSS configuration
├── tsconfig.json                     # TypeScript configuration
└── package.json                      # Dependencies and scripts
```

## Ministry Platform Integration

### MPHelper - Public API

The main entry point for interacting with Ministry Platform:

```typescript
import { MPHelper } from '@/lib/providers/ministry-platform';
import { ContactLogSchema } from '@/lib/providers/ministry-platform/models';

const mp = new MPHelper();

// Get contacts
const contacts = await mp.getTableRecords({
  table: 'Contacts',
  filter: 'Contact_Status_ID=1',
  select: 'Contact_ID,Display_Name,Email_Address'
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
```

### Available Services

- **Table Service**: Read, Create, Update, and Delete operations for MP tables
- **Procedure Service**: Execute stored procedures
- **Communication Service**: Send emails and messages
- **Metadata Service**: Get table schema and domain info
- **File Service**: Upload, download, and manage files
- **Domain Service**: Domain-specific operations

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

See [Ministry Platform Type Generator documentation](src/lib/providers/ministry-platform/scripts/README.md) for details.

## Components

### UI Components
Built with Radix UI primitives and styled with Tailwind CSS. Located in `src/components/ui/`:
- Alert Dialog, Avatar, Checkbox, Dialog, Dropdown Menu
- Label, Radio Group, Select, Switch, Tooltip
- And more...

### Application Components
- **auth-wrapper**: Protects routes requiring authentication
- **header**: Application header with navigation
- **sidebar**: Application sidebar navigation
- **user-menu**: User profile and logout menu
- **dynamic-breadcrumb**: Automatic breadcrumb generation
- **session-provider**: NextAuth session context provider
- **contact-lookup**: Contact search and selection
- **contact-lookup-details**: Detailed contact information
- **contact-logs**: Contact log management

All components follow kebab-case naming and use named exports for consistency.

## Building Custom Tools

### Template Tool

The project includes a template tool (`src/app/tools/template/`) that demonstrates best practices for building Ministry Platform tools that can be launched from within MP pages.

**Key features:**
- URL parameter parsing for MP page context (`pageID`, record selection, etc.)
- Dual-mode support (create new vs. edit existing records)
- Standard tool UI with save/close actions
- Development helpers for debugging tool params and user context
- Integration with `ToolContainer` component for consistent UX

**Structure:**
```
src/app/tools/template/
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

See the [template tool](src/app/tools/template/) for implementation details.

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

## Documentation

- **[AGENTS.md](AGENTS.md)** - Development guide with commands, architecture, and code style conventions
- **[OAUTH_LOGOUT_SETUP.md](OAUTH_LOGOUT_SETUP.md)** - OAuth logout configuration and OIDC RP-initiated logout details
- **[Ministry Platform Provider](src/lib/providers/ministry-platform/docs/README.md)** - Complete provider documentation
- **[Type Generator](src/lib/providers/ministry-platform/scripts/README.md)** - CLI tool documentation

## Code Style & Conventions

### Import Paths
Use the `@/*` path alias for all internal imports:
```typescript
import { MPHelper } from '@/lib/providers/ministry-platform';
import { Button } from '@/components/ui/button';
import { ContactSearch } from '@/lib/dto';
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
├── actions/              # Shared actions (cross-feature)
├── ui/                   # shadcn/ui components
├── feature-name/         # Feature folder (kebab-case)
│   ├── feature-name.tsx  # Main component
│   ├── actions.ts        # Feature-specific server actions
│   └── index.ts          # Barrel exports
└── shared-component.tsx  # Shared/layout components
```

### Import Examples
```typescript
// Import feature components via barrel exports
import { ContactLookup } from '@/components/contact-lookup';
import { UserMenu } from '@/components/user-menu';

// Import application DTOs
import { ContactSearch, ContactLookupDetails } from '@/lib/dto';

// Import Ministry Platform models (generated)
import { ContactLog, Congregation } from '@/lib/providers/ministry-platform/models';

// Import Ministry Platform helper
import { MPHelper } from '@/lib/providers/ministry-platform';

// Import feature-specific actions (within same folder)
import { searchContacts } from './actions';

// Import cross-feature actions
import { getCurrentUserProfile } from '@/components/user-menu/actions';

// Import shared actions
import { sharedAction } from '@/components/actions/shared';
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

## Contributing

This project follows strict TypeScript conventions and code style. Please review [AGENTS.md](AGENTS.md) before contributing.

## License

Private

## Support

For Ministry Platform API documentation, refer to your instance's API documentation portal.

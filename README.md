# MPNext

A modern Next.js application integrated with Ministry Platform authentication and REST API, built with TypeScript, Next.js 15, React 19, and NextAuth v5.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
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
- ✅ **Validation**: Zod schemas for runtime type validation

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
- **Package Manager**: pnpm (recommended)
- **Ministry Platform**: Active instance with API credentials

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/MinistryPlatform-Community/MPNext.git
cd MPNext
```

### 2. Install Dependencies

```bash
pnpm install
```

> **Note**: This project uses pnpm as the package manager. If you don't have it installed, run `npm install -g pnpm`.

### 3. Environment Configuration

Copy the example environment file and configure it with your Ministry Platform credentials:

```bash
cp .env.example .env.local
```

Update `.env.local` with your configuration:

```env
# NextAuth Provider Configuration
OIDC_PROVIDER_NAME="MinistryPlatform"
OIDC_CLIENT_ID=TM.Widgets
OIDC_CLIENT_SECRET=your_client_secret
OIDC_WELL_KNOWN_URL=https://your-instance.ministryplatform.com/ministryplatformapi/oauth/.well-known/openid-configuration
OIDC_SCOPE=openid profile email offline_access http://www.thinkministry.com/dataplatform/scopes/all

# Generate this secret via: npx auth secret
NEXTAUTH_SECRET=your_generated_secret

# Update for production
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_DEBUG=false

# MinistryPlatform API Configuration
MINISTRY_PLATFORM_CLIENT_ID=TM.Widgets
MINISTRY_PLATFORM_CLIENT_SECRET=your_client_secret
MINISTRY_PLATFORM_BASE_URL=https://your-instance.ministryplatform.com/ministryplatformapi

# Public Keys
NEXT_PUBLIC_MINISTRY_PLATFORM_FILE_URL=https://your-instance.ministryplatform.com/ministryplatformapi/files
NEXT_PUBLIC_APP_NAME=App
```

### 4. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

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

const mp = new MPHelper();

// Get contacts
const contacts = await mp.getTableRecords({
  table: 'Contacts',
  filter: 'Contact_Status_ID=1',
  select: 'Contact_ID,Display_Name,Email_Address'
});

// Create records
await mp.createTableRecords('Contact_Log', [{
  Contact_ID: 12345,
  Contact_Date: new Date().toISOString(),
  Made_By: 1,
  Notes: 'Follow-up call completed'
}]);
```

### Available Services

- **Table Service**: CRUD operations for MP tables
- **Procedure Service**: Execute stored procedures
- **Communication Service**: Send emails and messages
- **Metadata Service**: Get table schema and domain info
- **File Service**: Upload, download, and manage files
- **Domain Service**: Domain-specific operations

### Type Generation

Generate TypeScript interfaces and Zod schemas from your Ministry Platform database schema:

```bash
# Generate types for all tables with Zod schemas
pnpm mp:generate:models

# Generate types for specific tables
npx tsx src/lib/providers/ministry-platform/scripts/generate-types.ts --search "Contact"

# See all options
npx tsx src/lib/providers/ministry-platform/scripts/generate-types.ts --help
```

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
- **contact-lookup**: Contact search and selection
- **contact-lookup-details**: Detailed contact information

All components follow kebab-case naming and use named exports for consistency.

## Development

### Available Commands

```bash
# Start development server
pnpm dev

# Build for production (includes type checking)
pnpm build

# Start production server
pnpm start

# Run ESLint
pnpm lint

# Generate MP types
pnpm mp:generate

# Generate MP types to models directory with Zod schemas
pnpm mp:generate:models
```

### Building for Production

```bash
pnpm build
pnpm start
```

## Documentation

- **[AGENTS.md](AGENTS.md)** - Development guide with commands, architecture, and code style conventions
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
1. Always use TypeScript generics for type-safe API calls
2. Handle errors with try-catch blocks
3. Use Zod schemas for runtime validation
4. Keep Ministry Platform structure organized:
   - Generated database models: `src/lib/providers/ministry-platform/models/`
   - Application-level DTOs/ViewModels: `src/lib/dto/`
   - Export all from respective `index.ts` files

## Contributing

This project follows strict TypeScript conventions and code style. Please review [AGENTS.md](AGENTS.md) before contributing.

## License

Private

## Support

For Ministry Platform API documentation, refer to your instance's API documentation portal.

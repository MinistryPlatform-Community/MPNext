# Component Reference Guide

This document provides detailed context about the `src/components/` folder structure for LLM assistants working on the MPNext project.

## Folder Overview

```
src/components/
├── layout/                     # Layout components (barrel export via index.ts)
│   ├── auth-wrapper.tsx        # Authentication wrapper (Server Component)
│   ├── header.tsx              # App header with navigation
│   ├── sidebar.tsx             # Navigation sidebar
│   ├── dynamic-breadcrumb.tsx  # Breadcrumb navigation
│   └── index.ts               # Barrel exports
├── shared-actions/             # Shared server actions
├── ui/                         # shadcn/ui components (19 components)
├── contact-logs/               # Contact log CRUD feature
├── contact-lookup/             # Contact search feature
├── contact-lookup-details/     # Contact details view
└── user-menu/                  # User dropdown menu
```

## Component Categories

### Layout Components (`layout/` folder)

| File | Type | Purpose |
|------|------|---------|
| `layout/auth-wrapper.tsx` | Server | Wraps app to enforce authentication, redirects unauthenticated users |
| `layout/header.tsx` | Client | Top navigation bar with hamburger menu and user menu |
| `layout/sidebar.tsx` | Client | Slide-out navigation menu with page links |
| `layout/dynamic-breadcrumb.tsx` | Client | Auto-generates breadcrumbs from URL or custom segments |
| `layout/index.ts` | - | Barrel exports: `AuthWrapper`, `Header`, `Sidebar`, `DynamicBreadcrumb` |

### Feature Components

| Folder | Purpose | Has Actions |
|--------|---------|-------------|
| `contact-logs/` | Contact log CRUD with modal forms | Yes |
| `contact-lookup/` | Contact search with results display | Yes |
| `contact-lookup-details/` | Contact profile and logs view | Yes |
| `user-menu/` | User dropdown with sign-out | Yes |

### UI Components (shadcn/ui)

19 components following shadcn conventions:
- `alert.tsx`, `alert-dialog.tsx`, `avatar.tsx`, `breadcrumb.tsx`
- `button.tsx`, `card.tsx`, `checkbox.tsx`, `dialog.tsx`
- `drawer.tsx`, `dropdown-menu.tsx`, `form.tsx`, `input.tsx`
- `label.tsx`, `radio-group.tsx`, `select.tsx`, `skeleton.tsx`
- `switch.tsx`, `textarea.tsx`, `tooltip.tsx`

## Server Actions Location

Actions are co-located with their feature components:

| Feature | Actions File | Functions |
|---------|--------------|-----------|
| contact-logs | `contact-logs/actions.ts` | `getContactLogTypes`, `createContactLog`, `updateContactLog`, `deleteContactLog`, `getContactLogsByContactId`, `getContactLogById` |
| contact-lookup | `contact-lookup/actions.ts` | `searchContacts` |
| contact-lookup-details | `contact-lookup-details/actions.ts` | `getContactDetails`, `getContactLogsByContactId` |
| user-menu | `user-menu/actions.ts` | `handleSignOut` |
| **shared** | `shared-actions/user.ts` | `getCurrentUserProfile` |

**Shared Actions Folder**: `src/components/shared-actions/` contains actions used across multiple features. See the README in that folder for guidelines on when to use shared vs co-located actions.

## Import Patterns

```typescript
// Feature components (use barrel exports)
import { ContactLookup } from '@/components/contact-lookup';
import { ContactLogs } from '@/components/contact-logs';
import { UserMenu } from '@/components/user-menu';

// UI components (individual imports)
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

// Layout components (barrel export)
import { AuthWrapper, Header, Sidebar, DynamicBreadcrumb } from '@/components/layout';

// Co-located actions (relative import within feature)
import { searchContacts } from './actions';

// Shared actions
import { getCurrentUserProfile } from '@/components/shared-actions/user';
```

## Component Structure Template

Each feature folder should follow this structure:

```
feature-name/
├── index.ts              # Barrel export: export { FeatureName } from './feature-name';
├── feature-name.tsx      # Main component file
├── actions.ts            # Server actions (if needed)
└── [sub-components].tsx  # Additional components (optional)
```

## Compliance Summary

All components pass the following checks:

| Criterion | Status |
|-----------|--------|
| File naming (kebab-case) | PASS |
| Component naming (PascalCase) | PASS |
| Named exports only (no default) | PASS |
| `@/` alias for imports | PASS |
| Barrel exports for features | PASS |
| `"use client"` where needed | PASS |
| `"use server"` for actions | PASS |
| TypeScript strict typing | PASS |

## Known Issues & Recommendations

### UI Component Notes

- **dialog.tsx**: Uses mixed patterns (direct assignment vs forwardRef) - works but inconsistent.
- **tooltip.tsx**: Auto-wraps with `TooltipProvider` internally - no need to wrap manually.

## Quick Reference: Component Responsibilities

### contact-logs
- **Purpose**: CRUD interface for contact log entries
- **Features**: Create/edit modals, delete confirmation, log type filtering
- **Dependencies**: ContactLogService, React Hook Form, Zod validation

### contact-lookup
- **Purpose**: Search contacts by name/email/phone
- **Components**: `ContactLookup` (container), `ContactLookupSearch` (input), `ContactLookupResults` (display)
- **Features**: Debounced search, avatar display, selection callbacks

### contact-lookup-details
- **Purpose**: Display full contact profile with associated logs
- **Features**: Profile info display, embedded ContactLogs component, loading/error states

### user-menu
- **Purpose**: User profile dropdown with sign-out
- **Features**: Displays user name/email, implements OIDC logout flow
- **Note**: `handleSignOut` implements RP-initiated logout for Ministry Platform OAuth

## Services Used

Components interact with these service classes:

| Service | Location | Used By |
|---------|----------|---------|
| ContactService | `@/services/contactService` | contact-lookup, contact-lookup-details |
| ContactLogService | `@/services/contactLogService` | contact-logs |
| UserService | `@/services/userService` | user-menu |

All services ultimately use `MPHelper` from `@/lib/providers/ministry-platform` for API calls.

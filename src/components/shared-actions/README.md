# Shared Actions

This folder contains **shared server actions** that are used across multiple components or features.

## When to Add Actions Here

Place actions in this folder when:
- ✅ The action is used by **multiple components** across different features
- ✅ The action provides **shared utility** or **common functionality**
- ✅ The action handles **cross-cutting concerns** (logging, analytics, etc.)

## When to Keep Actions Co-located

Keep actions with their component folder when:
- ✅ The action is **feature-specific** and only used by that component
- ✅ The action is tightly coupled to a single feature's business logic

## Examples

**Shared Actions (place here):**
- `user.ts` - User profile operations used by contexts and components
- `auth.ts` - Authentication actions used across the app
- `analytics.ts` - Analytics tracking used by multiple features
- `notifications.ts` - Notification system used app-wide

**Feature-Specific Actions (keep co-located):**
- `components/contact-lookup/actions.ts` - Contact search functionality
- `components/user-menu/actions.ts` - Sign-out and user menu operations
- `components/contact-lookup-details/actions.ts` - Contact detail fetching

## Usage

```typescript
// Importing shared actions
import { trackEvent } from '@/components/shared-actions/analytics';

// Importing feature-specific actions
import { searchContacts } from './actions'; // Within same folder
import { getContactDetails } from '@/components/contact-lookup-details/actions'; // Cross-feature
```

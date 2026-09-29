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

## Authorization — Mandatory

A compiled server action is a callable POST endpoint. A session proves only that *some*
Ministry Platform user signed in; all MP data is fetched with the app's service account,
so the security-role gate is the only thing deciding who may read or change it.

Any action that touches MP data must call
`AuthorizationService.getInstance().requireSecurityRole({ table, operation })` — for reads
as well as writes — and never a bare `auth.api.getSession()` check:

```typescript
import { AuthorizationService } from '@/services/authorizationService';

await AuthorizationService.getInstance().requireSecurityRole({
  table: 'Contacts',
  operation: 'read',
});
```

`requireSecurityRole` throws `UnauthorizedError` on refusal and returns the acting MP
`User_ID` on success, so it also supplies `$userId` attribution for writes. It implies an
authenticated session, so no separate session check is needed alongside it.
`hasSecurityRole` is the non-throwing form — use it only to compute UI affordances, never
as the enforcement point. See [`.claude/references/auth.md`](../../../.claude/references/auth.md)
§ Authorization.

The two narrow exceptions in this folder are documented inline in the source: an action
that returns only the caller's own profile, and one that returns a single domain-wide
configuration string.

## Current Shared Actions

| File | Action | Signature | Gate |
|------|--------|-----------|------|
| `user.ts` | `getCurrentUserProfile` | `(): Promise<CurrentUserProfile \| undefined>` | Authenticated session; also computes `canAccessContactFeatures` via `hasSecurityRole` |
| `domain.ts` | `getMpTimezone` | `(): Promise<string>` | Authenticated session |

`getCurrentUserProfile` takes no parameters by design — the `User_GUID` is read from the
session rather than accepted from the caller, so it can never become a lookup of someone
else's name and email. It returns the six-field `CurrentUserProfile` DTO
(`src/lib/dto/user-profile.ts`: name fields, email, `Image_GUID`,
`canAccessContactFeatures`), built field by field; IDs, GUIDs, phone, roles and user
groups stay on the server. It resolves `undefined` when MP has no matching user, and
throws when there is no session.

It is one of the CLAUDE.md carve-outs that use a plain session check instead of
`requireSecurityRole`: it returns only the caller's **own** profile, and any MP user may
sign in and must be able to load the app shell (avatar, name, sign-out menu) with no
security role. The returned `canAccessContactFeatures` flag is **UX only, not a security
control**.

`getMpTimezone` returns the domain's IANA time zone identifier for client-side
`Intl.DateTimeFormat` rendering of MP datetimes. A session check is sufficient here rather
than the full role gate: the value is one domain-wide configuration string, not per-person
data, and its only consumer is the already role-gated contact detail page.

**Feature-Specific Actions (keep co-located):**
- `components/contact-lookup/actions.ts` - Contact search
- `components/contact-lookup-details/actions.ts` - Contact detail fetching
- `components/contact-logs/actions.ts` - Contact log CRUD
- `components/user-menu/actions.ts` - Sign-out

## Usage

```typescript
// Importing shared actions
import { getCurrentUserProfile } from '@/components/shared-actions/user';
import { getMpTimezone } from '@/components/shared-actions/domain';

// Importing feature-specific actions
import { searchContacts } from './actions'; // Within same folder
import { getContactDetails } from '@/components/contact-lookup-details/actions'; // Cross-feature
```

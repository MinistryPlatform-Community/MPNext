# TODO: Server actions and `/get-session` send the browser more identity data than the UI uses

**Created:** 2026-09-28
**Severity:** Info — minimization; anything sent to the client is readable by any script or extension on the page.
**Confidence:** Confirmed by code reading (grep of `.tsx` for field use) and repro for `/get-session`.
**Source:** Auth security review 2026-09-28 (authorization, session and client/config reviewers).

## Finding

- `getCurrentUserProfile` (`src/components/shared-actions/user.ts:55`, `src/services/userService.ts:65, 89-93`) returns `roles`, `userGroups`, `User_ID`, `Contact_ID`, `User_GUID`, `Mobile_Phone` — none used by the client, and `user.ts:13-16` itself treats roles/groups as sensitive.
- `contact-lookup-details/actions.ts:72-77` spreads the whole `ContactLog` row (including `Made_By` IDs and foreign keys) behind an `as ContactLogDisplay[]` cast.
- `/api/auth/get-session` returns the raw `session.token` and `session.ipAddress` to page JS (`@better-auth/core/dist/db/get-tables.mjs:105-110` has no `returned: false` on `token`). The token is useless without the cookie's HMAC signature today, but it becomes a bearer credential if the `bearer` plugin is ever added — making the HttpOnly flag moot.

## Fix

- Return DTOs with only the fields the UI renders (`src/lib/dto/`).
- In `enrichSessionUser`, strip `session.token` and `session.ipAddress` (and `userAgent`) from the returned session.

## How to verify a fix

- Tests asserting the exact key set returned by `getCurrentUserProfile`, the log-list action, and `enrichSessionUser`.

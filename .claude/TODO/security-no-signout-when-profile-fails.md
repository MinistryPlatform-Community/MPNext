# TODO: When the MP profile fails to load, the user has no way to sign out

**Created:** 2026-09-28
**Severity:** Low — a shared-kiosk trap: the session stays on the machine with no visible sign-out.
**Confidence:** Confirmed by code reading (header tests pin the no-menu state).
**Source:** Auth security review 2026-09-28 (client/config reviewer).
**Related:** [security-shared-device-session-persistence.md](security-shared-device-session-persistence.md)

## Finding

`getCurrentUserProfile()` can fail two ways:

1. It returns `undefined` when `dp_Users` has no match → `src/components/layout/header.tsx:36-77` renders an avatar button **with no menu**, so no sign-out control (pinned by `header.test.tsx:139-160`).
2. It throws when MP is unreachable (including the known role-lookup `ConnectTimeoutError`) → `src/contexts/user-context.tsx:54` has no `.catch`, the rejection propagates (`user-context.test.tsx:132`) past `(web)/error.tsx` (the Header lives in `(web)/layout.tsx:35-49`, above that boundary) to `src/app/error.tsx:55-68`, which offers only "Try again" and "Go to sign in".

"Go to sign in" → `/signin` sees the session → back to `/` → the same failure. `/session-error` has a sign-out button, but nothing links to it.

## Fix

- Render a sign-out form (`handleSignOut`) in the Header fallback whenever a session exists, even without a profile.
- Add a sign-out form to `src/app/error.tsx` (and `(web)/error.tsx`).
- Consider catching the profile promise in `UserProvider` and resolving to null, so a profile failure doesn't take down the shell.

## How to verify a fix

- Tests: mock `getCurrentUserProfile` to reject, and separately to return `undefined`; assert a sign-out control renders in both cases.

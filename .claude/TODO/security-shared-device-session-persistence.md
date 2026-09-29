# TODO: Sessions survive closing the browser, and sign-out does not reach other open tabs

**Created:** 2026-09-28
**Severity:** Low — shared/kiosk devices in church offices.
**Confidence:** Confirmed by repro and code reading.
**Source:** Auth security review 2026-09-28 (session reviewer).
**Related:** [Additional Security Hardening](../../docs/security/Additional_Security_Hardening.md), `docs/OAUTH_LOGOUT_SETUP.md` (logout fixed 2026-09-29), [security-no-signout-when-profile-fails.md](security-no-signout-when-profile-fails.md)

## Finding

- `session_token` carries `Max-Age=604800` and is re-set on every re-mint (`node_modules/better-auth/dist/cookies/index.mjs:49`, `api/routes/session.mjs:106-111`), so it's a persistent cookie: closing the browser does not sign the user out.
- Sign-out runs as a server action (`src/components/user-menu/actions.ts`) and sends no signal to other tabs. Server-rendered contact and pastoral-log content stays on screen in other open tabs; `UserProvider` only nulls the profile and nothing redirects.

## Fix

- Shorter `session.expiresIn` (see the revocation item). Consider a session-only (no Max-Age) `session_token` if better-auth allows it for this setup, or document the trade-off.
- In the protected shell, redirect to `/signin` when `useSession()` transitions to null (and optionally broadcast sign-out via `BroadcastChannel`/`storage` event so other tabs react immediately).

## How to verify a fix

- Component test: when the session hook returns null inside `(web)`, the page navigates to `/signin` and stops rendering member data.
- Manual: two tabs open, sign out in one — the other leaves the protected page.

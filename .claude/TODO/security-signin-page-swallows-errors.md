# TODO: `/signin` swallows every error — endless spinner on 429, provider-missing or session read failures; no loop limit

**Created:** 2026-09-28
**Severity:** Low — availability/UX with a security angle (users can't tell a lockout or outage from "loading"; a silent re-auth loop is possible).
**Confidence:** Confirmed by code reading; the loop case is theoretical.
**Source:** Auth security review 2026-09-28 (client/config, session and OAuth reviewers).
**Related:** `.claude/references/auth.md` § Rate limiting and client IP (IP resolution fixed 2026-09-28), [security-discovery-failure-no-retry.md](security-discovery-failure-no-retry.md)

## Finding

`src/components/sign-in/sign-in.tsx:93-106`:

- `authClient.signIn.social(...)` returns `{ error }` on 404 `PROVIDER_NOT_FOUND` (discovery failed at boot) or 429 (rate limit); the component ignores it → spinner forever.
- `authClient.getSession()` failures are ignored too.
- No limit on automatic OAuth restarts: if a freshly minted session can't be read back (e.g. instances with different secrets, a cookie dropped for size), the user loops silently through MP SSO.

## Fix

- Handle `{ error }`: show a message + retry button; distinguish 429 ("too many attempts, wait a moment") from provider errors.
- Count automatic restarts (e.g. `sessionStorage` counter or a query param) and stop after 1–2 with a visible error linking to `/auth-error`.

## How to verify a fix

- Component tests: `signIn.social` resolves `{ error: { status: 429 } }` → message rendered, no further redirect; `{ status: 404 }` → provider-unavailable message; repeated returns to `/signin` → loop stops.

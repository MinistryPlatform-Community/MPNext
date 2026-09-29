# TODO: `getUserInfo` can throw despite its "return null, never throw" contract; no timeout; redirects followed; "undefined undefined" names

**Created:** 2026-09-28
**Severity:** Low
**Confidence:** Confirmed by code reading.
**Source:** Auth security review 2026-09-28 (OAuth, MP-client and session reviewers).
**Related:** [security-mp-fetch-timeouts-and-redirects.md](security-mp-fetch-timeouts-and-redirects.md)

## Finding

`src/lib/auth.ts:433-514`:

- The comment at `:401-403` and `:459-462` says every refusal returns `null` because a throw "surfaces as an unhandled error rather than a clean sign-in failure" (`node_modules/better-auth/dist/plugins/generic-oauth/index.mjs:227` does not catch). But `fetch(...)` rejecting (network error) and `response.json()` throwing (non-JSON 200, e.g. an HTML error page from a proxy) both throw.
- No `AbortSignal` timeout on the userinfo fetch; `fetch` follows redirects by default (the user's bearer access token is stripped cross-origin by undici, but same-origin redirects keep it).
- `name: \`${profile.given_name} ${profile.family_name}\`` → `"undefined undefined"` when either claim is absent; this becomes the display name and the `firstName`/`lastName` split (`enrichSessionUser`, `:121-122`). `firstName`/`lastName` are not used anywhere in `src/`.

## Fix

- Wrap fetch + `.json()` in try/catch → return `null` and log `{ event: "auth.userinfo.fetch_failed", status | errName }` (no body, no token).
- `signal: AbortSignal.timeout(10_000)`, `redirect: "error"`.
- Build the name from whichever parts are strings; fall back to `""` (or the MP display name if available).
- Drop `firstName`/`lastName` from `enrichSessionUser` if unused.

## How to verify a fix

- Tests: fetch rejects → `null`; HTML 200 → `null`; missing `given_name` → name has no `"undefined"`.

# TODO: The `session_data` cookie is signed but not encrypted (`strategy: "jwt"` overrides better-auth's stateless `jwe` default)

**Created:** 2026-09-28
**Severity:** Low — member PII readable from the cookie by anything that captures Cookie headers or browser storage.
**Confidence:** Confirmed by repro (decoded cookie).
**Source:** Auth security review 2026-09-28 (session and OAuth reviewers, independently).

## Finding

`src/lib/auth.ts:309` sets `cookieCache.strategy: "jwt"`. better-auth's own stateless default is `"jwe"` (`node_modules/better-auth/dist/context/create-context.mjs:49-54`), which the app's explicit value overrides. The decoded `session_data` payload contains:

- `user.name`, the real `mpEmail`, `userGuid`, the synthetic email, the internal user ID
- `session.ipAddress`, `session.userAgent`, and the raw `session.token`

## Exposure

Cookie values end up in places page JS never reaches: reverse-proxy/APM logs of `Cookie` headers, HAR files attached to support tickets, browser extensions with cookie permission, disk artifacts on shared devices. (The same data is visible to page JS via `/get-session`, so `jwe` protects the at-rest/in-transit copy only.)

## Fix

- Switch to `strategy: "jwe"`. Measure cookie size afterwards — see [security-unused-user-oauth-tokens-stored.md](security-unused-user-oauth-tokens-stored.md) for the existing 4–6 KB total and chunking concern.

## How to verify a fix

- Test: after a mocked sign-in, the `session_data` cookie value does not base64url-decode to JSON containing `mpEmail`/`userGuid`.

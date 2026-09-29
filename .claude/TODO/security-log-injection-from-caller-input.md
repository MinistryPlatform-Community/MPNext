# TODO: Caller-controlled values reach server logs raw — forged log lines

**Created:** 2026-09-28
**Severity:** Info — log integrity; matters because structured events like `mp.write.unauthorized` / `mp.read.unauthorized` are the audit signal for the role gate.
**Confidence:** Confirmed by code reading.
**Source:** Auth security review 2026-09-28 (OAuth, authorization and MP-client reviewers).

## Finding

- **better-auth callback:** attacker-controlled `error`, `state`, `iss` and `callbackURL` values are logged verbatim, newlines included (`node_modules/better-auth/dist/api/routes/callback.mjs:75`, `api/middlewares/origin-check.mjs:56`). Not our code, but reachable anonymously via the allowlisted callback / sign-in routes.
- **Our code:** `src/services/domainTimezoneService.ts:320` puts the caller's `Contact_Date` into the thrown error message; `src/components/contact-logs/actions.ts:87,117` log it with `console.error`. A role-holder sending `Contact_Date: "x\n{\"event\":\"mp.write.unauthorized\",...}"` produces a separate, fake structured log line.

## Fix

- Don't echo input values in error messages: "Contact_Date could not be parsed" is enough.
- For logs we emit, always go through `JSON.stringify` of a structured object (escapes newlines) rather than string concatenation.
- For better-auth's own logs, consider a custom `logger` in the auth config that JSON-encodes/sanitizes messages, or accept and document.

## How to verify a fix

- Test: `toMpSqlDatetime("x\ny")` error message does not contain the input.

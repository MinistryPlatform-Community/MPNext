# TODO: `/auth-error` renders any attacker-chosen `?error=` text, unbounded — content spoofing on the app's own origin

**Created:** 2026-09-28
**Severity:** Low — phishing/content spoofing. React escapes it, so this is not XSS.
**Confidence:** Confirmed by a scratch test; the existing test asserts the vulnerable behaviour.
**Source:** Auth security review 2026-09-28 (OAuth, client/config and HTTP-boundary reviewers — all three flagged it independently).

## Finding

`src/app/auth-error/page.tsx:62-73`: `code = params.error` (any string) is rendered as `Error code: {code}` with no allowlist and no length cap. The file's own comment (`:19-23`) says unknown codes are not echoed ("no raw value echoed at all"). `page.test.tsx:84-88` pins the opposite.

## Scenario

Direct: `/auth-error?error=Your%20MP%20password%20expired.%20Call%20555-0100`.

Chained through a real login (more convincing): `/signin?callbackUrl=%2Fauth-error%3Ferror%3DYour%2520account%2520is%2520locked.%2520Call%2520555-0100` — `sanitizeCallbackUrl` accepts it (same-origin), the victim completes the genuine MP login, then lands on the app's own "Sign-in didn't work … Error code: Your account is locked. Call 555-0100". A 5,108-character message rendered fine in the scratch test.

## Fix

- Render the code only if it is a key of `KNOWN_ERROR_MESSAGES`, or matches `/^[a-z0-9_]{1,64}$/`; otherwise show only the generic message.
- Flip the test at `page.test.tsx:84-88` to assert free text is **not** rendered.

## How to verify a fix

- `?error=Call 555` → no "Error code" line; `?error=state_mismatch` → known message + code.

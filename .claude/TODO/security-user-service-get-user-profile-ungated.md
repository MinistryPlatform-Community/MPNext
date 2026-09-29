# TODO: `UserService.getUserProfile` has no gate and returns any user's profile for any GUID

**Created:** 2026-09-28
**Severity:** Low (latent — same shape as F10).
**Confidence:** Confirmed by repro: with no session at all it returned another user's email, phone, roles and groups.
**Source:** Auth security review 2026-09-28 (authorization reviewer).

## Finding

`src/services/userService.ts:61-94` takes an arbitrary `id` (User_GUID) and returns that user's profile, roles and groups. The documented carve-out (CLAUDE.md rule 10) covers the **action** `src/components/shared-actions/user.ts`, which only ever passes the caller's own `userGuid`. The service method itself is not a carve-out, yet rule 10 requires data-touching service methods to gate. Any future caller that passes a GUID from a URL or form would leak another user's PII and authorization model.

## Fix

- Replace with `getOwnProfile()` that resolves the GUID from the session inside the service, **or** assert `id === session.user.userGuid` in the method (throw `UnauthorizedError` otherwise).

## How to verify a fix

- Test: calling the service with a GUID other than the session's → refused; with no session → refused.

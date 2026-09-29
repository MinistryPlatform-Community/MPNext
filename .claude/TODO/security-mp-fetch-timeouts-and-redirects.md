# TODO: MP fetches have no timeouts and follow redirects — a 307 re-sends the client secret to another origin

**Created:** 2026-09-28
**Severity:** Low — availability (timeouts) and secret exposure under a misconfigured/compromised MP front end (redirects).
**Confidence:** Confirmed by repro against localhost mock servers on Node 24.18 (re-verify on Node 22, which CI/production use).
**Source:** Auth security review 2026-09-28 (MP-client reviewer; OAuth reviewer for the userinfo call).
**Related:** [security-mp-token-cache-hardening.md](security-mp-token-cache-hardening.md), [security-get-user-info-robustness.md](security-get-user-info-robustness.md)

## Call sites

`src/lib/providers/ministry-platform/utils/http-client.ts:15, 39, 59, 79, 105, 125`; `auth/client-credentials.ts:26-32`; `src/lib/auth.ts:433` (userinfo); `services/file.service.ts:170`. Also better-auth's `resolveMpUserId` path via MPHelper.

## Finding

### No timeouts

No `AbortSignal` anywhere, so a stalled MP holds each request until undici's default 300 s. `resolveMpUserId` runs inside every `getSession()` for uncached users (failures not cached), so a slow MP stalls **every page**, not just MP features. Repro: still pending after 8 s. (Separate from the known-open `ConnectTimeoutError` → 500.)

### Redirects followed

- A token POST answered with a 307 to a different origin: server B received `client_secret=dummy-SECRET-value`.
- A cross-origin 302 strips `Authorization` (good, undici); same-origin redirects keep the bearer (expected).
- API POST/PUT bodies (member data) are re-sent on 307/308 the same way, without the bearer.
- The MP API has no legitimate redirects.

## Fix

- `signal: AbortSignal.timeout(...)` on every call: ~10 s for token and userinfo, 15–20 s for API calls.
- `redirect: "error"` on the token, userinfo and every HttpClient call. (`http-client.test.ts` asserts exact init objects and will need updating.)

## How to verify a fix

- Mock server that never responds → call rejects at the deadline.
- Mock token endpoint returning 307 cross-origin → call throws; the second server receives nothing.

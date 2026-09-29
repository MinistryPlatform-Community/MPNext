# TODO: MP service-token cache — no single-flight refresh, token response not validated, 401s never invalidate the cache

**Created:** 2026-09-28
**Severity:** Low — availability and self-healing of the service-account auth flow.
**Confidence:** Confirmed by repro (stubbed `fetch`, dummy credentials).
**Source:** Auth security review 2026-09-28 (MP-client reviewer).
**Related:** [security-mp-fetch-timeouts-and-redirects.md](security-mp-fetch-timeouts-and-redirects.md)

## Finding

### No single-flight / backoff — `src/lib/providers/ministry-platform/client.ts:46-69`

- 50 concurrent `ensureValidToken()` calls on a cold client → **50** token requests; 20 concurrent calls while the token endpoint returned 503 → 20 token requests. Repeats at every ~55-min expiry and per instance.
- `client.test.ts:120-147` asserts only `toHaveBeenCalled()` and itself notes there's no dedup.

### Token response not validated — `auth/client-credentials.ts:34-38`, `client.ts:52-63`

- A 200 without `access_token` stores `undefined` → `Authorization: Bearer undefined` sent and cached for 55 min.
- `expires_in: 1e13` → `expiresAt` is an Invalid Date; `Invalid Date < new Date()` is always false → never refreshes.
- `expires_in <= 0` silently becomes 3600 s.
- `token_type` never checked.
- Error message carries `statusText` only (empty over HTTP/2).

### 401 never invalidates — `utils/http-client.ts:23-30`

- 5 consecutive API 401s triggered no refresh; a server-side-revoked token stays in use until local expiry.

## Fix

- Share one in-flight refresh promise (pattern at `src/services/domainTimezoneService.ts:275-290`), plus a 5–30 s jittered negative cache after failure.
- Require a non-empty string `access_token` and `token_type` equal to `bearer` (case-insensitive); clamp lifetime to [30 s, 1 h].
- On 401: set `expiresAt = new Date(0)` and retry once.
- Include `response.status` (never the body) in errors.

## How to verify a fix

- Tests: 50 concurrent cold calls → `toHaveBeenCalledTimes(1)`; missing `access_token` → throws; huge `expires_in` → clamped; 401 → one refresh + one retry.

# TODO: `originOf()` can widen or inject into the CSP from a malformed env value

**Created:** 2026-09-28
**Severity:** Info / Low — requires an operator to misconfigure an env var; contradicts the documented "malformed values make the policy tighter".
**Confidence:** Confirmed by a scratch test.
**Source:** Auth security review 2026-09-28 (client/config reviewer).

## Finding

`src/lib/security-headers.ts:96-103` (`originOf`) feeds `img-src` (`NEXT_PUBLIC_MINISTRY_PLATFORM_FILE_URL`) and `form-action` (`MINISTRY_PLATFORM_BASE_URL`):

- `originOf("https://*")` → `https://*` — every https host allowed in `img-src` and `form-action`.
- `originOf("https://%2A")` → also yields `*`.
- `originOf("https://a;sandbox")` → injects a directive.
- `javascript:` values → `"null"`.

`.claude/references/security-headers.md:65-68` says malformed values make the policy tighter.

## Fix

- Require `http:`/`https:` scheme and a host matching `^[a-z0-9.-]+$` (plus optional port); otherwise return null (omit the source). Reuse the MP base-URL validator from [security-auth-url-env-not-validated.md](security-auth-url-env-not-validated.md).

## How to verify a fix

- Unit tests: `https://*`, `https://%2A`, `https://a;sandbox`, `javascript:x` → null; `https://x.ministryplatform.com/path` → `https://x.ministryplatform.com`.

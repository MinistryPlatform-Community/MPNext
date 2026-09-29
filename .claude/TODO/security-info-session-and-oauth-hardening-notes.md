# TODO: Info-level session / OAuth hardening notes (grouped)

**Created:** 2026-09-28
**Severity:** Info — each is defence in depth or theoretical today. Grouped because each is small; split any into its own item when picked up.
**Source:** Auth security review 2026-09-28 (session and OAuth reviewers).

## Items

- [ ] **No `__Host-` cookie prefix → sibling-subdomain cookie tossing.** better-auth uses `__Secure-` (no `__Host-` option); better-call keeps the first duplicate cookie (`node_modules/better-call/dist/cookies.mjs:33`) and browsers send longer-Path cookies first, so a sibling subdomain could plant state/session cookies (login CSRF). Only relevant on custom domains with untrusted sibling subdomains (`*.vercel.app` / `*.azurewebsites.net` are on the PSL). *Theoretical.* Fix: document; host on a dedicated subdomain.

- [ ] **OAuth state is not one-time use.** In cookie mode `expireCookie` only asks the browser to drop it; the same `(cookie, state)` pair validates any number of callbacks for 10 minutes, including after a successful sign-in (`node_modules/better-auth/dist/state.mjs:93-118, 156-185`). Repro: reuse #1 `invalid_code` → #2 success → #3 success. Makes authorization-code injection (unmitigated, since MP supports neither PKCE nor `nonce` — accepted risk, see [security-docs-drift.md](security-docs-drift.md)) cheaper to repeat; each replay costs an MP token-endpoint call. Fix: only a server-side state store (`storeStateStrategy: "database"` + `secondaryStorage`) makes it truly one-time.

- [ ] **Memory adapter grows without bound and has no unique constraint.** Every sign-in adds user/account/session rows to the in-process memory adapter; nothing prunes them, and concurrent first sign-ins can create duplicate users (harmless today). Bounded by the 3-per-10 s sign-in rate limit (see `.claude/references/auth.md` § Rate limiting and client IP (IP resolution fixed 2026-09-28)). Fix: goes away with `secondaryStorage`/DB.

- [ ] **A null `/get-session` has no `Cache-Control`, and stale cookies are never cleared.** customSession returns `ctx.json(null)` and drops the inner Set-Cookie deletions (`node_modules/better-auth/dist/plugins/custom-session/index.mjs:49-56`). Not exploitable (`AuthWrapper` still redirects). Fix: accept, or clear cookies in `AuthWrapper` when the session is null.

- [x] *(Fixed 2026-09-29: logs `errName` only, and rethrows Next control-flow errors via `unstable_rethrow`.)* **`sessionContextService.ts:45` logs the whole error object.** Safe today; brittle if an error ever carries a response body. Fix: log `err.name`/`err.message` only.

- [ ] **Same secret, no domain separation.** `BETTER_AUTH_SECRET` is used raw as the HMAC key for `session_token` and as the HS256 JWT key (SHA-256/HKDF derivations for state and JWE). No signing oracle exists, so not exploitable. Captured in [security-auth-secret-fallback-and-test-flag.md](security-auth-secret-fallback-and-test-flag.md) (rotation note).

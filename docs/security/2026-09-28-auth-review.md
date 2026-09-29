# Auth Security Review — 2026-09-28

**Status: closed 2026-09-29.** Every finding is fixed, closed by decision, or recorded as accepted/known in the docs listed below. This file is the review record; nothing here is open. Item names such as `security-auth-test-gaps` are the review's finding IDs; test comments cite them as "review item …".

**Scope:** every authentication and authorization path — better-auth 1.7.4 config and internals, the MP OIDC sign-in flow, sessions/cookies/secrets, the `/api/auth` catch-all and `proxy.ts`, server actions and the role gate, the MP client-credentials service account and HTTP client, the auth UI pages, security headers, setup/config/CI, and the security docs.
**Method:** six parallel read-only reviewers (OAuth/OIDC, sessions, HTTP boundary, authorization, MP service-account client, client/config). Claims were checked against `node_modules` source and reproduced where possible with mock OIDC/MP servers and stubbed `fetch`. **No Ministry Platform calls were made.** Key claims were spot-checked again when consolidating.
**Baseline:** `main` @ `ea2e0ad`. Next 16.3.5, better-auth 1.7.4, better-call 1.4.0.

**Result:** no Critical or High findings. The fixes from the 2026-09-12 and 2026-09-25 rounds (F-UPDATE-USER, F2, F1/F10/F11, F4, F5, F7, F9, F12, F3/F3b) all held against targeted bypass attempts. The biggest remaining risks are that **sign-out doesn't revoke a stateless session**, **an over-privileged MP service account would widen the impact of any flaw**, and **several configuration defaults fail open**.

## Medium

None open. The remaining parts of the three partly fixed Medium items live in [`docs/security/Additional_Security_Hardening.md`](Additional_Security_Hardening.md): §1 sign-out revocation **accepted 2026-09-29**; §2 MP login re-validation and §3 role granularity (read/write split, MP rights) are future options that need a policy decision, not review work — §3's name-matching part is deferred.

## Fixed 2026-09-28 (branch `fix/security-review-2026-09-28-medium`)

- `security-incident-docs-understate-forged-session-window` — advisory erratum, playbook and auth.md corrected (up to 7 days; rotation mandatory)
- `security-auth-secret-fallback-and-test-flag` — startup guard `assertAuthEnvironment`; `disableOriginCheck: false` pinned
- `security-gitignore-env-files` — `.env*` + `!.env.example`, `.vercel`; pre-commit refuses staged env files
- `security-security-md-reporting-channel` — private vulnerability reporting, secret scanning, push protection and Dependabot security updates enabled; placeholder email removed
- `security-sign-in-social-callbackurl-size-dos` — 4 KB body cap (declared and streamed); `callbackURL` string ≤ 2048
- `security-service-account-over-privileged` — closed as not applicable to the template: each deployment scopes its own Client User (see README § Data-access client)
- `security-rate-limit-ip-resolution` — `AUTH_IP_ADDRESS_HEADERS` / `AUTH_TRUSTED_PROXIES` → `advanced.ipAddress`, validated at startup; per-host guidance in `.env.example` (429 UI handling stays with `security-signin-page-swallows-errors`)
- `security-mp-logout-missing-id-token-hint` — `client_id` + `id_token_hint` sent; one shared `auth` per process (2026-09-29) so the hint is actually available; verified live against MP (no prompt). On another serverless instance MP prompts once — documented
- `security-committed-claude-settings-sed` — `.claude/settings.local.json` untracked + gitignored; shared entries (no `sed:*`) moved to `.claude/settings.json`

## Fixed 2026-09-29 (branch `dev/security-review-2026-09-28`, wave 1 — child branches `security/a`…`security/g`)

The per-finding working notes were deleted once fixed; their doc edits landed in the docs sweep below.

- **MP HTTP client (a):** timeouts + `redirect: "error"` on every MP fetch; single-flight token refresh, token-response validation, 401 → refresh + one retry; `buildUrl` path guard; name-only error logging — `mp-fetch-timeouts-and-redirects`, `mp-token-cache-hardening`
- **Provider services (b):** identifier/ID/GUID validation + per-segment encoding in File/Table/Procedure services; trusted sender for communications; procedure allowlist; `$ignorePermissions` dropped; codegen escaping — `file-service-path-traversal`, `info-provider-logging-and-codegen`
- **Auth core (c):** `requireIdTokenVerification: true`; `exp`/`azp` checks; userinfo never throws (timeout, no redirects); `session_data` is JWE; `resolveMpUserId` negative cache + GUID-free logs; `token`/`ipAddress`/`userAgent` stripped from `/get-session` — `require-id-token-verification`, `id-token-claim-checks-weak`, `get-user-info-robustness`, `session-cookie-readable-jwt-strategy`, `resolve-mp-user-id-logs-guid-and-no-negative-cache`
- **App services (d):** contact-log field allowlists; `Made_By` kept on update; `updateContact` allowlist; service-level ID sanitizing and caps; `getUserProfile` self-only; LIKE `[` escaping + 100-char search cap; no input echo in errors; unused actions removed — `contact-log-caller-fk-fields`, `contact-log-update-overwrites-author`, `contact-service-update-contact-mass-assignment`, `service-layer-input-validation-gaps`, `user-service-get-user-profile-ungated`, `sanitize-like-value-gaps`, `log-injection-from-caller-input`, `info-authorization-notes`
- **HTTP boundary (e):** raw-header Content-Type check (NBSP); `/api` exact + anchored matcher; `no-store` on auth routes; COOP/CORP, `base-uri 'none'`, no `X-Powered-By`; `logging.serverFunctions: false`; image optimizer off; `originOf` validation — `sign-in-social-content-type-nbsp`, `proxy-public-path-and-matcher-loose`, `next-dev-logs-server-action-args`, `csp-origin-of-validation`, `header-hardening-gaps` (CSP reporting: decided none; `style-src` nonce: accepted)
- **Auth UI (f):** `/auth-error` code allowlist; `/signin` error states + restart cap; sign-out always reachable; `global-error` works without JS; `[guid]` page self-gates; tabs leave protected pages when the session ends — `auth-error-page-content-spoofing`, `signin-page-swallows-errors`, `no-signout-when-profile-fails`, `prerendered-nonceless-pages`, `layout-gate-docs-and-test-misleading`
- **CI / setup (g):** actions pinned by SHA + `permissions: contents: read` + Dependabot; lint + `tsc` CI job; `.env.local` written quoted/escaped, 0600, secret ≥ 32; setup uses `npm ci`, no `npm update`; dedicated OIDC client guidance — `ci-action-pinning-permissions`, `setup-env-file-writing`, `setup-runs-npm-update`, `shared-oidc-client-default`

- **F3b advisory fork check:** advisory greps all of `src/`; playbook control-char check covers `src/app/signin/` too. Verified against `ee46343`, `cfeecab~1`, `HEAD` → vulnerable, vulnerable, clean — `f3b-advisory-fork-check-incomplete`

- **Provider sender (wave 2):** `MPHelper.createCommunication`/`sendMessage(content, sender, attachments?)` with a required trusted sender; `new MPHelper({ allowedProcedures })` per-instance allowlist (default deny); `$ignorePermissions` removed from types — `dormant-provider-helpers`

- **Signed-out page + profile DTO (wave 2):** `/signed-out` (public, dynamic, never starts OAuth) is where `SessionGuard` and cross-tab sign-out land; `getCurrentUserProfile` returns a six-field `CurrentUserProfile`; `UserService` no longer reads roles/groups/phone — `client-data-overexposure`, `shared-device-session-persistence`
- **CI build (wave 2):** `build` job + `scripts/check-prerender.mjs` (only `/_not-found`, `/_global-error` static); setup tests run as a second Vitest project in `test:run`; `SessionContextService` rethrows Next control-flow errors (no build-log noise) — `ci-missing-lint-and-build`

- **Env validation + discovery rebuild (wave 2):** `src/lib/env.ts` — `MINISTRY_PLATFORM_BASE_URL` https-only (loopback http outside production), normalized; `BETTER_AUTH_URL` required, origin only, https for every real host (loopback http allowed even in production so `next build`/`next start` work locally and in CI); the exported `auth` is a self-healing facade that rebuilds the instance on sign-in/callback when the MP provider is missing (single-flight, 30 s cooldown, `auth.discovery.rebuild` log) — `auth-url-env-not-validated`, `discovery-failure-no-retry`

  > **Update 2026-09-29 (issue #101):** the self-healing facade is gone from `main`, superseded by removing boot-time discovery. It left a gap: a *hung* discovery still stalled every request ~300 s. The provider now has explicit endpoints (no `discoveryUrl`), so building the instance makes no MP call. `getUserInfo` verifies the id_token itself (`verifyMpIdToken`, RS256 only), against an issuer and JWKS loaded lazily from discovery at the first callback. That load has a 5 s timeout, is cached on success and is never cached on failure. `requireIdTokenVerification` from item (c) is therefore no longer set: without `discoveryUrl`, genericOAuth throws for it, and the verifier now fails closed on a partial discovery document by itself. The `auth.discovery.rebuild` log event is replaced by `auth.oidc.discovery_failed` and `auth.userinfo.id_token_unverified`.
- **Auth test harness (wave 2):** `src/test-utils/mock-oidc.ts` + code-flow, origin-check, session-config and rate-limit suites; all discovery stubs on the verified path; mutants (origin check off, `trustedOrigins: ["*"]`, strategy, `expiresIn`, `refreshCache`, sub-binding, nonce, PKCE, account cookie) all caught — `auth-test-gaps`

- **Dependencies (wave 3):** `next`/`eslint-config-next` 16.3.5 → 16.3.7 (GHSA-vcvr-r3jv-pc5j); `server-only` guards on `auth.ts`, the MP client and every service (a client import fails `next build` — verified); relocked with `deps:relock`, `deps:verify` clean — `next-image-optimizer-and-version`, `no-server-only-guard`

## Decisions (2026-09-29)

| Item | Decision |
|---|---|
| `roles-matched-by-name`, `mp-security-roles-parsing-fails-open` (closed) | **Deferred** — keep name matching for now; document the limitation |
| `unused-user-oauth-tokens-stored` scope remainder (closed) | **Won't fix** — template repo; forks need the broad scope |
| Signed-out page | **Implement** — a page that does not auto-start OAuth (wave 2) |
| `shared-device-session-persistence` remainder, sign-out revocation (closed) | **Leave as is** — 12 h cap + 1 h replay bound accepted; document |
| CSP reporting | **None** — known gap |
| `style-src 'unsafe-inline'` | **Accepted** — a nonce could cover react-remove-scroll (`get-nonce` `setNonce()`); kept for simplicity, `img-src`/`font-src` already block CSS exfiltration |
| Discovery failure | **Rebuild on failure** — shared `auth` rebuilt on the next sign-in/callback after a 30 s cooldown (wave 2). *Superseded 2026-09-29 (issue #101): no boot-time discovery at all — see the update note above* |
| F8 authorization-code injection (MP supports neither PKCE nor `nonce`) | **Accepted** — defences are a dedicated OIDC client with exact redirect URIs, `Referrer-Policy`, no code-bearing URLs in logs |

Where each decision is recorded: `CLAUDE.md` and `.claude/references/auth.md` (roles by name, scope, session lifetime, F8, OAuth state reuse, cookie residue, better-auth's verbatim logging), `README.md` and `.env.example` (`MP_SECURITY_ROLES`), `.claude/references/security-headers.md` (CSP reporting, `style-src`), `docs/security/Additional_Security_Hardening.md` §1/§3, and the playbook's known-open list.

## Docs sweep (2026-09-29, branch `security/w4-docs-sweep`)

The doc/comment carry-over of every wave (the former `security-review-2026-09-28-doc-sweep`, `security-docs-drift` and `security-info-session-and-oauth-hardening-notes` TODOs, now deleted) was applied against the merged code: `CLAUDE.md`, `README.md`, `.env.example`, `.claude/references/` (auth, testing, components, security-headers, deps-known-issues, datetime, query-syntax), `.claude/docs/TestCoverage.md`, `docs/security/` (playbook, Additional Security Hardening), `docs/OAUTH_LOGOUT_SETUP.md`, the provider and generator READMEs, the port playbook, and stale comments in `src/`. The decisions above are recorded where each area is documented. The playbook carries a "2026-09-29 follow-up" entry with the change summary and the breaking-for-forks list.

**Breaking for forks:** `firstName`/`lastName` removed from the session user; `MPHelper.createCommunication`/`sendMessage(content, sender, attachments?)` need a trusted sender; stored procedures are deny-all unless `new MPHelper({ allowedProcedures })`; `getCurrentUserProfile` returns the six-field `CurrentUserProfile`; `BETTER_AUTH_URL` is required and must be https for real hosts; `server-only` guards on auth, the MP client and services; `mp:generate*` need `tsx --conditions=react-server`; the JWE `session_data` strategy invalidates existing cookie caches once.

## Open

None.

Optional follow-ups that are not findings: register `<origin>/signed-out` as a post-logout redirect URI in MP (needs an MP admin) and then point `post_logout_redirect_uri` at it — see `docs/OAUTH_LOGOUT_SETUP.md`; trim the now test-only `MPUserProfile` type; a future `MP_SECURITY_ROLE_IDS` if name matching is revisited.

## What was checked and held (so it isn't re-reviewed from scratch)

- **Route allowlist and `disabledPaths`:** dozens of path variants tried (encodings, case, `;`, `..`/`%2e`, `//`, Unicode lookalikes, trailing slashes, HEAD/OPTIONS/PUT). None reached a non-allowlisted endpoint. better-call/rou3 and `disabledPaths` normalize the same way as the route.
- **F12 hook:** keys on `endpoint.path`, not the request URL. `__proto__`/`constructor` smuggling drops `idToken`. Duplicate keys, BOM, charset, gzip and trailing garbage all parse the same way in the filter and in better-call. Query-string `idToken` is ignored.
- **`userGuid`/`mpEmail` injection:** no reachable HTTP path. `mapProfileToUser` is spread last.
- **id_token checks:** `alg: none`, HS256 keyed with the client secret, wrong `iss`/`aud` and expired tokens are all rejected in the code flow. The sub-binding compare is case-insensitive and safe (no non-ASCII code point lowercases into GUID characters).
- **Cookies:** all HttpOnly, SameSite=Lax, `__Secure-` over https. The state cookie (XChaCha20-Poly1305) and account cookie (JWE) are encrypted. Tampered `session_data` is rejected. A new token is minted on every sign-in (no fixation).
- **CSRF:** server actions are covered by Next's Origin check. `/sign-in/social` is covered by the JSON preflight plus better-auth's origin check. Logout CSRF is not possible.
- **`callbackUrl` sanitizer:** 55 vectors (control characters, encoded and double-encoded slashes and backslashes, Unicode solidi, schemes, dot-segments). The client check agrees with better-auth's `isSafeRelativeURL` on every one.
- **Server actions:** every exported action and data-touching service method gates before any MP call, and every gate has a deny-path test. Attribution (`$userId`, `Made_By`, `Contact_ID`) is server-authoritative. `sanitizeNumericId`/`sanitizeGuid` withstood a large adversarial input set.
- **CSP:** enforced by default, nonce + `strict-dynamic`, fresh 128-bit nonce per request. HSTS is production-only. Referrer-Policy prevents `code`/`state` leaking via Referer.
- **Secrets hygiene:** no secrets anywhere in git history. Setup generates `BETTER_AUTH_SECRET` with `randomBytes(32)`. No server-only env var is used in a client file.
- **Advisories:** none of the published better-auth GHSAs affect 1.7.4. The `x-middleware-subrequest` class of bypass does not apply to Next 16.3.5.

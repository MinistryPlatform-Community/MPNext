# Auth Security Review — 2026-09-28 (index)

**Scope:** every authentication and authorization path — better-auth 1.7.4 config and internals, the MP OIDC sign-in flow, sessions/cookies/secrets, the `/api/auth` catch-all and `proxy.ts`, server actions and the role gate, the MP client-credentials service account and HTTP client, the auth UI pages, security headers, setup/config/CI, and the security docs.
**Method:** six parallel read-only reviewers (OAuth/OIDC, sessions, HTTP boundary, authorization, MP service-account client, client/config). Claims were checked against `node_modules` source and reproduced where possible with mock OIDC/MP servers and stubbed `fetch`. **No Ministry Platform calls were made.** Key claims were spot-checked again when consolidating.
**Baseline:** `main` @ `ea2e0ad`. Next 16.3.5, better-auth 1.7.4, better-call 1.4.0.

**Result:** no Critical or High findings. The fixes from the 2026-09-12 and 2026-09-25 rounds (F-UPDATE-USER, F2, F1/F10/F11, F4, F5, F7, F9, F12, F3/F3b) all held against targeted bypass attempts. The biggest remaining risks are that **sign-out doesn't revoke a stateless session**, **the MP service account is over-privileged**, and **several configuration defaults fail open**.

## Medium

None open. The remaining parts of the three partly fixed Medium items (sign-out revocation, MP login re-validation, role granularity) need decisions and are tracked in [`docs/security/Additional_Security_Hardening.md`](../../docs/security/Additional_Security_Hardening.md).

## Fixed 2026-09-28 (branch `fix/security-review-2026-09-28-medium`)

- `security-incident-docs-understate-forged-session-window` — advisory erratum, playbook and auth.md corrected (up to 7 days; rotation mandatory)
- `security-auth-secret-fallback-and-test-flag` — startup guard `assertAuthEnvironment`; `disableOriginCheck: false` pinned
- `security-gitignore-env-files` — `.env*` + `!.env.example`, `.vercel`; pre-commit refuses staged env files
- `security-security-md-reporting-channel` — private vulnerability reporting, secret scanning, push protection and Dependabot security updates enabled; placeholder email removed
- `security-sign-in-social-callbackurl-size-dos` — 4 KB body cap (declared and streamed); `callbackURL` string ≤ 2048
- `security-service-account-over-privileged` — closed as not applicable (dev environment)
- `security-rate-limit-ip-resolution` — `AUTH_IP_ADDRESS_HEADERS` / `AUTH_TRUSTED_PROXIES` → `advanced.ipAddress`, validated at startup; per-host guidance in `.env.example` (429 UI handling stays with `security-signin-page-swallows-errors`)
- `security-mp-logout-missing-id-token-hint` — `client_id` + `id_token_hint` sent; one shared `auth` per process (2026-09-29) so the hint is actually available; verified live against MP (no prompt). On another serverless instance MP prompts once — documented
- `security-committed-claude-settings-sed` — `.claude/settings.local.json` untracked + gitignored; shared entries (no `sed:*`) moved to `.claude/settings.json`

## Fixed 2026-09-29 (branch `dev/security-review-2026-09-28`, wave 1 — child branches `security/a`…`security/g`)

TODO files deleted; any remaining doc edits are in [security-review-2026-09-28-doc-sweep](security-review-2026-09-28-doc-sweep.md).

- **MP HTTP client (a):** timeouts + `redirect: "error"` on every MP fetch; single-flight token refresh, token-response validation, 401 → refresh + one retry; `buildUrl` path guard; name-only error logging — `mp-fetch-timeouts-and-redirects`, `mp-token-cache-hardening`
- **Provider services (b):** identifier/ID/GUID validation + per-segment encoding in File/Table/Procedure services; trusted sender for communications; procedure allowlist; `$ignorePermissions` dropped; codegen escaping — `file-service-path-traversal`, `info-provider-logging-and-codegen`
- **Auth core (c):** `requireIdTokenVerification: true`; `exp`/`azp` checks; userinfo never throws (timeout, no redirects); `session_data` is JWE; `resolveMpUserId` negative cache + GUID-free logs; `token`/`ipAddress`/`userAgent` stripped from `/get-session` — `require-id-token-verification`, `id-token-claim-checks-weak`, `get-user-info-robustness`, `session-cookie-readable-jwt-strategy`, `resolve-mp-user-id-logs-guid-and-no-negative-cache`
- **App services (d):** contact-log field allowlists; `Made_By` kept on update; `updateContact` allowlist; service-level ID sanitizing and caps; `getUserProfile` self-only; LIKE `[` escaping + 100-char search cap; no input echo in errors; unused actions removed — `contact-log-caller-fk-fields`, `contact-log-update-overwrites-author`, `contact-service-update-contact-mass-assignment`, `service-layer-input-validation-gaps`, `user-service-get-user-profile-ungated`, `sanitize-like-value-gaps`, `log-injection-from-caller-input`, `info-authorization-notes`
- **HTTP boundary (e):** raw-header Content-Type check (NBSP); `/api` exact + anchored matcher; `no-store` on auth routes; COOP/CORP, `base-uri 'none'`, no `X-Powered-By`; `logging.serverFunctions: false`; image optimizer off; `originOf` validation — `sign-in-social-content-type-nbsp`, `proxy-public-path-and-matcher-loose`, `next-dev-logs-server-action-args`, `csp-origin-of-validation`, `header-hardening-gaps` (CSP reporting: decided none; `style-src` nonce: accepted)
- **Auth UI (f):** `/auth-error` code allowlist; `/signin` error states + restart cap; sign-out always reachable; `global-error` works without JS; `[guid]` page self-gates; tabs leave protected pages when the session ends — `auth-error-page-content-spoofing`, `signin-page-swallows-errors`, `no-signout-when-profile-fails`, `prerendered-nonceless-pages`, `layout-gate-docs-and-test-misleading`
- **CI / setup (g):** actions pinned by SHA + `permissions: contents: read` + Dependabot; lint + `tsc` CI job; `.env.local` written quoted/escaped, 0600, secret ≥ 32; setup uses `npm ci`, no `npm update`; dedicated OIDC client guidance — `ci-action-pinning-permissions`, `setup-env-file-writing`, `setup-runs-npm-update`, `shared-oidc-client-default`

## Decisions (2026-09-29)

| Item | Decision |
|---|---|
| [security-roles-matched-by-name](security-roles-matched-by-name.md), [security-mp-security-roles-parsing-fails-open](security-mp-security-roles-parsing-fails-open.md) | **Deferred** — keep name matching for now; document the limitation |
| [security-unused-user-oauth-tokens-stored](security-unused-user-oauth-tokens-stored.md) (scope) | **Won't fix** — template repo; forks need the broad scope |
| Signed-out page | **Implement** — a page that does not auto-start OAuth (wave 2) |
| [security-discovery-failure-no-retry](security-discovery-failure-no-retry.md) | **Rebuild the auth instance on `PROVIDER_NOT_FOUND`** (single-flight, 30 s cooldown). Static endpoints ruled out: incompatible with `requireIdTokenVerification` |
| [security-shared-device-session-persistence](security-shared-device-session-persistence.md) remainder, sign-out revocation | **Leave as is** — 12 h cap + 1 h replay bound accepted; document |
| CSP reporting | **None** — known gap |

## Open (wave 2 in progress)

| Item | Remaining |
|---|---|
| [security-auth-url-env-not-validated](security-auth-url-env-not-validated.md) | `src/lib/env.ts`; wire into auth, MP client, sign-out, CSP |
| [security-discovery-failure-no-retry](security-discovery-failure-no-retry.md) | Rebuild-on-failure |
| [security-client-data-overexposure](security-client-data-overexposure.md) | `CurrentUserProfile` DTO for `getCurrentUserProfile` (session and log rows done) |
| [security-dormant-provider-helpers](security-dormant-provider-helpers.md) | Thread trusted sender through `helper.ts`/`provider.ts` (until then `createCommunication`/`sendMessage`/`executeProcedure*` refuse every call); remove `$ignorePermissions` from types |
| [security-auth-test-gaps](security-auth-test-gaps.md) | #1–#5, #8 (route/proxy gaps #6–#7 done) |
| [security-ci-missing-lint-and-build](security-ci-missing-lint-and-build.md) | `npm run build` + prerender check (only `/_not-found`, `/_global-error` static); setup tests in `test:run` |
| [security-next-image-optimizer-and-version](security-next-image-optimizer-and-version.md) | `next` ≥ 16.3.6 (optimizer disabled) |
| [security-no-server-only-guard](security-no-server-only-guard.md) | Install + imports |
| [security-shared-device-session-persistence](security-shared-device-session-persistence.md) | Signed-out page; rest accepted |
| [security-docs-drift](security-docs-drift.md), [security-review-2026-09-28-doc-sweep](security-review-2026-09-28-doc-sweep.md), [security-f3b-advisory-fork-check-incomplete](security-f3b-advisory-fork-check-incomplete.md), [security-info-session-and-oauth-hardening-notes](security-info-session-and-oauth-hardening-notes.md), roles/scope decisions above | Docs sweep (runs last) |

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

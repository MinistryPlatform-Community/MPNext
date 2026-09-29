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

## Low–Medium

| Item | One-liner |
|---|---|

## Low

| Item | One-liner |
|---|---|
| [security-unused-user-oauth-tokens-stored](security-unused-user-oauth-tokens-stored.md) | *Partly fixed 2026-09-28* (no `offline_access`, no account cookie, tokens stripped from memory). Remaining: narrow `scopes/all` (needs non-prod MP) |
| [security-session-cookie-readable-jwt-strategy](security-session-cookie-readable-jwt-strategy.md) | `strategy: "jwt"` → PII readable in `session_data` cookie |
| [security-auth-url-env-not-validated](security-auth-url-env-not-validated.md) | Unset `BETTER_AUTH_URL` → Host-derived redirect_uri; MP base URL may be `http://` |
| [security-resolve-mp-user-id-logs-guid-and-no-negative-cache](security-resolve-mp-user-id-logs-guid-and-no-negative-cache.md) | Logs raw User_GUID; re-queries MP on every failed `/get-session` |
| [security-shared-device-session-persistence](security-shared-device-session-persistence.md) | Persistent 7-day cookie; other tabs keep showing data after sign-out |
| [security-no-signout-when-profile-fails](security-no-signout-when-profile-fails.md) | Profile load failure removes every sign-out control |
| [security-auth-test-gaps](security-auth-test-gaps.md) | Origin checks off in all tests; no callback E2E; route mutants survive |
| [security-require-id-token-verification](security-require-id-token-verification.md) | Partial discovery silently disables id_token verification |
| [security-discovery-failure-no-retry](security-discovery-failure-no-retry.md) | Boot-time discovery failure = sign-in down until restart; docs describe old behaviour |
| [security-signin-page-swallows-errors](security-signin-page-swallows-errors.md) | Endless spinner on 429 / provider-missing; no auto-restart limit |
| [security-get-user-info-robustness](security-get-user-info-robustness.md) | `getUserInfo` can throw; no timeout; "undefined undefined" names |
| [security-auth-error-page-content-spoofing](security-auth-error-page-content-spoofing.md) | `/auth-error?error=` renders arbitrary text on the app's origin |
| [security-mp-security-roles-parsing-fails-open](security-mp-security-roles-parsing-fails-open.md) | *Partly fixed 2026-09-28* (`","` now fails closed, legacy var honoured). Remaining: role names containing commas can't be listed |
| [security-roles-matched-by-name](security-roles-matched-by-name.md) | Role names are editable text; match by Role_ID |
| [security-layout-gate-docs-and-test-misleading](security-layout-gate-docs-and-test-misleading.md) | Docs say the layout gate protects child pages — false in Next 16 |
| [security-contact-log-caller-fk-fields](security-contact-log-caller-fk-fields.md) | Caller can set `Feedback_Entry_ID`, `Original_Contact_Log_Entry`, etc. |
| [security-contact-log-update-overwrites-author](security-contact-log-update-overwrites-author.md) | Any edit rewrites `Made_By`; docs contradict each other |
| [security-sanitize-like-value-gaps](security-sanitize-like-value-gaps.md) | `[` not escaped; no type checks; no length cap |
| [security-user-service-get-user-profile-ungated](security-user-service-get-user-profile-ungated.md) | *Latent:* service returns any user's profile for any GUID |
| [security-contact-service-update-contact-mass-assignment](security-contact-service-update-contact-mass-assignment.md) | *Latent:* arbitrary columns; `fields.Contact_ID` overrides target |
| [security-service-layer-input-validation-gaps](security-service-layer-input-validation-gaps.md) | *Latent:* unvalidated IDs/limits in services; public unsanitized role read |
| [security-file-service-path-traversal](security-file-service-path-traversal.md) | *Latent (High if exposed):* `..` / unencoded paths aim the service bearer anywhere |
| [security-dormant-provider-helpers](security-dormant-provider-helpers.md) | *Latent:* communications "from" anyone, any stored proc, `$ignorePermissions` |
| [security-mp-token-cache-hardening](security-mp-token-cache-hardening.md) | No single-flight refresh; `Bearer undefined` cached; 401 doesn't invalidate |
| [security-mp-fetch-timeouts-and-redirects](security-mp-fetch-timeouts-and-redirects.md) | No timeouts; 307 re-sends client secret cross-origin |
| [security-next-dev-logs-server-action-args](security-next-dev-logs-server-action-args.md) | `next dev` prints pastoral notes / search terms from action args |
| [security-setup-env-file-writing](security-setup-env-file-writing.md) | `$`/`#` in hand-typed secrets corrupt or truncate them; file 0644 |
| [security-sign-in-social-content-type-nbsp](security-sign-in-social-content-type-nbsp.md) | Leading NBSP defeats the Content-Type invariant the filter relies on |
| [security-proxy-public-path-and-matcher-loose](security-proxy-public-path-and-matcher-loose.md) | `/apifoo` public; unescaped/unanchored matcher exclusions |
| [security-shared-oidc-client-default](security-shared-oidc-client-default.md) | Default reuses `TM.Widgets` with implicit/hybrid/ROPC flows enabled |
| [security-setup-runs-npm-update](security-setup-runs-npm-update.md) | Setup pulls unreviewed better-auth minors; lockfile drift |
| [security-ci-missing-lint-and-build](security-ci-missing-lint-and-build.md) | CI doesn't lint or build; docs say it does |
| [security-f3b-advisory-fork-check-incomplete](security-f3b-advisory-fork-check-incomplete.md) | Advisory's grep misses a vulnerable fork layout |

## Info

| Item | One-liner |
|---|---|
| [security-info-session-and-oauth-hardening-notes](security-info-session-and-oauth-hardening-notes.md) | `__Host-` prefix, state not one-time, memory adapter growth, stale cookies, … |
| [security-id-token-claim-checks-weak](security-id-token-claim-checks-weak.md) | `exp` optional, `azp` unchecked |
| [security-log-injection-from-caller-input](security-log-injection-from-caller-input.md) | Forged structured log lines via `Contact_Date` / callback params |
| [security-client-data-overexposure](security-client-data-overexposure.md) | Roles, IDs, phone, full log rows, `session.token` sent to the browser |
| [security-info-authorization-notes](security-info-authorization-notes.md) | MP-down reads as "no access"; role memo no-op in actions; unused exports |
| [security-next-image-optimizer-and-version](security-next-image-optimizer-and-version.md) | Disable unused `/_next/image`; bump `next` ≥ 16.3.6; GHSA-wxw3 dependency |
| [security-csp-origin-of-validation](security-csp-origin-of-validation.md) | `originOf("https://*")` widens the CSP |
| [security-header-hardening-gaps](security-header-hardening-gaps.md) | report-to, COOP, CORP, X-Powered-By, `no-store`, style nonce |
| [security-prerendered-nonceless-pages](security-prerendered-nonceless-pages.md) | `/_global-error` is static and nonce-less too |
| [security-ci-action-pinning-permissions](security-ci-action-pinning-permissions.md) | Pin actions by SHA; declare `permissions:` |
| [security-no-server-only-guard](security-no-server-only-guard.md) | Add `server-only` tripwires |
| [security-info-provider-logging-and-codegen](security-info-provider-logging-and-codegen.md) | Raw error objects logged; unescaped codegen |
| [security-docs-drift](security-docs-drift.md) | Remaining doc/comment mismatches (CSP comment, customSession, …) |

## Suggested order

1. **Minutes, no code:** enable private vulnerability reporting + secret scanning/push protection; fix `.gitignore`.
2. **MP admin work:** least-privilege service account and a dedicated OIDC client (Authorization Code only).
3. **Small, high-leverage code:** cap `callbackURL`/body size; startup assertions for secret + URLs; `next.config.ts` → `logging.serverFunctions: false`, `images.unoptimized: true`, `poweredByHeader: false`; `requireIdTokenVerification: true`; fail-closed role parsing.
4. **Session model decision:** `secondaryStorage` for real revocation, or short `expiresIn` + `disableSessionRefresh`; then correct the incident docs.
5. The logout `id_token_hint`. (PKCE is out of scope: MP does not support it — see the accepted-risk note in [security-docs-drift](security-docs-drift.md).)
6. Everything else, with its tests.

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

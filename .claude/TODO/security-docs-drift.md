# TODO: Auth/security documentation that doesn't match the code (grouped)

**Created:** 2026-09-28
**Severity:** Info — each is small, but downstream forks port from these docs. Security-consequential doc errors have their own items: [incident window](security-incident-docs-understate-forged-session-window.md), [layout gate](security-layout-gate-docs-and-test-misleading.md), [F3b fork check](security-f3b-advisory-fork-check-incomplete.md), [CI claims](security-ci-missing-lint-and-build.md), [Made_By](security-contact-log-update-overwrites-author.md), [discovery](security-discovery-failure-no-retry.md), [Content-Type invariant](security-sign-in-social-content-type-nbsp.md), [proxy "valid session"](security-proxy-public-path-and-matcher-loose.md).
**Source:** Auth security review 2026-09-28 (all reviewers).

## Code comments

- [ ] `src/proxy.ts:22` says the CSP "Ships as `Content-Security-Policy-Report-Only` until `CSP_ENFORCE=true`". The code enforces by default; only `CSP_ENFORCE=false` drops to report-only (`src/lib/security-headers.ts:270-274`). The playbook, `.env.example` and README are right — only this comment is stale.
- [ ] `src/app/api/auth/[...all]/route.ts:16-17` points to `src/app/signin/page.tsx` as the `/sign-in/social` caller; it's `src/components/sign-in/sign-in.tsx`.
- [ ] `src/lib/auth.ts:14-21` says `userGuid` `input: true` "carries no practical risk" — true only because `/update-user` is in `disabledAuthPaths`; cross-reference that.
- [ ] **PKCE / nonce comments (F8 — accepted risk, MP does not support PKCE).** `src/auth.test.ts:323` ("MP rejects PKCE today") is correct; `src/lib/auth.ts:515-518` ("can likely be flipped to `true`" because discovery advertises `S256`) is wrong and should say MP does not support PKCE, so `pkce: false` is required, not a pending follow-up.
  - `src/lib/auth.ts:545-549`, the playbook nonce section (~953-976) and `.claude/references/auth.md:223` claim the residual risk is "mitigated by the OAuth `state` cookie check" and by the client being confidential, and call PKCE "the natural follow-up". Neither stops authorization-code injection (RFC 9700 §4.5): the attacker uses *their own* state and the app redeems the victim's code with its own secret — confirmed against a mock OIDC provider. Reword to state it plainly: with MP omitting `nonce` and not supporting PKCE, **nothing binds a code to the browser that started the flow**; this is an accepted risk. The remaining defences are keeping codes out of reach — a dedicated OIDC client with exact redirect URIs ([shared client](security-shared-oidc-client-default.md)), `Referrer-Policy`, and no code-bearing URLs in logs.
- [ ] `src/lib/security-headers.ts:52-54`: `nosniff` never applies to MP photos (they load straight from MP). `:70-74`: `next start` is a production build and HSTS is baked into `routes-manifest.json`.

## `.claude/references/auth.md`

- [ ] `:422` says customSession runs "once the cookie cache expires" — it runs on **every** `/get-session`.
- [ ] `:477` says customSession runs at callback time — it doesn't.
- [ ] `:1002` talks about cookie-cache staleness of customSession output — that output is never stored in the cookie (no `userId`/`firstName` in the payload).
- [ ] `:75`, `:998` imply a restart logs everyone out — active users survive via the implicit `refreshCache`.
- [ ] `:1004` calls token refresh "unverified" — tokens are never refreshed or used.
- [ ] `:527` (and `docs/OAUTH_LOGOUT_SETUP.md`) say sign-out "clears the session" — it clears only this browser's cookies.
- [ ] `:843-845` "one request costs at most one role read" — false for server actions (tracked in [security-info-authorization-notes.md](security-info-authorization-notes.md)).
- [ ] `:896` still describes the old F3 sanitizer rules.
- [ ] `:941` offers `{APP_URL}/signin` as a post-logout URI — the app sends `BETTER_AUTH_URL` verbatim, which must match exactly.
- [ ] Env-var table omits `CSP_ENFORCE` and `NEXT_PUBLIC_MINISTRY_PLATFORM_FILE_URL`.

## Playbook / advisories / other docs

- [ ] `docs/security/downstream-hardening-playbook.md` rates F-UPDATE-USER **Critical**; the advisory and README rate it **High (CVSS 8.1)**. Pick one.
- [ ] Playbook error-boundary table says `src/app/error.tsx` covers only `/signin`, `/session-error`, `/auth-error` — it also catches errors thrown in the `(web)` shell (e.g. Header).
- [ ] `.claude/references/security-headers.md:125-132` lists only `/_not-found` as static (tracked in [security-prerendered-nonceless-pages.md](security-prerendered-nonceless-pages.md)).
- [ ] `.env.example` says the secret "must be ≥ 32 chars" — better-auth only warns (tracked in [security-auth-secret-fallback-and-test-flag.md](security-auth-secret-fallback-and-test-flag.md)).
- [ ] F12 residue note (new detail for the playbook's known-open list): injecting better-auth's `disableIdTokenSignIn` would also break the normal code flow — genericOAuth's code-flow `getUserInfo` calls the same `verifyProviderIdToken`, which returns false when that flag is set (`node_modules/@better-auth/core/dist/oauth2/verify-id-token.mjs:40`). So there is still no usable off switch; the hook remains the control.

## How to verify

- Each checkbox resolved by editing the doc/comment to match the code (or the code to match the doc, where the doc describes the intended behaviour).

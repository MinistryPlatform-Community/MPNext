# TODO: Documentation sweep for the 2026-09-28 security review (wave 1 carry-over)

**Created:** 2026-09-29
**Severity:** Info — docs only, but downstream forks port from these docs.
**Source:** Final reports of the seven wave-1 fix agents (branches `security/a`…`security/g`, merged into `dev/security-review-2026-09-28`), plus the user's decisions of 2026-09-29.

Each bullet is a doc/comment edit the code agents were not allowed to make (shared docs were reserved to avoid merge conflicts). **Line numbers are approximate** — the files moved; search for the quoted text. Verify every statement against the current code before writing it.

When this is done, also resolve [security-docs-drift.md](security-docs-drift.md) and the doc-only remainders of the other open items, then delete this file.

## Closed items whose only remaining work is here

These TODO files were deleted on 2026-09-29 because their code fix shipped; their doc edits live below:
contact-log-update-overwrites-author, sign-in-social-content-type-nbsp, proxy-public-path-and-matcher-loose, layout-gate-docs-and-test-misleading, header-hardening-gaps, log-injection-from-caller-input, info-authorization-notes, prerendered-nonceless-pages, shared-oidc-client-default, mp-token-cache-hardening, mp-fetch-timeouts-and-redirects, file-service-path-traversal.

- **header-hardening-gaps:** CSP reporting — user decided **none** (2026-09-29); record as a known gap in `security-headers.md`. `style-src 'unsafe-inline'` — accepted; correct the justification (a nonce *could* cover react-remove-scroll via `get-nonce`'s `setNonce()`; kept for simplicity, `img-src`/`font-src` already block CSS exfiltration) and fix playbook ~625 which calls it a dev-only relaxation.
- **log-injection-from-caller-input:** our code fixed; better-auth's own logger still logs callback `error`/`state`/`iss`/`callbackURL` verbatim — record as accepted in auth.md (or add a custom `logger` later).


## From A (merged 5c766ae)
Docs:
- auth.md: MP client/token lifecycle — single-flight refresh, 5–30 s negative cache, token validation (access_token non-empty, token_type bearer), lifetime clamp 30 s–1 h, 401 invalidate + retry once, 10 s token / 20 s API / 60 s multipart deadlines, redirect: "error".
- testing.md: mocked MP fetch responses need headers.get('content-type') → JSON, else HttpClient throws "unexpected content-type" (see mockHeaders helper in http-client.test.ts).
- query-syntax.md (or endpoint docs): HttpClient.buildUrl guard rejects `..`, `?`, `#`, `\`, %2e/%2f/%5c, control chars; endpoints must start with `/`.
Cross-group (B should cover; verify after B merges):
- file.service.ts:176/181 unique ID in messages/logs; :170 raw fetch needs redirect:error + timeout.
- services/*.service.ts catch blocks log raw error.
Behaviour: token errors now include status; unset/invalid MP base URL throws "Invalid MP API base URL" from buildUrl.

## From E (merged e47cb67)
Docs:
- auth.md ~496-503 "Why the Content-Type check is strict": anchored raw-header regex, NBSP rationale, comma rule = belt and braces.
- auth.md ~687 `/api/*` → "`/api` and `/api/*` (not `/apifoo`)"; ~691 matcher exclusions (escaped/anchored: /_next/static/, /_next/image, /favicon.ico exactly, /assets/); ~695 "valid session cookie" → cookie present only, AuthWrapper/actions re-validate; ~709 /session-error passes proxy with any cookie value.
- security-headers.md: :11 add COOP/CORP; :60 base-uri 'none'; :65-68 originOf now returns null for non-http(s)/bad hosts; add poweredByHeader:false, images.unoptimized, auth route no-store.
- playbook :610 and .claude/playbooks/port-downstream-hardening.md :619: base-uri 'none', add COOP/CORP.
Cross-group:
- src/components/contact-lookup/actions.ts:8-9 comment (D owns) — proxy doesn't "let /api through" for actions; actions are POSTs to page paths passing proxy with any cookie.
Not done: CSP reporting, style-src nonce (user decision). Wave-2 env validator could replace E's local originOf host check.

## From C (merged 57e3a6a + route.test jwks_uri fix)
Docs:
- CLAUDE.md:67 → "encrypted (JWE) cookie cache … customSession resolves MP User_ID … failures cached as null 30 s (error) / 5 min (no such user), never block session creation; token/ipAddress/userAgent stripped from returned session". No more name split.
- auth.md :68 drop firstName/lastName, add token/ip/UA strip; :74 JWT → JWE; :534-535 remove split lines; :350 and :1088 PKCE → accepted-risk wording; :1172 "until discovery returns" → until restart (PROVIDER_NOT_FOUND), mention requireIdTokenVerification; add log events auth.userinfo.fetch_failed, auth.userinfo.id_token_claims_invalid, auth.session.user_id_unresolved.
- testing.md :323-336 enrichSessionUser examples use firstName → update; add src/auth.oidc-hardening.test.ts to inventory.
Notes: jwe cookie 1209 chars (vs 1019); strategy change invalidates existing session_data once. Downstream forks reading firstName/lastName break — call out in release notes.

## From G (merged d523fe1)
Docs: auth.md:1121 CI claim → "lint + tsc --noEmit + unit tests; no build yet"; auth.md:1120 setup uses npm ci, no npm update; auth.md ~1110 two-client guidance (MPNext sign-in AuthCode only; MPNext.API client-credentials); CLAUDE.md:250 CI add lint job + setup-test step; testing.md:26-32 three jobs, scripts/vitest.config.mts outside coverage gates.
Cross-group: setup tests (scripts/setup-env.test.ts) only run via scripts/vitest.config.mts — not in npm run test:run; consider package.json script / root config. Optional: user-menu/actions.test.ts TM.Widgets fixture → MPNext.
Follow-up: CI build + prerender check (after F's global-error fix).

## From B (merged 178d489)
(RESOLVED in wave 2 by security/w2-provider-sender — docs only now) Behaviour: MPHelper.createCommunication / sendMessage / executeProcedure(WithBody) now refuse every call — need sender threaded through provider.ts:224-242 + helper.ts:468-486 (sender from gate's User_ID), and ALLOWED_PROCEDURES is empty. provider.test.ts:222,234 expect 3rd arg. → wave-2 item.
Cross-group: types/provider.types.ts:101 remove $ignorePermissions from GlobalFilterParams; helper.ts:353 JSDoc + ~367 example.
Docs: providers/ministry-platform/docs/README.md :166-175 procedure allowlist, :180-186 trusted sender, :241-244 drop $ignorePermissions; README.md:545 executeProcedureWithBody needs allowlist note; README.md:562 createCommunication/sendMessage need trusted sender; testing.md add services/guards.test.ts, scripts/generate-types.test.ts. Table names restricted to plain identifiers.

## Repo hygiene (me)
- .claude/worktrees/ shows untracked and eslint (from root) lints worktree dirs → add `.claude/worktrees/` to .gitignore and eslint ignores.

## From D (merged dd0b9a3)
Docs:
- auth.md ~978-990 contact-log allowlists (pick), Made_By: update omits it (original author kept; $userId → dp_Audit_Log), create stamps. ~997-999 role memo only during RSC render; in actions each gate = one role read. ~828 UserService.getUserProfile refuses any GUID but session's own.
- playbook ~484-487 Made_By; ~362 role memo; ~374/~404 session/User_ID resolution failure shows as no_mp_user "no access".
- src/app/(web)/contactlookup/layout.tsx:19-20 comment (F area) — "MP down never reads as not allowed" false for session/User_ID failures.
- components.md:103,119 remove getContactLogsByContactId/getContactLogById from contact-logs actions.
- TestCoverage.md:190,205 searchContactLogs gone.
- datetimehandling.md:69,80 error text now "toMpSqlDatetime: value could not be parsed as a date" (same for parseMpDatetime).
- testing.md + CLAUDE.md Testing: userService.test.ts now mocks @/lib/auth + next/headers (session-only subjects list).
Cross-group (wave 2):
- getCurrentUserProfile DTO: new CurrentUserProfile in src/lib/dto (First_Name, Last_Name, Nickname, Email_Address, Image_GUID, canAccessContactFeatures); switch providers.tsx, user-context.tsx, user-menu.tsx; action maps to it; UserService could stop reading roles/groups.
- E's request not done: src/components/contact-lookup/actions.ts:8-9 comment.

## From F (merged 2292729)
Docs: auth.md:898 remove "covers [guid]/page.tsx too"; :58 layout = UX redirect, [guid]/page.tsx is page gate; :832-833 useUser() no longer rethrows (null). playbook:382-384 + .claude/playbooks/port-downstream-hardening.md:275 each page must self-gate. security-headers.md:125-131 add /_global-error static (can't opt out; recovers via plain link). components.md :38,:41 Sign out button, ~:312 signOutEverywhere, add SessionGuard, SignOutButton, sign-in-attempts.ts, sign-out-broadcast.ts. testing.md 4 new test files. CLAUDE.md Contexts: failed profile → null.
Cross-group: src/app/server-providers.tsx comment stale (failed load → null, not rethrow).
Decision: SessionGuard redirects to /signin which auto-starts OAuth → may silently re-sign-in if MP SSO alive; a "signed out" landing page would avoid.
Build not run — wave-2 CI build/prerender check should confirm only /_not-found and /_global-error are static.

## User decisions (2026-09-29)
- Roles by Role_ID: NO — names only for now (close roles-matched-by-name + roles-parsing TODOs as won't-fix/deferred, document).
- OAuth scope narrowing: IGNORE — template repo, forks need broad capability (close unused-user-oauth-tokens remainder as won't-fix, document why).
- Signed-out page: IMPLEMENT — dedicated page that does NOT auto-start OAuth; SessionGuard / cross-tab sign-out / handleSignOut land there.
- Discovery failure: REBUILD ON FAILURE — on PROVIDER_NOT_FOUND rebuild shared auth instance (single-flight, 30 s cooldown). Static endpoints ruled out (incompatible with requireIdTokenVerification — generic-oauth/index.mjs:124-130).
- Session lifetime/revocation: LEAVE AS IS — 12 h cap + 1 h replay bound; persistent cookie accepted; document as accepted risk; close shared-device remainder + Additional_Security_Hardening §1 as accepted.
- CSP reporting: NONE — document as known gap.
- style-src nonce: (not asked) treat as accept & document unless user objects.

## Decision-closed items (TODO files deleted 2026-09-29)

- **roles-matched-by-name + mp-security-roles-parsing-fails-open (deferred, names only):** document in auth.md § Authorization and `.env.example`/README where `MP_SECURITY_ROLES` is described: roles are matched by (trimmed, case-insensitive) *name*; MP role names are editable free text and not unique, so anyone who can create/rename/assign MP roles can satisfy the gate; a role whose name contains a comma cannot be listed. Recommend operators restrict who can edit Security Roles. Future option: `MP_SECURITY_ROLE_IDS`.
- **unused-user-oauth-tokens-stored remainder (won't fix):** keep `dataplatform/scopes/all`. Rationale for auth.md § scopes: this is a template repo; forks need the broad scope for their own features. Token minimisation already shipped (no `offline_access`, no account cookie, tokens stripped from memory).
- **shared-device session persistence / sign-out revocation (accepted):** 12 h absolute cap + 1 h replay bound after sign-out (≤12 h on another instance) are accepted; persistent 12 h cookie (survives browser close) accepted. Update `docs/security/Additional_Security_Hardening.md` §1 to "Accepted 2026-09-29", and note the signed-out page (wave 2).
- **CSP reporting (none)** and **style-src nonce (accepted)** — see header-hardening note above.

## From wave 2 — provider sender (merged 1310da8)
- Root README.md ~545: executeProcedureWithBody example refused unless allowlisted → show `new MPHelper({ allowedProcedures: ['...'] })`.
- Root README.md ~562: createCommunication/sendMessage now `(content, sender, attachments?)`; sender built from requireSecurityRole's User_ID; remove author/from/FromAddress from payload example.
- testing.md: add helper.wiring.test.ts (plus guards.test.ts, generate-types.test.ts).
- Breaking for forks (release notes): new MPHelper communication signatures; procedures deny-all by default.

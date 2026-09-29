# MPNext — Application & Unit Test Coverage Review

**Date:** 2026-09-12
**Reviewed commit:** `5bc505a` (branch `docs/release-readiness-refresh`)
**Scope:** whole application — `src/**` excluding generated MP models, codegen scripts and `src/components/ui/`
**Supersedes:** the 2026-08-21 review of `64f18f0`, whose remaining gaps (§6) have now been closed
**Measured:** `npm run test:coverage`, Vitest 4.1.11, **1015 tests in 59 files**, ~6.5s

---

## 1. Executive summary

The whole application — feature components and app routes included — sits at **99.74% statement
coverage**. The 2026-08-21 review reported 99.47% over *non-UI* code only, with React components at
0% and ungated; that split no longer exists, and there is now a single honest number.

| | 2026-08-20 | 2026-08-21 (non-UI) | 2026-09-12 (whole app) |
|---|---|---|---|
| Statements | 71.93% (546/759) | 99.47% (756/760) | **99.74%** (1159/1162) |
| Branches | 70.73% (220/311) | 95.49% (297/311) | **97.21%** (593/610) |
| Functions | 72.28% (120/166) | 98.20% (164/167) | **99.31%** (291/293) |
| Lines | 72.93% (539/739) | 99.72% (738/740) | **99.91%** (1126/1127) |

Note the denominator grew from 760 statements to 1162 while the percentage rose: the UI was added to
the measured set, not excluded from it.

Three things matter more than the headline number:

| Finding | Status |
|---|---|
| **Measurement was inflated ~2.2×.** With no explicit `coverage.include`, every file no test imported dropped out of the denominator. | **Fixed.** `vitest.config.mts` now sets an explicit `include`, plus per-glob `thresholds` that fail the run on regression. |
| **`testing.md` claimed 95.39% coverage** — not reproducible under any configuration. | **Fixed.** Rewritten against measured numbers, with the new mock patterns documented. |
| **Coverage was pointed away from the risk.** Two `'use server'` actions have no session check at all, and both sat at 100% line coverage. | **Documented, then fixed.** Every finding in §5 is closed — §5.1 (filter injection), §5.2/§5.3 (missing auth), §5.4/§5.5 (missing authz, duplicated User_ID lookup), §5.6 (N+1 lookup), §5.7 (token lifetime), §5.8 (tests asserting against a copy of the logic). No test-derived item remains in `.claude/TODO/`. |

The shape of the original problem is worth restating, because the new number does not make it go
away: **high coverage is not evidence of correctness.** The filter-injection path in §5.1 lived in a
file at 100% statement coverage for as long as no test passed it a value of the wrong type.

---

## 2. What changed

### The 2026-08-21 round — new test files (9)

| File | Tests | Statements gained |
|---|---:|---:|
| `services/file.service.test.ts` | 35 | +88 |
| `services/procedure.service.test.ts` | 16 | +27 |
| `services/communication.service.test.ts` | 13 | +25 |
| `services/metadata.service.test.ts` | 8 | +12 |
| `services/domain.service.test.ts` | 8 | +11 |
| `auth/client-credentials.test.ts` | 5 | +7 |
| `lib/utils.test.ts` | 7 | +1 |
| `lib/auth-client.test.ts` | 4 | +1 |
| `components/shared-actions/domain.test.ts` | 3 | +3 |

(The five `*.service.test.ts` files live under
`src/lib/providers/ministry-platform/services/`; the paths above are shorthand. Test counts are as
of that round — see `.claude/references/testing.md` for today's per-file inventory.)

The five MP sub-services were the bulk of the gap — 163 of the 213 missing statements. All five share
the `ensureValidToken` → `getHttpClient` → error-wrap shape that `table.service.ts` already had tested,
so the harness was copy-adaptable.

### Extended test files (6)

- `provider.test.ts` — 9 → 24 tests. The pass-throughs to `CommunicationService` and `FileService`
  were entirely untested; `provider.ts` went 60% → 100%.
- `auth.test.ts` — 12 → 25 tests. See §3.
- `contact-logs/actions.test.ts` — 19 → 24. Added the missing-`userGuid` guard, non-positive-ID
  rejection, and unresolved-`User_ID` paths.
- `domainTimezoneService.test.ts` — 16 → 18. Added `clearCache` and the unparseable-with-zone-marker path.
- `http-client.test.ts` — 26 → 28. Added the `putFormData` non-OK and query-param paths.
- `contact-lookup-details/actions.test.ts`, `user-menu/actions.test.ts`, `user-context.test.tsx` —
  non-Error rejection wrapping, the env-fallback chain, and the `isPending` / undefined-profile branches.

### One source change

`src/lib/auth.ts` — the `customSession` callback body was extracted to an exported
`enrichSessionUser(user, session)`. Behavior is identical; the better-auth plugin closes over its
callback and never exposes it, so this was the only way to unit test the logic short of driving a full
`getSession()` request through the whole auth stack. `auth.ts` went 44% → 96%.

### Config

`vitest.config.mts` gained an explicit `coverage.include`, an exclude for `src/components/ui/`, and
per-glob `thresholds`. The threshold gate was verified to fail (exit 1) when breached, not just to
pass when satisfied.

### Since then: 2026-08-21 → 2026-09-12

The suite went from 575 tests in 32 files to **1015 tests in 59 files**. Three bodies of work:

- **The UI was covered and then gated.** Every feature component and app route named as a gap in §6
  now has a test file, and `vitest.config.mts` gained `src/app/**` and `src/components/**/*.tsx`
  threshold globs (95/90/95/95) plus a **global** gate (98/95/97/98) that catches a newly added,
  entirely untested file — which no per-glob gate can, since a new file is diluted by everything
  already covered in its glob. Covering the UI surfaced four real defects; they were landed as tests
  pinning the broken behaviour, then fixed. See `.claude/references/testing.md` § Defects found while
  covering the UI.
- **Authorization moved from a write-only gate to reads as well** (F1/F10/F11), with
  `authorizationService.test.ts` (40 tests) and a page-layer role gate at
  `app/(web)/contactlookup/layout.tsx`. A session proves only that some MP user signed in; all MP
  data is read with the app's client-credentials service account, so the role gate is the only thing
  deciding who may see it.
- **Security headers and a nonce-based CSP** landed with `lib/security-headers.test.ts` (41),
  `lib/next-config-headers.test.ts` (3), and a `Content-Security-Policy` block in `proxy.test.ts`
  (which grew 9 → 20). Three React error boundaries arrived with `app/(web)/error.test.tsx`,
  `app/error.test.tsx` and `app/global-error.test.tsx`.

`.github/workflows/test.yml` also gained a `lockfile` job (`node scripts/check-lockfile.mjs`)
alongside the `test` job, which runs `npx vitest run --coverage` and uploads to Codecov with
`fail_ci_if_error: false`. What actually gates a PR is the coverage threshold exit code, not Codecov.

---

## 3. Reproducing these numbers

```bash
npm run test:run       # 1015 passed (59 files), ~5.7s
npm run test:coverage  # the whole-app figure, and the threshold gate
npx tsc --noEmit       # clean
npx eslint .           # clean
```

`npm run test:coverage` prints the number quoted in §1 directly — 99.74% statements (1159/1162).
There is no longer a second, narrower figure to reproduce: the old non-UI-only invocation existed
because React components sat at 0% and were excluded from the gated set, and they no longer are.
`coverage.include` in `vitest.config.mts` is `['src/**/*.{ts,tsx}']`; the excludes are generated MP
models, the codegen scripts, `src/components/ui/`, `src/test-setup.ts` and the test files themselves.

> Two Vitest 4 gotchas. `--reporter=basic` fails (`Failed to load custom Reporter from basic`) — the
> `basic` reporter was removed; use `default` or `dot`. And `coverage.all` no longer exists and is not
> in the `CoverageOptions` type — setting it is a `tsc` error. `coverage.include` replaces it.

> The `text` reporter **omits fully-covered files**, so most of the table below is invisible in a
> normal run. Use `--coverage.reporter=json-summary` for real per-file numbers.

---

## 4. Coverage by layer

| Layer | Stmts | Branch | Files with statements | Assessment |
|---|---|---|---|---|
| Services (`src/services/`) | **100%** (220/220) | 98.28% | 6 | Complete |
| Server actions (`**/actions.ts`) | **100%** (95/95) | 97.73% | 4 | |
| App routes (`src/app/**`) | **100%** (65/65) | 92.59% | 16 | Small branch denominator — 27 total, so one miss costs ~4 points |
| Contexts | **100%** (29/29) | 100% | 2 | |
| MP provider + sub-services | **99.72%** (350/351) | 98.18% | 12 | Only the `client.ts` token-getter closure remains |
| React feature components | **99.69%** (324/325) | 97.90% | 14 | Gated since 2026-09-12; was 0% at the previous review |
| `src/lib` + `proxy.ts` | **98.70%** (76/77) | 92.54% | 5 | Only the `lib/auth.ts` delegating arrow remains |
| UI primitives (`components/ui/`) | excluded | — | 19 | Thin shadcn/Radix wrappers |
| Codegen scripts | excluded | — | 2 | Dev tooling, run manually |

Only **three statements** in the whole application are uncovered, all deliberate:

- `lib/auth.ts:408` — the one-line arrow delegating to `enrichSessionUser`; better-auth closes over it
- `client.ts` — the token-getter closure handed to `HttpClient`
- `contact-logs.tsx:232` — `if (!editingLog) return;`, unreachable because every path that clears
  `editingLog` closes the dialog in the same update

`app/api/auth/[...all]/route.ts` and `http-client.ts:31`, listed as gaps at the previous review, are
both covered now — the route grew a deny-by-default allowlist with 15 tests, and `http-client.test.ts`
grew to 32.

The remaining branch gaps are `helper.ts:189,273` (the `String(validationError)` arm — Zod always
throws an `Error`, so reaching it requires a fake schema object), `route.ts:53-57` (the non-`/api/auth`
arms of `relativeAuthPath`, which Next never routes there), `authorizationService.ts:258` (a
`?? "no_security_role"` fallback for a reason the denial path always sets),
`domainTimezoneService.ts:237` and `contact-logs.tsx:95,134` (the `hour === "24"` cross-ICU
safeguards), `contact-logs.tsx:387` and `user-menu.tsx:35`. None is worth the contrivance.

---

## 5. Where coverage is still actively misleading

**This is the most important section.** Each item below was fully covered by passing tests and was
still wrong. The original coverage work **documented rather than fixed** them — one file per issue in
`.claude/TODO/` — and the fixed items have since been closed out by follow-up work; each carries a
regression test that would have caught the defect.

### 5.1 Numeric IDs are interpolated into MP filters unsanitized ✅ FIXED

Fixed 2026-08-21: `sanitizeNumericId` was added to `filter-sanitize.ts` and applied at all five
interpolation sites plus the five action-level boundaries (`contact-logs/actions.ts` ×4,
`contact-lookup-details/actions.ts` ×1 — the second entry point, which the TODO had missed). It
accepts a `number` or a digits-only string and throws otherwise, so `'1 OR 1=1'` now fails before any
HTTP call. The probe tests were **kept** this time: `contactLogService.test.ts` asserts the built
filter string and that `getTableRecords` is never called for each payload — the assertion the old
100% coverage lacked. Behavior change: `searchContactLogs(0)` now throws instead of silently reading
the whole table (the old `if (contactId)` truthiness check treated 0 as "no filter").
(`searchContactLogs` itself, unused, was removed on 2026-09-29 along with the `contact-logs`
read actions; the remaining sanitized interpolation sites are unchanged.)

Was:

`contactLogService.ts:101,118,83` and `userService.ts:75,80` interpolated IDs directly. The codebase
had `sanitizeFilterValue`, `sanitizeLikeValue`, and `sanitizeGuid`, applied them faithfully to every
**string** parameter, and had no equivalent for numeric IDs — while the TypeScript `number` annotation
is erased at runtime.

The action-level guard did not help. For `contactLogId = "1 OR 1=1"`, `!id` is false (non-empty
string is truthy) and `id <= 0` is false, so the guard passed. Verified empirically:

```
getContactLogById("1 OR 1=1")  →  filter: "Contact_Log_ID = 1 OR 1=1"
searchContactLogs("5; DROP")   →  filter: "Contact_ID = 5; DROP"
```

`contactLogService.ts` was at **100% statements and 100% branches**. No test passed a non-numeric
value, which is exactly why full coverage did not catch it.

### 5.2 `searchContacts` — no authentication ✅ FIXED

Was: a `'use server'` action with zero `getSession` calls, returning up to 20 contacts including
email and mobile phone. `proxy.ts:8` allows all `/api` paths without a session, and every sibling
action file did check. 100% statements, 100% branches, 5 passing tests, none of which asked the
authorization question — because nothing in the code answered it.

Now: `searchContacts` calls `auth.api.getSession` and throws `Authentication required` before any
other work. The check sits **before** the try/catch, so the auth failure surfaces as itself rather
than being masked as `Failed to search contacts`, and the empty-search-term early return cannot
become an unauthenticated success path. Three tests cover it: null session, session with no
`user.id`, and rejection of an empty term while unauthenticated.

### 5.3 `getCurrentUserProfile` — no authentication, no ownership check ✅ FIXED

Was: took an arbitrary `User_GUID` and returned that user's profile **plus their roles and user
groups** — disclosing the authorization model for any user whose GUID was known. 100% covered; both
tests asserted pass-through.

Now: the parameter is **gone**. The action reads `userGuid` from the session, which makes the
ownership question unaskable rather than merely answered — there is no longer an argument for a
caller to tamper with. It throws `Authentication required` with no session and `User GUID not found
in session` when an authenticated session carries no GUID. `UserProvider` calls it with no argument
and keeps `userGuid` only as an effect dependency so switching users still re-fetches.

If a feature ever needs to read another user's profile, that is a separate, explicitly role-gated
function — not a widening of this one.

### 5.4 Contact-log actions authenticate but never authorize ✅ FIXED

Resolved 2026-08-21. The policy decision was made: **any authenticated user holding an MP security
role may create, edit, and delete any contact log**, ownership not a factor. It is enforced by
`AuthorizationService.requireSecurityRoleForWrite()`, documented in `.claude/references/auth.md`, and
encoded in tests that would fail under a different policy (`should NOT delete when the caller holds
no security role`, `should permit editing a log made by a different user`).

Authentication alone is no longer sufficient for a write: a session with no resolvable MP `User_ID`,
or an MP user holding no security role, fails closed with `UnauthorizedError` and a structured
`mp.write.unauthorized` log line. `MP_WRITE_SECURITY_ROLES` narrows the gate to named roles without a
code change.

**Extended 2026-09-12 (F1/F10/F11): the gate now covers reads too**, at both the action and the
service layer, plus a page-layer gate in `app/(web)/contactlookup/layout.tsx` that redirects to
`/no-access`. The env var is now `MP_SECURITY_ROLES`, with `MP_WRITE_SECURITY_ROLES` kept as a
deprecated fallback, and denials log `mp.read.unauthorized` as well. A bare session check proved
nothing for reads: MP's OIDC endpoint authenticates any `dp_Users` record, and this app reads MP with
its own client-credentials service account, so MP's per-user record security never applied to what
came back.

**Changed 2026-09-28: the gate fails closed when unconfigured.** Blank, unset or separator-only
`MP_SECURITY_ROLES` (with no usable legacy value) now permits nobody (`roles_not_configured`);
`MP_SECURITY_ROLES=*` is the explicit "any MP security role" setting.

### 5.5 Contact-log actions bypass `SessionContextService` ✅ FIXED

Resolved 2026-08-21. Both inline `dp_Users` lookups are gone. The acting `User_ID` now comes from
`AuthorizationService` → `SessionContextService` → the session-baked `userId` that `customSession`
resolved and `resolveMpUserId` cached — so a write costs no `dp_Users` round-trip at all, and the
`getUserGuid` helper plus the `MPHelper`/`sanitizeGuid` imports were deleted from the actions.

`mp.write.non_user` is still emitted for an unresolved acting user, so the attempt stays visible in
logs. Whether the write then *proceeds* is now the authorization gate's decision rather than an
accident of a failed lookup — and under §5.4's policy it does not, because a user with no `User_ID`
has no roles. `should not resolve the acting user itself — SessionContextService owns that` guards
against the inline lookup returning.

One behavior change worth calling out: `updateContactLog` no longer stamps `Made_By` with the editor.
That column records who made the *contact*; since any role-holder may edit anyone's log, stamping the
editor rewrote the pastoral record's authorship. MP's audit trail still captures the editor via
`$userId` in `ContactLogService`.

### 5.6 Resolved: N+1 query in `getContactLogsByContactId` ✅

Resolved 2026-08-21. `getContactLogTypes()` was called inside `logs.map()`, so 50 logs with a type
set meant 50 identical fetches of the same lookup table. It is now fetched once, indexed into a
`Map`, and the map is synchronous, so `Promise.all` is gone.

The naive hoist would not have been behavior-neutral: the old code fetched the lookup table *only*
when at least one log had a type, so a contact with no logs — or only untyped ones — made no request
and could not fail on one. A `logs.some(...)` guard preserves that exactly.

Why the old suite missed it: the file was at 100%/100% the entire time. The test mocked
`getContactLogTypes` and never asserted a call count, so the loop was invisible. The guard is now
`toHaveBeenCalledTimes(1)` against a five-log fixture, plus `not.toHaveBeenCalled()` for the
no-typed-logs and empty-logs paths. Verified by mutation: restoring the call inside the `map` fails
the count assertion and nothing else — the other four tests in that block pin behavior, not
efficiency, which is the correct split.

Service-level memoization of `getContactLogTypes()` was considered and deliberately skipped. The
remaining callers are one per page load and one per `contact-logs.tsx` mount; caching on a
process-wide singleton would hide a newly added contact log type until restart, for a single-digit
request saving.

### 5.7 `client.ts` token lifetime ignores `expires_in` ✅ FIXED

Was: the comment said "refresh 5 minutes *before* actual expiration"; the code set
`expiresAt = now + 5min` for every token, discarding the `expires_in` the OAuth endpoint returned.
Since `MinistryPlatformProvider` is a singleton and `ensureValidToken()` runs before every service
call, a 1-hour MP token was thrown away after 5 minutes — roughly 12× more token requests than
necessary. Two tests in `client.test.ts` pinned the wrong behavior by advancing timers past the
5-minute mark and asserting a refresh, so the cap looked deliberate.

Now: the lifetime comes from `expires_in`, minus a `TOKEN_SAFETY_MARGIN` of 5 minutes, floored at 30
seconds so a pathologically short or negative value cannot drive a refresh storm. A missing or
non-numeric `expires_in` falls back to `DEFAULT_TOKEN_LIFETIME_SECONDS` (3600).
`getClientCredentialsToken()` now declares a `ClientCredentialsToken` return type instead of leaking
`any` out of `response.json()`. The two misleading tests were rewritten against the real boundary and
four cases added (3600s → 55min, `expires_in` absent, `expires_in: 60` → 30s floor, non-numeric
→ default). Verified by mutation: restoring the flat 5-minute cap fails all four, and dropping just
the `Math.max` floor fails the clamp test.

### 5.8 Resolved: `auth.test.ts` asserted against a copy of the logic ✅

The old "Name Splitting" and "Session Structure" blocks (7 tests) re-implemented the transformation
inside the test body and never invoked `customSession` — they would have passed with the callback
deleted. That is why `auth.ts` reported 18.5% despite the file containing 12 tests.

Now rewritten to call the real `enrichSessionUser`. Verified by mutation: changing
`firstName: user.name?.split(" ")[0]` to a constant fails 6 tests. The old versions failed none.
(The name split was later removed outright, 2026-09-29: `enrichSessionUser` now only adds `userId`
and withholds `token`/`ipAddress`/`userAgent`; its tests call it the same way.)

---

## 6. Gaps from the previous review — all now closed

### `contact-logs.tsx` — was 602 lines at 0% ✅ ADDRESSED

Resolved 2026-08-21. `contact-logs.test.tsx` adds 13 targeted tests covering the three places where a
regression would silently corrupt or delete member data:

1. **The delete-confirmation gate** — clicking the trash icon opens the confirmation and calls
   nothing; cancelling calls nothing; only accepting calls `deleteContactLog(501)`.
2. **Client-side validation** — an empty `Notes` or a cleared `Contact_Date` surfaces the field error
   and never reaches `createContactLog`.
3. **Error surfacing** — a rejected create/update/delete alerts the user, leaves the dialog open, and
   does not call `onRefresh` as if it had succeeded; the log row stays on screen.

Verified by mutation: making `handleDeleteClick` call `deleteContactLog(logId)` directly — the exact
"delete fires before the confirmation resolves" regression the TODO named — fails all four gate
tests. The previous suite would have caught none of it.

Radix needs `ResizeObserver`, `hasPointerCapture`/`setPointerCapture`/`releasePointerCapture`, and
`scrollIntoView` polyfilled under jsdom; without them the primitives throw on mount rather than
failing an assertion. `installJsdomPolyfills()` in that test file is the pattern to copy for the
remaining component gaps below.

Full render coverage was not chased in that round — deliberately. Those were the write-path tests,
not a coverage exercise, and the component stayed ungated.

**Closed 2026-09-12.** `contact-logs.test.tsx` is now 40 tests and the file is at 99.28% statements /
96.11% branches, inside the `src/components/**/*.tsx` gate.

### Other component gaps ✅ CLOSED

`contact-lookup-details.tsx`, `contact-lookup-results.tsx`, `header.tsx`, `contact-lookup-search.tsx`,
`dynamic-breadcrumb.tsx`, `user-menu.tsx`, `contact-lookup.tsx` and `sidebar.tsx` were all at 0% at
the previous review. Every one now has a co-located test file and sits at 100% statements; the
aggregate for `src/components/**/*.tsx` is 99.69% statements / 97.90% branches, gated at 95/90.

Covering them was not a box-ticking exercise — it surfaced four real defects, including a
`formatDateTime()` that threw `RangeError` on an unparseable `Contact_Date` during unguarded row
render, and a silent unhandled rejection on the app's only sign-out path. All four are fixed; the
traps that invite a well-meaning revert are written up in `.claude/references/testing.md` § Defects
found while covering the UI.

Note the mechanics that make these tests possible rather than merely tedious: Radix primitives
**throw on mount** under jsdom without `ResizeObserver` / pointer-capture / `scrollIntoView`
polyfills, a Radix `Select` will not open from `fireEvent.pointerDown` (jsdom has no `PointerEvent`)
and must be driven from the keyboard, and React 19's `use()` will not resume inside RTL's synchronous
`act` scope. Each of these presents as a component bug rather than a failed assertion.

### Explicitly not worth doing

- **`components/ui/` primitives** — thin Radix/shadcn wrappers. Excluded from the denominator.
- **Codegen scripts** (`generate-types.ts`, `generate-storedprocs.ts`) — dev tooling, run manually,
  failures immediately visible. Excluding them keeps the denominator honest.
- **`helper.ts:189,273`** — unreachable without a fake schema object.

---

## 7. Appendix — whole-app coverage, per file

1162 statements total. 19 barrel / type-only files carry zero statements and are omitted, as are
`src/components/ui/`, the generated models and the codegen scripts (all excluded from the
denominator). Sorted by statement coverage, then by size.

| Stmts | Branch | Covered | File |
|---:|---:|---:|---|
| 94.44% | 100% | 17/18 | `lib/providers/ministry-platform/client.ts` |
| 97.36% | 85.29% | 37/38 | `lib/auth.ts` |
| 99.28% | 96.11% | 139/140 | `components/contact-logs/contact-logs.tsx` |
| 100% | 100% | 88/88 | `lib/providers/.../services/file.service.ts` |
| 100% | 97.77% | 76/76 | `services/domainTimezoneService.ts` |
| 100% | 81.81% | 54/54 | `lib/providers/ministry-platform/helper.ts` |
| 100% | 94.11% | 49/49 | `components/contact-logs/actions.ts` |
| 100% | 97.05% | 49/49 | `services/authorizationService.ts` |
| 100% | 100% | 45/45 | `lib/providers/.../utils/http-client.ts` |
| 100% | 100% | 45/45 | `services/contactLogService.ts` |
| 100% | 100% | 30/30 | `lib/providers/ministry-platform/provider.ts` |
| 100% | 100% | 30/30 | `lib/providers/.../services/table.service.ts` |
| 100% | 100% | 28/28 | `components/contact-lookup-details/actions.ts` |
| 100% | 100% | 26/26 | `contexts/user-context.tsx` |
| 100% | 100% | 25/25 | `components/contact-lookup/contact-lookup-results.tsx` |
| 100% | 100% | 25/25 | `components/contact-lookup/contact-lookup-search.tsx` |
| 100% | 100% | 25/25 | `lib/providers/.../services/communication.service.ts` |
| 100% | 100% | 23/23 | `components/contact-lookup/contact-lookup.tsx` |
| 100% | 100% | 21/21 | `lib/providers/.../services/procedure.service.ts` |
| 100% | 100% | 20/20 | `components/sign-in/sign-in.tsx` |
| 100% | 100% | 20/20 | `proxy.ts` |
| 100% | 100% | 19/19 | `components/contact-lookup-details/contact-lookup-details.tsx` |
| 100% | 100% | 19/19 | `services/contactService.ts` |
| 100% | 100% | 17/17 | `lib/security-headers.ts` |
| 100% | 75% | 16/16 | `app/api/auth/[...all]/route.ts` |
| 100% | 100% | 16/16 | `services/userService.ts` |
| 100% | 100% | 15/15 | `services/sessionContextService.ts` |
| 100% | 87.5% | 14/14 | `components/user-menu/user-menu.tsx` |
| 100% | 100% | 13/13 | `components/shared-actions/user.ts` |
| 100% | 100% | 12/12 | `components/layout/dynamic-breadcrumb.tsx` |
| 100% | 100% | 12/12 | `lib/providers/.../services/metadata.service.ts` |
| 100% | 100% | 11/11 | `lib/providers/.../services/domain.service.ts` |
| 100% | 100% | 10/10 | `components/contact-lookup/actions.ts` |
| 100% | 100% | 10/10 | `lib/providers/.../utils/filter-sanitize.ts` |
| 100% | 100% | 8/8 | `components/layout/header.tsx` |
| 100% | 100% | 8/8 | `components/layout/sidebar.tsx` |
| 100% | 100% | 8/8 | `components/user-menu/actions.ts` |
| 100% | 100% | 7/7 | `app/auth-error/page.tsx` |
| 100% | 100% | 7/7 | `components/layout/auth-wrapper.tsx` |
| 100% | 100% | 7/7 | `lib/providers/.../auth/client-credentials.ts` |
| 100% | 100% | 6/6 | `app/(web)/contactlookup/[guid]/page.tsx` |
| 100% | 100% | 6/6 | `components/shared-actions/domain.ts` |
| 100% | 100% | 5/5 | `app/(web)/error.tsx` |
| 100% | 100% | 5/5 | `app/(web)/layout.tsx` |
| 100% | 100% | 5/5 | `app/error.tsx` |
| 100% | 100% | 5/5 | `app/global-error.tsx` |
| 100% | 100% | 5/5 | `components/home-demos/contact-lookup-demo-card.tsx` |
| 100% | 100% | 4/4 | `app/(web)/contactlookup/layout.tsx` |
| 100% | 100% | 3/3 | `contexts/session-context.tsx` |
| 100% | 100% | 2/2 | `app/(web)/contactlookup/page.tsx` |
| 100% | 100% | 2/2 | `app/providers.tsx` |
| 100% | 100% | 2/2 | `app/session-error/page.tsx` |
| 100% | 100% | 2/2 | `app/signin/page.tsx` |
| 100% | 100% | 1/1 | `app/(web)/home/page.tsx` |
| 100% | 100% | 1/1 | `app/(web)/no-access/page.tsx` |
| 100% | 100% | 1/1 | `app/(web)/page.tsx` |
| 100% | 100% | 1/1 | `app/layout.tsx` |
| 100% | 100% | 1/1 | `lib/auth-client.ts` |
| 100% | 100% | 1/1 | `lib/utils.ts` |

The full test inventory (1015 tests across 59 files, with per-file counts) lives in
`.claude/references/testing.md`.

---

*All findings verified against the working tree at `5bc505a`. §5.1 was reproduced with a probe test
against the real `ContactLogService` with a mocked `MPHelper`; that probe now ships as the regression
guard in `contactLogService.test.ts`. §5.8 was verified by mutation. No Ministry Platform data was
read or written during this review or by any test in the suite — every test mocks at a boundary above
the network.*

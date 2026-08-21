# MPNext — Application & Unit Test Coverage Review

**Date:** 2026-08-21
**Reviewed commit:** `64f18f0` (branch `main`), plus the coverage work described in §2
**Scope:** whole application — `src/**` excluding generated MP models
**Supersedes:** the 2026-08-20 review of `bb2cd19`, whose gap analysis has now been acted on
**Updated 2026-08-21:** §5.4, §5.5 and §6 (the three contact-log findings) are now fixed — see those
sections. §5.1 (filter injection via numeric IDs) is now fixed too. The suite is at **575 tests in 32
files**; `contact-logs.tsx` went from 0% to 87.6% statements.

---

## 1. Executive summary

Non-UI functional code now sits at **99.47% statement coverage**, up from 71.93%. The suite grew from
279 tests in 21 files to **419 tests in 30 files**, still running in ~3s, with `tsc --noEmit` and
`eslint .` both clean.

| | Before | After |
|---|---|---|
| Statements | 71.93% (546/759) | **99.47%** (756/760) |
| Branches | 70.73% (220/311) | **95.49%** (297/311) |
| Functions | 72.28% (120/166) | **98.20%** (164/167) |
| Lines | 72.93% (539/739) | **99.72%** (738/740) |

Three things matter more than the headline number:

| Finding | Status |
|---|---|
| **Measurement was inflated ~2.2×.** With no explicit `coverage.include`, every file no test imported dropped out of the denominator. | **Fixed.** `vitest.config.ts` now sets an explicit `include`, plus per-glob `thresholds` that fail the run on regression. |
| **`testing.md` claimed 95.39% coverage** — not reproducible under any configuration. | **Fixed.** Rewritten against measured numbers, with the new mock patterns documented. |
| **Coverage was pointed away from the risk.** Two `'use server'` actions have no session check at all, and both sat at 100% line coverage. | **Documented, then fixed.** §5.1 (filter injection), §5.2/§5.3 (missing auth) and §5.4/§5.5 (missing authz, duplicated User_ID lookup) are closed. §5.6 and §5.7 remain open in `.claude/TODO/`. |

The shape of the original problem is worth restating, because the new number does not make it go
away: **high coverage is not evidence of correctness.** The filter-injection path in §5.1 lived in a
file at 100% statement coverage for as long as no test passed it a value of the wrong type.

---

## 2. What changed

### New test files (10)

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

`vitest.config.ts` gained an explicit `coverage.include`, an exclude for `src/components/ui/`, and
per-glob `thresholds`. The threshold gate was verified to fail (exit 1) when breached, not just to
pass when satisfied.

---

## 3. Reproducing these numbers

```bash
npm run test:run       # 575 passed (32 files), ~4s
npm run test:coverage   # whole-app figure, and the threshold gate
npx tsc --noEmit        # clean
npx eslint .            # clean
```

`npm run test:coverage` prints the **whole-app** number — 71.45% statements (756/1058) — because
feature components and app pages are in the denominator but ungated. To reproduce the **non-UI
functional** figure quoted in §1:

```bash
npx vitest run --coverage \
  --coverage.include='src/**/*.ts' \
  --coverage.include='src/contexts/*.tsx' \
  --coverage.exclude='**/*.test.*' \
  --coverage.exclude='src/test-setup.ts' \
  --coverage.exclude='src/lib/providers/ministry-platform/models/**' \
  --coverage.exclude='src/lib/providers/ministry-platform/scripts/**'
```

Both numbers are honest; they differ only in denominator. Quote the one whose scope you mean.

> Two Vitest 4 gotchas. `--reporter=basic` fails (`Failed to load custom Reporter from basic`) — the
> `basic` reporter was removed; use `default` or `dot`. And `coverage.all` no longer exists and is not
> in the `CoverageOptions` type — setting it is a `tsc` error. `coverage.include` replaces it.

---

## 4. Coverage by layer

| Layer | Stmts | Files | Assessment |
|---|---|---|---|
| Services (`src/services/`) | **100%** | 5 | Complete, branches 98.9% |
| MP provider + sub-services | **99.7%** | 13 | Only the `client.ts` token-getter closure remains |
| Server actions | **100%** | 5 | Branches 89–100% |
| Contexts | **100%** | 2 | |
| `lib/auth.ts` + proxy | **97.4%** | 3 | Only the one-line delegating arrow remains |
| React feature components | **0%** | 9 | Ungated by design — see §6 |
| UI primitives (`components/ui/`) | excluded | 19 | Thin shadcn/Radix wrappers |
| Codegen scripts | excluded | 2 | Dev tooling, run manually |

Only **four statements** in non-UI code are uncovered, all deliberate:

- `app/api/auth/[...all]/route.ts` — a one-line `toNextJsHandler(auth)` re-export
- `lib/auth.ts:198` — the arrow delegating to `enrichSessionUser`
- `client.ts` — the token-getter closure handed to `HttpClient`
- `http-client.ts:31` — one arm of the GET error-message builder

Plus two branch gaps at `helper.ts:189,273` — the `String(validationError)` arm of a validation-error
message. Zod always throws an `Error`, so reaching it requires a fake schema object. Not worth the
contrivance.

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

### 5.6 N+1 query in `getContactLogsByContactId` 🟡

→ `.claude/TODO/n-plus-1-contact-log-types-lookup.md`

`getContactLogTypes()` is called inside `logs.map()`. 50 logs with a type set means 50 identical
fetches of the same lookup table. The file is at 100%/100%; the test mocks the call and never asserts
a count.

### 5.7 `client.ts` token lifetime ignores `expires_in` 🟡

→ `.claude/TODO/mp-client-token-lifetime-ignores-expires-in.md`

The comment says "refresh 5 minutes *before* actual expiration"; the code caps every token at 5
minutes total, discarding `expires_in`. Roughly 12× more token requests than necessary.

### 5.8 Resolved: `auth.test.ts` asserted against a copy of the logic ✅

The old "Name Splitting" and "Session Structure" blocks (7 tests) re-implemented the transformation
inside the test body and never invoked `customSession` — they would have passed with the callback
deleted. That is why `auth.ts` reported 18.5% despite the file containing 12 tests.

Now rewritten to call the real `enrichSessionUser`. Verified by mutation: changing
`firstName: user.name?.split(" ")[0]` to a constant fails 6 tests. The old versions failed none.

---

## 6. Remaining gaps

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

Full render coverage was not chased — deliberately. These are the write-path tests, not a coverage
exercise, and the component stays ungated in `vitest.config.ts` thresholds.

### Other component gaps 🟡

`contact-lookup-details.tsx` (172 LOC), `contact-lookup-results.tsx` (82), `header.tsx` (89),
`contact-lookup-search.tsx` (68), `dynamic-breadcrumb.tsx` (65), `user-menu.tsx` (59),
`contact-lookup.tsx` (53), `sidebar.tsx` (39) — all 0%. `@testing-library/react` is installed and
`auth-wrapper.test.tsx` proves the harness works, so the cost is low.

### Explicitly not worth doing

- **`components/ui/` primitives** — thin Radix/shadcn wrappers. Excluded from the denominator.
- **Codegen scripts** (`generate-types.ts`, `generate-storedprocs.ts`, 445 stmts) — dev tooling, run
  manually, failures immediately visible. Excluding them keeps the denominator honest.
- **`helper.ts:189,273`** — unreachable without a fake schema object.

---

## 7. Appendix — non-UI coverage, per file

760 statements total. 17 barrel / type-only files carry zero statements and are omitted.

| Stmts | Branch | Covered | File |
|---:|---:|---:|---|
| 0% | 100% | 0/1 | `app/api/auth/[...all]/route.ts` |
| 94.73% | 100% | 18/19 | `lib/providers/ministry-platform/client.ts` |
| 96.42% | 80% | 27/28 | `lib/auth.ts` |
| 97.95% | 95.83% | 48/49 | `lib/providers/.../utils/http-client.ts` |
| 100% | 81.81% | 54/54 | `lib/providers/ministry-platform/helper.ts` |
| 100% | 89.47% | 91/91 | `components/contact-logs/actions.ts` |
| 100% | 97.77% | 76/76 | `services/domainTimezoneService.ts` |
| 100% | 100% | 88/88 | `lib/providers/.../services/file.service.ts` |
| 100% | 100% | 47/47 | `services/contactLogService.ts` |
| 100% | 100% | 33/33 | `lib/providers/.../services/table.service.ts` |
| 100% | 100% | 33/33 | `components/contact-lookup-details/actions.ts` |
| 100% | 100% | 30/30 | `lib/providers/ministry-platform/provider.ts` |
| 100% | 100% | 27/27 | `lib/providers/.../services/procedure.service.ts` |
| 100% | 100% | 26/26 | `contexts/user-context.tsx` |
| 100% | 100% | 25/25 | `lib/providers/.../services/communication.service.ts` |
| 100% | 100% | 17/17 | `services/contactService.ts` |
| 100% | 100% | 15/15 | `services/sessionContextService.ts` |
| 100% | 100% | 15/15 | `services/userService.ts` |
| 100% | 100% | 14/14 | `proxy.ts` |
| 100% | 100% | 12/12 | `lib/providers/.../services/metadata.service.ts` |
| 100% | 100% | 11/11 | `lib/providers/.../services/domain.service.ts` |
| 100% | 100% | 9/9 | `components/contact-lookup/actions.ts` |
| 100% | 100% | 8/8 | `components/user-menu/actions.ts` |
| 100% | 100% | 7/7 | `lib/providers/.../auth/client-credentials.ts` |
| 100% | 100% | 7/7 | `components/layout/auth-wrapper.tsx` |
| 100% | 100% | 6/6 | `lib/providers/.../utils/filter-sanitize.ts` |
| 100% | 100% | 4/4 | `components/shared-actions/user.ts` |
| 100% | 100% | 3/3 | `components/shared-actions/domain.ts` |
| 100% | 100% | 3/3 | `contexts/session-context.tsx` |
| 100% | 100% | 1/1 | `lib/auth-client.ts` |
| 100% | 100% | 1/1 | `lib/utils.ts` |

The full test inventory (575 tests across 32 files, with per-file counts) lives in
`.claude/references/testing.md`.

---

*All findings verified against the working tree. §5.1 was reproduced with a probe test against the
real `ContactLogService` with a mocked `MPHelper`; that probe now ships as the regression guard in
`contactLogService.test.ts`. §5.8 was verified by mutation. No Ministry Platform data was read or written during this review or by any test in the
suite — every test mocks at a boundary above the network.*

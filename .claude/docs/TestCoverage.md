# MPNext — Application & Unit Test Coverage Review

**Date:** 2026-08-20
**Reviewed commit:** `bb2cd19` (branch `main`, clean working tree)
**Scope:** whole application — `src/**` excluding generated MP models

---

## 1. Executive summary

The test suite is **healthy where it exists and honest in style** — 277 tests across 21 files, all passing in ~3s, with `tsc --noEmit` and `eslint .` both clean. The service and provider layers are genuinely well tested.

Three things matter more than the headline number:

| Finding | Impact |
|---|---|
| **Reported coverage is inflated ~2.2×.** `coverage.all` is not enabled, so files no test imports are omitted from the denominator entirely. Real statement coverage is **32.7%**, not the 71.6% the tool prints. | Medium — measurement |
| **`.claude/references/testing.md` claims 95.39% coverage.** That figure is not reproducible under any configuration; it is stale by a wide margin. | Medium — documentation |
| **Two `'use server'` actions have no session check at all**, and both are at 100% line coverage. Coverage is measuring the wrong thing on the paths that matter most. | **High — security** |

Additionally, one **confirmed filter-injection path** was found during review (§7.1) — reproduced empirically, not inferred.

Bottom line: this is not a "write more tests" problem so much as a **"tests are pointed away from the risk"** problem. The MP provider plumbing is tested three layers deep; the authorization boundary and the 624-line UI component that performs the writes are untested.

---

## 2. Reproducing these numbers

```bash
npm run test:run       # 277 passed (21 files), ~3s
npm run test:coverage  # prints 71.58% — see §3 for why this is wrong
npx tsc --noEmit       # clean
npx eslint .           # clean
```

> **Note:** `npx vitest run --reporter=basic` fails on Vitest 4 (`Failed to load custom Reporter from basic`). The `basic` reporter was removed. Any CI script or doc still passing `--reporter=basic` needs updating to `--reporter=default` or `dot`.

To get the true figure, run with `all: true` and an explicit `include`:

```jsonc
// vitest.config.ts → test.coverage
{
  provider: 'v8',
  all: true,                                  // <-- the missing line
  include: ['src/**/*.{ts,tsx}'],
  exclude: [
    'node_modules/', '.next/', 'src/test-setup.ts', '**/*.d.ts',
    '**/*.test.{ts,tsx}',
    'src/lib/providers/ministry-platform/models/',
    'src/lib/providers/ministry-platform/scripts/',   // dev-only codegen
  ],
}
```

---

## 3. The headline number is wrong

| Metric | As currently reported | Actual (`all: true`) |
|---|---|---|
| Statements | 71.58% (539/753) | **32.72%** (539/1647) |
| Branches | 70.22% (217/309) | **26.27%** (217/826) |
| Functions | 71.95% (118/164) | **29.50%** (118/400) |
| Lines | 72.57% (532/733) | **33.31%** (532/1597) |

The covered count is identical (539) in both runs — only the denominator changes. Every file no test ever imports is currently invisible: all 19 UI primitives, all 10 app routes/pages, 9 of 10 feature components, both codegen scripts.

The v8 text reporter also **omits any file at 100% on every metric**, showing only the directory roll-up. So `src/services` printing one row is not a truncation bug — the other five files there really are at 100%. Useful to know when reading the raw output.

---

## 4. Coverage by layer (true figures)

| Layer | Stmts | Files | Assessment |
|---|---|---|---|
| Business logic (services, provider, actions, utils, contexts) | **70.8%** (532/751) | 46 | Solid — the real strength of this suite |
| React feature components | **2.6%** (7/269) | 10 | Effectively untested (only `auth-wrapper.tsx`) |
| UI primitives (`components/ui/`) | **0%** (0/145) | 19 | Acceptable — thin shadcn/Radix wrappers |
| App routes & pages | **0%** (0/37) | 10 | Mostly thin shells; low value |
| Codegen scripts | **0%** (0/445) | 2 | Dev-only tooling; should be excluded, not tested |

**The meaningful number is 70.8%** — business logic, excluding UI primitives, pages, and dev tooling. That is a defensible figure and the one worth tracking in CI. It is *not* 95%, and it is not 32.7% either; quoting either extreme misleads.

---

## 5. What is well covered

Genuinely good work here, worth preserving:

- **`src/services/`** — 97.6%. `contactLogService`, `contactService`, `userService`, `sessionContextService` all at 100%/100%.
- **`domainTimezoneService.ts`** — 94.7% with 16 tests. Given that CLAUDE.md makes this the mandatory MP datetime boundary, testing it this thoroughly is exactly right. DST transitions, Windows→IANA mapping, and round-tripping are all exercised.
- **`http-client.ts`** — 95.9% / 26 tests. Query-string building, array params, and per-verb error paths covered.
- **`filter-sanitize.ts`** — 100% / 20 tests. Quote doubling, LIKE wildcard escaping, and GUID rejection all asserted.
- **`proxy.ts`** — 100%. Public-path bypass, missing-cookie redirect, and the throwing branch are all covered.
- **`helper.ts` / `table.service.ts`** — 100% statements. Zod `partial: true/false` semantics and validation error messages are asserted.
- **Mock hygiene** — `vi.hoisted()` is used correctly throughout, MPHelper is mocked as a class (not `mockImplementation`), and singletons are reset in `beforeEach`. The patterns documented in `testing.md` are actually followed.

---

## 6. Coverage gaps, ranked

### 6.1 `lib/auth.ts` — 18.5% (5/27 stmts) 🔴

The OAuth wiring is the app's front door and is almost entirely unexercised. Untested: `getUserInfo` (lines 93–121), `mapProfileToUser`, the `customSession` callback, and `resolveMpUserId` (35–57) including its unbounded process-wide `userIdCache`.

`src/auth.test.ts` has 12 tests and does **not** raise this number — see §7.2 for why.

Worth covering: `getUserInfo` returning `null` on a non-OK userinfo response; `mapProfileToUser` mapping `sub` → `userGuid`; `resolveMpUserId` cache-hit vs. cache-miss; and the `catch` that must **not** block session creation.

### 6.2 MP sub-services — 0% 🔴

| File | LOC | Stmts |
|---|---|---|
| `file.service.ts` | 212 | 0/88 |
| `communication.service.ts` | 78 | 0/25 |
| `procedure.service.ts` | 72 | 0/27 |
| `metadata.service.ts` | 37 | 0/12 |
| `domain.service.ts` | 40 | 0/11 |

`table.service.ts` is at 100% and its four siblings are at zero — the same `ensureValidToken` → `getHttpClient` → error-wrap shape, tested once and then not again. `file.service.ts` (multipart uploads, blob downloads) and `communication.service.ts` (**sends real email/SMS to real church members**) are the two that carry actual blast radius.

`provider.ts` sits at 60% for the same reason: the pass-throughs to these five services are never called.

### 6.3 `contact-logs.tsx` — 0%, 624 lines 🔴

The single largest untested file in the app, and it is the component that drives contact-log **create / update / delete**. It holds form state, validation, optimistic updates, and delete confirmation. Every write path a user can actually reach goes through code with no test coverage.

The server actions beneath it are 97.8% covered — but the actions are the easy half. The form logic, the confirmation gate, and the error handling are where a regression silently corrupts or deletes member data.

### 6.4 `client-credentials.ts` — 0% (7 stmts) 🟡

25 lines, zero tests, and it is the only thing standing between the app and every MP API call. Needs one happy-path test and one `!response.ok` test. Cheap to fix.

### 6.5 Other component gaps 🟡

`contact-lookup-details.tsx` (176 LOC), `contact-lookup-results.tsx` (129), `contact-lookup-search.tsx` (87), `contact-lookup.tsx` (73), `header.tsx` (93), `dynamic-breadcrumb.tsx` (70), `user-menu.tsx` (69), `sidebar.tsx` (54) — all 0%. `@testing-library/react` is already installed and `auth-wrapper.test.tsx` proves the harness works, so the cost here is low.

### 6.6 No coverage thresholds 🟡

`vitest.config.ts` sets no `coverage.thresholds`. Nothing fails when coverage drops, so there is no ratchet — this review's numbers can silently regress before the next one.

---

## 7. Where coverage is actively misleading

This is the most important section. Each item below is **fully covered by a passing test** and still wrong.

### 7.1 Confirmed: numeric IDs are interpolated into MP filters unsanitized 🔴

`ContactLogService` interpolates IDs directly:

- `contactLogService.ts:101` — `filter: \`Contact_Log_ID = ${contactLogId}\``
- `contactLogService.ts:118` — `filter: \`Contact_ID = ${contactId}\``
- `contactLogService.ts:78` — same, in `searchContactLogs`
- `userService.ts:75,80` — `User_ID = ${profile.User_ID}` (lower risk; value originates from MP)

The codebase has `sanitizeFilterValue`, `sanitizeLikeValue`, and `sanitizeGuid` — and applies them faithfully to every **string** parameter. There is **no equivalent for numeric IDs**, and the TypeScript `number` annotation is erased at runtime. Server actions are public HTTP endpoints; a caller controls the payload shape, not just its values.

The action-level guard does not help. For `contactLogId = "1 OR 1=1"`:

```
!id      → false      (non-empty string is truthy)
id <= 0  → false      (string/number comparison is not a rejection)
guard passes → true
```

Verified empirically against the real service with a mocked MPHelper:

```
getContactLogById("1 OR 1=1")  →  filter: "Contact_Log_ID = 1 OR 1=1"
searchContactLogs("5; DROP")   →  filter: "Contact_ID = 5; DROP"
```

Both reach the MP API. `Contact_Log_ID = 1 OR 1=1` widens a single-record read to the whole table.

**No test passes a non-numeric value to any of these methods**, which is precisely why 100% line coverage on `contactLogService.ts` did not catch it.

*Fix:* add `sanitizeNumericId(value: unknown): number` to `filter-sanitize.ts` — `Number.isInteger` + positive check, throwing otherwise — and apply it at every numeric interpolation site. Then test it with `'1 OR 1=1'`, `'5; DROP'`, `NaN`, `Infinity`, `1.5`, `-1`, `null`.

### 7.2 `src/auth.test.ts` — 5 tests assert against a copy of the logic, not the logic 🔴

The "Name Splitting" block re-implements the transformation inside the test body:

```ts
// src/auth.test.ts:28-31 — this is the test, not the subject
const enrichedUser = {
  ...user,
  firstName: user.name?.split(' ')[0] || '',
  lastName: user.name?.split(' ').slice(1).join(' ') || '',
};
expect(enrichedUser.firstName).toBe('John');
```

This asserts that `String.prototype.split` works. It never imports or invokes the `customSession` callback in `lib/auth.ts:143-161`. **Delete that callback entirely and these five tests still pass** — which is exactly why `auth.ts` reports 18.5% despite `auth.test.ts` containing 12 tests.

The `userAdditionalFields` / `parseAdditionalUserInputFromProviderProfile` tests in the same file are the opposite — they import the real export and guard a genuine better-auth 1.6 regression. That is the pattern the rest of the file should follow.

### 7.3 `searchContacts` — no authentication, 100% covered 🔴

`src/components/contact-lookup/actions.ts` is a `'use server'` action with **zero** `getSession` calls. It searches `Contacts` across `First_Name`, `Last_Name`, `Nickname`, `Email_Address`, and `Mobile_Phone`, returning up to 20 records including email and mobile phone.

Server actions compile to callable POST endpoints. `src/proxy.ts:8` explicitly allows all `/api` paths through without a session, and every sibling action file checks the session — so this is an inconsistency, not a deliberate design.

Its 5 tests cover empty input, whitespace, trimming, and service errors. All 5 pass. None asserts that an unauthenticated caller is rejected, because nothing rejects one.

### 7.4 `getCurrentUserProfile` — no authentication, no ownership check, 100% covered 🔴

`src/components/shared-actions/user.ts` takes an arbitrary `id` (a User_GUID) and returns that user's profile **plus their roles and user groups** (`userService.ts:72-89`). No session check, and no verification that the caller owns the requested GUID.

Both its tests pass `'guid-123'` and assert pass-through. The authorization question is never asked.

### 7.5 Contact-log actions authenticate but never authorize 🟠

`updateContactLog`, `deleteContactLog`, `getContactLogById`, and `getContactLogsByContactId` all confirm *a* valid session, then act on whatever ID they are handed. Nothing checks that the log belongs to the caller, or that the caller may touch that contact.

`deleteContactLog` is the sharpest edge: unlike create/update it does not even resolve `userGuid`, so any authenticated session can delete any contact log in the domain by ID. Given CLAUDE.md's stance on MP write safety, this deserves an explicit decision — either "any authenticated staff user may delete any log" is the intended policy and should be documented, or an ownership check is missing.

The tests mirror the code's assumptions exactly (`deleteContactLog(42)` → asserts the service was called with `42`), so they will keep passing either way.

### 7.6 N+1 query in `getContactLogsByContactId` 🟡

`contact-lookup-details/actions.ts:49-64` calls `contactLogService.getContactLogTypes()` **inside** the `logs.map()`. For 50 logs with a type set, that is 50 identical fetches of the same small lookup table. Hoist the call above the loop.

The test mocks `getContactLogTypes` and never asserts a call count, so the inefficiency is invisible to the suite.

### 7.7 `client.ts` token lifetime ignores `expires_in` 🟡

`client.ts:52` sets `expiresAt = Date.now() + TOKEN_LIFE` where `TOKEN_LIFE = 5 minutes`, discarding the `expires_in` from the token response. The comment says "refresh 5 minutes *before* actual expiration," but the code caps every token at 5 minutes total. Mostly harmless (extra refreshes), but the stated intent and the behavior disagree, and no test pins either.

---

## 8. Recommendations

Ordered by risk reduction per unit of effort.

### Priority 1 — security correctness (do these first; they are bugs, not gaps)

1. Add `sanitizeNumericId` to `filter-sanitize.ts` and apply it at all five numeric interpolation sites (§7.1). Add the rejection tests.
2. Add a session check to `searchContacts` (§7.3) and to `getCurrentUserProfile` (§7.4); for the latter, verify the requested GUID matches `session.user.userGuid` unless a role explicitly permits otherwise.
3. Decide and document the authorization policy for contact-log read/update/delete (§7.5). If ownership is required, enforce it; either way, add a test that encodes the decision.
4. Add a **negative-path test per server action**: unauthenticated → rejected. This is ~10 small tests and it is the single highest-value block of tests missing from the repo.

### Priority 2 — make measurement honest

5. Set `coverage.all: true` with the `include`/`exclude` from §2. Expect the reported number to drop to ~33% — that is the correction, not a regression.
6. Rewrite `src/auth.test.ts`'s name-splitting tests to invoke the real `customSession` callback, or delete them (§7.2). Tautological tests are worse than absent ones: they buy false confidence.
7. Correct `.claude/references/testing.md` — the 95.39% / "228 tests, 19 files" figures are wrong on all three counts (actual: 277 tests, 21 files, 32.7% raw / 70.8% business logic). Fix the `--reporter=basic` reference too.
8. Add a threshold ratchet at current business-logic levels so this cannot silently slide:
   ```jsonc
   thresholds: { statements: 70, branches: 65, functions: 70, lines: 70 }
   ```

### Priority 3 — close the real gaps

9. `client-credentials.ts` — 2 tests (§6.4). Smallest effort, guards every API call.
10. The four untested MP sub-services (§6.2). Clone the `table.service.test.ts` shape; start with `communication.service.ts` (sends real messages) and `file.service.ts` (largest).
11. `lib/auth.ts` — `getUserInfo` non-OK → `null`, `mapProfileToUser`, `resolveMpUserId` cache hit/miss/throw (§6.1).
12. `contact-logs.tsx` (§6.3) — the delete-confirmation gate and form validation first, not full render coverage. This is 624 lines driving MP writes; even three targeted tests beat zero.

### Explicitly not worth doing

- Testing `components/ui/` primitives — thin Radix/shadcn wrappers; exclude them from the denominator instead.
- Testing the codegen scripts (`generate-types.ts`, `generate-storedprocs.ts`, 445 stmts) — dev tooling, run manually, failures are immediately visible. Excluding them raises the honest denominator by ~27%.

---

## 9. Appendix — business-logic coverage, per file

| Stmts | Branch | Covered | File |
|---:|---:|---:|---|
| 0% | 0% | 0/88 | `lib/providers/.../services/file.service.ts` |
| 0% | 0% | 0/27 | `lib/providers/.../services/procedure.service.ts` |
| 0% | 0% | 0/25 | `lib/providers/.../services/communication.service.ts` |
| 18.51% | 16.66% | 5/27 | `lib/auth.ts` |
| 60% | 100% | 18/30 | `lib/providers/ministry-platform/provider.ts` |
| 0% | 0% | 0/12 | `lib/providers/.../services/metadata.service.ts` |
| 0% | 100% | 0/11 | `lib/providers/.../services/domain.service.ts` |
| 0% | 0% | 0/7 | `lib/providers/.../auth/client-credentials.ts` |
| 0% | 100% | 0/3 | `components/shared-actions/domain.ts` |
| 0% | 100% | 0/1 | `lib/auth-client.ts` |
| 0% | 100% | 0/1 | `lib/utils.ts` |
| 94.73% | 93.33% | 72/76 | `services/domainTimezoneService.ts` |
| 94.73% | 100% | 18/19 | `lib/providers/ministry-platform/client.ts` |
| 95.91% | 91.66% | 47/49 | `lib/providers/.../utils/http-client.ts` |
| 96.15% | 75% | 25/26 | `contexts/user-context.tsx` |
| 97.8% | 85.96% | 89/91 | `components/contact-logs/actions.ts` |
| 100% | 81.81% | 54/54 | `lib/providers/ministry-platform/helper.ts` |
| 100% | 90.9% | 33/33 | `components/contact-lookup-details/actions.ts` |
| 100% | 60% | 8/8 | `components/user-menu/actions.ts` |
| 100% | 100% | 47/47 | `services/contactLogService.ts` |
| 100% | 100% | 33/33 | `lib/providers/.../services/table.service.ts` |
| 100% | 100% | 17/17 | `services/contactService.ts` |
| 100% | 100% | 15/15 | `services/sessionContextService.ts` |
| 100% | 100% | 15/15 | `services/userService.ts` |
| 100% | 100% | 14/14 | `proxy.ts` |
| 100% | 100% | 9/9 | `components/contact-lookup/actions.ts` |
| 100% | 100% | 6/6 | `lib/providers/.../utils/filter-sanitize.ts` |
| 100% | 100% | 4/4 | `components/shared-actions/user.ts` |
| 100% | 100% | 3/3 | `contexts/session-context.tsx` |
| — | — | 0/0 | 16 barrel / type-only files |

### Test inventory

| Test file | Tests |
|---|---:|
| `lib/providers/ministry-platform/helper.test.ts` | 54 |
| `lib/providers/.../utils/http-client.test.ts` | 26 |
| `lib/providers/.../services/table.service.test.ts` | 21 |
| `services/contactLogService.test.ts` | 21 |
| `lib/providers/.../utils/filter-sanitize.test.ts` | 20 |
| `components/contact-logs/actions.test.ts` | 19 |
| `services/domainTimezoneService.test.ts` | 16 |
| `auth.test.ts` | 12 *(5 tautological — §7.2)* |
| `lib/providers/ministry-platform/client.test.ts` | 12 |
| `services/contactService.test.ts` | 12 |
| `services/sessionContextService.test.ts` | 10 |
| `components/contact-lookup-details/actions.test.ts` | 9 |
| `lib/providers/ministry-platform/provider.test.ts` | 9 |
| `proxy.test.ts` | 8 |
| `contexts/user-context.test.tsx` | 6 |
| `services/userService.test.ts` | 6 |
| `components/contact-lookup/actions.test.ts` | 5 |
| `components/layout/auth-wrapper.test.tsx` | 4 |
| `components/user-menu/actions.test.ts` | 3 |
| `components/shared-actions/user.test.ts` | 2 |
| `contexts/session-context.test.tsx` | 2 |
| **Total** | **277** |

---

*All findings verified against the working tree at `bb2cd19`. §7.1 was reproduced with a temporary probe test (since removed) against the real `ContactLogService` with a mocked `MPHelper`. No Ministry Platform data was read or written during this review.*

# Testing Reference Guide

This document provides detailed context about the testing setup, patterns, and conventions for LLM assistants working on the MPNext project.

## Overview

MPNext uses **Vitest** with **jsdom** environment, **@testing-library/react** for component/hook tests, and **v8** for coverage reporting.

### Configuration

| File | Purpose |
|------|---------|
| `vitest.config.mts` | Test runner config: two projects (`src`, `scripts`), coverage, path aliases |
| `scripts/vitest.config.mts` | The `scripts` project — Node environment, no `src/test-setup.ts`; `scripts/*.test.ts` |
| `src/test-setup.ts` | Global setup for the `src` project: mocked env vars + `@testing-library/jest-dom` |

Every run (`npm test`, `npm run test:run`, `npm run test:coverage`, CI) runs
**both** projects once each. `src` is jsdom + `src/test-setup.ts`; `scripts` is
the Node-only dev tooling (setup's `.env.local` writer, the CI prerender guard)
and does not extend the root config. Coverage `include` is `src/**` only, so
`scripts/` never enters the denominator or the thresholds.

The root config also aliases **`server-only`** to the package's no-op
`empty.js`: the real module throws unless resolved under the `react-server`
condition, which Vitest does not set, and `src/lib/auth.ts`, the MP client and
every service import it.

### Commands

```bash
npm test              # Watch mode
npm run test:run      # Single run
npm run test:coverage # Single run + v8 coverage report
npm run test:scripts  # Only the `scripts` project (same as --project scripts)
npx vitest run --project src   # Only the app suite
```

### CI

`.github/workflows/test.yml` runs on pushes and PRs to `main`, on Node 22, with
`permissions: contents: read` and every action pinned to a commit SHA. Four
jobs:

| Job | Runs |
|---|---|
| `lockfile` | `node scripts/check-lockfile.mjs` — platform drift in `package-lock.json`, see CLAUDE.md § Dependency Rule |
| `lint` | `npm ci`, `npm run lint`, `npx tsc --noEmit` |
| `build` | `npm ci`, `npm run build` (dummy env; the MP URL is `https://mp.invalid/…`, so no real MP is contacted), then `npm run build:check-prerender` — fails if any route other than `/_not-found` and `/_global-error` was prerendered (see security-headers.md § Nonces force dynamic rendering) |
| `test` | `npm ci`, then `npx vitest run --coverage` (both projects), then uploads `coverage/coverage-final.json` to Codecov |

Note what actually gates the `test` job: the **coverage thresholds in
`vitest.config.mts`** (below), because a breach makes `vitest run --coverage`
exit non-zero. The Codecov step is reporting only — it is pinned
`fail_ci_if_error: false` and cannot fail the build.

## Test File Conventions

- Co-locate test files next to their source: `foo.ts` → `foo.test.ts`
- Service tests: `src/services/contactService.test.ts`
- Action tests: `src/components/contact-logs/actions.test.ts`
- Context tests: `src/contexts/user-context.test.tsx` (`.tsx` for JSX)
- Provider tests: `src/lib/providers/ministry-platform/provider.test.ts`

## Key Pattern: `vi.hoisted()` for Mock Variables

**Critical**: `vi.mock()` factories are hoisted to the top of the file. Any mock variables referenced inside a factory **must** be declared with `vi.hoisted()`, not plain `const`.

```typescript
// ✅ Correct — vi.hoisted() ensures variables exist when vi.mock() runs
const { mockGetSession, mockGetTableRecords } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockGetTableRecords: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: mockGetSession } },
}));

// ❌ Wrong — ReferenceError: Cannot access 'mockGetSession' before initialization
const mockGetSession = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: mockGetSession } },
}));
```

## Mock Patterns

### Mocking MPHelper (class constructor)

Services call `new MPHelper()`. Use a mock class, not `vi.fn().mockImplementation()`:

```typescript
const { mockGetTableRecords } = vi.hoisted(() => ({
  mockGetTableRecords: vi.fn(),
}));

vi.mock('@/lib/providers/ministry-platform', () => {
  return {
    MPHelper: class {
      getTableRecords = mockGetTableRecords;
    },
  };
});
```

### Mocking Service Singletons

Server actions call `ServiceClass.getInstance()`. Mock the static method:

```typescript
const { mockContactSearch } = vi.hoisted(() => ({
  mockContactSearch: vi.fn(),
}));

vi.mock('@/services/contactService', () => ({
  ContactService: {
    getInstance: vi.fn().mockResolvedValue({
      contactSearch: mockContactSearch,
    }),
  },
}));
```

### Mocking the authorization gate (server actions AND services)

Every contact action and every `ContactService` / `ContactLogService` method
calls `AuthorizationService` — for reads as well as writes (see
`.claude/references/auth.md` § Authorization). Mock the singleton the same way
as any other, and re-declare `UnauthorizedError` inside the factory so tests can
assert on the type:

```typescript
const { mockRequireSecurityRole } = vi.hoisted(() => ({
  mockRequireSecurityRole: vi.fn(),
}));

vi.mock('@/services/authorizationService', () => {
  class UnauthorizedError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'UnauthorizedError';
    }
  }
  return {
    UnauthorizedError,
    AuthorizationService: {
      getInstance: () => ({ requireSecurityRole: mockRequireSecurityRole }),
    },
  };
});

beforeEach(() => {
  // Default to an authorized role-holder; individual tests override.
  mockRequireSecurityRole.mockResolvedValue(99);
});
```

The gate subsumes authentication (it fails closed when no MP user resolves), so
files that mock it generally do **not** need `@/lib/auth` or `next/headers` at
all — `contact-logs/actions.test.ts` and `contact-lookup*/actions.test.ts`
dropped both. Use `hasSecurityRole` (returning
`{ permitted, userId, reason }`) instead where the subject calls the
non-throwing form: `shared-actions/user.test.ts` and the `/contactlookup`
layout test.

> ⚠️ **`cache()` from `"react"` is a passthrough under Vitest.** The gate
> memoizes its `dp_User_Roles` read per request with React's `cache()`. React
> calls straight through when no cache dispatcher is installed, which is the
> case in every test here. So assert only what holds in *both* environments —
> "the decision is not carried across calls" — and never a hit count that
> depends on the memo being live.

### Mocking Auth + Headers (server actions)

Only six files still mock this pair, and none of them is a contact action:
`components/layout/auth-wrapper.test.tsx`, `components/shared-actions/user.test.ts`,
`components/shared-actions/domain.test.ts`, `components/user-menu/actions.test.ts`,
`services/sessionContextService.test.ts` and `services/userService.test.ts` — the
subjects that genuinely do nothing but check for a session, plus
`shared-actions/user.test.ts`, which mocks both the session and the non-throwing
`hasSecurityRole`, and `userService.test.ts`, because `getUserProfile` refuses
any GUID but the session's own `userGuid`. (`app/signed-out/page.test.tsx`
mocks `@/lib/auth` alone.) Everything that touches MP data mocks the gate above
instead.

```typescript
const { mockGetSession } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: mockGetSession } },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

// In tests:
const mockAuthSession = {
  user: { id: 'internal-id', userGuid: 'user-guid-123' },
};

it('should require authentication', async () => {
  mockGetSession.mockResolvedValueOnce(null);
  await expect(someAction()).rejects.toThrow('Authentication required');
});

it('should work when authenticated', async () => {
  mockGetSession.mockResolvedValueOnce(mockAuthSession);
  // ...
});
```

### Mocking Next.js Navigation

```typescript
const { mockRedirect } = vi.hoisted(() => ({
  mockRedirect: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}));
```

### Mocking Better Auth Client (React hooks)

For context/component tests that use `authClient.useSession()`:

```typescript
const { mockUseSession } = vi.hoisted(() => ({
  mockUseSession: vi.fn(),
}));

vi.mock('@/lib/auth-client', () => ({
  authClient: { useSession: mockUseSession },
}));

// In tests:
mockUseSession.mockReturnValue({
  data: { user: { id: 'internal-id', userGuid: 'guid-123' } },
  isPending: false,
});
```

### Mocking the MP sub-service harness (`client` + `HttpClient`)

The six MP sub-services (`TableService`, `FileService`, `CommunicationService`,
`ProcedureService`, `MetadataService`, `DomainService`) all take a
`MinistryPlatformClient` and call `ensureValidToken()` then `getHttpClient()`.
Build both as plain objects - no `vi.mock()` needed, since the service takes the
client as a constructor argument:

```typescript
let mockHttpClient: HttpClient;
let mockClient: MinistryPlatformClient;

beforeEach(() => {
  mockHttpClient = {
    get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(),
    buildUrl: vi.fn(), postFormData: vi.fn(), putFormData: vi.fn(),
  } as unknown as HttpClient;

  mockClient = {
    ensureValidToken: vi.fn().mockResolvedValue(undefined),
    getHttpClient: vi.fn().mockReturnValue(mockHttpClient),
  } as unknown as MinistryPlatformClient;

  service = new FileService(mockClient);
});
```

Always assert the token-failure path calls nothing:

```typescript
it('should not call the API when the token refresh fails', async () => {
  (mockClient.ensureValidToken as ReturnType<typeof vi.fn>)
    .mockRejectedValueOnce(new Error('Token refresh failed'));

  await expect(service.getFileMetadata(1)).rejects.toThrow('Token refresh failed');
  expect(mockHttpClient.get).not.toHaveBeenCalled();
});
```

### Stubbing global `fetch`

Two places bypass `HttpClient` and call `fetch` directly:
`getClientCredentialsToken()` and `FileService.getFileContentByUniqueId()` (a
deliberately unauthenticated endpoint). Use `vi.stubGlobal` and always undo it:

```typescript
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

it('should throw on a non-OK response', async () => {
  fetchMock.mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' });
  await expect(subject()).rejects.toThrow('404 Not Found');
});
```

Mock the response as a plain object with only the fields the code touches
(`ok`, `status`, `statusText`, `json`, `blob`) - not a real `Response`.

**A JSON response needs `headers.get('content-type')`.** `HttpClient` and the
token fetch check the response Content-Type before parsing and throw
`unexpected content-type` otherwise, so a mocked MP response must include
`headers: { get: () => 'application/json' }` (see the `mockHeaders` helper in
`utils/http-client.test.ts`).

### Asserting multipart `FormData` payloads

File uploads and communications with attachments go through `postFormData` /
`putFormData`. Read the captured `FormData` off the mock rather than trying to
match it with `toHaveBeenCalledWith`:

```typescript
const [endpoint, formData, queryParams] = (
  mockHttpClient.postFormData as ReturnType<typeof vi.fn>
).mock.calls[0];

expect(endpoint).toBe('/files/Contacts/42');
expect((formData.get('file-0') as File).name).toBe('photo.jpg');
expect(JSON.parse(formData.get('communication') as string)).toEqual(payload);
expect(queryParams).toEqual({ $default: 'true' });
```

`formData.get()` returns `null` for an absent key - useful for asserting that a
falsy optional param was dropped rather than sent as `"0"`.

### Do not assert against a re-implementation of the subject

The single worst pattern to reintroduce. An earlier version of `auth.test.ts`
looked like this:

```typescript
// WRONG - this tests String.prototype.split, not our code.
const enriched = {
  ...user,
  firstName: user.name?.split(' ')[0] || '',
};
expect(enriched.firstName).toBe('John');
```

Those five tests passed at 100% line coverage while `lib/auth.ts` sat at 18.5%,
and they would have kept passing if the `customSession` callback were deleted
outright. Import the real export and call it:

```typescript
// CORRECT
import { enrichSessionUser } from '@/lib/auth';
const result = await enrichSessionUser({ id: 'ba', userGuid: GUID }, session);
expect(result.user.userId).toBe(42); // resolved from dp_Users (mocked)
```

(The name split in the WRONG example no longer exists at all: `firstName`/
`lastName` were removed from the session user on 2026-09-29. `enrichSessionUser`
now only adds `userId` and strips `token`/`ipAddress`/`userAgent` from the
session.)

If a function is unreachable because it is closed over by a library (as the
`customSession` callback was), extract it to a named export rather than
simulating it in the test.

## Singleton Reset Pattern

Service classes use static singleton instances. Reset between tests to avoid state leakage:

```typescript
beforeEach(() => {
  vi.clearAllMocks();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (ContactService as any).instance = undefined;
});
```

## React Hook/Context Tests

Use `@testing-library/react` `renderHook` with a wrapper:

```typescript
import { renderHook, waitFor, act } from '@testing-library/react';
import { ReactNode } from 'react';

function createWrapper(profilePromise = Promise.resolve(null)) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <UserProvider profilePromise={profilePromise}>{children}</UserProvider>;
  };
}

it('should load profile', async () => {
  // useUser() suspends, so render inside an awaited act() and a <Suspense>
  // (see contexts/user-context.test.tsx for the full harness).
  const { result } = renderHook(() => useUser(), {
    wrapper: createWrapper(Promise.resolve(mockProfile)),
  });

  await waitFor(() => {
    expect(result.current.userProfile).toEqual(mockProfile);
  });
});
```

**Pending-forever suspensions and `act()`:** to assert what renders *while* `useUser()`
is still pending, tests make it `use()` a promise that never settles. Inside `act()`
(which `fireEvent` wraps), React holds **every** commit until pending thenables settle —
so a click that should update state beside a suspended boundary never lands, although
a browser commits it. `components/layout/header.test.tsx` ("keeps the sidebar usable")
sets `IS_REACT_ACT_ENVIRONMENT = false` for that one test, uses `findBy*`/`waitFor`,
and restores the flag in `finally`.

## Radix Component Tests Under jsdom

jsdom does not implement the browser APIs Radix primitives probe on mount. Without
these polyfills, `Dialog` / `AlertDialog` / `Select` **throw during render** rather
than failing an assertion, which makes the component look broken when only the
harness is. `components/contact-logs/contact-logs.test.tsx` carries the pattern:

```typescript
function installJsdomPolyfills() {
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
  const proto = Element.prototype as unknown as Record<string, unknown>;
  proto.hasPointerCapture ??= () => false;
  proto.setPointerCapture ??= () => {};
  proto.releasePointerCapture ??= () => {};
  proto.scrollIntoView ??= () => {};
}
```

Call it in `beforeEach`. Notes on the rest of the harness:

- `fireEvent` is sufficient for Radix triggers and buttons — `@testing-library/user-event`
  is **not** installed, so do not import it.
- Icon-only buttons (the trash icon on a log row) have no accessible name. Find them by
  filtering `getAllByRole('button')` rather than adding a test-only label to the component.
- Scope assertions to the open dialog with `within(await screen.findByRole('dialog'))`;
  `AlertDialog` uses role `alertdialog`, not `dialog`.
- Components that report errors with `window.alert()` need `vi.spyOn(window, 'alert')` —
  jsdom's default implementation emits "not implemented" noise.
- react-hook-form + `zodResolver` validate asynchronously. Assert the error message with
  `await screen.findByText(...)` before asserting the action was not called.

### Verify a gate test actually gates

A test that asserts "the action was called with 42" passes under any policy. For a
confirmation gate, mutate the component to bypass it and confirm the tests fail:

```
handleDeleteClick = (logId) => { deleteContactLog(logId); setDeleteLogId(logId); }
```

All four delete-gate tests fail on that mutation. The suite that preceded them failed
none of it.

## jsdom, Radix and React 19 mechanics

Each of these presents as a component bug rather than a failed assertion, so
recognise them before debugging the component.

**Radix needs browser APIs jsdom lacks.** Dialog/AlertDialog/Select/DropdownMenu
throw on mount without `ResizeObserver`, `hasPointerCapture`,
`setPointerCapture`, `releasePointerCapture` and `scrollIntoView`. Copy the
`installJsdomPolyfills()` helper from `contact-logs.test.tsx` and call it in
`beforeEach`.

**A Radix `Select` will not open from `fireEvent.pointerDown`** - jsdom does not
implement `PointerEvent` at all. Drive it from the keyboard instead: `ArrowDown`
on the combobox, then `Enter` on the option. See `selectLogType` in
`contact-logs.test.tsx`. A `DropdownMenu` trigger, by contrast, *does* open on
`pointerDown` and does **not** open on `click`.

**React 19's `use()` will not resume inside RTL's synchronous `act` scope.** If a
component suspends on a promise, a plain `render()` leaves every assertion seeing
only the Suspense fallback. The render has to happen inside an **awaited** `act`.
See the `renderDetails` helper in `contact-lookup-details.test.tsx`. Conversely,
to *force* a fallback, call `use()` on a never-resolving promise in a mocked hook.

**`window.location` is redefinable** under jsdom 30 via `Object.defineProperty`
with `configurable: true` - useful for asserting a hard redirect.

**`src/app/globals.css` cannot be imported under Vitest.** Vite tries to load the
repo's PostCSS config and dies with `Invalid PostCSS Plugin found at: plugins[0]`,
because Tailwind v4's plugin is not loadable outside the Next build pipeline. Any
test importing a module that imports it needs `vi.mock("./globals.css", () => ({}))`
(see `src/app/layout.test.tsx`). If this spreads much further, a CSS stub alias in
`vitest.config.mts` would be the cleaner fix. Relatedly, v8 tries to parse
`globals.css` as JS during a bare `--coverage.include='src/app/**'` run and emits a
harmless `PARSE_ERROR`/`RolldownError`; narrowing to `'src/app/**/*.{ts,tsx}'`
silences it.

**Reading a scoped coverage run:** the `text` reporter *omits fully-covered
files*, so a scoped run over files you just brought to 100% prints an empty-looking
table. Use `--coverage.reporter=json-summary` to see real per-file numbers. And if
two coverage runs overlap, pass `--coverage.reportsDirectory` to avoid an `ENOENT`
on `coverage/.tmp/coverage-0.json`.

## Coverage

Coverage uses the **v8** provider.

```bash
npm run test:coverage            # text + json + html reporters
npx vitest run --coverage --coverage.reportOnFailure   # also report when tests fail
```

> Use `--reporter=default` or `--reporter=dot`. The `basic` reporter was removed
> in Vitest 4 and `--reporter=basic` now fails with
> `Failed to load custom Reporter from basic`.

### The `include` glob is load-bearing

`vitest.config.mts` sets `coverage.include: ['src/**/*.{ts,tsx}']`. Without an
explicit `include`, v8 reports only on files that some test imported, so every
untested file drops out of the denominator - the repo once reported 71.6% while
true statement coverage was 32.7%. Do not remove it.

(Vitest 3's `coverage.all` flag no longer exists in Vitest 4 and is not in the
`CoverageOptions` type; `include` replaces it.)

### Excluded from the denominator

| Path | Why |
|---|---|
| `src/lib/providers/ministry-platform/models/` | Auto-generated from the MP API |
| `src/lib/providers/ministry-platform/scripts/` | Dev-only codegen, run manually; failures are immediately visible |
| `src/components/ui/` | Thin shadcn/Radix wrappers - testing them asserts that Radix works |

Feature components (`*.tsx`) and app routes are **not** excluded, and as of
2026-09-12 they are no longer ungated either - see the thresholds below.

### Thresholds

`coverage.thresholds` gates coverage per glob. A breach fails the run with
`ERROR: Coverage for statements (X%) does not meet "<glob>" threshold (Y%)` and a
non-zero exit code.

| Glob | Stmts | Branch | Funcs | Lines |
|---|---|---|---|---|
| `src/app/**` | 95 | 90 | 95 | 95 |
| `src/components/**/*.tsx` | 95 | 90 | 95 | 95 |
| `src/services/**` | 95 | 90 | 95 | 95 |
| `src/lib/**/*.ts` | 95 | 85 | 90 | 95 |
| `src/components/**/actions.ts` | 95 | 85 | 95 | 95 |
| `src/contexts/**` | 95 | 85 | 95 | 95 |
| `src/proxy.ts` | 100 | 100 | 100 | 100 |
| **global** (bare keys) | 98 | 95 | 97 | 98 |

Two mechanics worth knowing before editing these:

- **A glob aggregates its matching files into one number**, it does not check
  them per-file (`thresholds.perFile` would change that). `contact-lookup-search.tsx`
  sits at 92.3% statements and the `src/components/**/*.tsx` gate still passes,
  because the glob's aggregate is 98.9%.
- **The bare `statements`/`branches`/`functions`/`lines` keys are a global gate
  over every included file, not a fallback for files no glob matched.** Vitest's
  `resolveThresholds` builds the global map from *all* files - the source comment
  reads `// Global threshold is for all files, even if they are included by glob
  patterns`. That global gate is the backstop that catches a new, entirely
  untested file: a per-glob gate alone cannot, since one new file is diluted by
  everything already covered in its glob.

Keep branch gates loose where the denominator is small - `src/app/**` has only 10
branches in total, so a single uncovered one costs 10 points.

### Coverage snapshot (2026-09-12: 1015 tests, 59 files)

Whole app, as `npm run test:coverage` prints it - every `src/**/*.{ts,tsx}`
excluding generated models, codegen scripts, `src/components/ui/`, and test files.
Measured 2026-09-12 on `docs/release-readiness-refresh`, Vitest 4.1.11, run in
6.5s. (Not re-measured since; the suite is now 2035 tests in 85 files — see the
inventory below. The thresholds still gate every run.)

| Metric | Value |
|---|---|
| Statements | **99.74%** (1159/1162) |
| Branches | **97.21%** (593/610) |
| Functions | **99.31%** (291/293) |
| Lines | **99.91%** (1126/1127) |

This is now a single honest number. Earlier revisions of this doc quoted two
figures - a high non-UI one and a low whole-app one - because feature components
and app routes were untested; that split no longer exists.

Everything the report still flags, file by file - all deliberate, all defensive
or unreachable:

| File | Uncovered | Why |
|---|---|---|
| `contact-logs.tsx` | 232 | `if (!editingLog) return;` in the update handler. Every path that clears `editingLog` also closes the dialog in the same update, so the form cannot submit from a render where it is null. |
| `lib/auth.ts` | 408 | The one-line arrow delegating to `enrichSessionUser`; better-auth closes over it. |
| `client.ts` | funcs 75% | The token-getter closure handed to `HttpClient`. |
| `app/api/auth/[...all]/route.ts` | 53-57 | The non-`/api/auth` and empty-path arms of `relativeAuthPath`; Next only routes `/api/auth/*` here. |
| `contact-logs/actions.ts` | 64 | The non-`Error` arm of the `getContactLogTypes` catch wrapper. |
| `authorizationService.ts` | 299 | The `decision.reason ?? "no_security_role"` fallback; `hasSecurityRole` always sets a reason on a denial. |

`http-client.ts:31` is no longer in this list - the GET error-message builder was
covered when `http-client.test.ts` grew to 32 tests.

And the unreachable branches:

- `helper.ts:189,273` - the `String(validationError)` arm of a validation-error
  message; Zod always throws an `Error`.
- `contact-logs.tsx:95,134` and `domainTimezoneService.ts:237` - `hour === "24"`
  guards. Verified on Node 24.18 / current ICU: `Intl.DateTimeFormat("en-CA",
  { hour12: false })` returns `"00"` at midnight, never `"24"`. Dead here, kept
  as a cross-ICU safeguard.
- `contact-logs.tsx:387` - an error arm for a `z.string().optional()` field only
  ever written via `setValue` with a string.
- `user-menu.tsx:35` - the false arm of `if (action === "signout")`.
  `userMenuItems` is a module-level constant with exactly one entry, whose action
  is `"signout"`.

### Defects found while covering the UI - all four now fixed

Covering this code surfaced four real defects. They were first landed as tests
*pinning* the broken behaviour, then fixed in a follow-up; the notes below are
kept because each fix has a trap that invites a well-meaning revert.

1. **`formatDateTime()` could take down the whole page.** It threw
   `RangeError: Invalid time value` on any `Contact_Date` its regex missed and
   `new Date()` could not parse (`""`, `" "`, `"not-a-date"`). It is called
   unguarded during row render and, at the time, **the app had no error boundary
   anywhere** - no `error.tsx`, no `global-error.tsx`, no `ErrorBoundary` in
   `src/` - so the throw escaped `ContactLogs` and hit Next's default global
   error screen. (Boundaries were added afterwards; see § Error boundaries. The
   guard still matters - a boundary contains the blast radius, it does not make
   the row render.) Now guarded at both entry and the `new Date()` fallback,
   returning `"—"`. The DTO
   was deliberately *not* widened to `string | null`: MP's generated model has
   `Contact_Date: string` / `z.string().datetime()`, a NOT NULL column, so this is
   defence-in-depth at the formatting boundary, not a type correction. Fixing it
   also made `handleEditClick`'s `: ""` arm reachable for the first time.
2. **`contact-lookup-search.tsx` never cleared stale results.** The empty-query
   early return in `handleSearch` was dead code, because `performSearch` applied
   the same guard first. After a search, clearing the box and pressing Enter left
   the previous results and count on screen. `performSearch` now passes the empty
   term through. Note the button path's safety now rests *entirely* on the
   `disabled` attribute, since `performSearch` no longer guards - there is a test
   pinning that.
3. **A failed sign-out was silent.** `handleItemClick` had no `try/catch`, so a
   rejected `handleSignOut` escaped as an unhandled rejection on the app's only
   sign-out path. **The fix has a live trap:** `handleSignOut` ends in
   `redirect()`, and in Next 16 the server-action reducer explicitly rejects the
   action promise with the `NEXT_REDIRECT` error
   (`router-reducer/reducers/server-action-reducer.js`: *"If the action triggered
   a redirect, the action promise will be rejected with a redirect so that it's
   handled by RedirectBoundary"*). A plain `try/catch` therefore alerts
   `Error: NEXT_REDIRECT` on every **successful** sign-out - verified by deleting
   the guard and watching the test fail with exactly that string. `unstable_rethrow(err)`
   must stay the first statement in the catch. There is a test asserting a
   successful sign-out is silent and one asserting the signal is re-thrown.
4. **`dynamic-breadcrumb.tsx` had no label mapping**, so a contact GUID rendered as
   `Ab12cd34 ef56 7890 abcd ef1234567890`. Now a known-segment label map plus an
   anchored GUID pattern that renders `Details`. Two deliberate choices: the map is
   a `Map`, not an object literal, because the key is a raw URL segment and
   `/constructor` against a plain object would return an inherited
   `Object.prototype` member as the label; and the GUID pattern is *not* restricted
   to the RFC-4122 v4 form, because MP GUIDs are not guaranteed to be v4 and a
   stricter pattern would fail open on a legitimate id. A GUID renders as the
   generic `Details` rather than the contact's name because the component is
   mounted by the layout, which has no access to page data - resolving the name
   needs a context provider, not a better regex.

## Error boundaries

Three boundaries, added 2026-09-13. Placement is the whole design, so it is worth
stating why each exists rather than collapsing them into one:

| File | Catches | Renders inside |
|---|---|---|
| `src/app/(web)/error.tsx` | anything thrown below the `(web)` layout | the app shell - Header, avatar, user menu, **sign-out** all survive |
| `src/app/error.tsx` | `/signin`, `/session-error`, `/auth-error` | the root layout, bare (those routes have no shell) |
| `src/app/global-error.tsx` | a throw in the root `layout.tsx` itself | nothing - it *replaces* the root layout |

`error.tsx` never wraps the layout of **its own** segment. That is why a single
boundary is not enough: `src/app/error.tsx` alone would replace the `(web)` shell
on any page error, taking the user's sign-out with it - the same trap
`/session-error` exists to avoid. And neither `error.tsx` catches a root-layout
throw, which is what `global-error.tsx` is for.

Things that will bite whoever edits these:

- **The prop is `retry`, not `reset`.** Next 16 renamed it. `reset()` still
  exists but only clears error state without re-fetching. A boundary wired to a
  stale-named prop renders fine and its button silently does nothing, so each
  boundary has a test asserting `retry` is called.
- **They log identifiers only - never `error.message`.** These boundaries sit
  above components that render pastoral notes, names and emails, so a render
  error's message is not guaranteed content-free the way a controlled catch
  block's is. Each has a test that fails if a message ever reaches the log, and
  the structured event is `ui.render.error` with `{ boundary, name, digest }`.
  See § Logging policy in `.claude/references/auth.md`.
- **`global-error.tsx` imports nothing from the app** (a test enforces this by
  reading the source), styles inline, and sets its title with React's `<title>`
  rather than a `metadata` export, which a client component cannot have. Inline
  styles are safe *only* because the CSP is `style-src 'self' 'unsafe-inline'`
  with no nonce - see `.claude/references/security-headers.md`. A nonce-based
  `style-src` would silently drop every one of them.

### Testing them

- **React 19 hoists `<html>`, `<body>` and `<title>` out of the render
  container.** After `render(<GlobalError />)`, `container.querySelector("html")`
  is `null` and the first child is the inner `<div>`, even though the component
  returns them. Assert that structural contract with `renderToStaticMarkup` from
  `react-dom/server`, which emits the real tags. (`document.title` *is* set, so
  the title is asserted there.)
- **You cannot call these components as plain functions** the way `layout.test.tsx`
  does - they use `useEffect`, and hooks need a real render.
- **`readFileSync(new URL("./x.tsx", import.meta.url))` fails under Vitest** with
  `The URL must be of scheme file`; `import.meta.url` is not a file: URL there.
  Use a cwd-relative path.
- shadcn's `CardTitle` renders a `<div>`, not a heading, so the `(web)` boundary
  is matched on text rather than `getByRole("heading")`.

## Test File Inventory

Per-file counts below are from `npx vitest run --reporter=json` on 2026-09-29
(both projects; `scripts/` paths are repo-relative, the rest are under `src/`).
They sum to 2035.

| Test File | Tests | What It Covers |
|-----------|-------|----------------|
| `app/api/auth/[...all]/route.test.ts` | 118 | Route allowlist (deny-by-default), `/sign-in/social` body-key filter, strict raw-header Content-Type check (NBSP), body size cap (declared and streamed), `callbackURL` ≤ 2048 (F12), `Cache-Control: no-store` on every response, `toNextJsHandler` wiring |
| `lib/providers/ministry-platform/utils/http-client.test.ts` | 100 | HTTP verbs, URL building, form data, error handling; per-request timeouts, `redirect: "error"`, JSON Content-Type check, `buildUrl` endpoint guard (`..`, `?`, `#`, `\`, encoded separators, control chars), GUID-redacted errors |
| `auth.test.ts` | 81 | `enrichSessionUser` (`userId` only; `token`/`ipAddress`/`userAgent` withheld), cached User_ID resolution, OAuth config guards, `getUserInfo` id_token↔userinfo `sub` binding (F12), disabled paths incl. `/link-social` — runs on the verified (`requireIdTokenVerification`) path |
| `services/contactLogService.test.ts` | 80 | Contact log CRUD, service-layer read/write gate, field allowlists, `Made_By` kept on update, date conversion, Zod validation, filter-injection regression guard |
| `lib/providers/ministry-platform/services/file.service.test.ts` | 76 | All 8 file endpoints, multipart bodies, unauthenticated blob fetch (timeout, no redirects), ID/GUID validation, unique IDs kept out of errors and logs |
| `lib/providers/ministry-platform/utils/filter-sanitize.test.ts` | 68 | Quote doubling, LIKE escaping, GUID rejection, numeric-ID validation |
| `app/signin/page.test.tsx` | 65 | `signIn.social({ provider: "ministry-platform" })`, `callbackUrl` fallbacks and open-redirect sanitizing on both sinks (F3/F3b: tab/CR/LF, backslash, control chars, encoded separators), already-signed-in bounce, `isRedirecting` latch |
| `lib/providers/ministry-platform/helper.test.ts` | 65 | MPHelper CRUD, validation, procedures (deny-all default, `allowedProcedures`), communications with a required sender, files |
| `scripts/setup-env.test.ts` | 64 | (`scripts` project) setup's `.env.local` writer: values quoted/escaped and round-tripped through `@next/env`, exact-key replace, invalid keys/values refused, file written 0600 |
| `components/contact-logs/actions.test.ts` | 61 | Contact log create/update/delete actions, security-role gate on reads AND writes, argument guards, field allowlists, ownership policy, numeric-ID injection rejection |
| `lib/security-headers.test.ts` | 57 | Static header values (framing, sniffing, referrer, permissions, COOP/CORP, HSTS in production only), `originOf` (non-http(s) schemes and unsafe hostnames → null), nonce generation, every CSP directive incl. `base-uri 'none'`, enforce vs report-only |
| `services/authorizationService.test.ts` | 57 | MP security-role gate for reads and writes, `hasSecurityRole`, fail-closed default when no role policy is configured (`roles_not_configured`, `mp.authz.config` warn-once), explicit `*` = any role, `","` treated as unset, `MP_SECURITY_ROLES` + deprecated `MP_WRITE_SECURITY_ROLES` fallback, `mp.read.unauthorized` / `mp.write.unauthorized` denials, no cross-request caching |
| `lib/providers/ministry-platform/services/communication.service.test.ts` | 56 | Email/SMS JSON vs multipart paths, trusted sender stamped over payload `author`/`from`/`FromAddress` |
| `proxy.test.ts` | 56 | Route protection (public paths incl. `/signed-out`, `/api` exact + anchored matcher, cookie presence only), the per-request CSP nonce forwarded on request headers, enforce vs report-only, MP origins in `img-src` / `form-action`, matcher pattern |
| `components/sign-in/sign-in.test.tsx` | 49 | `sanitizeCallbackUrl` unit tests: hostile and benign lists, C1/lowercase-encoded cases, raw (not URL-normalized) return, origin/throw backstops |
| `lib/providers/ministry-platform/services/table.service.test.ts` | 48 | TableService CRUD, table-name identifier validation, ID validation |
| `components/contact-logs/contact-logs.test.tsx` | 40 | Delete-confirmation gate, form validation, error surfacing (MP write path), edit/cancel paths, in-flight double-write guard, log-type colour arms, MP wall-clock date rendering, unparseable-date placeholder (one bad row must not blank the list) |
| `lib/env.test.ts` | 38 | `getMpBaseUrl` (https only, loopback http outside production, normalized, value never echoed) and `getAuthBaseUrl` (required, origin only, `NEXTAUTH_URL` fallback, loopback http in any env) |
| `lib/providers/ministry-platform/scripts/generate-types.test.ts` | 38 | Codegen escaping: comment terminators, control characters, backticks, field-name string literals, type-name sanitizing |
| `lib/providers/ministry-platform/services/procedure.service.test.ts` | 34 | Procedure listing and execution, identifier validation, per-segment encoding |
| `services/contactService.test.ts` | 31 | Contact search (LIKE escaping, 100-char cap), getByGuid, `updateContact` field allowlist, service-layer read/write gate (F10) |
| `lib/providers/ministry-platform/client.test.ts` | 30 | OAuth token management: single-flight refresh, token-response validation, lifetime clamp (30 s–1 h), negative cache after a failed fetch, 401 → invalidate, refresh and retry once |
| `lib/providers/ministry-platform/services/guards.test.ts` | 30 | `sanitizeIdentifier` (plain identifiers, ≤ 128) and `errorName` (class name only, never the message) |
| `lib/providers/ministry-platform/provider.test.ts` | 28 | Provider delegation to all six sub-services, sender threaded through to communications |
| `components/contact-lookup-details/actions.test.ts` | 27 | Contact details + log type mapping, security-role read gate, numeric-ID injection rejection |
| `auth.code-flow.test.ts` | 25 | The real authorization-code flow against `mock-oidc`: authorize request (state, redirect URI, no nonce/PKCE), happy-path callback, state validation (missing, mismatched, cookie-less, tampered, expired — refused before the code is redeemed), id_token and sub-binding refusals |
| `app/auth-error/page.test.tsx` | 24 | OAuth-failure landing page, known codes mapped to fixed messages, unrecognized codes get the generic one, `error_description` never rendered |
| `auth.secret-guard.test.ts` | 24 | `assertAuthEnvironment`: missing, empty, default, short (< 32) or overridden secret refused at import; `TEST` flag; auth-critical URLs validated at module load; the secret never in the message |
| `lib/providers/ministry-platform/auth/client-credentials.test.ts` | 24 | Client-credentials token grant: timeout, `redirect: "error"`, Content-Type and token-shape checks, status in errors, no body in logs |
| `components/layout/header.test.tsx` | 23 | App-title env fallback, profile-loading state, bar/hamburger/sidebar stay rendered while `useUser()` is suspended (only the avatar suspends), `HeaderSkeleton` matches the fixed h-16 bar, avatar vs icon fallback, the tooltip chain (incl. falling back to `mpEmail`, never the synthetic session email), sidebar open/close ownership |
| `auth.ip-address.test.ts` | 21 | `AUTH_IP_ADDRESS_HEADERS` / `AUTH_TRUSTED_PROXIES` parsing and the client IP resolved per host (Cloudflare, Azure, Vercel, appending proxy); rate-limit buckets key on it |
| `services/domainTimezoneService.test.ts` | 20 | Windows-to-IANA mapping, DST, round-tripping, cache |
| `components/contact-lookup/contact-lookup-search.test.tsx` | 19 | Empty query clears results without calling the action, in-flight lock via the disabled button, Enter vs button submit, action rejection surfaced |
| `components/contact-lookup-details/contact-lookup-details.test.tsx` | 18 | Suspense pending/resolved states, MP photo URL, nickname + initials fallbacks, `N/A` placeholders, props handed to ContactLogs |
| `components/user-menu/user-menu.test.tsx` | 18 | Radix trigger opens on pointerDown, sign-out fires once, `onClose` ordering, degenerate-profile sign-out, failed sign-out alerts, successful sign-out stays silent, NEXT_REDIRECT re-thrown not alerted |
| `components/layout/dynamic-breadcrumb.test.tsx` | 16 | Mapped route labels, GUID leaf renders `Details` (any case), GUID-ish segments must NOT match, crude fallback retained, doubled/trailing slashes, all three `customSegments` shapes |
| `lib/providers/ministry-platform/services/domain.service.test.ts` | 16 | Domain info and global filters |
| `components/contact-lookup/actions.test.ts` | 15 | Search contacts action, security-role read gate, denial not flattened into a generic error |
| `components/contact-lookup/contact-lookup-results.test.tsx` | 15 | Empty state, row rendering with missing optional fields, row navigation |
| `components/user-menu/actions.test.ts` | 15 | Sign-out + OAuth end-session redirect with `client_id` and `id_token_hint`, refuses a malformed MP URL |
| `services/userService.test.ts` | 14 | User profile lookup (self only: any GUID but the session's own is refused), GUID + User_ID validation |
| `app/(web)/contactlookup/[guid]/page.test.tsx` | 13 | Next.js 16 async `params` await, promises passed down unresolved for streaming, `Contact_ID` guard, rejection propagation |
| `app/(web)/layout.test.tsx` | 13 | `AuthWrapper` is an ancestor of the page and sits outside `ServerProviders`; Header-in-Suspense with `HeaderSkeleton` as the fallback; both metadata title branches |
| `components/layout/sidebar.test.tsx` | 13 | Nav label+href pairs, entries are `next/link` (no document reload), drawer + Dashboard render while the profile is pending, `onClose` from X and from a nav link, panel stays mounted when closed, Contact Lookup hidden/shown by `canAccessContactFeatures` (fails closed) |
| `components/shared-actions/user.test.ts` | 13 | `getCurrentUserProfile` maps to the six-field `CurrentUserProfile`, server-computed `canAccessContactFeatures`, role-less users keep their profile |
| `scripts/check-prerender.test.ts` | 13 | (`scripts` project) CI prerender guard: only `/_not-found` and `/_global-error` may be static; exit codes |
| `auth.origin-check.test.ts` | 12 | The real instance enforces the origin check under `NODE_ENV=test`; cross-site `callbackURL`/Origin refused; negative controls (`disableOriginCheck`, `trustedOrigins: ["*"]`) go green, proving the test can fail |
| `components/contact-lookup/contact-lookup.test.tsx` | 12 | Search-to-results state wiring, error and empty propagation, emptying the box clears stale results |
| `services/sessionContextService.test.ts` | 12 | Acting-user resolution, `mp.write.non_user` warning, Next control-flow errors rethrown |
| `auth.discovery-rebuild.test.ts` | 11 | Boot-time discovery failure self-heals: rebuild on sign-in/callback after the 30 s cooldown, single-flight, only sign-in/callback trigger it, `auth.discovery.rebuild` outcomes, a healthy instance is never rebuilt |
| `auth.id-token-sign-in.test.ts` | 11 | F12 end to end: real `auth` against a mocked MP OIDC provider with RS256-signed id_tokens; the `hooks.before` refusal over HTTP and in-process, and the `sub` binding alone with the hook removed (node environment) |
| `contexts/user-context.test.tsx` | 11 | Server-started promise exposed without a client refetch, suspend/resolve/reject, server re-render swaps the promise, refresh stays inside a transition (no fallback mid-reload) |
| `app/(web)/contactlookup/layout.test.tsx` | 9 | Page-layer role gate: renders children for a role-holder, `redirect("/no-access")` for every denial reason, MP failure surfaces instead of redirecting |
| `app/global-error.test.tsx` | 9 | Renders its own html/body (via `renderToStaticMarkup`), sets `document.title` with no metadata export, imports no app code |
| `components/sign-in/sign-in-attempts.test.ts` | 9 | `/signin` automatic-restart cap: attempts per window, future timestamps ignored, never blocks sign-in when storage throws |
| `components/user-menu/sign-out-button.test.tsx` | 9 | `SignOutButton` / `signOutEverywhere`: broadcasts before `handleSignOut`, rethrows the redirect signal, returns a real failure's message |
| `app/(web)/error.test.tsx` | 8 | Shell boundary: retry is called, digest shown as a reference code, and the error message reaches neither the log nor the page |
| `auth.oidc-hardening.test.ts` | 8 | `requireIdTokenVerification` (partial discovery takes the provider down), id_token `exp`/`aud`/`azp` checks through the code flow, `session_data` is JWE, `/get-session` key sets (no token, IP, UA) |
| `auth.session-lifetime.test.ts` | 8 | Clock walk: 12 h absolute cap, no sliding, a cookie pair copied before sign-out dies within 1 h; negative control with the pre-fix config |
| `components/layout/session-guard.test.tsx` | 8 | `SessionGuard`: leaves for `/signed-out` (not `/signin`) when the session ends, no redirect before first session or mid-refetch, clears the sign-in restart counter, cross-tab broadcast re-check |
| `lib/providers/ministry-platform/helper.wiring.test.ts` | 8 | Real MPHelper → provider → services with mocked HTTP: trusted sender overrides spoofed payload fields, old call shape refused, procedure allowlist per instance (default deny), no `$ignorePermissions` forwarded |
| `lib/providers/ministry-platform/services/metadata.service.test.ts` | 8 | Metadata refresh, table listing |
| `app/(web)/page.test.tsx` | 7 | Demo tile mounted in Suspense and omitted without access; page stays synchronous and prop-less (no MP fetch) |
| `app/error.test.tsx` | 7 | Root boundary for the shell-less recovery routes: retry, and a plain `/signin` link that does not depend on retrying |
| `contexts/sign-out-broadcast.test.ts` | 7 | Cross-tab sign-out over a dedicated `BroadcastChannel`; no-op without one; a failed post never fails sign-out |
| `lib/next-config-headers.test.ts` | 7 | The static headers are actually attached to `/(.*)` in `next.config.ts`, and no CSP is set there — the nonce-based one is per-request in `src/proxy.ts` |
| `lib/utils.test.ts` | 7 | `cn()` Tailwind class merging |
| `app/providers.test.tsx` | 6 | Children nested inside `UserProvider`, not beside it; `profilePromise` forwarded as-is |
| `components/home-demos/contact-lookup-demo-card.test.tsx` | 6 | Dashboard tile renders only with `canAccessContactFeatures === true`, `/contactlookup` href, fails closed on a null/flagless profile |
| `app/(web)/no-access/page.test.tsx` | 5 | Explains the missing security role, names the administrator, no link or auto-redirect that would loop back into the gate |
| `app/server-providers.test.tsx` | 5 | One un-awaited profile load per render, `undefined` → `null`, rejection passed through |
| `app/session-error/page.test.tsx` | 5 | Sign-out is a real submit inside `<form action>` and actually invokes the action |
| `app/signed-out/page.test.tsx` | 5 | `/signed-out`: public, never starts OAuth or reads the session, plain link to `/signin`, opts out of prerendering |
| `auth.session-config.test.ts` | 5 | Exactly two session cookies with pinned attributes, `__Secure-` over https, `expiresAt` = sign-in + 12 h, `session_data` holds better-auth session + user only |
| `auth.shared-instance.test.ts` | 5 | One `auth` per process across module copies (route and server-action layers), so sign-out has the id_token for `id_token_hint`; fresh instance under Vitest |
| `auth.user-oauth-tokens.test.ts` | 5 | No `offline_access`, no `account_data` cookie, no access/refresh token retained in memory; `id_token` kept for sign-out |
| `components/shared-actions/domain.test.ts` | 5 | `getMpTimezone` delegation and its authenticated-session check (F11) |
| `app/layout.test.tsx` | 4 | `<html lang>`/`<body>` pair, children pass through by identity (no wrapping) |
| `auth.rate-limit.test.ts` | 4 | Sign-in rate limiting with the app config: shared bucket when unconfigured, per-client with IP headers or trusted proxies, invalid entry fails at startup |
| `components/layout/auth-wrapper.test.tsx` | 4 | Auth gating wrapper (authentication only — no role check) |
| `lib/auth-client.test.ts` | 4 | Client plugin wiring (`customSessionClient`, `signIn.social`) |
| `app/(web)/contactlookup/page.test.tsx` | 3 | Mounts `<ContactLookup>` with zero props, keeping the client shell a leaf |
| `auth.user-id-cache.test.ts` | 3 | 15-minute User_ID cache TTL; attribution dropped within one TTL once the `dp_Users` login is gone |
| `app/(web)/home/page.test.tsx` | 2 | Unconditional redirect to `/`, never looping back to `/home` |
| `contexts/session-context.test.tsx` | 2 | `useAppSession` wrapper |
| **Total** | **2035** | 85 files |

Shared helper (not a test file): `src/test-utils/mock-oidc.ts` — a mock MP OIDC provider (discovery, JWKS, token, userinfo; RS256 id_tokens) behind a stub `fetch` that **throws on any URL it does not serve**, so no auth test can reach a real Ministry Platform. Install it inside `vi.hoisted` (better-auth runs discovery when the instance is built) and use it from `// @vitest-environment node` suites. `auth.test.ts`, `auth.ip-address.test.ts` and `auth.user-id-cache.test.ts` run on it, on the verified (`requireIdTokenVerification: true`) path.

## Ministry Platform Safety in Tests

Per CLAUDE.md, no test may reach a real MP instance. Every suite mocks at a
boundary above the network:

- `HttpClient` is mocked for all sub-service tests
- `MPHelper` is mocked as a class for all service and action tests
- Direct `fetch` callers are covered by `vi.stubGlobal('fetch', ...)`
- **Component tests mock the co-located `./actions` module wholesale.** A
  component test must never import a real `'use server'` action - that module
  reaches MP through a service singleton. This is why `contact-logs.test.tsx`,
  `contact-lookup*.test.tsx`, and `user-menu.test.tsx` all open with
  `vi.mock("./actions", ...)`, and why `user-menu.test.tsx` does *not* mock
  `@/lib/auth-client`: sign-out there is a server action, not a client call.

This matters most for `communication.service.test.ts` (sends real email/SMS in
production), `procedure.service.test.ts` (stored procedures can mutate data), and
`file.service.test.ts` / `table.service.test.ts` (writes and deletes).

## Deferred Issues

Defects and refactors found while testing are documented one-per-file in
`.claude/TODO/`, not fixed silently. **Every test-derived TODO is now closed** —
filter injection via numeric IDs, the two unauthenticated `'use server'` actions,
the missing authorization gate, the `SessionContextService` refactor, the N+1
lookup, the token lifetime, and the untested contact-log component. See
`.claude/docs/TestCoverage.md` §5 and §6 for each one. `.claude/TODO/` holds a
single open item, `investigate-setup-check-stale-model-detection.md`, which is a
setup-wizard issue with no bearing on the suite.

Five test files still carry `Regression guard for .claude/TODO/<x>.md` comments
naming TODO files that have since been deleted (`mp-filter-injection-numeric-ids.md`,
`n-plus-1-contact-log-types-lookup.md`, `contact-logs-component-untested.md`).
The assertions are correct; only the breadcrumbs are dangling.

Those assertions are now specifications rather than snapshots — `should NOT
delete when the caller holds no security role` and `should permit editing a log
made by a different user` would each fail under a different policy, which is the
point. If a new TODO ever pins behavior it proposes changing, keep the comment
naming it so the next person knows the assertion is a snapshot of today's
behavior.

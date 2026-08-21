# Testing Reference Guide

This document provides detailed context about the testing setup, patterns, and conventions for LLM assistants working on the MPNext project.

## Overview

MPNext uses **Vitest** with **jsdom** environment, **@testing-library/react** for component/hook tests, and **v8** for coverage reporting.

### Configuration

| File | Purpose |
|------|---------|
| `vitest.config.ts` | Test runner config (jsdom, globals, coverage, path aliases) |
| `src/test-setup.ts` | Global setup: mocked env vars + `@testing-library/jest-dom` |

### Commands

```bash
npm test              # Watch mode
npm run test:run      # Single run (CI)
npm run test:coverage # Single run + v8 coverage report
```

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

### Mocking Auth + Headers (server actions)

Most server actions require `auth.api.getSession()` and `headers()`:

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
const result = await enrichSessionUser({ id: 'ba', name: 'John Doe' }, session);
expect(result.user.firstName).toBe('John');
```

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

function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <UserProvider>{children}</UserProvider>;
  };
}

it('should load profile', async () => {
  const { result } = renderHook(() => useUser(), { wrapper: createWrapper() });

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });

  expect(result.current.userProfile).toEqual(mockProfile);
});
```

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

`vitest.config.ts` sets `coverage.include: ['src/**/*.{ts,tsx}']`. Without an
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

Feature components (`*.tsx`) and app routes are **not** excluded. They stay
visible in the report at their real (mostly 0%) numbers; they are simply not
gated by a threshold.

### Thresholds

`coverage.thresholds` gates non-UI functional code per glob - services, the MP
provider, server actions, contexts, and auth/proxy plumbing. A breach fails the
run with `ERROR: Coverage for statements (X%) does not meet "<glob>" threshold (Y%)`
and a non-zero exit code.

| Glob | Stmts | Branch | Funcs | Lines |
|---|---|---|---|---|
| `src/services/**` | 95 | 90 | 95 | 95 |
| `src/lib/**/*.ts` | 95 | 85 | 90 | 95 |
| `src/components/**/actions.ts` | 95 | 85 | 95 | 95 |
| `src/contexts/**` | 95 | 85 | 95 | 95 |
| `src/proxy.ts` | 100 | 100 | 100 | 100 |

### Current coverage (419 tests, 30 files)

Non-UI functional code - every `src/**/*.ts` plus `src/contexts/*.tsx`, excluding
generated models, codegen scripts, and test files (760 statements):

| Metric | Value |
|---|---|
| Statements | **99.47%** (756/760) |
| Branches | **95.49%** (297/311) |
| Functions | **98.20%** (164/167) |
| Lines | **99.72%** (738/740) |

Whole-app figure as `npm run test:coverage` prints it (1058 statements, including
untested feature components and app pages): **71.45%** statements. Both numbers
are honest; they differ only in denominator. Quote the one whose scope you mean.

Known remaining gaps in non-UI code, all deliberate:

Only four statements remain uncovered:

- `app/api/auth/[...all]/route.ts` - a one-line `toNextJsHandler(auth)` re-export
- `lib/auth.ts:198` - the one-line arrow delegating to `enrichSessionUser`
- `client.ts` - the token-getter closure passed into `HttpClient`
- `http-client.ts:31` - one arm of the GET error-message builder

Plus two branch gaps that are unreachable without a fake schema:
`helper.ts:189,273`, the `String(validationError)` arm of a validation-error
message - Zod always throws an `Error`.

## Test File Inventory

| Test File | Tests | What It Covers |
|-----------|-------|----------------|
| `lib/providers/ministry-platform/helper.test.ts` | 54 | MPHelper CRUD, validation, procedures, files |
| `lib/providers/ministry-platform/services/file.service.test.ts` | 35 | All 8 file endpoints, multipart bodies, unauthenticated blob fetch |
| `lib/providers/ministry-platform/utils/http-client.test.ts` | 28 | HTTP verbs, URL building, form data, error handling |
| `auth.test.ts` | 25 | `enrichSessionUser`, cached User_ID resolution, OAuth config guards |
| `components/contact-logs/actions.test.ts` | 24 | Contact log CRUD actions, auth and argument guards |
| `lib/providers/ministry-platform/provider.test.ts` | 24 | Provider delegation to all six sub-services |
| `lib/providers/ministry-platform/services/table.service.test.ts` | 21 | TableService CRUD |
| `services/contactLogService.test.ts` | 21 | Contact log CRUD, date conversion, Zod validation |
| `lib/providers/ministry-platform/utils/filter-sanitize.test.ts` | 20 | Quote doubling, LIKE escaping, GUID rejection |
| `services/domainTimezoneService.test.ts` | 18 | Windows-to-IANA mapping, DST, round-tripping, cache |
| `lib/providers/ministry-platform/services/procedure.service.test.ts` | 16 | Procedure listing and execution, name encoding |
| `lib/providers/ministry-platform/services/communication.service.test.ts` | 13 | Email/SMS JSON vs multipart paths |
| `lib/providers/ministry-platform/client.test.ts` | 12 | OAuth token management |
| `services/contactService.test.ts` | 12 | Contact search, getByGuid, updateContact |
| `components/contact-lookup-details/actions.test.ts` | 11 | Contact details + log type mapping |
| `services/sessionContextService.test.ts` | 10 | Acting-user resolution, `mp.write.non_user` warning |
| `contexts/user-context.test.tsx` | 8 | UserProvider + useUser lifecycle |
| `lib/providers/ministry-platform/services/domain.service.test.ts` | 8 | Domain info and global filters |
| `lib/providers/ministry-platform/services/metadata.service.test.ts` | 8 | Metadata refresh, table listing |
| `proxy.test.ts` | 8 | Route protection (public paths, session, errors) |
| `lib/utils.test.ts` | 7 | `cn()` Tailwind class merging |
| `services/userService.test.ts` | 6 | User profile lookup |
| `components/contact-lookup/actions.test.ts` | 5 | Search contacts action |
| `components/user-menu/actions.test.ts` | 5 | Sign-out + OAuth end session redirect |
| `lib/providers/ministry-platform/auth/client-credentials.test.ts` | 5 | Client-credentials token grant |
| `components/layout/auth-wrapper.test.tsx` | 4 | Auth gating wrapper |
| `lib/auth-client.test.ts` | 4 | Client plugin wiring (`customSessionClient`, `signIn.social`) |
| `components/shared-actions/domain.test.ts` | 3 | `getMpTimezone` delegation |
| `components/shared-actions/user.test.ts` | 2 | `getCurrentUserProfile` delegation |
| `contexts/session-context.test.tsx` | 2 | `useAppSession` wrapper |
| **Total** | **419** | |

## Ministry Platform Safety in Tests

Per CLAUDE.md, no test may reach a real MP instance. Every suite mocks at a
boundary above the network:

- `HttpClient` is mocked for all sub-service tests
- `MPHelper` is mocked as a class for all service and action tests
- Direct `fetch` callers are covered by `vi.stubGlobal('fetch', ...)`

This matters most for `communication.service.test.ts` (sends real email/SMS in
production), `procedure.service.test.ts` (stored procedures can mutate data), and
`file.service.test.ts` / `table.service.test.ts` (writes and deletes).

## Deferred Issues

Defects and refactors found while testing are documented one-per-file in
`.claude/TODO/`, not fixed silently. Several are cases where a fully covered file
is still wrong - most notably numeric IDs interpolated into MP filters without
sanitization, and two `'use server'` actions with no session check at all. See
`.claude/TODO/` and `.claude/docs/TestCoverage.md`.

Tests that pin behavior a TODO proposes changing carry a comment naming the TODO
file, so the next person knows the assertion is a snapshot of today's behavior
rather than a specification.

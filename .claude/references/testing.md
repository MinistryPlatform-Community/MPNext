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

Coverage uses the **v8** provider. Auto-generated model files are excluded.

```bash
# Run with coverage (also reports on failure)
npx vitest run --coverage --coverage.reportOnFailure
```

### Current Coverage (228 tests, 19 files)

| Layer | Stmts | Branch | Lines |
|-------|-------|--------|-------|
| Services | 97.29% | 86.48% | 97.27% |
| Server Actions | ~99% | ~90% | ~99% |
| Proxy | 100% | 100% | 100% |
| Contexts | 91.42% | 85.71% | 91.42% |
| MP Provider | 87.37% | 86.66% | 88.23% |
| **All files** | **95.39%** | **88.02%** | **95.74%** |

## Test File Inventory

| Test File | Tests | What It Covers |
|-----------|-------|----------------|
| `services/contactService.test.ts` | 10 | Contact search, getByGuid, updateContact |
| `services/contactLogService.test.ts` | 16 | Contact log CRUD, date conversion, Zod validation |
| `services/userService.test.ts` | 4 | User profile lookup |
| `services/toolService.test.ts` | 7 | Page data + user tools via stored procedures |
| `components/contact-lookup/actions.test.ts` | 5 | Search contacts action |
| `components/contact-logs/actions.test.ts` | 19 | Contact log CRUD actions with auth |
| `components/contact-lookup-details/actions.test.ts` | 10 | Contact details + log type mapping |
| `components/user-menu/actions.test.ts` | 3 | Sign-out + OAuth end session redirect |
| `components/user-tools-debug/actions.test.ts` | 4 | User tools with auth + MP lookup |
| `components/shared-actions/user.test.ts` | 2 | getCurrentUserProfile delegation |
| `proxy.test.ts` | 8 | Route protection (public paths, session, errors) |
| `lib/providers/ministry-platform/provider.test.ts` | 9 | Provider delegation to services |
| `contexts/user-context.test.tsx` | 6 | UserProvider + useUser hook lifecycle |
| `contexts/session-context.test.tsx` | 2 | useAppSession wrapper |
| `auth.test.ts` | 11 | Name splitting, session structure |
| `lib/providers/ministry-platform/helper.test.ts` | 54 | MPHelper CRUD, validation, procedures, files |
| `lib/providers/ministry-platform/client.test.ts` | 12 | OAuth token management |
| `lib/providers/ministry-platform/services/table.service.test.ts` | 20 | TableService CRUD |
| `lib/providers/ministry-platform/utils/http-client.test.ts` | 26 | HTTP methods, URL building, error handling |

## Known Issues

- **ContactLogService date conversion bug**: `createContactLog` and `updateContactLog` convert ISO dates to SQL Server format (`YYYY-MM-DD HH:MM:SS`) _before_ Zod validation, but `ContactLogSchema` uses `z.string().datetime()` which only accepts ISO format. The validation rejects the converted date. Tests document this behavior.

# Playbook: Port Ministry Platform Write Attribution Into This Repo

You are Claude Code running in a repo that integrates with **Ministry Platform** (MP). Another team has closed a class of audit-trail gaps where MP write APIs were called without `$userId`, so every change recorded against MP's audit log was attributed to the OAuth integration account rather than the user who performed it. This playbook ports that fix into the repo you're in.

**Outcome you're driving toward**

1. A `SessionContextService` singleton exists in this repo and is the only path through which write call sites obtain the acting user's MP `User_ID`.
2. Every domain service that creates, updates, or deletes records via `MPHelper.{createTableRecords,updateTableRecords,deleteTableRecords}` resolves an `actingUserId` via `SessionContextService.getActingUserIdForWrite(...)` and forwards it as `$userId` to MPHelper.
3. The acting user's MP `User_ID` is baked onto `session.user.userId` once per session by extending the auth library's session transform (Better Auth's `customSession` in the source repo), with an in-memory `userGuid → User_ID` cache so repeated `getSession()` calls don't hit MP.
4. Anonymous / unresolved writes do **not** throw. They proceed with no `$userId` and emit a stable structured log line (`event: "mp.write.non_user"`) so unattributed writes are visible in production observability (Vercel logs, log aggregators) and can be alerted on.
5. A reference doc `.claude/references/ministryplatform.writeattribution.md` is checked in.
6. `CLAUDE.md` cites the reference and includes a Key Development Practice rule pointing to it.
7. Tests cover the new service and assert `$userId` is forwarded on the authenticated path and omitted (with structured warn) on the anonymous path.

**Do not skip the discovery phase.** Auth libraries, session shapes, and MPHelper surfaces vary. The pattern is portable; the exact wiring is not.

## Background — the bug class you're preventing

MP's table write APIs accept an optional `$userId` query-string parameter. When present, MP records that `User_ID` as the actor in its audit log (`dp_Audit_Log` / `Domain_Audit_Items`). When absent, MP records the OAuth integration account as the actor — for every change made through the app.

Nothing breaks. The feature works. The bug is invisible from the UI. It only surfaces when someone tries to answer "who edited this record?" — at which point the audit log says "the API service account, every time" and the trail dead-ends.

A concrete example from the source repo: `ContactLogService.createContactLog` called `mp.createTableRecords("Contact_Log", [...])` with no third argument. `MPHelper.createTableRecords` typed `params?.{$select,$userId}` as optional. Result: every contact log entry created through the app was attributed in MP's audit log to the integration user, not the staff member who clicked "save." Same gap on `updateContactLog`, `deleteContactLog`, and `ContactService.updateContact`.

The fix has three pieces:

1. **A session-side resolver** that produces the acting user's MP `User_ID` from whatever identity the session already carries (e.g. `userGuid`), cached so it costs at most one MP lookup per user per process.
2. **A boundary service** (`SessionContextService`) that domain services call right before each MP write to get the `User_ID` for `$userId`, with structured logging when the result is null.
3. **A grep-and-fix pass** on every domain-service method that calls `createTableRecords` / `updateTableRecords` / `deleteTableRecords` / `uploadFiles` / `updateFile` / `deleteFile`.

The "graceful + log" contract is deliberate: the app may serve unauthenticated users in the future, and a hard-fail design would either block that or require adding override paths later. A logged-and-allowed anonymous write is honest about what happened; the production log line makes the gap visible to humans without breaking functionality.

## Phase 1 — Discovery

Before writing any code, answer these by reading the repo:

1. **Where does `MPHelper` live, and does it accept `$userId` on writes?**
   - In the source repo: `@/lib/providers/ministry-platform` exporting `MPHelper`, with `createTableRecords(table, records, params?)`, `updateTableRecords`, `deleteTableRecords` — each accepting `params?: { $select?, $userId?, ... }`.
   - In *this* repo it may be at a different path or expose writes via a different signature.
   - Find it: `grep -rn "createTableRecords\|updateTableRecords\|deleteTableRecords" src/lib src/providers`. Read the signature and confirm `$userId` is a legal parameter.
   - **Stop and ask the user** if `$userId` is not supported by this repo's MP wrapper. The fix needs SDK support before it can land at the call sites.

2. **What auth library is in use, and is `User_ID` already on the session?**
   - The source repo uses **Better Auth** with a `customSession` plugin (`src/lib/auth.ts`).
   - This repo may use Better Auth, NextAuth, Clerk, Auth.js, Lucia, or a custom JWT setup. Find the auth config: `grep -rn "betterAuth\|NextAuth\|clerkMiddleware\|jose\|jsonwebtoken" src/`.
   - Inspect the session shape. Look for a field that already holds the MP-side identifier — it might be `User_ID`, `userId`, `mp_user_id`, `User_GUID`, `userGuid`, `sub`, `oauth_sub`, or buried inside `session.user.app_metadata`.
   - If `User_ID` (numeric) is already on the session, **skip the customSession extension in Phase 2** and have `SessionContextService` read it directly.
   - If only a GUID/sub is on the session, you'll need to extend the session transform to resolve `User_ID` via MP (Phase 2).

3. **What is the session-augmentation hook called?**
   - Better Auth: `customSession(async ({ user, session }) => { ... }, options)`.
   - NextAuth: `callbacks.session` and/or `callbacks.jwt`.
   - Clerk / Lucia / custom: find the equivalent.
   - **The pattern is the same regardless:** at session creation / refresh, look up `User_ID` once, cache it, attach it to the session object. Adapt the hook syntax to whichever library is in use.

4. **Where do domain services live?** (e.g. `src/services/`, `src/lib/services/`, `app/services/`). Match the existing convention. These are where the write call sites are.

5. **Which testing framework?** Vitest or Jest. The source repo uses Vitest with `vi.hoisted()` and mocks `MPHelper` as a class with method properties. Adapt the mock setup to Jest if needed.

6. **Path alias.** Most repos use `@/*` for `src/*`. Verify in `tsconfig.json`.

7. **Enumerate every MP write call site.** Grep:
   ```
   grep -rn "createTableRecords\|updateTableRecords\|deleteTableRecords" src/ --include="*.ts" --include="*.tsx"
   grep -rn "uploadFiles\|updateFile\|deleteFile" src/services src/lib | grep -v ".test."
   grep -rn "executeProcedure\|createCommunication\|sendMessage" src/services src/lib | grep -v ".test."
   ```
   Exclude SDK internals (the `MPHelper` / `TableService` definitions themselves) and tests. The remaining hits are your fix sites. In the source repo this was four call sites across two files (`contactLogService.ts`, `contactService.ts`). In this repo it may be more or fewer.

8. **Is there already a partial fix in place?** Search for `$userId`, `actingUserId`, `currentUserId`, `getCurrentUser`. If someone has started this work, extend it — don't duplicate.

Write the answers down. Only proceed to Phase 2 when each question has an answer or has been raised with the user.

## Phase 2 — Extend the session transform to carry `User_ID`

Skip this phase if Phase 1 confirmed `User_ID` is already on `session.user`.

Otherwise: extend the auth library's session transform so `User_ID` rides along on every session. The shape below is **Better Auth** (the source repo's library). For NextAuth / others, port the same three moves — cache, resolve, attach — to the equivalent hook.

```ts
// src/lib/auth.ts (or wherever the auth config lives)
import { MPHelper } from "@/lib/providers/ministry-platform";
import { sanitizeGuid } from "@/lib/providers/ministry-platform/utils/filter-sanitize";

// Process-wide cache. The session transform runs on every getSession() call,
// so without this each request would do a dp_Users lookup. The userGuid →
// User_ID mapping is stable per user, so an unbounded Map is safe in practice.
const userIdCache = new Map<string, number>();

async function resolveMpUserId(userGuid: string): Promise<number | null> {
  const cached = userIdCache.get(userGuid);
  if (cached !== undefined) return cached;
  try {
    const mp = new MPHelper();
    const [record] = await mp.getTableRecords<{ User_ID: number }>({
      table: "dp_Users",
      filter: `User_GUID = '${sanitizeGuid(userGuid)}'`,
      select: "User_ID",
      top: 1,
    });
    if (record?.User_ID) {
      userIdCache.set(userGuid, record.User_ID);
      return record.User_ID;
    }
    return null;
  } catch (err) {
    // Never block session creation on this — the NonUser Write warning at
    // write time will surface the missing attribution.
    console.error("[customSession] resolveMpUserId failed", { userGuid, err });
    return null;
  }
}
```

Then inside the `customSession` (or equivalent) callback:

```ts
customSession(
  async ({ user, session }) => {
    const userGuid = (user as { userGuid?: string | null }).userGuid;
    const userId: number | null = userGuid
      ? await resolveMpUserId(userGuid)
      : null;
    return {
      user: {
        ...user,
        // ... any other transforms (name splitting, etc.)
        userId,
      },
      session,
    };
  },
  options,
),
```

**Notes:**
- The field name on the session that already carries the OAuth subject varies. In the source repo it's `userGuid` (set by Better Auth's `genericOAuth` plugin via `mapProfileToUser`). In NextAuth it might be `user.sub` or `token.sub`. Use whichever your Phase 1 investigation surfaced.
- If your session uses JWT cookie caching (Better Auth default, NextAuth with `strategy: "jwt"`), the resolved `userId` gets baked into the cookie and subsequent reads are free until the cookie expires.
- If your auth library lets you hook at sign-in only (rather than every session read), prefer that — it's even cheaper. The cache is still worth keeping for cold-start cases.

## Phase 3 — Create `SessionContextService`

Create `src/services/sessionContextService.ts` (or wherever services live in this repo). Adapt the auth import and the `headers()` import to whichever framework is in use (App Router uses `next/headers`; other frameworks have analogues).

```ts
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * SessionContextService — resolves the current request's acting MP user for
 * audit attribution on writes.
 *
 * Anonymous writes are legitimate (the app may serve unauthenticated users in
 * the future) but always surfaced: `getActingUserIdForWrite` emits a
 * structured `mp.write.non_user` warning so non-user writes are visible in
 * production logs (Vercel, log aggregators) and can be investigated.
 */
export class SessionContextService {
  private static instance: SessionContextService | null = null;

  private constructor() {}

  public static getInstance(): SessionContextService {
    if (!SessionContextService.instance) {
      SessionContextService.instance = new SessionContextService();
    }
    return SessionContextService.instance;
  }

  /**
   * Pure read — returns the acting user's MP User_ID for the current request,
   * or null when there is no session or no User_ID could be resolved at
   * session creation. No side effects. Prefer `getActingUserIdForWrite` at
   * MP write boundaries so non-user writes are logged.
   */
  public async getCurrentUserId(): Promise<number | null> {
    try {
      const session = await auth.api.getSession({ headers: await headers() });
      const userId = (
        session?.user as { userId?: number | null } | undefined
      )?.userId;
      return userId ?? null;
    } catch (err) {
      console.error("[SessionContextService] getSession failed", err);
      return null;
    }
  }

  /**
   * Returns the acting user's MP User_ID for a write operation. When no user
   * is resolved (anonymous / system / session lookup failed) emits a
   * structured `mp.write.non_user` warning so the unattributed write is
   * visible in production logs. Use this — not `getCurrentUserId` — at every
   * MP write boundary.
   */
  public async getActingUserIdForWrite(ctx: {
    table: string;
    operation: "create" | "update" | "delete";
  }): Promise<number | null> {
    const userId = await this.getCurrentUserId();
    if (userId === null) {
      // Stable shape — grep / alerts can rely on `event: mp.write.non_user`.
      console.warn(
        JSON.stringify({
          event: "mp.write.non_user",
          message:
            "NonUser Write — MP write performed without a resolved acting user",
          table: ctx.table,
          operation: ctx.operation,
        }),
      );
    }
    return userId;
  }
}

export const sessionContextService = SessionContextService.getInstance();
```

**Design rules baked in here — keep them when porting:**

- **Two methods, not one.** `getCurrentUserId` for pure reads (display, conditional rendering, audit-log lookups). `getActingUserIdForWrite` for write boundaries. They differ in one thing: the write variant logs.
- **Graceful, not loud.** Both methods return `null` on failure; neither throws. The audit gap is surfaced via the structured log, not via a thrown exception. **Do not** "improve" this by adding throws for "missing user" cases — the user explicitly chose this contract to support future anonymous flows.
- **Structured log key is stable.** `event: "mp.write.non_user"` is grep / alert bait. Don't rename it.
- **Service is in the app layer, not the SDK layer.** Don't bury the session lookup inside MPHelper itself — that would couple the MP provider library to the auth library and break scripts / tests. Keep MPHelper neutral.

## Phase 4 — Add the SessionContextService tests

Create `src/services/sessionContextService.test.ts`. Vitest pattern below; for Jest, swap `vi.hoisted` / `vi.mock` for the Jest equivalents and put the mock declarations above the import.

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockGetSession, mockHeaders } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockHeaders: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mockGetSession } },
}));

vi.mock("next/headers", () => ({
  headers: mockHeaders,
}));

import { SessionContextService } from "@/services/sessionContextService";

describe("SessionContextService", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockGetSession.mockReset();
    mockHeaders.mockReset();
    mockHeaders.mockResolvedValue(new Headers());
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (SessionContextService as any).instance = null;
  });

  afterEach(() => {
    // Restore console spies so they don't stack across tests.
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  describe("getCurrentUserId", () => {
    it("returns userId when session has it", async () => {
      mockGetSession.mockResolvedValueOnce({ user: { userId: 42 } });
      expect(
        await SessionContextService.getInstance().getCurrentUserId(),
      ).toBe(42);
    });

    it("returns null when session is null", async () => {
      mockGetSession.mockResolvedValueOnce(null);
      expect(
        await SessionContextService.getInstance().getCurrentUserId(),
      ).toBeNull();
    });

    it("returns null and logs when getSession throws", async () => {
      mockGetSession.mockRejectedValueOnce(new Error("session boom"));
      expect(
        await SessionContextService.getInstance().getCurrentUserId(),
      ).toBeNull();
      expect(errorSpy).toHaveBeenCalled();
    });

    it("does not warn on the pure-read path", async () => {
      mockGetSession.mockResolvedValueOnce(null);
      await SessionContextService.getInstance().getCurrentUserId();
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe("getActingUserIdForWrite", () => {
    it("returns userId and does not warn when resolved", async () => {
      mockGetSession.mockResolvedValueOnce({ user: { userId: 7 } });
      const result = await SessionContextService
        .getInstance()
        .getActingUserIdForWrite({ table: "Contact_Log", operation: "create" });
      expect(result).toBe(7);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("returns null and emits structured warn when no session", async () => {
      mockGetSession.mockResolvedValueOnce(null);
      const result = await SessionContextService
        .getInstance()
        .getActingUserIdForWrite({ table: "Contacts", operation: "update" });
      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledTimes(1);

      const payload = JSON.parse(warnSpy.mock.calls[0][0] as string);
      expect(payload).toMatchObject({
        event: "mp.write.non_user",
        table: "Contacts",
        operation: "update",
      });
      expect(payload.message).toContain("NonUser Write");
    });

    it("still warns when getSession throws (treated as anonymous)", async () => {
      mockGetSession.mockRejectedValueOnce(new Error("session boom"));
      const result = await SessionContextService
        .getInstance()
        .getActingUserIdForWrite({ table: "Contact_Log", operation: "create" });
      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });
  });
});
```

**Gotcha you will hit:** without `afterEach { warnSpy.mockRestore(); errorSpy.mockRestore(); }`, `vi.spyOn(console, "warn")` stacks across tests — the same spy keeps accumulating calls and assertions like `toHaveBeenCalledTimes(1)` start failing on the third or fourth test. Restore the spies.

Run the service tests in isolation first, then make sure they pass clean:

```
npm run test:run -- src/services/sessionContextService.test.ts
```

## Phase 5 — Wire `$userId` into every MP write call site

For each call site Phase 1 found, apply the recipe matching the operation. **Confirm the call is a real MP write** (not a query, not a local helper) before changing it.

### Recipe A — `createTableRecords` call

**Before:**

```ts
const result = await this.mp!.createTableRecords(
  "Contact_Log",
  [{ ...validatedRest, Contact_Date: mpDate }],
);
```

**After:**

```ts
import { SessionContextService } from "@/services/sessionContextService";

// ...

const $userId = await SessionContextService.getInstance().getActingUserIdForWrite({
  table: "Contact_Log",
  operation: "create",
});

const result = await this.mp!.createTableRecords(
  "Contact_Log",
  [{ ...validatedRest, Contact_Date: mpDate }],
  $userId !== null ? { $userId } : undefined,
);
```

The `$userId !== null ? { $userId } : undefined` shape matters: passing `{ $userId: null }` would send the literal string `"null"` as a query parameter, which MP misinterprets. Omit the parameter entirely on the anonymous path.

### Recipe B — `updateTableRecords` call

Same shape as Recipe A, with `operation: "update"`:

```ts
const $userId = await SessionContextService.getInstance().getActingUserIdForWrite({
  table: "Contacts",
  operation: "update",
});

await this.mp!.updateTableRecords(
  "Contacts",
  [record],
  $userId !== null ? { $userId } : undefined,
);
```

If the existing call already passes other params (e.g. `$allowCreate`), merge:

```ts
await this.mp!.updateTableRecords(
  "Contacts",
  [record],
  {
    $allowCreate: true,
    ...($userId !== null ? { $userId } : {}),
  },
);
```

### Recipe C — `deleteTableRecords` call

```ts
const $userId = await SessionContextService.getInstance().getActingUserIdForWrite({
  table: "Contact_Log",
  operation: "delete",
});

await this.mp!.deleteTableRecords(
  "Contact_Log",
  [contactLogId],
  $userId !== null ? { $userId } : undefined,
);
```

### Recipe D — File operations (`uploadFiles`, `updateFile`, `deleteFile`)

MP's file endpoints also accept `userId` for audit attribution. The `SessionContextService.getActingUserIdForWrite` API only types `operation` as `"create" | "update" | "delete"` — that's fine, map: `uploadFiles → "create"`, `updateFile → "update"`, `deleteFile → "delete"`. Use the file's containing table as the `table` field for the log context if helpful.

```ts
const $userId = await SessionContextService.getInstance().getActingUserIdForWrite({
  table: `files:${table}`,
  operation: "create",
});

await this.mp!.uploadFiles({
  table,
  recordId,
  files,
  uploadParams: {
    ...(uploadParams ?? {}),
    ...($userId !== null ? { userId: $userId } : {}),
  },
});
```

(Note that the file helpers in MPHelper typically take `userId` — not `$userId` — in their params object. Check the local signature.)

### After every fix

Update the corresponding test file:

1. Hoist a `mockGetActingUserIdForWrite` mock and mock `@/services/sessionContextService`:

   ```ts
   const { /* existing hoists */, mockGetActingUserIdForWrite } = vi.hoisted(() => ({
     // ...
     mockGetActingUserIdForWrite: vi.fn(),
   }));

   vi.mock('@/services/sessionContextService', () => ({
     SessionContextService: {
       getInstance: () => ({
         getActingUserIdForWrite: mockGetActingUserIdForWrite,
       }),
     },
   }));
   ```

2. In `beforeEach`, default the resolved user to a known number:

   ```ts
   mockGetActingUserIdForWrite.mockReset();
   mockGetActingUserIdForWrite.mockResolvedValue(500);
   ```

3. Update existing write assertions to include the new `$userId` argument:

   ```ts
   expect(mockCreateTableRecords).toHaveBeenCalledWith(
     'Contact_Log',
     [expect.objectContaining({ /* ... */ })],
     { $userId: 500 },
   );
   ```

4. Add an anonymous-path test for each write method:

   ```ts
   it('omits $userId param when SessionContextService resolves to null', async () => {
     mockGetActingUserIdForWrite.mockResolvedValueOnce(null);
     mockCreateTableRecords.mockResolvedValueOnce([{ /* ... */ }]);

     // ... exercise the write ...

     expect(mockCreateTableRecords).toHaveBeenCalledWith(
       'Contact_Log',
       expect.any(Array),
       undefined,
     );
   });
   ```

5. If you have a regression test that loops a write (e.g. round-tripping the same edit), update its inner assertion to also check `call[2]`:

   ```ts
   for (const call of mockUpdateTableRecords.mock.calls) {
     expect(call[2]).toEqual({ $userId: 500 });
   }
   ```

## Phase 6 — Write the reference doc

Create `.claude/references/ministryplatform.writeattribution.md`. Adjust import paths if this repo uses a different alias or directory layout.

````markdown
# MP Write Attribution Reference

This document covers how MP write APIs must receive `$userId` for the audit log to attribute changes to the user who made them. Use it whenever you add a new MP write path, audit a server action that calls `MPHelper.createTableRecords` / `updateTableRecords` / `deleteTableRecords` / `uploadFiles` / `updateFile` / `deleteFile`, or debug a "the audit log says it was the service account" report.

## Why this matters

MP's table write APIs accept an optional `$userId` query parameter. When present, MP records that `User_ID` as the actor in `dp_Audit_Log`. When absent, MP records the OAuth integration account — for every change made through the app. Nothing breaks visibly; the audit trail is just useless.

## The service

`src/services/sessionContextService.ts` — singleton, server-side. Two methods:

```ts
import { SessionContextService } from "@/services/sessionContextService";

const ctx = SessionContextService.getInstance();

// Pure read — no side effects. Use for display, audit log lookups, etc.
await ctx.getCurrentUserId();          // → number | null

// Write boundary — logs `mp.write.non_user` when null.
await ctx.getActingUserIdForWrite({    // → number | null
  table: "Contact_Log",
  operation: "create",
});
```

The acting user's MP `User_ID` is baked onto `session.user.userId` by `customSession` in `src/lib/auth.ts`, using an in-memory `userGuid → User_ID` cache. The lookup is cheap (one MP call per user per process cold start).

## The contract

- **Authenticated write** → `$userId` is forwarded → MP audit log shows the real user.
- **Anonymous write** → `$userId` is omitted → MP audit log shows the service account → production logs get a structured `{"event":"mp.write.non_user","table":"…","operation":"…"}` warn line.
- **Lookup failure** → treated as anonymous. The warn surfaces it.

Anonymous writes are legitimate (the app may serve unauthenticated users in the future). The contract is **graceful + observable**, not **hard fail**. Do not "improve" this by adding throws.

## The pattern at a write boundary

Always this shape:

```ts
const $userId = await SessionContextService.getInstance().getActingUserIdForWrite({
  table: "Contact_Log",
  operation: "create",
});

await this.mp!.createTableRecords(
  "Contact_Log",
  [record],
  $userId !== null ? { $userId } : undefined,
);
```

The `$userId !== null ? { $userId } : undefined` idiom is load-bearing: passing `{ $userId: null }` sends the string `"null"` as a query param to MP, which is wrong. Omit the parameter entirely on the anonymous path.

## Anti-patterns

| ❌ Don't | ✅ Do |
| --- | --- |
| `mp.createTableRecords(table, records)` (no third arg) | Resolve via `SessionContextService.getActingUserIdForWrite` and forward `$userId` |
| `mp.createTableRecords(table, records, { $userId: session?.user?.id })` | Use `session.user.userId` (MP `User_ID`), not Better Auth's internal `user.id` |
| `mp.createTableRecords(table, records, { $userId: null })` | `$userId !== null ? { $userId } : undefined` |
| Bury the session lookup inside MPHelper | Keep MPHelper neutral; resolve at the service layer |
| `throw new Error("no session")` on the anonymous path | Return null and let the structured warn fire |

## Observability

Grep production logs for `mp.write.non_user`. Each hit is an MP write that wasn't attributed to a user — could be legitimate (anonymous flow), a session bug, or a missing call to `getActingUserIdForWrite` at a newly-added write site. Worth a periodic review.

## Testing

When a test exercises a service method that writes to MP:

1. **Mock `SessionContextService`** with `vi.hoisted` so the mock is set up before the import:
   ```ts
   const { mockGetActingUserIdForWrite } = vi.hoisted(() => ({
     mockGetActingUserIdForWrite: vi.fn(),
   }));
   vi.mock("@/services/sessionContextService", () => ({
     SessionContextService: {
       getInstance: () => ({ getActingUserIdForWrite: mockGetActingUserIdForWrite }),
     },
   }));
   ```
2. **Default to a resolved user** in `beforeEach`: `mockGetActingUserIdForWrite.mockResolvedValue(500);`.
3. **Assert `$userId` is forwarded** on the authenticated path: third arg of the MPHelper call equals `{ $userId: 500 }`.
4. **Add an anonymous-path test** that overrides to `null` and asserts the third arg is `undefined`.

When testing `SessionContextService` itself, restore `console.warn` and `console.error` spies in `afterEach` — `vi.spyOn` stacks across tests otherwise.
````

## Phase 7 — Update CLAUDE.md

Two edits to the repo's `CLAUDE.md`:

**1.** Add a new bullet to the **Key Development Practices** section. Number to follow the existing list:

```
N. **Forward an acting `$userId` on every MP write** — call `SessionContextService.getActingUserIdForWrite(...)` at every `createTableRecords` / `updateTableRecords` / `deleteTableRecords` call site and pass the result as `$userId`. Anonymous writes are allowed but surfaced via the structured `mp.write.non_user` log. See **[Write Attribution Reference](.claude/references/ministryplatform.writeattribution.md)**.
```

**2.** Add a line to the **Reference Documents** section pointing to the new doc:

```
- **[Ministry Platform Write Attribution](.claude/references/ministryplatform.writeattribution.md)** — How to thread the acting user's MP `User_ID` through writes via `SessionContextService`, the graceful + log contract for anonymous writes, and test patterns
```

If this repo's CLAUDE.md doesn't have a Mandatory Data Safety section, also consider adding a sentence to that section: "Every write must be attributed via `$userId`; see the Write Attribution reference."

## Phase 8 — Verify

Before declaring done:

1. `npm run lint` — clean.
2. `npm run test:run` (or whatever the local test command is) — all tests pass.
3. `npx tsc --noEmit` — no new type errors. Pre-existing errors in unrelated files are OK; note them in the PR description.
4. Grep that no write call site still omits `$userId`:
   ```
   grep -rn "createTableRecords\|updateTableRecords\|deleteTableRecords" src/services
   ```
   Every match should either be a definition or a call with three arguments where the third is the `$userId !== null ? { $userId } : undefined` shape.
5. Spot-check one bug fix manually if possible: sign in to the app, perform a write, then look up the new row in `dp_Audit_Log` and confirm `User_ID` is your `User_ID`, not the integration user.

## Phase 9 — Branch, commit, PR

Use the repo's existing conventions. The source repo's commit looked like this; adapt the scope to whichever entity-set carried the gap in this repo:

```
feat(audit): attribute MP writes to acting user via session context

MP write APIs were not receiving $userId, so every <Table> and <Table>
write was recorded in MP's audit log under the OAuth integration account
rather than the user who performed the action. The MPHelper layer supported
$userId on create/update/delete; the gap was at the call sites.

- Resolve MP User_ID in customSession from session.user.userGuid via a
  process-wide cache, attach to session.user.userId. Failures are logged
  but never block session creation.
- New SessionContextService.getActingUserIdForWrite({ table, operation })
  returns the userId or null. When null, emits a structured
  mp.write.non_user warn so anonymous/system writes are visible in
  production logs without hard-failing the request (the app may serve
  unauthenticated users in the future).
- <ServiceA>.method / <ServiceB>.method now resolve and forward $userId.
```

Open the PR, request review, do not self-merge unless that's normal in this repo.

## What "done" looks like

- [ ] `src/services/sessionContextService.ts` exists, is the only file resolving the acting MP `User_ID` for write attribution.
- [ ] `src/services/sessionContextService.test.ts` exists; the resolved-user path, anonymous path (with structured warn assertion), and error paths are covered.
- [ ] Every MP write call site (`createTableRecords`, `updateTableRecords`, `deleteTableRecords`, file ops) forwards `$userId` resolved via `SessionContextService.getActingUserIdForWrite(...)`.
- [ ] Each updated domain-service test file asserts `$userId` is forwarded on the authenticated path and omitted (with `undefined` as the third arg) on the anonymous path.
- [ ] The auth session transform attaches `userId` to `session.user`, with an in-memory `userGuid → User_ID` cache (or — if Phase 1 found `User_ID` was already on the session — `SessionContextService` reads it directly).
- [ ] `.claude/references/ministryplatform.writeattribution.md` exists.
- [ ] `CLAUDE.md` has a Key Development Practices bullet and a Reference Documents entry pointing to it.
- [ ] Lint and full test suite pass.

If you hit something the playbook doesn't cover — an MP entry point that's not in the table API (procedures, communications), a partial pre-existing fix, an auth library that doesn't expose a session transform hook — stop and ask the user before improvising.

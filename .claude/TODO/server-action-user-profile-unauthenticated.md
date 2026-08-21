# TODO: `getCurrentUserProfile` has neither authentication nor an ownership check

**Created:** 2026-08-21
**Severity:** High — unauthenticated disclosure of arbitrary users' profiles, roles, and groups.
**Status:** Open. Documented during the test-coverage push; not fixed.

## Symptom

`src/components/shared-actions/user.ts`:

```ts
export async function getCurrentUserProfile(id: string): Promise<MPUserProfile | undefined> {
  const userService = await UserService.getInstance();
  return await userService.getUserProfile(id);
}
```

Two problems, not one:

1. **No session check.** Like `searchContacts`, this is a `'use server'` action reachable as a POST
   endpoint with no authentication.
2. **No ownership check.** The name says "current user" but the function takes an arbitrary
   `User_GUID` and returns whatever profile that GUID names. `src/services/userService.ts:72-89`
   also loads that user's **roles and user groups** — i.e. it discloses the authorization model for
   any user whose GUID is known.

GUIDs are not usefully secret: `session.user.userGuid` is present in the client-side session, and MP
GUIDs appear in URLs elsewhere in the app (`/contactlookup/[guid]`).

## Proposed fix

```ts
const session = await auth.api.getSession({ headers: await headers() });
if (!session?.user?.id) throw new Error('Authentication required');

const requested = id ?? session.user.userGuid;
if (requested !== session.user.userGuid) {
  // Either reject, or gate on an explicit "may read other users" role.
  throw new Error('Forbidden');
}
```

If cross-user reads are genuinely needed by some feature, that is a separate authorized path and
should be a separate, role-gated function — not an unauthenticated one named `getCurrentUserProfile`.
Consider dropping the parameter entirely and reading the GUID from the session, which makes the
ownership question unaskable.

## Why the existing tests missed it

Both existing tests pass `'guid-123'` and assert pass-through. 100% coverage, 4/4 statements. The
authorization question is never asked.

## Related

- `.claude/TODO/server-action-search-contacts-unauthenticated.md`
- `.claude/docs/TestCoverage.md` §7.4

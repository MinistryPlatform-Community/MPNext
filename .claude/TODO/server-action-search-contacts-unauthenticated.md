# TODO: `searchContacts` server action has no session check

**Created:** 2026-08-21
**Severity:** High — unauthenticated PII disclosure.
**Status:** Open. Documented during the test-coverage push; not fixed, because adding auth here is a
behavior change on a user-facing path.

## Symptom

`src/components/contact-lookup/actions.ts` is a `'use server'` action with **zero** `getSession`
calls. It searches `Contacts` across `First_Name`, `Last_Name`, `Nickname`, `Email_Address`, and
`Mobile_Phone`, returning up to 20 matching records **including email address and mobile phone**.

```ts
export async function searchContacts(searchTerm: string): Promise<ContactSearch[]> {
  if (!searchTerm || searchTerm.trim().length === 0) return [];
  const contactService = await ContactService.getInstance();
  return await contactService.contactSearch(searchTerm.trim());
}
```

## Why this is reachable

Server actions compile to callable POST endpoints. `src/proxy.ts:8` explicitly allows all `/api`
paths through without a session. Every sibling action file (`contact-logs/actions.ts`,
`contact-lookup-details/actions.ts`) does check the session — so this reads as an oversight, not a
deliberate design decision.

A one-character search term returns 20 church members with contact details, to any caller.

## Proposed fix

Match the sibling pattern exactly:

```ts
const session = await auth.api.getSession({ headers: await headers() });
if (!session?.user?.id) {
  throw new Error('Authentication required');
}
```

Then add a test asserting an unauthenticated caller is rejected.

## Why the existing tests missed it

`contact-lookup/actions.ts` is at 100% statement and branch coverage with 5 passing tests (empty
input, whitespace, trimming, service errors, pass-through). None of them asks the authorization
question, because nothing in the code answers it. Coverage cannot flag a check that was never
written.

## Related

- `.claude/TODO/server-action-user-profile-unauthenticated.md` — same class of defect
- `.claude/docs/TestCoverage.md` §7.3

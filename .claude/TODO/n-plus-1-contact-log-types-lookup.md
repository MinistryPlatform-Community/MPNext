# TODO: N+1 lookup fetch in `getContactLogsByContactId`

**Created:** 2026-08-21
**Severity:** Low — performance only, no correctness impact.
**Status:** Open. Trivially fixable; documented rather than fixed to keep the coverage work behavior-neutral.

## Symptom

`src/components/contact-lookup-details/actions.ts:49-64` calls
`contactLogService.getContactLogTypes()` **inside** the `logs.map()` callback:

```ts
const logsWithTypes = await Promise.all(
  logs.map(async (log) => {
    let contactLogType: string | null = null;
    if (log.Contact_Log_Type_ID) {
      const types = await contactLogService.getContactLogTypes();   // <-- per log
      const type = types.find(t => t.Contact_Log_Type_ID === log.Contact_Log_Type_ID);
      contactLogType = type?.Contact_Log_Type || null;
    }
    return { ...log, Contact_Log_Type: contactLogType } as ContactLogDisplay;
  })
);
```

For a contact with 50 logs that have a type set, that is 50 identical fetches of the same small
lookup table on every page load.

## Fix

Hoist the call above the loop and build a `Map` once:

```ts
const types = await contactLogService.getContactLogTypes();
const typeById = new Map(types.map(t => [t.Contact_Log_Type_ID, t.Contact_Log_Type]));
const logsWithTypes = logs.map(log => ({
  ...log,
  Contact_Log_Type: log.Contact_Log_Type_ID ? typeById.get(log.Contact_Log_Type_ID) ?? null : null,
})) as ContactLogDisplay[];
```

Since the map becomes synchronous, `Promise.all` goes away too.

Alternatively (or additionally) memoize `getContactLogTypes()` in `ContactLogService` — it is a
lookup table that changes rarely, and other callers would benefit.

## Why the existing tests missed it

`contact-lookup-details/actions.ts` is at 100% statements / 90.9% branches. The test mocks
`getContactLogTypes` and never asserts a call count, so the inefficiency is invisible to the suite.
When fixing, add `expect(getContactLogTypes).toHaveBeenCalledTimes(1)` with a multi-log fixture so it
cannot regress.

## Related

- `.claude/docs/TestCoverage.md` §7.6

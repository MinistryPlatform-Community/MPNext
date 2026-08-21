# TODO: Numeric IDs are interpolated into MP filters without sanitization

**Created:** 2026-08-21
**Severity:** High — confirmed filter injection reachable from a public server action.
**Status:** Open. Documented during the test-coverage push; deliberately **not** fixed, because the fix changes runtime behavior on read paths and deserves its own review.

## Symptom

`ContactLogService` interpolates caller-supplied IDs straight into the MP `$filter` string:

- `src/services/contactLogService.ts:101` — `filter: \`Contact_Log_ID = ${contactLogId}\``
- `src/services/contactLogService.ts:118` — `filter: \`Contact_ID = ${contactId}\``
- `src/services/contactLogService.ts:83` — same shape via `searchContactLogs`
- `src/services/userService.ts:75` and `:80` — `User_ID = ${profile.User_ID}` (lower risk; the value originates from MP, not from a caller)

The codebase has `sanitizeFilterValue`, `sanitizeLikeValue`, and `sanitizeGuid` in
`src/lib/providers/ministry-platform/utils/filter-sanitize.ts`, and applies them faithfully to every
**string** parameter. There is no equivalent for numeric IDs, and the TypeScript `number` annotation
is erased at runtime.

## Why the action-level guard does not stop it

`src/components/contact-logs/actions.ts` guards with `if (!contactLogId || contactLogId <= 0)`.
For `contactLogId = "1 OR 1=1"`:

```
!id      -> false   (a non-empty string is truthy)
id <= 0  -> false   (string/number comparison does not reject it)
guard passes
```

Server actions compile to callable POST endpoints. A caller controls the payload *shape*, not just
its values, so a string arriving where the signature says `number` is entirely reachable.

## Reproduction

Verified empirically against the real service with a mocked `MPHelper` (probe test since removed):

```
getContactLogById("1 OR 1=1")  ->  filter: "Contact_Log_ID = 1 OR 1=1"
searchContactLogs("5; DROP")   ->  filter: "Contact_ID = 5; DROP"
```

Both reach the MP API. `Contact_Log_ID = 1 OR 1=1` widens a single-record read into a full-table read.

## Proposed fix

1. Add to `filter-sanitize.ts`:

```ts
export function sanitizeNumericId(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error('Invalid numeric ID');
  }
  return n;
}
```

2. Apply it at all five interpolation sites listed above.
3. Test the rejection set: `'1 OR 1=1'`, `'5; DROP'`, `NaN`, `Infinity`, `1.5`, `-1`, `0`, `null`,
   `undefined`, `'  7  '` (decide whether whitespace-padded numerics are accepted or rejected).

## Why the existing tests missed it

`contactLogService.ts` is at 100% statement coverage. No test passes a non-numeric value to any of
these methods, so every line executes and the defect survives. This is the clearest example in the
repo of coverage measuring the wrong thing — see `.claude/docs/TestCoverage.md` §7.

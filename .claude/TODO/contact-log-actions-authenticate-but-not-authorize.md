# TODO: Contact-log actions authenticate but never authorize

**Created:** 2026-08-21
**Severity:** Medium-High — needs a policy decision before it can be called a bug or a feature.
**Status:** Open. Documented during the test-coverage push. Requires a product decision, not just code.

## Symptom

In `src/components/contact-logs/actions.ts`, `updateContactLog`, `deleteContactLog`,
`getContactLogById`, and `getContactLogsByContactId` all confirm that *a* valid session exists, then
act on whatever ID they are handed. Nothing verifies that:

- the contact log belongs to the caller, or
- the caller is permitted to touch that contact at all.

`deleteContactLog` is the sharpest edge. Unlike create/update it does not even resolve `userGuid`:

```ts
const session = await auth.api.getSession({ headers: await headers() });
if (!session?.user?.id) throw new Error("Authentication required");
if (!contactLogId || contactLogId <= 0) throw new Error("Valid Contact Log ID is required");
await contactLogService.deleteContactLog(contactLogId);
```

Any authenticated session can delete **any** contact log in the domain by ID. Given CLAUDE.md's
stance on MP write safety ("Ministry Platform is a shared production database containing real church
member data"), this needs an explicit decision rather than an implicit one.

## The decision to make

Either:

**(a)** "Any authenticated staff user may read, edit, and delete any contact log" is the intended
policy — MP itself is a staff-facing system and this may well match how the church operates. If so,
document it in `.claude/references/auth.md` and add a test that *encodes* the decision, so a future
reader knows it was chosen rather than overlooked.

**(b)** Ownership or role gating is required. Then `deleteContactLog` and `updateContactLog` should
load the log first, compare `Made_By` against the acting `User_ID`, and reject mismatches unless the
caller holds a supervisory role.

Option (a) is plausible and cheap. What is not acceptable is leaving it ambiguous — the current tests
mirror the code's assumptions exactly (`deleteContactLog(42)` asserts the service was called with
`42`), so they keep passing under either policy and encode nothing.

## Related

- `.claude/TODO/mp-filter-injection-numeric-ids.md` — the same entry points, different defect
- `.claude/docs/TestCoverage.md` §7.5

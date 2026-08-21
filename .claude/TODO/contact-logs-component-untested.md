# TODO: `contact-logs.tsx` — 602 lines driving MP writes, 0% coverage

**Created:** 2026-08-21
**Severity:** Medium — the largest untested file in the app, on the app's only write path.
**Status:** Open. Explicitly **out of scope** for the >90% non-UI coverage target (this is a React
component), but it is the highest-value remaining test gap in the repo and should not get lost.

## Symptom

`src/components/contact-logs/contact-logs.tsx` is 602 lines at 0% coverage. It is the component that
drives contact-log **create / update / delete** against Ministry Platform. It owns:

- form state and client-side validation
- the delete-confirmation gate
- optimistic updates and rollback
- error handling and user-facing error surfaces

The server actions beneath it sit at 97.8% coverage — but the actions are the easy half. The form
logic, the confirmation gate, and the error handling are where a regression silently corrupts or
deletes real member data.

## Why it matters more than the coverage number suggests

CLAUDE.md is unambiguous about MP write safety. The only interactive path a user has to mutate MP
data in this app goes through code that no test has ever executed. A regression that, say, fires
delete before the confirmation resolves would not be caught by anything in the suite.

## Suggested approach — targeted, not exhaustive

`@testing-library/react` is already installed and `components/layout/auth-wrapper.test.tsx` proves
the harness works. Do not chase full render coverage. Three tests, in priority order:

1. **The delete-confirmation gate.** Clicking delete does *not* call `deleteContactLog` until the
   confirmation is accepted; cancelling calls nothing.
2. **Form validation before submit.** Missing `Contact_Date` or `Notes` does not reach
   `createContactLog` (the action throws on these, but the component should never send them).
3. **Action failure surfaces to the user** and does not leave an optimistic row in place.

Even these three beat zero by a wide margin.

## Related

- `.claude/docs/TestCoverage.md` §6.3
- `.claude/TODO/contact-log-actions-authenticate-but-not-authorize.md`

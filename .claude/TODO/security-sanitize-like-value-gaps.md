# TODO: `sanitizeLikeValue` doesn't escape `[`; sanitizers don't type-check; search terms have no length cap

**Created:** 2026-09-28
**Severity:** Low — unintended LIKE pattern semantics and oversized queries, not SQL injection. The Unicode-quote part is theoretical.
**Confidence:** Confirmed by repro (except the Unicode quote case, which can't be tested without MP).
**Source:** Auth security review 2026-09-28 (authorization and MP-client reviewers).

## Finding

`src/lib/providers/ministry-platform/utils/filter-sanitize.ts:27-46`, used at `src/services/contactService.ts:72-75`:

- `[a-z]`, `[^a]` pass through unchanged. In T-SQL `LIKE` these are character classes, so a user can run pattern searches like `[0-9][0-9][0-9]` — contradicting the function's doc comment. (`%` and `_` are escaped.)
- U+2019 / U+02BC (curly/modifier apostrophes), U+FF07 (fullwidth apostrophe), NUL and newlines pass through. Whether MP's backend ever narrows these to `'` (e.g. an implicit NVARCHAR→VARCHAR conversion) is unknown. *Theoretical.*
- `sanitizeGuid` doesn't check `typeof`: a one-element array passes (stringifies safely; the action's `.trim()` rejects arrays first).
- No length cap on the search term: a body under the 1 MB server-action limit becomes a multi-MB URL with five `LIKE '%x%'` clauses.

## Fix

- Escape `[` as `\[`, matching the existing `ESCAPE '\'` scheme the function already uses for `%`, `_` and `\`. Confirm every caller's LIKE clause carries `ESCAPE '\'`.
- Reject control characters; consider rejecting or normalizing non-ASCII quote look-alikes.
- `typeof value === "string"` guards in all sanitizers.
- Cap search terms at ~100 characters in `searchContacts`.

## How to verify a fix

- Unit tests: `[0-9]` is matched literally; `"\u0000"` rejected; array input rejected; 10 KB term rejected.

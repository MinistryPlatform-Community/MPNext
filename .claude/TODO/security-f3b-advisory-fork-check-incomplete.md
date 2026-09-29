# TODO: The F3b advisory's fork check misses forks whose sign-in code still lives in `src/app/signin/page.tsx`

**Created:** 2026-09-28
**Severity:** Low (docs) — a vulnerable fork can run the published check and conclude it's safe.
**Confidence:** Confirmed from git history.
**Source:** Auth security review 2026-09-28 (client/config reviewer).

## Finding

- `docs/security/2026-09-25-signin-hardening.md:56` greps only `src/components/sign-in/` for `startsWith("/\\")`.
- From `ee46343` until F9 (`cfeecab`), the weak check lived in `src/app/signin/page.tsx:22`. A fork that took F3 but not F9 prints nothing → looks unaffected.
- Conversely, the playbook's control-character check (`grep … src/components/sign-in/`) wrongly flags a *fixed* fork whose sign-in code is still in `src/app/signin/page.tsx`.

Evidence: `git grep -F 'startsWith("/\\")' ee46343 -- src` shows the file the advisory's check skips.

## Fix

- Grep `src/` (not just `src/components/sign-in/`) in both the advisory and the playbook triage block.

## How to verify a fix

- Run the corrected greps against `ee46343`, `cfeecab~1` and `HEAD`: vulnerable, vulnerable, clean.

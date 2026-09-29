# TODO: CI runs neither ESLint nor a build — the "enforced" no-console rule and CSP-breaking prerenders are unchecked; docs claim otherwise

**Created:** 2026-09-28
**Severity:** Low — a security regression (e.g. PII logging via `console.log`, or a prerendered route that silently breaks under the enforced CSP) can merge with CI green.
**Confidence:** Confirmed by reading `.github/workflows/test.yml`.
**Source:** Auth security review 2026-09-28 (client/config reviewer).
**Related:** [security-ci-action-pinning-permissions.md](security-ci-action-pinning-permissions.md), [security-prerendered-nonceless-pages.md](security-prerendered-nonceless-pages.md)

## Finding

- `.github/workflows/test.yml:40-43` runs `npx vitest run --coverage` (and a lockfile job) only.
- CLAUDE.md rule 12 calls the F5 `no-console` rule "enforced, not advisory" — only local lint enforces it; Next 16's build doesn't run ESLint either.
- A new route that gets prerendered (○ in build output) won't carry a nonce and won't hydrate under the enforced CSP; only a build reveals that.
- Wrong claims: `.claude/references/auth.md:946` ("Our CI (`build` + `lint` + unit tests)"), `README.md:111` ("CI builds and tests").

## Fix

- Add a CI job: `npm run lint`, `npx tsc --noEmit`, and ideally `npm run build` with a check that no app route other than the accepted `/_not-found`/`/_global-error` is static (○).
- Correct `auth.md:946` and `README.md:111` if the job isn't added.

## How to verify a fix

- A branch adding `console.log` under `src/` fails CI; a branch adding a static page fails the prerender check.

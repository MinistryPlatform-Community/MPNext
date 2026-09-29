# TODO: CI hardening — pin actions by SHA and declare `permissions:`

**Created:** 2026-09-28
**Severity:** Info — supply-chain defence in depth.
**Confidence:** Confirmed by reading `.github/workflows/*.yml`.
**Source:** Auth security review 2026-09-28 (client/config reviewer).
**Related:** [security-ci-missing-lint-and-build.md](security-ci-missing-lint-and-build.md)

## Finding

- Actions are pinned by tag, not commit SHA — including the third-party `codecov/codecov-action@v5`, which receives `CODECOV_TOKEN` on pushes to `main`.
- No explicit `permissions:` blocks. The repo default is `read`, but forks in orgs may default to write.
- Checked safe: no `pull_request_target`; no untrusted `${{ }}` inside `run:`; fork PRs get no secrets; the Discord workflow passes untrusted release text via `env:` + `jq --arg`.

## Fix

- Pin every third-party action to a full commit SHA (with a `# vX.Y.Z` comment); let Dependabot bump them.
- Add `permissions: contents: read` at workflow level; widen per job only where needed.

## How to verify a fix

- `grep -E "uses: .*@v[0-9]" .github/workflows/*.yml` returns nothing; every workflow has a `permissions:` block.

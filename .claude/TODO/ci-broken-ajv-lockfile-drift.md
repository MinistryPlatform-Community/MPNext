# TODO: CI is red on `main` — `npm ci` fails on `ajv` lockfile drift

**Created:** 2026-08-21
**Severity:** High — **every** CI run on `main` and on every branch fails at the install step. No PR can be verified by CI until this is fixed.
**Status:** Open. Pre-existing; discovered while pushing unit-test coverage (PR #71), unrelated to that work.

## Symptom

`npm ci` fails in ~8s on GitHub Actions, before any test runs:

```
npm error `npm ci` can only install packages when your package.json and
npm error package-lock.json or npm-shrinkwrap.json are in sync.
npm error Invalid: lock file's ajv@6.15.0 does not satisfy ajv@8.20.0
npm error Missing: ajv@6.15.0 from lock file
npm error Missing: fast-uri@3.1.5 from lock file
npm error Invalid: lock file's json-schema-traverse@0.4.1 does not satisfy json-schema-traverse@1.0.0
npm error Missing: json-schema-traverse@0.4.1 from lock file
```

## When it started

Introduced by `64f18f0` ("Package Update Cleanup"). The run immediately before it
(`32470332071`, merge of PR #70) was green; `32472743169` on `64f18f0` is red with this
error, and every run since has failed identically.

Verified byte-identical between the `main` run and PR #71's run, and PR #71 touches neither
`package.json` nor `package-lock.json` — so this is not branch-specific.

## Cause

Two packages want different `ajv` majors:

| Package | Requires |
|---|---|
| `eslint` | `ajv@^6.14.0` |
| `@hookform/resolvers` | `ajv@^8` |

`package-lock.json` contains exactly **one** `node_modules/ajv` entry, pinned to `6.15.0`
(line ~5242). The nested `ajv@8.x` entry that `@hookform/resolvers` needs is absent, along
with its `fast-uri@3.1.5` and `json-schema-traverse@1.0.0` subtree.

This is the same class of failure as `.claude/TODO/investigate-emnapi-lockfile-drift.md`: a
Windows `npm install` / `npm dedupe` pruned nested entries out of the lockfile, and `npm ci`
on Linux then refuses to proceed. `ajv` is a different victim, same mechanism.

## Fix

Regenerate the lockfile without touching `node_modules`, then confirm both `ajv` trees survive:

```bash
npm install --package-lock-only
git diff package-lock.json    # expect a nested ajv@8.x under @hookform/resolvers
```

**Do this in WSL, a Linux container, or with `--os=linux --cpu=x64`.** A bare
`npm install` on Windows is what caused this, and the emnapi TODO documents it re-pruning
Linux-only optional entries — fixing `ajv` on Windows risks reintroducing that drift in the
same commit.

Then verify the way CI does, on Linux:

```bash
rm -rf node_modules && npm ci && npm run test:run
```

## Worth doing alongside

Both incidents share one root cause: lockfiles are generated on Windows and consumed on
Linux. Options in `.claude/TODO/investigate-emnapi-lockfile-drift.md` §"Things to try" apply
verbatim here — in particular a CI guard or pre-commit hook that runs `npm ci --dry-run`
before a lockfile change can reach `main`. That would have caught both incidents at the
commit that introduced them rather than one merge later.

The `/audit-deps` skill is the natural home for this check.

## Related

- `.claude/TODO/investigate-emnapi-lockfile-drift.md` — same mechanism, different packages
- `64f18f0` — the commit that introduced it
- Failing run on `main`: https://github.com/MinistryPlatform-Community/MPNext/actions/runs/32472743169

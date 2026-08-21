# TODO: Investigate `@emnapi/*` lockfile drift on Windows `npm install`

**Created:** 2026-05-17
**Severity:** Annoying — CI breaks every time someone bumps a dep on Windows.

**Workaround in place:** Manually re-add the four `@emnapi/*` lockfile entries by hand after every Windows `npm install`. Tracked by commits `dc5e439` and the follow-up patch after `ecaa009`.

> **2026-08-21 update — the regeneration recipe is now verified, the systemic guard is not.**
>
> A second incident (`ajv`, introduced by `64f18f0`) broke `npm ci` on `main` for every branch.
> Fixing it confirmed **option 2 below works and is safe**:
>
> ```bash
> npm install --package-lock-only --os=linux --cpu=x64
> ```
>
> Run from Windows, this restored every missing nested/bundled entry — including the
> `@tailwindcss/oxide-wasm32-wasi` → `@emnapi/*` subtree this TODO is about — and pruned
> **nothing**. Platform-specific entry counts were byte-identical before and after
> (76 win32, 75 darwin, 46 linux-x64, 40 android), so `--os`/`--cpu` steer resolution
> without narrowing the lockfile to one platform. `--package-lock-only` never touches
> `node_modules`, so it is safe to run mid-session.
>
> Verified by `npm ci` on Linux (exit 0, 587 packages) before pushing.
>
> **What is still missing is item 4: the guard.** Both incidents reached `main` and were
> found one merge later. Until `npm ci --dry-run` runs on a lockfile change, there will be
> a third incident. That is the remaining work in this TODO — the manual fix is solved.

## Symptom

CI `npm ci` on Ubuntu fails with:

```
npm error Missing: @emnapi/runtime@1.10.0 from lock file
npm error Missing: @emnapi/core@1.10.0 from lock file
```

…immediately after a dep bump that was prepared on Windows. The same pattern has now hit twice:

- `bdd2e47` (npm dedupe on Windows) → fixed by `dc5e439`
- `ecaa009` (tsx + @vitejs/plugin-react bump on Windows) → fixed by the follow-up commit to this TODO

## Hypothesis

The `@emnapi/core` and `@emnapi/runtime` packages are pulled in as **optional, peer** deps of `@rolldown/binding-wasm32-wasi` (a Linux-only optional dep). When `npm install` runs on Windows, npm prunes them out of the lockfile because the parent `@rolldown/binding-wasm32-wasi` doesn't resolve on Windows. CI on Linux then reads `package.json`, sees the requirement, and the lockfile is "missing" entries → `npm ci` refuses to proceed.

## Things to try

1. **`npm install --include=optional`** on Windows — does this preserve the Linux-only optional graph? If yes, document it as the required install command and add to CLAUDE.md / contributing guide.
2. ~~**`npm install --os=linux --cpu=x64`**~~ — **CONFIRMED WORKING**, see the update at the top.
   Use `npm install --package-lock-only --os=linux --cpu=x64`; the `--package-lock-only` part
   matters, since it keeps `node_modules` untouched. This is now the documented fix for this
   class of drift.
3. **Move all dep-bump work to a Linux container or WSL** so lockfiles are always generated against the CI platform.
4. **Pre-commit hook or CI guard** — **this is the remaining work.** Rather than detecting the
   four `@emnapi/*` entries specifically (the `ajv` incident had nothing to do with emnapi), run
   the generic check: on any commit touching `package-lock.json`, run `npm ci --dry-run` on Linux
   and fail fast. That catches every variant of this drift at the commit that introduces it
   instead of one merge later. The `/audit-deps` skill is the natural home.
5. **Investigate whether `@tailwindcss/oxide-wasm32-wasi` and `@rolldown/binding-wasm32-wasi` are actually needed** — if neither is being used at build/runtime, removing them eliminates the source of the optional/peer entanglement.

## How to verify a fix

After applying a candidate fix on Windows:

```pwsh
Remove-Item -Recurse -Force node_modules
npm install            # or whatever variant is being tested
git diff package-lock.json   # the @emnapi/core and @emnapi/runtime entries should still be present
```

Then push to a branch and confirm CI's `npm ci` step succeeds on Ubuntu.

## References

- `dc5e439` — prior manual fix with full context in commit message
- `bdd2e47` — original drift introduction (npm dedupe)
- `ecaa009` — second drift introduction (this incident)
- CI run that failed: https://github.com/MinistryPlatform-Community/MPNext/actions/runs/25991275743

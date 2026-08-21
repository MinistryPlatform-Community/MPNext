# Dependency Known Issues

State carried between `/audit-deps` runs so each audit starts from prior conclusions
instead of re-deriving them. Every entry needs a date and a re-check trigger.

Last audit: **2026-08-21 (run 2)** — report at `.claude/reports/deps-audit-2026-08-21-run2.md`
(run 1: `.claude/reports/deps-audit-2026-08-21.md`).

## Accepted advisories (triaged as not exploitable)

| Package | Advisory | Reason not exploitable | Verified | Re-check when |
|---|---|---|---|---|
| `better-auth` | 2026 CVE cluster: `CVE-2026-53513` (SSRF, CVSS 9.6, `@better-auth/sso`), `CVE-2026-53516` (OAuth auto-link ATO), `CVE-2026-45337` (`deviceAuthorization`), `CVE-2026-67336` (insecure crypto defaults in `oidcProvider`/`mcp`) | Two independent reasons: (a) all fixed in `1.6.11`+, installed is `1.7.1`; (b) the vulnerable plugins are not loaded — `src/lib/auth.ts` registers exactly `genericOAuth`, `customSession`, `nextCookies`. Repo-wide grep for `oidcProvider`, `mcp(`, `ssoPlugin`, `deviceAuthorization`, `apiKey(` matches nothing outside comments. **Re-verified run 2 (2026-08-21):** plugin list unchanged (`genericOAuth` L77, `customSession` L164, `nextCookies` L186); grep still returns no matches; OSV independently returns 0 vulns for `better-auth@1.7.1`. | 2026-08-21 (run 2) | Any change to the plugin list in `src/lib/auth.ts` |

### Cleared entries

| Package | Advisory | Cleared because | Date |
|---|---|---|---|
| `postcss` (bundled in `next`) | 2 moderate findings under `node_modules/next/...` | Resolved upstream in `next@16.3.1`. `npm audit` now reports 0 findings across 583 packages. | 2026-08-21 |

> The `npm audit fix --force` ban is permanent and independent of the cleared entry above:
> `--force` still "fixes" bundled-dependency findings by downgrading `next` to 9.3.3.

## Blocked majors

| Package | Target | Blocker | Verified | Re-check when |
|---|---|---|---|---|
| `typescript` | 7.x | **Verified by attempt 2026-08-21 (TS 7.0.2).** Lint only — `build` and `tests` both pass on TS 7. `eslint .` dies before linting anything: `Error: typescript-eslint does not support TS 7.0.` — an explicit runtime guard in `typescript-eslint/dist/index.js:52`, not merely a peer-range mismatch. Root cause: **TypeScript 7.0 ships no compiler API at all**, and typescript-eslint needs one. Both `latest` (8.67.0) and `canary` (8.67.1-alpha.24) still declare `typescript: >=4.8.4 <6.1.0`; there is no typescript-eslint 9.x line. Upstream is explicitly targeting **TS >= 7.1**, which is where the new API lands. **Re-confirmed run 2 (2026-08-21):** `latest` is now 8.67.0 and `canary` 8.67.1-alpha.24 — both still `typescript: >=4.8.4 <6.1.0`, still no 9.x line. | 2026-08-21 (run 2) | typescript-eslint ships TS >= 7.1 support — track [typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940) and the TS 7.1 release |
| `eslint` | 10.x | **Verified by attempt (run 1), re-confirmed against upstream metadata (run 2).** The three plugins `eslint-config-next` pulls in cap `eslint` at `^9` — and as of run 2 **all three are at their latest published version**, so this is an upstream gap, not a stale pin: `eslint-plugin-react@7.37.5` (`… ‖ ^9.7`), `eslint-plugin-import@2.32.0` (`… ‖ ^9`), `eslint-plugin-jsx-a11y@6.10.2` (`… ‖ ^9`). `eslint-config-next@16.3.2` depends on `^7.37.0` / `^2.32.0` / `^6.10.0` respectively — i.e. it already allows the newest. Installing v10 → `ERESOLVE overriding peer dependency` ×3 and `npm error invalid: eslint@10.8.1`; `eslint .` then dies with `TypeError: Error while loading rule 'react/display-name': contextOrFilename.getFilename is not a function` (`eslint-plugin-react` still calls the `context.getFilename()` API v10 removed). Zero files lintable. Reverted. | 2026-08-21 (run 2) | Any of `eslint-plugin-react` / `-import` / `-jsx-a11y` ships ESLint 10 support |
| `@types/node` | 26.x | The `@types/node` major tracks the Node major; local runtime is Node **24.18.0**. Resolved this audit by realigning **down** to `^24.13.3` (see Held). Going to 26 would put types two majors ahead of the runtime. | 2026-08-21 | Local/CI/production Node moves to 26 |

> **Do not check only the top-level peer of `eslint-config-next`.** Its declared peer is
> `eslint: >=9.0.0`, which is misleading — the binding constraint lives in the plugins it depends on.
> Check `eslint-plugin-react` / `-import` / `-jsx-a11y` before proposing an ESLint major.
>
> **Where those plugins resolve varies between installs — check the resolved version, not a fixed
> path.** Run 1 found them nested under `node_modules/eslint-config-next/node_modules/`; after run 2's
> `npm update` dedupe they resolve **hoisted at top level** (`node_modules/eslint-plugin-react`). The
> constraint is identical either way; a path-based check silently reports "not vendored" and can be
> misread as "no constraint".

> **The inherited claim that TS 7 "breaks the Next.js 16 build worker" is wrong** — it was carried in
> from an undated earlier run and is disproven as of `next@16.3.1` + `typescript@7.0.2`. The build not
> only succeeds, it is markedly faster: the TypeScript check drops from ~2.8s to **933ms** on the
> native compiler. Next.js declares no `typescript` peer at all. The blocker is lint, and lint alone.
>
> **Partial workaround, if the faster `tsc` ever becomes worth the complexity:** TypeScript documents
> running 6 and 7 side by side via npm aliases — `"typescript": "npm:@typescript/typescript6@^6.0.2"`
> (real package, exists) plus an arbitrarily-named alias such as
> `"@typescript/native": "npm:typescript@^7.0.2"`. Anything doing `require('typescript')` then gets the
> 6.0 API — which includes Next.js's own build-time type check, so the build would go *back* to TS 6
> speed. The win would be limited to a standalone `tsc` invocation. Not worth it for this repo today.

> **`@types/node` version numbers do not track Node patch versions.** There is no `@types/node@24.18.0`
> (the highest 24.x is `24.13.3`). Writing an unsatisfiable range does not fail fast — it sends the npm
> resolver into pathological backtracking (~870 CPU-seconds with no output before being killed).
> Confirm the version exists with `npm view "@types/node@^24" version` before editing the range.

## Pending upstream

| Package | Item | Detail | Re-check |
|---|---|---|---|
| `next` | Pre-announced **critical** vulnerability | Patches announced as `16.3.2` / `15.5.24`, scheduled **2026-08-26**; advisory still unpublished. **`16.3.2` shipped early (2026-08-21T09:36:39Z) but is NOT the security release** — its release notes say "backporting bug fixes" and list only 6 Turbopack/app-router/Turborepo-OIDC fixes, no CVE. `15.5.24` does not exist (`backport` dist-tag = `15.5.23`). Upgrading to 16.3.2 does **not** address the critical vuln; expect the patch as `16.3.3`/`15.5.24` or an amended advisory. Installed `16.3.2` is already the newest available — no action possible. [Announcement](https://nextjs.org/blog/upcoming-nextjs-security-release-august-2026) (published 2026-08-20). | On/after **2026-08-26** |

## Held packages (deliberately not upgraded)

| Package | Pinned at | Reason | Decided |
|---|---|---|---|
| `@types/node` | `^24.13.3` | Deliberately held **one major below `latest`** so the type surface matches the Node 24.18.0 runtime. Bumping to 25 or 26 would let `tsc` accept APIs the runtime does not have. Move this only together with the actual runtime. | 2026-08-21 |
| `eslint` | `^9.39.2` (resolves 9.39.5) | This version is **deprecated upstream** ("no longer supported"), and is held only because ESLint 10 is hard-blocked by the plugins `eslint-config-next` vendors. Not a preference — an unavoidable hold. Revisit as soon as `eslint-config-next` updates its bundled plugins. | 2026-08-21 |

## Removed dependencies

| Package | Was | Why removed | Date |
|---|---|---|---|
| `openai` | `dependencies: ^6.32.0` | Zero references repo-wide — no `import`/`require` in `src/` or `scripts/`, no `OPENAI*` env var, no config reference. Removing it dropped exactly 1 package; build, lint, and 279 tests stayed green. If AI features are added later, install fresh at `^7`. | 2026-08-21 |

## Applied majors (for the record)

| Package | Change | Verified by | Date |
|---|---|---|---|
| `jsdom` | `^29.0.0` → `^30.0.1` | 279/279 tests pass | 2026-08-21 |
| `chalk` | `^5.6.2` → `^6.0.0` | `npm run setup:check` renders colored output, all 8 checks run | 2026-08-21 |
| `@testing-library/jest-dom` | `^6.9.1` → `^7.0.1` | 279/279 tests pass; `@testing-library/dom@^10.4.1` promoted transitive → explicit `devDependency` as v7 requires | 2026-08-21 |

## Lockfile platform drift (Windows -> Linux CI)

**Resolved 2026-08-21 with a guard. Read this before touching `package-lock.json`.**

`package-lock.json` is authored on Windows and installed by CI on Linux. npm resolves
optional and bundled subtrees per platform, so a lockfile written on Windows can omit
entries `npm ci` on Linux requires. CI then dies at the install step with a cryptic
`Missing: … from lock file`, before any test runs.

It happened twice, and both times reached `main` and were found a merge later:

| Date | Trigger | Damage |
|---|---|---|
| 2026-05-17 | `npm dedupe` on Windows | `@emnapi/*` subtree under `@tailwindcss/oxide-wasm32-wasi` pruned; fixed by hand |
| 2026-08-21 | `64f18f0` "Package Update Cleanup" | `ajv` hoisted to top level; `main` red for ~45 min; fixed in PR #72 |

### The rule

```bash
npm run deps:relock     # the ONLY supported way to regenerate the lockfile
npm run deps:verify     # check it (runs in CI and in the pre-commit hook)
```

`deps:relock` is `npm install --package-lock-only --os=linux --cpu=x64`. Verified
2026-08-21: it restores every missing nested/bundled entry, prunes nothing, and does not
narrow the lockfile to one platform — platform entry counts were byte-identical before and
after (win32 76, darwin 75, linux-x64 46, android 40). It is idempotent, and
`--package-lock-only` never touches `node_modules`, so it is safe to run mid-session.

**Never** regenerate with a bare `npm install` or `npm dedupe` on Windows. Measured against
the fixed lockfile: a plain `npm install --package-lock-only` is harmless (2 metadata lines),
but `npm dedupe --package-lock-only` re-breaks it in one command — 114 lines, stripping the
nested `eslint/node_modules/ajv` subtrees and re-hoisting `ajv@6.15.0`, reproducing the exact
`64f18f0` failure.

### Why the guard is not `npm ci --dry-run`

Measured 2026-08-21 against a known-broken lockfile:

| Command | Windows | Linux |
|---|---|---|
| `npm ci --dry-run` | **exit 0** | exit 1 |
| `npm ci --dry-run --os=linux --cpu=x64` | **exit 0** | — |

npm's lock/manifest sync check ignores `--os`/`--cpu`, so **the drift is undetectable with
`npm ci` from a Windows machine**. A hook built on it would pass every time and still break CI.

`scripts/check-lockfile.mjs` instead asserts an invariant that holds on any platform: *the
lockfile must already be what Linux resolution produces.* It relocks a throwaway copy and
compares. Against the real broken lockfile it names all six drifted entries, from Windows.

The comparison is **semantic, not byte-for-byte** — it compares the tree shape (which
`node_modules/...` entries exist, and at which version) and ignores npm metadata flags.
That matters: CI's node 22 ships npm 10.x while developers here run npm 11.x, and the two
write flags like `dev` vs `devOptional` differently. A byte comparison fails on differences
that cannot break an install — verified 2026-08-21, when a lockfile differing only in one
`fast-deep-equal` flag installed cleanly on CI (`test` job green) while a byte-diff rejected
it. Reporting harmless diffs as failures is how a check gets ignored.

The semantic comparison tracks npm's own validation closely. On the broken lockfile it
reports `ajv: 6.15.0 -> 8.20.0` and a missing `fast-uri`, which is what `npm ci` itself says
(`Invalid: lock file's ajv@6.15.0 does not satisfy ajv@8.20.0`, `Missing: fast-uri@3.1.5`).

### Where it runs

- **pre-commit** — `.githooks/pre-commit`, only when `package-lock.json` is staged.
  Auto-installed by the `prepare` script (`git config core.hooksPath .githooks`), so a fresh
  clone gets it on first `npm install`. Bypass with `git commit --no-verify`.
- **CI** — the `lockfile` job in `.github/workflows/test.yml`, on every push and PR. This is
  the authoritative check; it runs on Linux and cannot be skipped.

Offline behavior: the check needs the registry. Locally it warns and passes when npm is
unreachable (so an offline commit is not blocked); in CI (`process.env.CI`) it fails instead.

### Not fixable upstream

`@tailwindcss/oxide-wasm32-wasi` and `@unrs/resolver-binding-wasm32-wasi` are
`optionalDependencies` of `@tailwindcss/oxide` and `unrs-resolver` respectively, both with
`cpu: ["wasm32"]`. They are transitive and not ours to remove — the only way to exclude them is
`--omit=optional`, which would also drop every platform's native binary. The WASM-fallback
entanglement is inherent to those upstream packages, so the guard is the fix, not removal.

## Open items awaiting a decision (not blockers)

| Item | Detail | Raised |
|---|---|---|
| `pkce: false` in `src/lib/auth.ts` | Not a dependency issue, but a live security posture item: MP discovery advertises `S256`, so PKCE can likely be enabled. Needs its own change + test. | 2026-08-21 |
| `vitest.config.ts` CJS/ESM warning | Vite 8 warns the config uses ESM syntax while loaded as CommonJS and that `configLoader: 'native'` will become the default. Pre-existing. Fix: rename to `vitest.config.mts`. | 2026-08-21 |

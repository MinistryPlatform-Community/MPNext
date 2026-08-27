# Dependency Known Issues

State carried between `/audit-deps` runs so each audit starts from prior conclusions
instead of re-deriving them. Every entry needs a date and a re-check trigger.

Last audit: **2026-08-27** — report at `.claude/reports/deps-audit-2026-08-27.md`
(prior: `deps-audit-2026-08-21-run2.md`, `deps-audit-2026-08-21.md`).

## Accepted advisories (triaged as not exploitable)

| Package | Advisory | Reason not exploitable | Verified | Re-check when |
|---|---|---|---|---|
| `better-auth` | 2026 CVE cluster: `CVE-2026-53513` (SSRF, CVSS 9.6, `@better-auth/sso`), `CVE-2026-53516` (OAuth auto-link ATO), `CVE-2026-45337` (`deviceAuthorization`), `CVE-2026-67336` (insecure crypto defaults in `oidcProvider`/`mcp`) | Two independent reasons: (a) all fixed in `1.6.11`+, installed is `1.7.1`; (b) the vulnerable plugins are not loaded — `src/lib/auth.ts` registers exactly `genericOAuth`, `customSession`, `nextCookies`. Repo-wide grep for `oidcProvider`, `mcp(`, `ssoPlugin`, `deviceAuthorization`, `apiKey(` matches nothing outside comments. **Re-verified run 2 (2026-08-21):** plugin list unchanged (`genericOAuth` L77, `customSession` L164, `nextCookies` L186); grep still returns no matches; OSV independently returns 0 vulns for `better-auth@1.7.1`. | 2026-08-21 (run 2) | Any change to the plugin list in `src/lib/auth.ts` |
| `next` | [GHSA-2xp9-vwfh-vxw4](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4) — **critical** unauthenticated RCE optimizing an attacker-controlled AVIF (`libheif` via `sharp`) | **Patched** (`16.3.3`) *and* unreachable, three independent ways: (a) all three `<Image>` call sites pass `unoptimized` — `contact-lookup-results.tsx:95`, `contact-lookup-details.tsx:78`, `layout/header.tsx:60`; (b) `next.config.ts` declares no `images.remotePatterns`/`domains`, so `/_next/image` rejects every remote URL — an attacker cannot supply a hostile AVIF; (c) the only local file the optimizer can reach is `public/assets/icons/favicon.ico`, repo-committed. Note `/_next/image` is unauthenticated by design (`src/proxy.ts:32` excludes it), so (a)–(c) are the entire defense. | 2026-08-27 | **Either** `images.remotePatterns`/`domains` is added to `next.config.ts`, **or** any `<Image>` drops `unoptimized` |
| `next` | [CVE-2026-75604](https://www.cve.org/CVERecord?id=CVE-2026-75604) / [GHSA-p293-qw3h-jr36](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36) — **critical** unauthenticated RCE on Windows-hosted servers | **Patched** (`16.3.3`). Needed **both** preconditions; only one held. Windows filesystem — **met** (dev on Windows 11). Both Pages Router *and* App Router — **not met**: App Router only (`src/app/`), no source `pages/`, no `getServerSideProps`/`getStaticProps`/`next/router` in `src/`. (`./.next/server/pages` is a build artifact for internal error pages, **not** Pages Router adoption — do not misread it.) Narrower margin than the AVIF issue: one `pages/` route would have made it live. | 2026-08-27 | A `pages/` directory is introduced |

### Cleared entries

| Package | Advisory | Cleared because | Date |
|---|---|---|---|
| `postcss` (bundled in `next`) | 2 moderate findings under `node_modules/next/...` | Resolved upstream in `next@16.3.1`. `npm audit` now reports 0 findings across 583 packages. | 2026-08-21 |

> The `npm audit fix --force` ban is permanent and independent of the cleared entry above:
> `--force` still "fixes" bundled-dependency findings by downgrading `next` to 9.3.3.

## Blocked majors

| Package | Target | Blocker | Verified | Re-check when |
|---|---|---|---|---|
| `typescript` | 7.x | **Verified by attempt 2026-08-21 (TS 7.0.2).** Lint only — `build` and `tests` both pass on TS 7. `eslint .` dies before linting anything: `Error: typescript-eslint does not support TS 7.0.` — an explicit runtime guard in `typescript-eslint/dist/index.js:52`, not merely a peer-range mismatch. Root cause: **TypeScript 7.0 ships no compiler API at all**, and typescript-eslint needs one. Both `latest` (8.67.0) and `canary` (8.67.1-alpha.24) still declare `typescript: >=4.8.4 <6.1.0`; there is no typescript-eslint 9.x line. Upstream is explicitly targeting **TS >= 7.1**, which is where the new API lands. **Re-confirmed run 2 (2026-08-21):** `latest` 8.67.0, `canary` 8.67.1-alpha.24 — both still `typescript: >=4.8.4 <6.1.0`, no 9.x line. **Re-confirmed 2026-08-27:** `latest` moved to **8.68.0** and `canary` to `8.68.1-alpha.5`; the `typescript` peer is *unchanged* at `>=4.8.4 <6.1.0` and there is still **no 9.x line**. Upstream shipped a minor without touching the TS cap — movement on the package, none on this blocker. | 2026-08-27 | **TypeScript 7.1 ships** (targeted Autumn 2026) — that is the real signal, not a typescript-eslint issue. [typescript-eslint#12518](https://github.com/typescript-eslint/typescript-eslint/issues/12518) is the current tracking issue and is **closed as *not planned***: TS 7.0 ships no compiler API, so the fix is TypeScript's, not theirs. Watch the TS 7.1 release; `7.1.0-dev.*` builds publish daily. **Decision 2026-08-27: wait** — oxlint was evaluated as an alternative path and declined (see the note under Blocked majors). |
| `eslint` | 10.x | **Verified by attempt (run 1), re-confirmed against upstream metadata (run 2).** The three plugins `eslint-config-next` pulls in cap `eslint` at `^9` — and as of run 2 **all three are at their latest published version**, so this is an upstream gap, not a stale pin: `eslint-plugin-react@7.37.5` (`… ‖ ^9.7`), `eslint-plugin-import@2.32.0` (`… ‖ ^9`), `eslint-plugin-jsx-a11y@6.10.2` (`… ‖ ^9`). `eslint-config-next@16.3.2` depends on `^7.37.0` / `^2.32.0` / `^6.10.0` respectively — i.e. it already allows the newest. Installing v10 → `ERESOLVE overriding peer dependency` ×3 and `npm error invalid: eslint@10.8.1`; `eslint .` then dies with `TypeError: Error while loading rule 'react/display-name': contextOrFilename.getFilename is not a function` (`eslint-plugin-react` still calls the `context.getFilename()` API v10 removed). Zero files lintable. Reverted. **Re-confirmed 2026-08-27:** all three plugins remain at the identical latest versions (`7.37.5` / `2.32.0` / `6.10.2`) with identical `^9` caps, and `eslint-config-next@16.3.3` already permits the newest of each — an upstream gap, not a stale pin. **Partial movement:** `typescript-eslint@8.68.0` now declares `eslint: ^8.57.0 \|\| ^9.0.0 \|\| ^10.0.0`, so it is **no longer part of the blockage**; the three plugins are now the sole remaining constraint. | 2026-08-27 | Any of `eslint-plugin-react` / `-import` / `-jsx-a11y` ships ESLint 10 support |
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

> ### oxlint as a TS 7 path — evaluated 2026-08-27, decision: **wait for TS 7.1**
>
> Asked and answered; do not re-research this unless the decision below is revisited.
>
> **oxlint would genuinely unblock TS 7 for this repo**, and the reason is specific to our config:
> `eslint-config-next/typescript` builds on `typescript-eslint.configs.recommended`, **not**
> `recommendedTypeChecked`. There is no `projectService` and no `parserOptions.project` anywhere,
> so **we use zero type-aware rules**. typescript-eslint still crashes on TS 7 because its *parser*
> needs the compiler API, but oxlint parses TypeScript with its own Rust parser and never loads the
> TS compiler — so under oxlint, lint stops depending on the TypeScript version at all. Not a
> workaround; the blocker ceases to exist.
>
> Coverage is complete for what we actually use — oxlint ships all five plugins `eslint-config-next`
> pulls in: `nextjs` (~13 rules, effectively all of `@next/eslint-plugin-next`), `react` (including
> `rules-of-hooks` and `exhaustive-deps`), `jsx-a11y`, `import`, `typescript`. `@oxlint/migrate`
> converts a flat config automatically. Because we need no type-aware rules, `oxlint-tsgolint` is
> unnecessary — which also avoids its hard pin to TypeScript 7.0.2 exactly.
>
> **Decided against, for now.** TS 7's whole prize here is build-time type checking dropping from
> ~4.4s (measured 2026-08-27) to under a second — about three seconds a build. That does not justify
> replacing the linter when [typescript-eslint#12518](https://github.com/typescript-eslint/typescript-eslint/issues/12518)
> makes it free: closed as *not planned* because the fix is TypeScript's, not theirs. TS 7.0 ships no
> compiler API; **7.1 does, targeted Autumn 2026**, with `7.1.0-dev.*` builds publishing daily.
>
> **Two traps if this is revisited:**
> - `eslint-plugin-oxlint` side-by-side does **not** unblock TS 7. ESLint still loads typescript-eslint,
>   which still dies. It is a speed play only.
> - Judge oxlint as a *linter* decision, not a TypeScript one. The standing reason to consider it is
>   that it would retire the deprecated `eslint@9` hold below — unblocking TS 7 is a side effect.

> **`@types/node` version numbers do not track Node patch versions.** There is no `@types/node@24.18.0`
> (the highest 24.x is `24.13.3`). Writing an unsatisfiable range does not fail fast — it sends the npm
> resolver into pathological backtracking (~870 CPU-seconds with no output before being killed).
> Confirm the version exists with `npm view "@types/node@^24" version` before editing the range.

## Pending upstream

*(none open)*

### Resolved

| Package | Item | Outcome | Date |
|---|---|---|---|
| `next` | Pre-announced **critical** vulnerability (announced 2026-08-20, scheduled 2026-08-26) | **Shipped early, 2026-08-25** as `16.3.3` (Active LTS) and `15.5.24` (Maintenance LTS) — the `backport` dist-tag moved `15.5.23` → `15.5.24`, confirming run 2's prediction. Two critical unauthenticated RCEs, both now in the accepted table above. Repo upgraded `16.3.2` → `16.3.3`; build/lint/582 tests green. [Advisory](https://nextjs.org/blog/august-2026-security-release) | 2026-08-27 |

> **Run 2's read was correct and worth repeating:** `16.3.2` was *not* the security release
> despite landing during the announcement window. Confirm a security release by its advisory,
> never by "a newer version exists".

> ### `npm audit` and OSV both missed this — do not trust either alone
>
> Measured 2026-08-27, ~2 days after publication, against the vulnerable `next@16.3.2`:
>
> | Source | Verdict | |
> |---|---|---|
> | `npm audit` | 0 vulnerabilities / 720 packages | missed |
> | OSV `api.osv.dev` | 0 vulns | missed |
> | Vendor blog / GHSA | 2 x critical RCE | **caught** |
>
> Neither advisory database had ingested the GHSA entries. The vendor-source step is the only
> reason the highest-severity finding in this repo was found at all. Never drop it.

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

### `npm update` is an in-range upgrade AND a dedupe — always relock after it

Learned 2026-08-27, during the `next@16.3.3` security upgrade:

- **`npm install` does not apply in-range updates.** With a satisfying lockfile present it
  reported `up to date` and changed nothing, even with 8 packages showing a newer `wanted`.
  An audit step built on `npm install` alone silently applies **no** security patches.
- **`npm update` is what moves them** — and it dedupes as a side effect, re-breaking the
  lockfile in the exact `64f18f0` pattern: `ajv` hoisted to top level, the
  `@tailwindcss/oxide-wasm32-wasi/node_modules/@emnapi/*` subtree pruned (10 entries missing,
  2 spurious). `deps:verify` caught it; `deps:relock` fixed it.

So the safe upgrade sequence is three commands, not one:

```bash
npm update              # applies in-range bumps (this is the one that upgrades)
npm run deps:relock     # undo the dedupe damage before it reaches CI
npm run deps:verify     # confirm clean
```

This is the third time this exact drift has occurred, and the first time it was caught before
reaching `main` — by the guard, from Windows, as designed.

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

# Dependency Known Issues

State carried between `/audit-deps` runs so each audit starts from prior conclusions
instead of re-deriving them. Every entry needs a date and a re-check trigger.

Last audit: **2026-08-21** — report at `.claude/reports/deps-audit-2026-08-21.md`.

## Accepted advisories (triaged as not exploitable)

| Package | Advisory | Reason not exploitable | Verified | Re-check when |
|---|---|---|---|---|
| `better-auth` | 2026 CVE cluster: `CVE-2026-53513` (SSRF, CVSS 9.6, `@better-auth/sso`), `CVE-2026-53516` (OAuth auto-link ATO), `CVE-2026-45337` (`deviceAuthorization`), `CVE-2026-67336` (insecure crypto defaults in `oidcProvider`/`mcp`) | Two independent reasons: (a) all fixed in `1.6.11`+, installed is `1.7.1`; (b) the vulnerable plugins are not loaded — `src/lib/auth.ts` registers exactly `genericOAuth`, `customSession`, `nextCookies`. Repo-wide grep for `oidcProvider`, `mcp(`, `ssoPlugin`, `deviceAuthorization`, `apiKey(` matches nothing outside comments. | 2026-08-21 | Any change to the plugin list in `src/lib/auth.ts` |

### Cleared entries

| Package | Advisory | Cleared because | Date |
|---|---|---|---|
| `postcss` (bundled in `next`) | 2 moderate findings under `node_modules/next/...` | Resolved upstream in `next@16.3.1`. `npm audit` now reports 0 findings across 583 packages. | 2026-08-21 |

> The `npm audit fix --force` ban is permanent and independent of the cleared entry above:
> `--force` still "fixes" bundled-dependency findings by downgrading `next` to 9.3.3.

## Blocked majors

| Package | Target | Blocker | Verified | Re-check when |
|---|---|---|---|---|
| `typescript` | 7.x | **Verified by attempt 2026-08-21 (TS 7.0.2).** Lint only — `build` and `tests` both pass on TS 7. `eslint .` dies before linting anything: `Error: typescript-eslint does not support TS 7.0.` — an explicit runtime guard in `typescript-eslint/dist/index.js:52`, not merely a peer-range mismatch. Root cause: **TypeScript 7.0 ships no compiler API at all**, and typescript-eslint needs one. Both `latest` (8.67.0) and `canary` (8.67.1-alpha.24) still declare `typescript: >=4.8.4 <6.1.0`; there is no typescript-eslint 9.x line. Upstream is explicitly targeting **TS >= 7.1**, which is where the new API lands. | 2026-08-21 | typescript-eslint ships TS >= 7.1 support — track [typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940) and the TS 7.1 release |
| `eslint` | 10.x | **Verified by attempt, not by inference.** `eslint-config-next@16.3.1` *vendors* `eslint-plugin-react`, `eslint-plugin-import`, and `eslint-plugin-jsx-a11y` under its own `node_modules`, and all three cap `eslint` at `^9`. Installing v10 → `ERESOLVE overriding peer dependency` ×3 and `npm error invalid: eslint@10.8.1`; `eslint .` then dies with `TypeError: Error while loading rule 'react/display-name': contextOrFilename.getFilename is not a function` (`eslint-plugin-react` still calls the `context.getFilename()` API v10 removed). Zero files lintable. Reverted. | 2026-08-21 | `eslint-config-next` ships a release whose bundled `eslint-plugin-react` / `-import` / `-jsx-a11y` accept ESLint 10 |
| `@types/node` | 26.x | The `@types/node` major tracks the Node major; local runtime is Node **24.18.0**. Resolved this audit by realigning **down** to `^24.13.3` (see Held). Going to 26 would put types two majors ahead of the runtime. | 2026-08-21 | Local/CI/production Node moves to 26 |

> **Do not check only the top-level peer of `eslint-config-next`.** Its declared peer is
> `eslint: >=9.0.0`, which is misleading — the binding constraint lives in the plugins it bundles
> under `node_modules/eslint-config-next/node_modules/`. Check those before proposing an ESLint major.

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
| `next` | Pre-announced **critical** vulnerability | Patches `16.3.2` / `15.5.24` scheduled for **2026-08-26**; advisory unpublished as of this audit. Installed `16.3.1` is the latest available — no action possible yet. [Announcement](https://nextjs.org/blog/upcoming-nextjs-security-release-august-2026) (published 2026-08-20). | On/after **2026-08-26** |

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

## Open items awaiting a decision (not blockers)

| Item | Detail | Raised |
|---|---|---|
| `pkce: false` in `src/lib/auth.ts` | Not a dependency issue, but a live security posture item: MP discovery advertises `S256`, so PKCE can likely be enabled. Needs its own change + test. | 2026-08-21 |
| `vitest.config.ts` CJS/ESM warning | Vite 8 warns the config uses ESM syntax while loaded as CommonJS and that `configLoader: 'native'` will become the default. Pre-existing. Fix: rename to `vitest.config.mts`. | 2026-08-21 |

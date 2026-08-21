# Dependency Audit — 2026-08-21

Baseline: `c77b15c` (clean tree) · node v24.18.0 · npm 11.16.0
Audited tree = `package.json` as of `c77b15c`, verified via `npm ls --all` (no `invalid`/`missing`;
all `UNMET OPTIONAL` entries are cross-platform native binaries and are expected on Windows).

## Summary

Zero exploitable vulnerabilities. `npm audit` reports **0 findings** across 583 packages, and OSV
returns no advisories for any installed version of the 17 packages checked individually — including
every runtime-critical one. 32 direct dependencies were updated in-range (`npm update`, no
`package.json` range edits) and build, lint, and the full 279-test suite all pass.

Four approved changes were then applied on top: **`openai` removed** (it was a declared runtime
dependency with zero usage anywhere in the repo), **`@types/node` realigned `^25` → `^24`** to match
the Node 24.18.0 runtime, and dev majors **`jsdom` 30**, **`chalk` 6**, and **`jest-dom` 7** (plus an
explicit `@testing-library/dom`). A fifth, **ESLint 10, was attempted and reverted** — see below.

**ESLint 10 is blocked, contrary to the initial phase-5 assessment.** The peer ranges of
`eslint-config-next` and `typescript-eslint` do accept v10, but `eslint-config-next@16.3.1` *vendors*
`eslint-plugin-react`, `eslint-plugin-import`, and `eslint-plugin-jsx-a11y` under its own
`node_modules`, and all three cap `eslint` at `^9`. Installing v10 produced `ERESOLVE overriding peer
dependency` and `invalid:` in `npm ls`, and `eslint .` then failed outright:
`TypeError: Error while loading rule 'react/display-name': contextOrFilename.getFilename is not a
function` — `eslint-plugin-react` still calls the `context.getFilename()` API that v10 removed. Not
a single file could be linted. Reverted; lint is green again on 9.39.5.

One forward-looking item, no action available: Next.js has **pre-announced a critical-severity
vulnerability** with patches (16.3.2 / 15.5.24) landing **2026-08-26**. We are on 16.3.1, the current
latest — there is nothing to upgrade to yet. Re-run this audit on or after Aug 26.

## Security findings

| Package | Advisory | Severity | Exposure here | Scope | Evidence | Action |
|---|---|---|---|---|---|---|
| `next` | Pre-announced, undisclosed (patch = 16.3.2, due 2026-08-26) | Critical (vendor-stated) | **Pending** — unknowable; advisory not published | runtime | [nextjs.org announcement, published 2026-08-20](https://nextjs.org/blog/upcoming-nextjs-security-release-august-2026); installed 16.3.1 is the latest 16.3.x | None available. Re-audit on/after 2026-08-26 and upgrade to 16.3.2 |
| — | `npm audit` | — | none | — | 0 findings, 583 packages audited | — |
| — | OSV (17 packages) | — | none | — | `next@16.3.1`, `react`/`react-dom@19.2.6`, `better-auth@1.7.1`, `zod@4.4.3`, `openai@6.38.0`, `dotenv@17.4.2`, `vitest@4.1.6`, `vite@8.1.4`, `esbuild@0.28.1`, `jsdom@29.1.1`, `tsx@4.22.1`, `postcss@8.5.23`, `tailwindcss@4.3.0`, `eslint@9.39.4`, `typescript@6.0.3`, `react-hook-form@7.76.0`, `lucide-react@1.16.0` — all clean | — |

### Not exploitable — do not "fix"

- **`better-auth` — the 2026 CVE cluster** (`CVE-2026-53513` SSRF/CVSS 9.6 in `@better-auth/sso`,
  `CVE-2026-53516` OAuth auto-link account takeover, `CVE-2026-45337` `deviceAuthorization`,
  `CVE-2026-67336` insecure crypto defaults in `oidcProvider`/`mcp`). Two independent reasons this
  does not apply: **(a)** all are fixed in `1.6.11`+ and this repo runs `1.7.1`; **(b)** the
  vulnerable plugins are not loaded. Re-verified against `src/lib/auth.ts` on 2026-08-21 — the
  plugin list is exactly `genericOAuth`, `customSession`, `nextCookies`. A repo-wide grep for
  `oidcProvider`, `mcp(`, `ssoPlugin`, `deviceAuthorization`, `apiKey(` matches nothing outside
  comments.
- **`postcss` bundled inside `next`** — the 2 moderate findings recorded in the prior audit are
  **gone as of `next@16.3.1`**. `npm audit` returns 0. This entry has been cleared from the
  known-issues file. The `npm audit fix --force` ban stands regardless: it still resolves such
  findings by downgrading `next` to 9.3.3.

### Observations (not dependency vulnerabilities)

- `src/lib/auth.ts` sets `pkce: false` on the `genericOAuth` provider. The adjacent code comment
  notes MP discovery advertises `code_challenge_methods_supported: ["plain","S256"]`, so PKCE can
  likely be enabled. OAuth 2.1 makes PKCE the default for good reason; enabling it removes
  authorization-code interception risk. Out of scope for a dependency audit — worth a separate,
  separately-tested change.
- `@types/node` is declared `^25` while the local runtime is **Node 24.18.0**. The `@types/node`
  major tracks the Node major, so the type surface currently describes APIs the runtime may not
  have. See "Needs your decision".

## Updates

### Applied — Tier 1 (in-range, no `package.json` change)

| Package | Change |
|---|---|
| `@hookform/resolvers` | 5.2.2 → 5.9.1 |
| `@inquirer/prompts` | 8.4.3 → 8.6.0 |
| `@radix-ui/react-alert-dialog` | 1.1.15 → 1.1.23 |
| `@radix-ui/react-avatar` | 1.1.11 → 1.2.6 |
| `@radix-ui/react-checkbox` | 1.3.3 → 1.3.11 |
| `@radix-ui/react-dialog` | 1.1.15 → 1.1.23 |
| `@radix-ui/react-dropdown-menu` | 2.1.16 → 2.1.24 |
| `@radix-ui/react-label` | 2.1.8 → 2.1.15 |
| `@radix-ui/react-radio-group` | 1.3.8 → 1.4.7 |
| `@radix-ui/react-select` | 2.2.6 → 2.3.7 |
| `@radix-ui/react-slot` | 1.2.4 → 1.3.3 |
| `@radix-ui/react-switch` | 1.2.6 → 1.3.7 |
| `@radix-ui/react-tooltip` | 1.2.8 → 1.2.16 |
| `@tailwindcss/postcss` | 4.3.0 → 4.3.3 |
| `@tailwindcss/typography` | 0.5.19 → 0.5.20 |
| `@types/node` | 25.8.0 → 25.9.5 |
| `@types/react` | 19.2.14 → 19.2.18 |
| `@types/react-dom` | 19.2.3 → 19.2.4 |
| `@vitejs/plugin-react` | 6.0.2 → 6.1.0 |
| `@vitest/coverage-v8` | 4.1.6 → 4.1.11 |
| `autoprefixer` | 10.5.0 → 10.5.4 |
| `eslint` | 9.39.4 → 9.39.5 |
| `eslint-config-next` | 16.2.6 → **16.3.1** (now aligned with `next@16.3.1`; was a minor-line mismatch) |
| `lucide-react` | 1.16.0 → **1.33.0** (largest in-range jump; build + lint clean) |
| `openai` | 6.38.0 → 6.49.0 |
| `postcss` | 8.5.23 → 8.5.26 |
| `react` | 19.2.6 → 19.2.8 |
| `react-dom` | 19.2.6 → 19.2.8 |
| `react-hook-form` | 7.76.0 → 7.85.0 |
| `tailwindcss` | 4.3.0 → 4.3.3 |
| `tsx` | 4.22.1 → 4.23.12 |
| `vitest` | 4.1.6 → 4.1.11 |

Transitively, `typescript-eslint` moved 8.59.3 → **8.67.0** (via `eslint-config-next@16.3.1`), which
is what unblocks ESLint 10 — see below.

**Tier 2 (range bumps, non-major): none required.** Every non-major `latest` is already reachable
inside the declared `^` ranges, so `package.json` needed no edits at all.

### Tier 3 — majors remaining

| Package | Current | Latest | Scope | Verdict |
|---|---|---|---|---|
| `openai` | 6.49.0 | 7.5.0 | runtime (declared) | **Removed** — unused |
| `eslint` | 9.39.5 | 10.8.1 | dev | **Attempted → BLOCKED**, reverted |
| `@testing-library/jest-dom` | 6.9.1 | 7.0.1 | dev | **Applied** (+ explicit `@testing-library/dom`) |
| `jsdom` | 29.1.1 | 30.0.1 | dev | **Applied** |
| `chalk` | 5.6.2 | 6.0.0 | dev | **Applied** |
| `typescript` | 6.0.3 | 7.0.2 | dev/build | **Blocked** (unchanged) |
| `@types/node` | 25.9.5 | 26.2.0 | dev | **Realigned down to `^24.13.3`** to match the runtime |

### Applied — Tier 3, second pass (approved 2026-08-21)

`package.json` diff, verified green after each individual change:

```diff
   dependencies:
-    "openai": "^6.32.0",

   devDependencies:
+    "@testing-library/dom": "^10.4.1",
-    "@testing-library/jest-dom": "^6.9.1",
+    "@testing-library/jest-dom": "^7.0.1",
-    "@types/node": "^25.5.0",
+    "@types/node": "^24.13.3",
-    "chalk": "^5.6.2",
+    "chalk": "^6.0.0",
-    "jsdom": "^29.0.0",
+    "jsdom": "^30.0.1",
```

- **`openai` removed.** Single-package footprint; `npm install` removed exactly 1 package. Build,
  lint, and 279 tests green afterward — confirming nothing referenced it.
- **`@types/node` → `^24.13.3`.** Note `24.18.0` (the *Node* version) does not exist as an
  `@types/node` release — the highest 24.x is **24.13.3**. Writing the unsatisfiable `^24.18.0` sent
  the npm resolver into pathological backtracking (killed after ~870 CPU-seconds with no output)
  rather than failing fast; the corrected range installed in under a second. Type-check is clean, so
  nothing in the codebase depended on a Node 25-only API.
- **`jsdom` → 30.0.1.** 279/279 tests pass.
- **`chalk` → 6.0.0.** Verified by actually running the one consumer: `npm run setup:check` renders
  colored output and completes all 8 checks. (That script reports `Missing: BETTER_AUTH_SECRET,
  BETTER_AUTH_URL` — pre-existing and unrelated; per CLAUDE.md those have `NEXTAUTH_*` fallbacks,
  which is what `.env.local` appears to use.)
- **`jest-dom` → 7.0.1** with `@testing-library/dom@^10.4.1` promoted from transitive to an explicit
  `devDependency`, as v7 requires. No `invalid:` peers afterward.

### Rejected — ESLint 10 (attempted, reverted)

| Step | Result |
|---|---|
| `"eslint": "^10.8.1"` + `npm install` | `npm warn ERESOLVE overriding peer dependency` ×3; `npm error invalid: eslint@10.8.1` |
| `npm run lint` | **Hard failure.** `TypeError: Error while loading rule 'react/display-name': contextOrFilename.getFilename is not a function` at `eslint-config-next/node_modules/eslint-plugin-react/lib/util/version.js:31` |
| Revert | Range restored to `^9.39.2`, `npm install` re-resolved the lockfile (not `git checkout` — the lockfile also carries the changes being kept). `npm ls` clean, `eslint .` green. |

The blocker is **not** `eslint-config-next` or `typescript-eslint` — both accept v10 in their declared
peers. It is the three ESLint plugins `eslint-config-next@16.3.1` vendors under its own
`node_modules`, each capped at `eslint: ^9`:

| Vendored plugin | Declared `eslint` peer |
|---|---|
| `eslint-plugin-import` | `^2 \|\| ^3 \|\| ^4 \|\| ^5 \|\| ^6 \|\| ^7.2.0 \|\| ^8 \|\| ^9` |
| `eslint-plugin-jsx-a11y` | `^3 \|\| ^4 \|\| ^5 \|\| ^6 \|\| ^7 \|\| ^8 \|\| ^9` |
| `eslint-plugin-react` | `^3 \|\| ^4 \|\| ^5 \|\| ^6 \|\| ^7 \|\| ^8 \|\| ^9.7` |

Checking only the top-level peer of `eslint-config-next` is not sufficient for this package — its
vendored plugin tree has to be checked too. Recorded in the known-issues file so the next run does
not retry it blindly.

## Verification

Full pass run after Tier 1, and again after each individual Tier 3 change. **Final tree:**

- **build**: **pass** — `next build` (Turbopack), Next.js 16.3.1, TypeScript check clean, 8 routes emitted.
- **lint**: **pass** — `eslint .`, no output (zero errors, zero warnings).
- **tests**: **pass** — 21 files, **279/279 tests passed**.
- **audit**: **0 vulnerabilities**, 595 packages.
- **`npm ls`**: no `invalid:` peers.
- **`npm outdated`**: only the 3 documented holds remain (`@types/node` 26, `eslint` 10, `typescript` 7).

Pre-existing, not introduced by this audit: `vitest run` emits a Vite 8 forward-compat warning that
`vitest.config.ts` uses ESM syntax while being loaded as CommonJS, and that `configLoader: 'native'`
will become the default in a future Vite major. Renaming to `vitest.config.mts` clears it. Not
applied — source change, outside this command autonomy contract.

Also restored: `next-env.d.ts`. Running `next build` rewrites its route-type imports from
`./.next/dev/types/...` to `./.next/types/...`; `next dev` writes them back. That churn is an
artifact of verification, not a change, so it was reverted with `git checkout` to keep the diff
dependency-only.

## Decisions taken (all four approved and acted on 2026-08-21)

The four items below were presented for approval; all were approved. Outcomes are recorded above —
three applied as proposed, one (ESLint 10) attempted and reverted on hard evidence.

1. **Remove `openai` — approved and applied.** It is declared in `dependencies` at `^6.32.0` but has **zero
   references** anywhere: no `import`/`require` in `src/` or `scripts/`, no `OPENAI*` environment
   variable, no reference in any config. The only mentions in the repo are `package.json` itself and
   the `/audit-deps` command doc that lists it as security-critical. Carrying it means auditing and
   patching a runtime dependency that ships nothing. Removing it also makes the major upgrade moot.
   *Alternative if it is scaffolding for planned work:* move it to `devDependencies`, or bump to
   `^7` now while nothing depends on the v6 API surface.

2. **ESLint 9 → 10 — approved, attempted, BLOCKED** (see "Rejected — ESLint 10" above). The
   reasoning below is preserved because it was the basis for approval, and because it shows exactly
   where the pre-flight check fell short: it verified the top-level peers but not the plugin tree
   `eslint-config-next` vendors. ESLint 9.39.5 is **deprecated upstream** — npm prints "This
   version is no longer supported" on install. Both recorded blockers have cleared:
   `typescript-eslint@8.67.0` now declares `eslint: ^8.57.0 || ^9.0.0 || ^10.0.0`, and
   `eslint-config-next@16.3.1` declares `eslint: >=9.0.0`. Node 24.18.0 satisfies the ESLint 10
   engine range `^20.19.0 || ^22.13.0 || >=24`. Blast radius is small: this repo is already pure
   flat config (`eslint.config.mjs`, one root file, no `.eslintrc*` anywhere), so the headline
   breaking change — removal of the legacy eslintrc system — does not touch it. The one thing that
   could surface new findings is the new JSX reference tracking in v10, which changes scope analysis
   in `.tsx` files; that shows up immediately as lint output, and this is lint-only with no runtime
   effect.

3. **Dev-tooling majors — approved and applied (all three).** `jsdom` 29→30, `chalk` 5→6,
   `@testing-library/jest-dom` 6→7. All three
   are test/script-only and engine-compatible with Node 24.18.0.
   - `jsdom` 30: engine bump to `^22.22.2 || ^24.15.0 || >=26`, plus `CSS.escape()`/`CSS.supports()`
     and `getComputedStyle()` pixel-conversion fixes. Consumed only as `environment: 'jsdom'` in
     `vitest.config.ts`; the `vitest` peer on it is `*`.
   - `chalk` 6: requires Node ≥22, treats numeric `FORCE_COLOR` as an exact level. One consumer,
     `scripts/setup.ts:19`, using basic color methods.
   - `jest-dom` 7: requires Node ≥22 and makes `@testing-library/dom` an **explicit** peer. It is
     currently only transitive (`@testing-library/react@16.3.2` → `@testing-library/dom@10.4.1`,
     which satisfies `>=10 <11`), so this upgrade also means **adding `@testing-library/dom` to
     `devDependencies`** — a new dependency, hence the approval. Consumed only via
     `src/test-setup.ts:1`.

4. **`@types/node` — approved: realigned to `^24` (resolved `24.13.3`), not `^26`.** The
   `@types/node` major tracks the Node
   major, and the local runtime is **Node 24.18.0** while the declared range is `^25`. The tree is
   already a major *ahead* of its runtime, which lets `tsc` accept Node 25 APIs that Node 24 does
   not have. Going to `^26` widens that gap. The `vitest` peer (`^20 || ^22 || >=24`) is satisfied
   by any of them, so this is purely about type fidelity. I would align it to `^24` — but confirm
   the deployment target Node version first, since CI/production may not be on 24.

## Deferred / blocked

- **`eslint` 10.8.1** — blocked by the ESLint plugins vendored inside `eslint-config-next@16.3.1`
  (`eslint-plugin-react`, `eslint-plugin-import`, `eslint-plugin-jsx-a11y`, all capped at `^9`).
  Verified by attempt, 2026-08-21. Re-check when `eslint-config-next` ships a release whose bundled
  plugins accept ESLint 10 — in particular when `eslint-plugin-react` drops `context.getFilename()`.
- **`typescript` 7.0.2** — still blocked, re-verified 2026-08-21. `typescript-eslint@8.67.0` (latest)
  caps its peer at `typescript: >=4.8.4 <6.1.0`. Re-check when typescript-eslint widens that range.
- **`next` 16.3.2** — not yet published. Re-check 2026-08-26.
- **`@types/node` 26** — held pending the runtime-version decision above.

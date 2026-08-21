# Dependency Audit — 2026-08-21 (run 2)

Baseline: audited tree = `package.json` as of `4446294` (clean working tree at start)
· node v24.18.0 · npm 11.16.0

> Second audit run on the same date. The earlier run's report is preserved at
> `.claude/reports/deps-audit-2026-08-21.md`; this file does not replace it.

## Summary

Zero advisories across every source checked — `npm audit` reports 0 findings over 583
packages, and OSV returns 0 vulnerabilities for all 11 security-critical runtime and dev
packages at their installed versions. One in-range update was available and applied:
`next` and `eslint-config-next` 16.3.1 → 16.3.2. **The pre-announced critical Next.js
vulnerability is still unpatched** — 16.3.2 shipped today, but as a bug-fix backport, not
the security release. No major upgrade is actionable: all three re-verified as blocked or
deliberately held. Nothing needs a decision from you.

## Security findings

| Package | Advisory | Severity | Exposure here | Scope | Evidence | Action |
|---|---|---|---|---|---|---|
| — | none | — | — | — | `npm audit` = 0 findings / 583 pkgs; OSV = 0 vulns for `next`, `react`, `react-dom`, `better-auth`, `zod`, `dotenv`, `tsx`, `vitest`, `jsdom`, `esbuild`, `vite` | none |

### Unpatched upstream — tracked, no action possible

**`next` — pre-announced critical vulnerability.** Vercel
[announced](https://nextjs.org/blog/upcoming-nextjs-security-release-august-2026)
(published 2026-08-20) one **critical** severity vulnerability, with patches scheduled for
**2026-08-26**.

The announcement names `16.3.2` and `15.5.24` as the patch versions. `16.3.2` **has already
shipped** (published 2026-08-21T09:36:39Z) — but its release notes are explicitly
bug-fixes-only and carry no security content:

> This release is backporting bug fixes. It does **not** include all pending features/changes on canary.

Six listed changes, all Turbopack / app-router / Turborepo-OIDC fixes. No CVE, no advisory,
and `15.5.24` does not exist (the `backport` dist-tag is still `15.5.23`).

**Conclusion: 16.3.2 is not the security release, and upgrading to it does not address the
critical vulnerability.** The announced version numbering will presumably shift (16.3.3 /
15.5.24), or the advisory will land separately on 08-26. Installed `16.3.2` is the newest
available, so no action is possible today. Re-check on/after **2026-08-26**.

### Not exploitable — do not "fix"

**`better-auth` 2026 CVE cluster** (`CVE-2026-53513` SSRF CVSS 9.6, `CVE-2026-53516` OAuth
auto-link ATO, `CVE-2026-45337` deviceAuthorization, `CVE-2026-67336` insecure crypto
defaults) — re-verified this run, reason still holds on two independent grounds:

1. All fixed in `1.6.11`+; installed is `1.7.1`.
2. The vulnerable plugins are not loaded. `src/lib/auth.ts` registers exactly
   `genericOAuth` (line 77), `customSession` (line 164), `nextCookies` (line 186).
   A grep of `src/` and `scripts/` for `oidcProvider`, `ssoPlugin`,
   `deviceAuthorization`, `apiKey(`, `mcp(` returns **no matches**.

OSV independently returns 0 vulns for `better-auth@1.7.1`.

## Updates

| Package | Current | Wanted | Latest | Tier | Risk | Notes |
|---|---|---|---|---|---|---|
| `next` | 16.3.1 | 16.3.2 | 16.3.2 | 1 (in-range) | Low | Applied. Bug-fix backport; **not** the security patch |
| `eslint-config-next` | 16.3.1 | 16.3.2 | 16.3.2 | 1 (in-range) | Low | Applied alongside `next` |
| `@types/node` | 24.13.3 | 24.13.3 | 26.2.0 | 4 (held) | — | Held one major below latest to match the Node 24.18.0 runtime |
| `eslint` | 9.39.5 | 9.39.5 | 10.8.1 | 3 (blocked) | — | Blocked upstream at the plugin layer — see below |
| `typescript` | 6.0.3 | 6.0.3 | 7.0.2 | 3 (blocked) | — | Blocked by typescript-eslint — see below |

No Tier 2 range bumps were available: every other dependency is already at `latest`.

### Blocked majors — re-verified this run, not inherited

**`eslint` 10.x — blocked, and the prior diagnosis is now stronger.** All three plugins
that `eslint-config-next` pulls in are at their **latest published versions** and none
accepts ESLint 10:

| Plugin | Latest | `eslint` peer range |
|---|---|---|
| `eslint-plugin-react` | 7.37.5 | `^3 \|\| … \|\| ^9.7` |
| `eslint-plugin-import` | 2.32.0 | `^2 \|\| … \|\| ^9` |
| `eslint-plugin-jsx-a11y` | 6.10.2 | `^3 \|\| … \|\| ^9` |

This is not a stale pin in `eslint-config-next@16.3.2` (which depends on
`eslint-plugin-react@^7.37.0`, `eslint-plugin-import@^2.32.0`,
`eslint-plugin-jsx-a11y@^6.10.0`) — the plugins themselves have shipped **no** ESLint 10
support at all. Nothing to wait on downstream; upstream must move first.

*Correction to the prior run's note:* in the current tree these plugins resolve **hoisted
at top level** (`node_modules/eslint-plugin-react`), not nested under
`eslint-config-next/node_modules/`. The binding constraint is identical either way, but
check the resolved plugin versions rather than a fixed nested path.

**`typescript` 7.x — blocked, unchanged.** `typescript-eslint@latest` (8.67.0) and
`@canary` (8.67.1-alpha.24) *both* still declare `typescript: >=4.8.4 <6.1.0`. There is no
9.x line. As established last run, the blocker is lint alone — build and tests pass on
TS 7 — because TypeScript 7.0 ships no compiler API and typescript-eslint requires one.
Upstream targets TS >= 7.1.

**`@types/node` 26.x — held, unchanged.** Local runtime is still Node 24.18.0. Moving types
two majors ahead of the runtime would let `tsc` accept APIs that do not exist at runtime.

## Applied

`package.json` **unchanged** — no version range was modified. Lockfile only:

```
package-lock.json | 276 +++++++++++++-------------------------
1 file changed, 93 insertions(+), 183 deletions(-)
```

- `next` 16.3.1 → 16.3.2 (plus all 8 `@next/swc-*` platform binaries and `@next/env`)
- `eslint-config-next` 16.3.1 → 16.3.2, `@next/eslint-plugin-next` 16.3.1 → 16.3.2
- Dedupe/hoist churn, no version regressions: `ajv@6.15.0` and
  `json-schema-traverse@0.4.1` hoisted to top level; `whatwg-url` 16.0.1 → 17.1.0 hoisted
  from `jsdom`; six `@emnapi`/`@napi-rs`/`@tybys` copies under the
  `@tailwindcss/oxide-wasm32-wasi` optional tree pruned.

Applied via `npm update` (in-range only). Plain `npm install` was a no-op — the lockfile
already satisfied `package.json`, so it held at 16.3.1. `npm audit fix` was not needed at
0 findings. `--force` was never used.

## Verification

- **build**: **pass** — `next build` (Turbopack), 16.3.2, compiled in 3.5s, TypeScript
  check 1798ms, 7/7 static pages, 8 routes + proxy
- **lint**: **pass** — `eslint .`, exit 0, no warnings
- **tests**: **pass** — 21/21 files, **279/279** tests, 2.87s

## Needs your decision

Nothing. No major is in a state worth attempting — each blocker was re-verified above
against current upstream metadata.

## Deferred / blocked

| Item | Reason | Re-check trigger |
|---|---|---|
| `next` critical vulnerability | Advisory unpublished; 16.3.2 is a bug-fix backport, not the patch. Installed version is already the newest available | On/after **2026-08-26** |
| `eslint` 10.x | `eslint-plugin-react` / `-import` / `-jsx-a11y` at latest cap at `^9` | Any of the three ships ESLint 10 support |
| `typescript` 7.x | `typescript-eslint` latest + canary both cap at `<6.1.0`; TS 7.0 has no compiler API | typescript-eslint ships TS >= 7.1 support ([#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940)) |
| `@types/node` 26.x | Runtime is Node 24.18.0 | Runtime moves to 26 |

### Pre-existing, unrelated to dependencies

- `vitest.config.ts` CJS/ESM warning — Vite 8 warns the config uses ESM syntax while loaded
  as CommonJS, and that `configLoader: 'native'` becomes the default in a future major.
  Fix: rename to `vitest.config.mts`. Still present; not a blocker.
- `pkce: false` at `src/lib/auth.ts:102` — security posture item, not a dependency issue.
  MP discovery advertises `S256`, so PKCE can likely be enabled. Needs its own change + test.
- `npm warn allow-scripts` for `esbuild@0.28.2` and `unrs-resolver@1.12.2` — npm 11
  install-script gating; both are expected native-binary postinstalls. Informational.

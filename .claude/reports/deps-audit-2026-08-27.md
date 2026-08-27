# Dependency Audit — 2026-08-27

Baseline: `89436f0` · node v24.18.0 · npm 11.16.0
Prior runs: [2026-08-21](deps-audit-2026-08-21.md), [2026-08-21 run 2](deps-audit-2026-08-21-run2.md)

## Summary

The Next.js critical security release that the last audit was waiting on **shipped on
2026-08-25**, one day ahead of its announced date. It patches **two critical unauthenticated
RCE vulnerabilities**. This repo was running the vulnerable `next@16.3.2`; it is now on
`16.3.3`, applied as an ordinary in-range update with no `package.json` change.

Both vulnerabilities triage to **Not exploitable in this application** — but only because of
specific, verifiable properties of this codebase that a future commit could quietly remove.
Both re-check triggers are recorded in the known-issues file.

Notably, **`npm audit` and OSV both reported zero findings for the vulnerable version**. The
advisory was only visible at the vendor source. A single-source audit would have declared this
repo clean while it was running a critical unauthenticated RCE.

Six other in-range updates rode along. All three remaining majors stay blocked or held for
unchanged upstream reasons. Nothing needs your decision.

## Security findings

| Package | Advisory | Severity | Exposure here | Scope | Evidence | Action |
|---|---|---|---|---|---|---|
| `next` | [GHSA-2xp9-vwfh-vxw4](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4) — AVIF image-optimization RCE via `libheif`/`sharp` | **Critical** | **Not exploitable** (3 independent reasons) | runtime | `next.config.ts` (no `images` config); 3 `<Image>` call sites; `public/` | **Patched anyway** → `16.3.3` |
| `next` | [CVE-2026-75604](https://www.cve.org/CVERecord?id=CVE-2026-75604) / [GHSA-p293-qw3h-jr36](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36) — Windows-hosted server RCE | **Critical** | **Not exploitable** (one of two preconditions fails) | runtime | no source `pages/`; no `getServerSideProps`/`getStaticProps`/`next/router` in `src/` | **Patched anyway** → `16.3.3` |

Advisory published **2026-08-25**; `16.3.3` published 2026-08-25T15:32:19Z, `15.5.24` at
16:14:06Z. Source: [August 2026 Security Release](https://nextjs.org/blog/august-2026-security-release).

### Why the scanners missed this

| Source | Verdict on `next@16.3.2` | |
|---|---|---|
| `npm audit` | 0 vulnerabilities / 720 packages | ❌ missed |
| OSV (`api.osv.dev`) | 0 vulns | ❌ missed |
| Vendor blog / GHSA | 2 × critical RCE | ✅ caught |

Neither advisory database had ingested the GHSA entries ~2 days after publication. Keep the
vendor-source step in this audit; it is the only thing that found the highest-severity issue
in the repo.

### Not exploitable — do not "fix"

**GHSA-2xp9-vwfh-vxw4 (AVIF RCE)** — requires Next.js to optimize an *attacker-controlled*
AVIF image. Three independent reasons that cannot happen here:

1. **All three `<Image>` call sites pass `unoptimized`**, bypassing the Image Optimization API
   entirely — `contact-lookup-results.tsx:95`, `contact-lookup-details.tsx:78`,
   `layout/header.tsx:60`.
2. **`next.config.ts` declares no `images.remotePatterns` / `images.domains`** (the file is an
   empty config). With an empty allowlist `/_next/image` rejects every remote URL, so an
   attacker cannot point the optimizer at a hostile AVIF — this is what makes the MP-hosted
   avatar URLs unreachable through the optimizer too.
3. **The only local file the optimizer could reach is `public/assets/icons/favicon.ico`** —
   repo-committed, not attacker-controlled.

Note `/_next/image` *is* unauthenticated by design: `src/proxy.ts:32` excludes it from the
protected matcher. That is correct and unchanged, but it means reasons 1–3 are the whole
defense — re-check them before enabling image optimization.

**CVE-2026-75604 (Windows RCE)** — requires **both** preconditions:

- *Windows filesystem* — **met.** Development runs on Windows 11.
- *Both Pages Router and App Router in use* — **not met.** App Router only (`src/app/`); no
  source `pages/` directory, and no `getServerSideProps` / `getStaticProps` / `next/router`
  anywhere in `src/`. The `./.next/server/pages` path found on disk is a build artifact Next.js
  emits for internal error pages, not a Pages Router adoption.

Because the OS half of the precondition *is* satisfied here, this one had a narrower margin
than the AVIF issue — introducing a single `pages/` route would have made it live. Patched.

## Updates

| Package | Current | Wanted | Latest | Tier | Risk | Notes |
|---|---|---|---|---|---|---|
| `next` | 16.3.2 | **16.3.3** | 16.3.3 | 1 | low | **Critical security fix.** In range of `^16.1.6` |
| `sharp` (transitive) | 0.35.3 | **0.35.4** | — | 1 | low | Pulled in by `next@16.3.3`; the AVIF-vulnerable dep |
| `eslint-config-next` | 16.3.2 | 16.3.3 | 16.3.3 | 1 | low | Tracks `next` |
| `better-auth` | 1.7.1 | 1.7.2 | 1.7.2 | 1 | low | Auth-critical; OSV clean at both versions |
| `lucide-react` | 1.33.0 | 1.34.0 | 1.34.0 | 1 | low | Icons |
| `react-hook-form` | 7.85.0 | 7.86.0 | 7.86.0 | 1 | low | |
| `@inquirer/prompts` | 8.6.0 | 8.7.0 | 8.7.0 | 1 | low | dev — setup wizard |
| `@types/react-dom` | 19.2.4 | 19.2.5 | 19.2.5 | 1 | low | dev — types |
| `@types/node` | 24.13.3 | 24.13.3 | 26.4.0 | 4 | — | **Held** at `^24` to match Node 24.18.0 runtime |
| `eslint` | 9.39.5 | 9.39.5 | 10.9.1 | 4 | — | **Blocked** — plugin peers cap at `^9` |
| `typescript` | 6.0.3 | 6.0.3 | 7.0.2 | 4 | — | **Blocked** — typescript-eslint has no TS 7 support |

## Applied

- `npm update` → the eight in-range bumps above. **`package.json` unchanged** — no version
  range was modified, so nothing here required approval.
- `npm audit fix` (no `--force`) → no-op; 0 advisories in the registry data.
- `npm run deps:relock` → **required.** See below.

`git diff --stat`: `package-lock.json` only, 451 insertions / 451 deletions.

### The lockfile guard earned its keep again

`npm install` alone reported "up to date" and applied nothing — it honors the existing
lockfile when it satisfies `package.json`. **`npm update` is what actually moves in-range
dependencies**, and it dedupes as a side effect. That dedupe re-broke the lockfile for Linux CI
in the exact documented pattern:

```
✗ package-lock.json does not match Linux resolution.
  Missing entries that Linux needs (10):
    + node_modules/eslint/node_modules/ajv
    + node_modules/@eslint/eslintrc/node_modules/ajv  (+ json-schema-traverse)
    + node_modules/@tailwindcss/oxide-wasm32-wasi/node_modules/@emnapi/*  (6 entries)
  Entries Linux resolution does not produce (2):
    - node_modules/ajv
    - node_modules/json-schema-traverse
```

This is the `64f18f0` incident reproduced precisely — `ajv` hoisted to top level, the
`@emnapi/*` subtree pruned. `npm run deps:relock` fixed it; `npm run deps:verify` now passes.
Had this been committed unchecked, CI would have died at the install step before running a
single test.

**Carry forward:** the audit's "apply safe updates" step must be `npm update`, and `npm update`
*always* requires a relock afterward on Windows.

## Verification

| Step | Result |
|---|---|
| `npm run deps:verify` | ✅ pass — lockfile tree matches Linux resolution |
| `npm run build` | ✅ pass — compiled in 6.3s, TypeScript 4.4s, 7/7 static pages, 8 routes |
| `npm run lint` | ✅ pass — clean, no warnings |
| `npm run test:run` | ✅ pass — **582/582 tests, 32/32 files**, 23.29s |

## Needs your decision

**Nothing.** No major upgrade is currently viable, and no in-range change required approval.

## Deferred / blocked

| Item | Status | Re-check trigger |
|---|---|---|
| `typescript` 7.x | Blocked, **re-confirmed**. typescript-eslint moved 8.67.0 → **8.68.0**; its `typescript` peer is *still* `>=4.8.4 <6.1.0`, and there is still **no 9.x line** (newest is `8.68.1-alpha.5`). TS 7 ships no compiler API; upstream targets TS ≥ 7.1. | typescript-eslint ships TS ≥ 7.1 support |
| `eslint` 10.x | Blocked, **re-confirmed**. `eslint-plugin-react@7.37.5` (`^9.7`), `eslint-plugin-import@2.32.0` (`^9`), `eslint-plugin-jsx-a11y@6.10.2` (`^9`) — all still at latest, all still capped at `^9`. `eslint-config-next@16.3.3` already permits the newest of each, so this is an upstream gap. **Partial movement:** `typescript-eslint@8.68.0` now accepts `^10.0.0`, so it is no longer part of the blockage — the three plugins are the sole remaining constraint. | Any of the three plugins ships ESLint 10 support |
| `@types/node` 26.x | Held by design at `^24.13.3` to match the Node 24.18.0 runtime. | Runtime moves off Node 24 |

## Behavioral note

`16.3.3` **disables AVIF optimization** as its mitigation, pending an upstream `libheif` fix.
No impact here — all `<Image>` uses are `unoptimized`. But if image optimization is enabled
later, AVIF output will not be produced until that upstream fix lands.

## Still open (unchanged, not dependency blockers)

- `pkce: false` in `src/lib/auth.ts` — MP discovery advertises `S256`; PKCE can likely be
  enabled. Needs its own change + test. Raised 2026-08-21.
- `vitest.config.ts` CJS/ESM warning — still emitted on every test run. Fix: rename to
  `vitest.config.mts`. Pre-existing.

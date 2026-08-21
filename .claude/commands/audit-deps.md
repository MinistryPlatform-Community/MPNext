---
description: Full dependency audit — advisories, exploitability triage, and guided upgrades
argument-hint: "[--report-only] [--majors-only] [--major <pkg>] [--no-verify]"
---

# Dependency Audit & Upgrade

Perform a complete review of this project's dependencies: real vulnerability exposure,
available updates, and — with approval where required — apply and verify the upgrades.

> **No Ministry Platform writes.** This command touches only local dependencies
> (`node_modules`, `package.json`, `package-lock.json`) and local report files. It never
> reads or writes MP data, so the MP Data Safety rule in CLAUDE.md is not triggered.
> If any step would touch MP, stop and ask.

## Arguments

Parse `$ARGUMENTS`; default behavior when none are given is described in each phase.

| Flag | Effect |
|---|---|
| *(none)* | Full audit → auto-apply **safe** updates + verify → propose majors → ask before any major → offer branch+commit |
| `--report-only` | Read-only. Produce the report and the exact commands, change nothing. Skip phases 6–9. |
| `--majors-only` | Skip the safe-update pass; only research and propose major upgrades. |
| `--major <pkg>` | After the normal run, attempt that one major upgrade with the verify/revert protocol in phase 8. |
| `--no-verify` | Skip build/lint/test verification. **Only** honor this if the user passed it explicitly; say loudly in the report that nothing was verified. |

## Autonomy contract

Know exactly what you may do without asking:

**Allowed without asking**
- Every read-only command (`npm ls`, `npm audit`, `npm outdated`, `npm view`, `git status`, `git diff`).
- `npm install` with **no package argument** (syncs the tree to existing `package.json` ranges).
- `npm audit fix` **without** `--force`.
- Patch/minor bumps that stay inside the existing `^` range.
- Writing the report file and updating the known-issues file.
- Running `npm run build`, `npm run lint`, `npm run test:run`.

**Requires explicit approval, every time**
- Any change to a version **range** in `package.json` (i.e. any major bump, or widening a range).
- Removing, replacing, or adding a dependency.
- Any `git commit` (offer it in phase 9; do not commit silently).
- Deleting `node_modules` or `package-lock.json`.

**Never, under any circumstances**
- `npm audit fix --force` — in this repo it "fixes" a bundled `postcss` advisory by
  downgrading **`next` to 9.3.3**, a catastrophic breaking downgrade. Banned outright.
- `git push`, `gh pr create` — this command stops at a local commit.
- `--legacy-peer-deps` or `--force` on install to paper over an `ERESOLVE` error. An
  `ERESOLVE` is a real signal that the ecosystem hasn't adopted the new major; report it
  and revert instead.

---

## Phase 0 — Read prior state

Read `.claude/references/deps-known-issues.md` **first**. It records:
- advisories already triaged as not-exploitable here (do not re-litigate, but **do**
  re-verify the stated reason still holds — a code change can make a dead path live),
- majors verified as blocked and why, with the date,
- packages deliberately held back.

If the file is missing, create it from the template at the bottom of this document.

## Phase 1 — Preflight: is the tree even trustworthy?

Auditing a stale tree produces misleading results. Establish a clean baseline before
reading a single advisory.

1. `git status --short` — record whether `package.json` / `package-lock.json` are already
   dirty. If either is modified before you start, **stop and show the user the diff**; you
   cannot cleanly revert a failed upgrade on top of unrelated pending changes.
2. `node --version` and `npm --version` — note them in the report; some advisories and
   peer ranges are engine-dependent.
3. `npm ls --all 2>&1 | grep -iE "invalid|missing|UNMET"` — any hit means the installed
   tree does not satisfy `package.json`. Run `npm install`, then re-check.
4. Confirm `package.json` and the lockfile agree. Prefer `npm ls` cleanliness plus
   `npm install --package-lock-only --dry-run` (non-destructive). Reach for `npm ci` only
   if you must, and warn the user first — it **deletes and rebuilds `node_modules`**.
5. Only proceed once the tree matches `package.json`. State the baseline explicitly:
   "audited tree = package.json as of \<commit sha\>".

## Phase 2 — Inventory

Build the fact base you will reason over. Do not audit from memory of what this repo uses.

- Read `package.json` — capture the exact declared range for every dependency.
- `npm outdated --json` — current / wanted / latest for each package. Redirect long output
  to the scratchpad and read it from there rather than dumping it into the transcript.
- Distinguish, for every package: **runtime/shipped** (`dependencies` reachable from
  `src/`) vs **dev/build-time only** (`devDependencies`, scripts, tooling). This
  distinction drives severity more than the advisory's own CVSS score does.
- Note transitive-only packages — you cannot bump those directly; the fix is bumping the
  parent or an `overrides` entry.

## Phase 3 — Advisory sweep

Use multiple sources; no single one is complete.

1. **`npm audit --json`** — the registry advisory baseline. Parse it; record for each
   finding: package, severity, advisory URL, vulnerable range, patched range, the
   dependency path, and whether a non-breaking fix exists (`fixAvailable`).
2. **OSV / GitHub Advisory Database** — for anything security-critical in this stack
   (`next`, `react`, `react-dom`, `better-auth`, `zod`, `openai`, `dotenv`), check
   advisories that `npm audit` may not carry yet. Use WebFetch against
   `https://api.osv.dev/v1/query` (POST `{"package":{"name":"<pkg>","ecosystem":"npm"},"version":"<installed>"}`)
   or `https://github.com/advisories?query=<pkg>`.
3. **Fresh disclosures / 0-days** — WebSearch for advisories newer than the registry data,
   scoped to the current major of each critical package. Search terms that actually work:
   `"<pkg> CVE 2026"`, `"<pkg> security advisory"`, `"<pkg> RCE"`, `next.js
   security release`. Weight vendor blogs, GHSA entries, and the project's own release
   notes; discount aggregator spam. **Report the publication date of anything you cite** —
   an undated claim is not usable evidence.
4. **Context7** — use it for *documentation*, not advisories: `resolve-library-id` then
   `query-docs` to confirm whether a vulnerable API/plugin is the one this repo actually
   calls, and to pull migration notes in phase 5. Context7 is not a CVE database; do not
   present its output as advisory data.

## Phase 4 — Exploitability triage (the important part)

An advisory range match is a hypothesis, not a finding. For each one, work sequentially
and reach a verdict backed by evidence from *this* repo:

1. **Is the vulnerable code path reachable?** Grep for the actual import/API. Example:
   a `better-auth` advisory in `oidc-provider` or the `mcp` plugin does **not** apply
   here — `src/lib/auth.ts` uses only the `genericOAuth` client plugin. Verify that is
   still true rather than assuming it; cite the file you checked.
2. **Runtime or dev-only?** A `vitest`/`vite`/`esbuild`/`tsx`/`jsdom` advisory affects the
   developer's machine and CI, not shipped code. Real, but a different urgency tier.
3. **Does the trigger condition exist here?** Many advisories require a specific config,
   a dev server exposed on a network interface, an untrusted-input entry point, or a
   particular OS (several esbuild/vite advisories are Windows-only — relevant, since this
   project develops on Windows 11).
4. **Is the input attacker-controlled?** Trace it. A parser bug reachable only from a
   hard-coded internal value is not the same as one reachable from a request body.

Assign each finding **two** ratings and keep them separate:
- *Advisory severity* — what npm/GHSA says.
- *Actual exposure here* — Confirmed / Conditional / Not exploitable, with the reason.

Anything rated Not exploitable goes into the known-issues file with its reason and date,
so the next run doesn't re-derive it — and so nobody "fixes" it later by force.

## Phase 5 — Update analysis

Sort every available update into exactly one tier:

- **Tier 1 — In-range (patch/minor inside `^`).** Applied by `npm install`. Low risk.
- **Tier 2 — Range bump, non-major** (e.g. `^1.6` → `^1.7`). Low-moderate; read release
  notes, apply as a group, verify once.
- **Tier 3 — Major.** One at a time, never batched. For each candidate:
  - Query **Context7** for the migration guide and breaking changes.
  - Check peer-dependency compatibility across the whole toolchain before touching
    anything: `npm view <pkg>@<target> peerDependencies`, and check what depends on it.
  - Grep this repo for the APIs the changelog says changed — quantify the actual blast
    radius ("3 call sites in `src/services/`"), not a generic "may require changes".
  - Verdict: **Ready** (peers satisfied, no code changes needed) / **Needs work**
    (with the specific edits) / **Blocked** (with the blocker and who must move first).
- **Tier 4 — Held.** Anything in the known-issues hold list; restate why and re-check
  whether the blocker has cleared upstream.

## Phase 6 — Apply safe updates

Skip entirely if `--report-only` or `--majors-only`.

In this exact order:

1. `npm install` — syncs to existing ranges; resolves most in-range advisories.
2. `npm audit fix` — remaining in-range security patches. **Never `--force`.**
3. Tier 2 range bumps, if any: edit `package.json`, then `npm install`. Group them into
   one install, but keep the diff reviewable.
4. `git diff --stat package.json package-lock.json` — show exactly what moved.

## Phase 7 — Verify

Run all three, in order, and stop at the first failure:

1. `npm run build` — Turbopack production build, includes TypeScript checking.
2. `npm run lint` — `eslint .`
3. `npm run test:run` — Vitest single run.

Report real results. If something fails, say so with the output — never characterize an
unverified or failing state as done. On failure, diagnose: is it the upgrade, or a
pre-existing failure? Check by stashing the dependency change if unsure.

## Phase 8 — Majors (approval gated)

Never bump a major without asking. Present each candidate as: current → target, what
breaks, the migration effort, the security or capability reason to do it now, and your
recommendation. Then ask.

For each approved major, one at a time:

1. Edit the range in `package.json`, `npm install`. Watch for `ERESOLVE` and for
   `invalid:` in `npm ls <pkg>` — either means surrounding tooling hasn't adopted it.
2. Apply the code changes the migration guide requires.
3. Run the full phase 7 verification.
4. **On failure, revert cleanly and completely:** restore the `package.json` range,
   `git checkout -- package-lock.json`, `npm install`, then confirm `git status` is clean
   for those files and the build passes again. Record the failure and its cause in the
   known-issues file with today's date so the next run doesn't retry it blindly.

## Phase 9 — Report, persist, commit

**Report** (in chat, and written to `.claude/reports/deps-audit-<YYYY-MM-DD>.md`):

```markdown
# Dependency Audit — <date>
Baseline: <commit sha> · node <ver> · npm <ver>

## Summary
<2–3 sentences: what was found, what was applied, what needs a decision.>

## Security findings
| Package | Advisory | Severity | Exposure here | Scope | Evidence | Action |
|---|---|---|---|---|---|---|
<one row per finding; Exposure = Confirmed/Conditional/Not exploitable; Scope = runtime/dev>

### Not exploitable — do not "fix"
<each, with the reason and the file checked>

## Updates
| Package | Current | Wanted | Latest | Tier | Risk | Notes |
|---|---|---|---|---|---|---|

## Applied
<exact changes made, with the package.json diff>

## Verification
build: <pass/fail> · lint: <pass/fail> · tests: <pass/fail, counts>

## Needs your decision
<majors, with recommendation each>

## Deferred / blocked
<with reason and re-check trigger>
```

**Persist** — update `.claude/references/deps-known-issues.md`: add newly triaged
non-exploitable advisories, newly verified-blocked majors, and clear any entry that no
longer applies. Keep dates on everything.

**Commit** — if anything changed, offer a local branch + commits (no push, no PR):

- Branch: `chore/deps-audit-<YYYY-MM>` (create it if currently on `main`).
- Separate commits per tier so a bisect is meaningful:
  - `fix(deps): resolve <N> advisories via in-range updates`
  - `chore(deps): bump <pkg> <old> -> <new>` (one per major)
  - `docs(deps): audit report <date>`
- Include the report path and the verification results in the commit body.
- Sign off as configured in CLAUDE.md's commit conventions.
- **Do not push and do not open a PR.** Tell the user the branch is ready.

---

## This repo's stack — what to actually watch

Security-critical, runtime, shipped to users:
- **next** — framework. Check every security release; read the release notes, not just
  the version number.
- **react / react-dom** — core runtime.
- **better-auth** — auth/crypto critical. This app uses the **`genericOAuth` client**
  plugin only (see `src/lib/auth.ts`); advisories against `oidc-provider` or `mcp`
  plugins are almost certainly not applicable — but verify against the current file.
- **zod** — validation at API boundaries. Note: v4 API differs from v3.
- **openai**, **dotenv** — API client and env loading.

Lower security risk, watch for breaking majors:
- **Radix UI** primitives, **lucide-react**, **tailwindcss** / `@tailwindcss/postcss`,
  **react-hook-form** / `@hookform/resolvers`, **vaul**, **tailwind-merge**.

Dev/build-time only — real but lower urgency, often Windows-specific:
- **vitest**, **@vitest/coverage-v8**, **@vitejs/plugin-react**, **esbuild** (transitive),
  **tsx**, **jsdom**, **eslint** / **eslint-config-next**, **typescript**, **postcss**,
  **autoprefixer**, **@inquirer/prompts**, **chalk**, **@types/\***.

Not in this project — don't chase advisories for them: `next-auth`, `jsonwebtoken`,
`bcryptjs`, Drizzle, Prisma, AWS SDK, express.

## Known-issues file template

If `.claude/references/deps-known-issues.md` does not exist, create it with:

```markdown
# Dependency Known Issues

State carried between `/audit-deps` runs. Every entry needs a date and a re-check trigger.

## Accepted advisories (triaged as not exploitable)
| Package | Advisory | Reason not exploitable | Verified | Re-check when |
|---|---|---|---|---|

## Blocked majors
| Package | Target | Blocker | Verified | Re-check when |
|---|---|---|---|---|

## Held packages (deliberately not upgraded)
| Package | Pinned at | Reason | Decided |
|---|---|---|---|
```

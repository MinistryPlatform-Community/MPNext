# TODO: `npm run setup` always runs `npm install` and `npm update` — unreviewed auth-library upgrades and lockfile drift

**Created:** 2026-09-28
**Severity:** Low — supply-chain / change-control: better-auth minors have broken sign-in and identity before.
**Confidence:** Confirmed by code reading.
**Source:** Auth security review 2026-09-28 (client/config reviewer).

## Finding

- `scripts/setup.ts:1161` runs `npm install`; `:1183` runs `npm update`.
- `package.json` has `better-auth: ^1.7.4`, so `npm update` can pull a new better-auth minor. `.claude/references/auth.md:943-996` documents that minor upgrades have broken sign-in/identity before and require a manual checklist (route allowlist, `allowedSignInSocialKeys`, `refuseIdTokenSignIn`, `disabledAuthPaths` re-checks).
- On Windows this also produces the lockfile platform drift CLAUDE.md forbids (§ Dependency Rule — use `npm run deps:relock`).

## Fix

- Use `npm ci` in setup; drop `npm update` (or put it behind an explicit `--update` flag that prints the auth-upgrade checklist).
- Consider pinning `better-auth` to an exact version (or `~`) given its history in this repo.

## How to verify a fix

- Running `npm run setup` on a clean checkout leaves `package-lock.json` unchanged.

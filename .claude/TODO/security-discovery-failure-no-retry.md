# TODO: A boot-time discovery failure disables MP sign-in for the life of the process (known-open, new detail)

**Created:** 2026-09-28 (already listed as known-open in the playbook; no TODO existed)
**Severity:** Low — availability. In 1.7.4 it fails **closed**, not open; the docs describe the older fail-open behaviour.
**Confidence:** Confirmed by repro.
**Source:** Auth security review 2026-09-28 (OAuth and session reviewers).
**Related:** [security-signin-page-swallows-errors.md](security-signin-page-swallows-errors.md), [security-require-id-token-verification.md](security-require-id-token-verification.md)

## Finding

- Discovery runs once per auth context with no retry (`node_modules/better-auth/dist/plugins/generic-oauth/index.mjs:90-93, 117-122`). One transient MP outage at cold start → the provider is skipped → `/sign-in/social` returns `404 PROVIDER_NOT_FOUND` until the process restarts.
- The sign-in UI ignores that error → users see an endless spinner (related item).
- An unset `MINISTRY_PLATFORM_BASE_URL` silently builds the discovery URL `undefined/oauth/...`.

## Stale docs (describe the pre-1.7.3 fail-open behaviour)

- `src/lib/auth.ts:378-382` and `:239-243` ("sign-in SUCCEEDED only when the boot-time discovery fetch had failed ... skips verification").
- `docs/security/downstream-hardening-playbook.md` ~966-970.
- `.claude/references/auth.md:988-991` (wrong log text; "until discovery returns").

## Fix

- Options: (a) re-create the auth instance / provider lazily on `PROVIDER_NOT_FOUND` with backoff; (b) a health check that fails the instance when the provider is missing so the platform recycles it; (c) supply static endpoints + a static JWKS URL instead of `discoveryUrl` (the playbook's deferred trade-off — also removes the F12 id_token branch).
- Update the three stale comments/docs.

## How to verify a fix

- Test: first discovery fetch rejects, second succeeds → sign-in works without a restart (for option a), or the documented failure mode is asserted.

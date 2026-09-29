# TODO: A partial discovery document silently disables id_token verification — set `requireIdTokenVerification: true`

**Created:** 2026-09-28
**Severity:** Low — no takeover (code-flow tokens still come from MP's token endpoint), but the control several comments rely on can disappear without a log line.
**Confidence:** Confirmed by repro and by reading `node_modules/better-auth/dist/plugins/generic-oauth/index.mjs:95-130`.
**Source:** Auth security review 2026-09-28 (OAuth reviewer).

## Finding

genericOAuth only builds `idTokenConfig` when discovery returns **both** `jwks_uri` and `issuer` (`generic-oauth/index.mjs:103-117`). If discovery succeeds with endpoints but lacks either field, the provider stays live and code-flow id_tokens are **not verified at all**; the only thing still reading them is the deliberately-unverified `readIdTokenSub` in `src/lib/auth.ts:249-261`.

Repro: discovery without `jwks_uri` + an `alg: none` id_token → session minted. With `requireIdTokenVerification: true` → provider skipped (`404 PROVIDER_NOT_FOUND`) with an explicit error log (`generic-oauth/index.mjs:124-130`).

The option exists in 1.7.4 (`plugins/generic-oauth/types.d.mts:54`); the app doesn't set it. Comments at `src/lib/auth.ts:235-243` and `:384-386` assume verification always happens when discovery works.

## Fix

- Add `requireIdTokenVerification: true` to the ministry-platform provider config.
- Update the `readIdTokenSub` comment to cite this option as the guarantee.

## How to verify a fix

- Test: discovery mock missing `jwks_uri` (and separately `issuer`) → sign-in refused. Removing the option must fail the test.

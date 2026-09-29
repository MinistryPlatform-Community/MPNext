# TODO: Narrow the user OAuth scope below `dataplatform/scopes/all`

**Created:** 2026-09-28 · **Updated:** 2026-09-28 (token minimisation shipped; this is what remains)
**Severity:** Low — least privilege; the tokens are no longer retained, so this only limits what an in-flight access token could do.
**Source:** Auth security review 2026-09-28 (session and OAuth reviewers).
**Related:** `docs/OAUTH_LOGOUT_SETUP.md` (logout fixed 2026-09-29)

## Done (commit on `fix/security-review-2026-09-28-medium`)

- `offline_access` dropped — no refresh token is issued.
- `account.storeAccountCookie: false` — no `account_data` cookie; no tokens reach the browser.
- `databaseHooks.account.{create,update}.before` → `stripUserOAuthTokens` blanks access/refresh tokens and expiries in the in-memory row. The `id_token` is kept.
- Pinned by `src/auth.user-oauth-tokens.test.ts` (mocked code flow; each of the three fails when reverted).

## What remains

- The access token is still requested with `http://www.thinkministry.com/dataplatform/scopes/all` and used once, by `getUserInfo`. Check against a **non-production** MP whether userinfo works with `openid` alone (or a narrower scope). If it does, drop `scopes/all` and update `src/auth.test.ts` and `.claude/references/auth.md` § scopes.

## Note for the logout item

With the account cookie gone, the `id_token` exists only in the in-memory account row of the instance that handled sign-in. An `id_token_hint` implementation must read it from there (and accept that it is missing on another serverless instance) or carry it some other way.

## How to verify

Manual sign-in against a non-production MP with the narrower scope: userinfo returns `sub` and the name claims.

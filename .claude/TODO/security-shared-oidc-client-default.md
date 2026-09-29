# TODO: Default setup reuses the `TM.Widgets` OIDC client and tells operators to enable implicit, hybrid and password flows

**Created:** 2026-09-28
**Severity:** Low — the defaults are exactly the conditions the F12 advisory says raise risk, and the PKCE/nonce trade-offs assume a dedicated confidential client.
**Confidence:** Defaults confirmed; exploit path theoretical and tenant-specific.
**Source:** Auth security review 2026-09-28 (client/config and MP-client reviewers).
**Related:** [security-docs-drift.md](security-docs-drift.md) (F8 accepted-risk note)

## Finding

- `.env.example:7-12` and `scripts/setup.ts:1012` default `OIDC_CLIENT_ID` to `TM.Widgets` and call re-using it "best practice".
- `README.md:219, 233-235`: "Authentication Flow: use the default: Authorization Code, Implicit, Hybrid, Client Credentials, or Resource Owner".
- The F12 note (`docs/security/2026-09-25-signin-hardening.md:6, 35-37`) names a shared client, or one that allows implicit/hybrid, as what raises F12 to Low–Medium. The `disableIdTokenNonceBinding` and `pkce: false` justifications (`src/lib/auth.ts:384-391`) rely on "a confidential client that exchanges the code with a client secret".
- README also registers the redirect URIs on an `MPNext` client while sign-in uses `TM.Widgets` — inconsistent guidance.

## Fix

- Default to a **dedicated** MPNext OIDC client: Authorization Code only (+ refresh only if actually needed — see [security-unused-user-oauth-tokens-stored.md](security-unused-user-oauth-tokens-stored.md)), exact redirect URIs. MP does not support PKCE, so a dedicated client with tight redirect-URI registration is the main defence against authorization-code injection.
- Separate API client for client-credentials (Client Credentials grant only).
- Update `.env.example`, `setup.ts` and README consistently.

## How to verify a fix

- Defaults in `.env.example`, setup and README agree with each other and with the advisory's guidance.

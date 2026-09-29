# TODO: id_token claim checks are weaker than OIDC Core requires (`exp` optional, `iat` not required, `azp` unchecked)

**Created:** 2026-09-28
**Severity:** Info — only reachable with MP-signed tokens in the code flow.
**Confidence:** Confirmed by repro.
**Source:** Auth security review 2026-09-28 (OAuth reviewer).

## Finding

`node_modules/@better-auth/core/dist/oauth2/verify-id-token.mjs:48-53` → `jose` `jwtVerify` with issuer/audience only. `jose` checks `exp` only if present (`jose/dist/webapi/lib/jwt_claims_set.js:64-85`); `requiredClaims` is not set, so a token with no `exp` passes; `iat` is not required; `azp` is never checked when `aud` is an array. Repro accepted `noexp` and `aud: [other, ours]` with `azp: other`.

Signature (`alg: none`, HS256-with-client-secret), wrong `iss`, wrong `aud` and expired tokens **are** rejected — this item is only about the missing-claim cases.

## Fix

- genericOAuth exposes no `verifyClaims` hook. Either add a check in our `getUserInfo` (we already decode the id_token payload in `readIdTokenSub`: require `exp` present and in the future; if `aud` is an array, require `azp === OIDC_CLIENT_ID`) — noting that at that point the token is already verified — or document the gap.

## How to verify a fix

- Tests with a mock id_token lacking `exp`, and one with `aud: [other, ours]` + `azp: other` → sign-in refused.

# TODO: Auth test suite gaps — origin checks are off in every test, and no test drives the OAuth callback or pins session lifetime

**Created:** 2026-09-28
**Severity:** Low — no vulnerability by itself, but several security controls could be removed with the whole suite still green.
**Confidence:** Confirmed by code reading.
**Source:** Auth security review 2026-09-28 (OAuth, session and HTTP-boundary reviewers).

## Gaps

1. **Origin / callbackURL / CSRF checks are disabled in every test.** Vitest sets `NODE_ENV=test`, and better-auth defaults `skipOriginCheck` to `true` under `isTest()` (`node_modules/better-auth/dist/context/create-context.mjs:211`). So the *server-side* half of F3/F3b is unguarded: adding `advanced.disableOriginCheck: true` or `trustedOrigins: ["*"]` to `src/lib/auth.ts` passes the whole suite.
2. **No end-to-end callback test.** Nothing drives `GET /api/auth/callback/ministry-platform`: state validation, code exchange, code-flow id_token verification and session minting are all untested. (`src/auth.id-token-sign-in.test.ts` already has a mock-OIDC pattern to reuse.)
3. **Session config is not pinned.** No test asserts cookie-cache strategy/`maxAge`, the implicit `refreshCache`, `expiresIn`, cookie attributes/prefix, or that customSession output is not written into the cookie. A better-auth upgrade that changes stateless defaults would ship unnoticed.
4. **Sign-out effectiveness is untested.** `src/components/user-menu/actions.test.ts:11,40` mocks `signOut`.
5. **No tests for** secret/baseURL validation (once added), rate-limit IP resolution, or `disableIdTokenNonceBinding` (not pinned by any test). (`pkce: false` is pinned correctly — MP does not support PKCE.)
6. **Route allowlist mutants survive** (HTTP-boundary reviewer; mutation-tested `route.ts` against the real `route.test.ts`, 51/51 green for each): GET allowlist changed to prefix matching; pathname run through `decodeURIComponent` before matching; pathname lower-cased; trailing-slash stripping removed. Cause: the "everything else 404s" block (`route.test.ts:108`) only checks status 404 — and better-auth's own router also 404s most paths — so it never proves the request was stopped *before* `auth.handler`. No tests for `%2D`-encoded paths, `;`, case changes, HEAD, OPTIONS, or the NBSP Content-Type (see [security-sign-in-social-content-type-nbsp.md](security-sign-in-social-content-type-nbsp.md)). (Caught: removing the Content-Type check fails 6 tests; the `,` check 2; the body filter 12+.)
7. **Proxy matcher test is `toContain`-only** (`proxy.test.ts:296-302`) — adding an exclusion like `|contactlookup` passes. Nothing tests `/apifoo`. See [security-proxy-public-path-and-matcher-loose.md](security-proxy-public-path-and-matcher-loose.md).
8. **Route/auth tests run the unverified id_token path.** The discovery stub in `route.test.ts:38` (and `auth.test.ts`) has no `jwks_uri`, so genericOAuth builds no `idTokenConfig` — exactly the silent no-verification shape in [security-require-id-token-verification.md](security-require-id-token-verification.md). Only `auth.id-token-sign-in.test.ts:81` supplies one.

## Fix

- A code-flow harness: mock OIDC server + stubbed `fetch` that throws on anything unmocked + faked `Date`, driving the real `auth.handler`.
- A suite that builds `betterAuth({ ...auth.options, advanced: { ...auth.options.advanced, disableOriginCheck: false } })` and asserts `callbackURL: "https://evil.example"` and `"/\t/evil"` → 403.
- Assertions for cookie names, attributes, strategy and lifetime; sign-in → sign-out → replay.
- In `route.test.ts`, spy on `auth.handler` in the 404 block and assert it was **not** called; add a table of path variants (encoded, `;`, case, trailing slash, HEAD/OPTIONS).
- Assert the proxy matcher exactly and behaviourally via Next's `getMiddlewareMatchers`.
- Give the route/auth test discovery stubs a `jwks_uri` + `issuer` (with a local JWKS), so the default path under test is the verified one.

## How to verify a fix

Mutation check: each of these must turn the suite red — `disableOriginCheck: true`; `trustedOrigins: ["*"]`; `strategy` flipped; `expiresIn` raised; removing the sub-binding check; skipping state validation (via a stubbed better-auth internal, if practical).

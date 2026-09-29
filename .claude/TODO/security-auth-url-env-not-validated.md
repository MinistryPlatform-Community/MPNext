# TODO: Auth-critical URLs are never validated — `BETTER_AUTH_URL` falls back to the Host header; `MINISTRY_PLATFORM_BASE_URL` may be `http://`

**Created:** 2026-09-28
**Severity:** Low — configuration-dependent, but the failure modes are redirect_uri poisoning and cleartext secrets.
**Confidence:** Confirmed by repro (Host-derived baseURL) and code reading.
**Source:** Auth security review 2026-09-28 (session, OAuth and MP-client reviewers).
**Related:** [security-auth-secret-fallback-and-test-flag.md](security-auth-secret-fallback-and-test-flag.md), `docs/OAUTH_LOGOUT_SETUP.md` (logout fixed 2026-09-29)

## Finding

### `BETTER_AUTH_URL` / `NEXTAUTH_URL` (`src/lib/auth.ts:282`)

- If unset, better-auth derives the base URL from the request (`node_modules/better-auth/dist/auth/base.mjs:37-47`, `utils/url.mjs:68-87`). Repro: a request with `Host: evil.example` produced `redirect_uri=https://evil.example/api/auth/callback/ministry-platform`, and `callbackURL: https://evil.example/landing` was accepted as a trusted origin. Only a warning is logged.
- With `NODE_ENV=production` and an `http://` value, cookies are issued without `Secure` and without the `__Secure-` prefix, silently (`cookies/index.mjs:23`).
- `.env.example` and `scripts/setup.ts:125-129` default to `http://localhost:3000`; sign-out falls back to `http://localhost:3000` (`src/components/user-menu/actions.ts:20`).

### `MINISTRY_PLATFORM_BASE_URL` (`src/lib/auth.ts:9` uses `!`)

The same value is used for the client-secret POST, every bearer API call, the userinfo call with the user's access token, OIDC discovery (the trust anchor for the JWKS), and the endsession redirect:
`client-credentials.ts:16-17,26`, `client.ts:35`, `auth.ts:340,433-434`, `user-menu/actions.ts:13-18`, `security-headers.ts:96-103`.

- An `http://` value sends the client secret and tokens in cleartext; a MITM on discovery can substitute the JWKS. `setup.ts:389-397` forces https, but values set by hand or in a hosting dashboard bypass setup.
- A trailing `/` produces `//oauth`, `//tables`.
- Unset → discovery URL becomes `undefined/oauth/.well-known/openid-configuration`, silently.

## Fix

- One small `src/lib/env.ts` (or similar) validated at startup:
  - `BETTER_AUTH_URL` required; origin only (no path/query/hash); `https:` in production (allow `http://localhost` in development).
  - `getMpBaseUrl()`: `new URL()`, `https:` required (localhost exemption for dev only), strip trailing slash, reject credentials/query/hash. Use it at every call site above.
- Optionally `advanced.useSecureCookies: true` in production.
- Remove the localhost fallback in `handleSignOut`.

## How to verify a fix

- Unit tests: `http://x`, `https://x/`, `https://u:p@x`, `https://x?a`, unset → refused or normalized; production boot refuses `http://`.

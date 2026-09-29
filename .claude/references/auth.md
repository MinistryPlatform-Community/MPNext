# Authentication Reference Guide

This document provides detailed context about the authentication system for LLM assistants working on the MPNext project.

## Overview

MPNext uses **Better Auth** with the **genericOAuth** plugin to authenticate users against Ministry Platform's OIDC endpoints. Sessions are stateless (encrypted JWE cookie cache, no database). The full MP user profile is loaded separately — started server-side by `ServerProviders` and streamed to `UserProvider`; the only thing the session itself resolves server-side is the MP `User_ID` (see [customSession Callback](#customsession-callback)).

## Critical: user.id vs userGuid

Better Auth generates its own internal `user.id` (a random nanoid-style string like `1gYSNMvy6OqAm9q3DdVhtKj3Czkxd0ms`). This is **NOT** the Ministry Platform User_GUID.

The MP User_GUID (the OAuth `sub` claim) is stored as `user.userGuid` via `additionalFields` + `mapProfileToUser`.

| Field | Value | Use For |
|-------|-------|---------|
| `session.user.id` | Better Auth internal ID | Auth guards (checking if session exists) |
| `session.user.userGuid` | MP User_GUID (UUID) | All MP API lookups (`dp_Users`, profile fetching) |
| `session.user.email` | **Synthetic** — `<sub>@mp.invalid` | Nothing. Never display it or send mail to it. Exists only to satisfy better-auth's `required, unique` email column. |
| `session.user.mpEmail` | Real MP email, or `null` | Display fallbacks (e.g. the header tooltip). MP does not require an email, so always handle `null`. |
| `session.user.userId` | MP `User_ID` (number), or `null` | Audit attribution (`$userId`) and the authorization gate. Resolved from `userGuid` by `customSession`; read it through `SessionContextService`, not inline. |

**Why?** Better Auth explicitly strips the `id` from `getUserInfo` when creating user records (`const { id: _, ...restUserInfo } = userInfo` in `link-account.mjs`). The `id` becomes the `accountId` in the account table, not `user.id`.

### Accessing userGuid

```typescript
// Server-side (server actions)
const session = await auth.api.getSession({ headers: await headers() });
const userGuid = (session.user as Record<string, unknown>).userGuid as string;

// Client-side (React components)
const { data: session } = authClient.useSession();
const userGuid = (session?.user as { userGuid?: string } | undefined)?.userGuid;
```

The cast is needed because `customSessionClient` type inference doesn't include `additionalFields` from `genericOAuth`.

## File Map

| File | Purpose |
|------|---------|
| `src/lib/auth.ts` | Server-side Better Auth configuration |
| `src/lib/auth-client.ts` | Client-side auth client (`authClient`) |
| `src/app/api/auth/[...all]/route.ts` | Allowlisted route handler — only `GET /get-session`, `GET /callback/ministry-platform`, `POST /sign-in/social` reach better-auth; everything else 404s. `POST /sign-in/social` is also body-filtered (exact `application/json`, keys `provider`/`callbackURL` only, `provider: "ministry-platform"`) — see [id_token sign-in is disabled](#id_token-sign-in-is-disabled-sign-insocial) |
| `src/lib/env.ts` | `getMpBaseUrl` / `getAuthBaseUrl` — validate `MINISTRY_PLATFORM_BASE_URL` and `BETTER_AUTH_URL` at module load (see [Environment Variables](#environment-variables)) |
| `src/proxy.ts` | Route protection (session cookie *presence* check — not validation) |
| `src/app/auth-error/page.tsx` | Landing page for a failed OAuth callback (`onAPIError.errorURL`) — outside the (web) route group, public in `src/proxy.ts`. Renders only allowlisted `error` codes |
| `src/app/signed-out/page.tsx` | Where a tab lands when its session ends (`SessionGuard`). Public, per-request, starts no OAuth — only links to `/signin` |
| `src/components/layout/session-guard.tsx` | `SessionGuard` — client half of the shell's session check: when the client session goes from present to none (sign-out in any tab, expiry), stops rendering and `location.replace("/signed-out")` |
| `src/app/server-providers.tsx` | `ServerProviders` — starts the MP profile load during the server render, below `AuthWrapper` |
| `src/contexts/user-context.tsx` | `UserProvider` — exposes the streamed profile promise to `useUser()`; reloads it on `refreshUserProfile()` |
| `src/contexts/session-context.tsx` | `useAppSession()` — thin wrapper around `authClient.useSession()` |
| `src/components/layout/auth-wrapper.tsx` | Server guard for the (web) group — redirects to `/signin` (no session) or `/session-error` (session without `userGuid`). Authentication only; it does **not** check roles |
| `src/app/session-error/page.tsx` | Recovery page for broken sessions — provides a sign-out even when the header/menu can't render (outside the (web) group, so not self-guarded) |
| `src/components/user-menu/actions.ts` | `handleSignOut()` — OIDC logout flow |
| `src/app/signin/page.tsx` | Sign-in **route** — a server component whose only job is `export const dynamic = "force-dynamic"` (route segment config is ignored in a `"use client"` file, and the nonce-based CSP needs a per-request render) and rendering `<SignIn />` |
| `src/components/sign-in/sign-in.tsx` | The sign-in page body — auto-redirects to OAuth exactly once per page load (ref guard), and sanitizes `callbackUrl` to a same-origin relative path (see [Open redirect on `/signin`](#open-redirect-on-signin-f3-closed-2026-09-12)) |
| `src/services/authorizationService.ts` | The **authorization** gate — MP security-role check for reads and writes |
| `src/services/sessionContextService.ts` | Resolves the acting MP `User_ID` from the session (`getCurrentUserId`, `getActingUserIdForWrite`) — the single source the gate reads |
| `src/app/(web)/contactlookup/layout.tsx` | UX redirect over `/contactlookup/**` — sends a role-less user to `/no-access`. **Not** the gate for child pages; `[guid]/page.tsx` gates itself (see [The four layers](#the-four-layers)) |
| `src/app/(web)/no-access/page.tsx` | "You need a security role" page. **Inside** the (web) group, so the header and sign-out still render |

## Auth Configuration (`src/lib/auth.ts`)

### Plugins

| Plugin | Purpose |
|--------|---------|
| `genericOAuth` | Ministry Platform OAuth provider config |
| `customSession` | Adds `userId` (MP `User_ID`, resolved from `dp_Users` and process-cached) and strips `token`/`ipAddress`/`userAgent` from the returned session. No `firstName`/`lastName` (removed 2026-09-29) — names come from the MP profile |
| `nextCookies` | Next.js cookie integration |

### Session Strategy

- **Absolute lifetime**: 12 hours from sign-in (`session.expiresIn`), never extended (`session.disableSessionRefresh: true`)
- **Cookie cache**: JWE strategy (encrypted, A256CBC-HS512 keyed from the secret — the old `jwt` strategy left name, MP email, `userGuid`, IP and user agent readable to anything that sees Cookie headers), 1-hour TTL (`session.cookieCache.maxAge`), `refreshCache: false` (explicit — see below). Switching strategy invalidated every existing `session_data` once (2026-09-29)
- **No account cookie**: `storeAccountCookie: false` (better-auth defaults it to `true` without a database). The user's MP tokens are never used — all MP data access is the service account — so they stay out of the browser, and `databaseHooks.account` (`stripUserOAuthTokens`) blanks the access/refresh tokens in the in-memory row too. Only the `id_token` is kept (not an API bearer; what a future RP-logout `id_token_hint` would use). Pinned by `src/auth.user-oauth-tokens.test.ts`.
- **State**: OAuth state stored in cookie (`storeStateStrategy: "cookie"`)
- **No database**: Uses in-memory adapter. A restart loses the rows, but not instantly everyone's session: a `session_data` cookie stays valid until its 1 h cache expires, then the request falls through to the (now empty) store and the user must sign in again

### Session lifetime and revocation (stateless)

There is no server-side session store, so **sign-out cannot revoke a copied
cookie pair** — it deletes the in-memory row on the process that handled it and
clears that browser's cookies, nothing more.

> **One `auth` per process.** Next loads `src/lib/auth.ts` once per bundle
> layer (route handler, server actions, server components — 4 copies under
> `next dev`, 2 in a production build, verified 2026-09-29). Before the fix,
> each copy had its own in-memory store: the OAuth callback wrote the session
> and account rows in the route-handler copy, and the sign-out server action
> deleted from a different, empty one. Sign-out then removed nothing that
> `/get-session` reads, so a copied pair lived to the 12 h cap, and no logout
> URL had an `id_token_hint`. `sharedInstance` now caches the instance on
> `globalThis`, so every layer shares one store. The 1 h figure below assumes
> that; `src/auth.shared-instance.test.ts` pins it across two module copies.

The settings in `src/lib/auth.ts`
(documented on `SESSION_EXPIRES_IN_SECONDS`) instead put hard ceilings on every
session, pinned by the clock-walk suite `src/auth.session-lifetime.test.ts`
(better-auth 1.7.4, real `auth` instance, mock OIDC code flow, fake clock):

| Session | Ceiling |
|---------|---------|
| Any session, however often used, on either `/get-session` path | **sign-in + 12 h** (the check is `expiresAt < now`, so exactly 12 h is the last valid instant) |
| A cookie pair *not* backed by a live in-memory row — copied before sign-out, forged from a leaked secret, or presented to a serverless instance that never saw the sign-in | **1 h after that `session_data` was minted** |

Why each setting (verified in `node_modules/better-auth/dist/`):

- **`refreshCache: false` must be explicit.** With no database, better-auth
  `defu`-merges `{ refreshCache: true, strategy: "jwe", maxAge: expiresIn }`
  *under* the app's `cookieCache` (`context/create-context.mjs`), so omitting it
  silently turns it on. With it on, `/get-session` re-signs `session_data` from
  the cookie alone in the last 20 % of `maxAge`, with no store lookup
  (`api/routes/session.mjs`), so a copied pair survived sign-out and re-minted
  itself until `expiresAt` — 7 days under the old defaults. Both values respect
  `expiresAt`; `false` additionally forces a fall-through to the in-memory row
  once the 1 h cache expires, so a copy outlives its row by at most an hour.
- **`expiresIn: 12h`** — `expiresAt` is set once, at sign-in, and both paths
  refuse a session past it. It also sets the `session_token` cookie Max-Age.
  The default was 7 days.
- **`disableSessionRefresh: true`** — otherwise the in-memory path slides
  `expiresAt` forward by `expiresIn` once per `updateAge` (1 day), which kept a
  session alive indefinitely on a long-running `next start`. Today `expiresIn`
  (12 h) is shorter than `updateAge`, so this is defence in depth (its removal
  is caught by the config pin, not the walk); it matters if `expiresIn` is ever
  raised past a day.

**Trade-off (serverless):** after the 1 h cache, a request that lands on an
instance without the in-memory row gets no session and goes back through MP
sign-in (usually silent while the MP session is alive). That is also an hourly
re-check against MP: a disabled or deleted MP login fails it. On a single
long-running process the row is there and the session runs to the 12 h cap.

**Accepted as-is (decision 2026-09-29).** The 12 h absolute cap, the 1 h replay
bound after sign-out (up to 12 h for a copy presented to an instance that still
holds the row) and a persistent 12 h `session_token` cookie that survives a
browser close are accepted for now; see
[Additional Security Hardening § 1](../../docs/security/Additional_Security_Hardening.md).
On a shared machine the practical mitigation is UI-side: `SessionGuard` takes
every open tab to `/signed-out` (which starts no OAuth) as soon as the session
ends in any of them.

**Emergency "sign everyone out" levers:**

1. **Redeploy with a bumped `session.cookieCache.version`** (e.g. `version: "2"`).
   Every existing `session_data` is refused on its next read, and the redeploy
   wipes the in-memory rows, so nothing can re-mint it. OAuth state and account
   cookies keep decrypting. (A plain redeploy without the bump also ends every
   session, but only within 1 h — the cookie-cache TTL.)
2. **Rotate `BETTER_AUTH_SECRET`.** Invalidates every signed cookie at once —
   including one forged with the old secret, which a version bump would *not*
   stop (a forger can sign any `version`). Mandatory if the secret may have
   leaked or a forged session is suspected. Everyone must sign in again.

The real fix remains a server-side store (better-auth `secondaryStorage` or a
database): with one present, `refreshCache` is no longer defaulted on and
sign-out actually deletes the session. See Known Limitations § 1.

### Secret and environment guard

`assertAuthEnvironment` (`src/lib/auth.ts`) runs at module load in **every**
environment — development, production, or `NODE_ENV` unset — and refuses to
start when:

- neither `BETTER_AUTH_SECRET` nor `NEXTAUTH_SECRET` is set (better-auth would
  otherwise sign with its public `DEFAULT_SECRET`, and only refuses that when
  `NODE_ENV=production`);
- the secret *is* better-auth's `DEFAULT_SECRET`, or is shorter than 32 chars;
- `BETTER_AUTH_SECRETS` is set (better-auth silently prefers it over the
  validated secret; versioned secrets are not supported here);
- `TEST` is truthy while `NODE_ENV=production` (better-auth's `isTest()` would
  skip its own secret validation).

`advanced.disableOriginCheck: false` is pinned so `TEST` cannot switch the
Origin/callbackURL check off either (left undefined, better-auth uses
`isTest()`). The only exemption from the guard is Vitest (`process.env.VITEST`);
`src/auth.secret-guard.test.ts` clears it to prove the import throws. `next build`
imports this module, so a build environment needs a real secret too — and a
valid `MINISTRY_PLATFORM_BASE_URL` / `BETTER_AUTH_URL` (see
[Environment Variables](#environment-variables)). Building the instance also
runs OIDC discovery (a read-only GET, once per build worker), so a `next build`
with a real `.env.local` contacts the real MP discovery endpoint.

The guard enforces length only. better-auth's own entropy estimate still only
*warns* on a low-entropy secret, so generate it (`openssl rand -base64 32`;
`npm run setup` uses `randomBytes(32)`) rather than typing one.

The same secret is the raw HMAC key for `session_token` and, through HKDF
derivations, the key for the JWE `session_data` and the OAuth state cookie, so
rotating it always signs everyone out. There is no domain separation on the raw
HMAC use; with no signing oracle exposed this is not exploitable, and is
accepted. better-auth's versioned `secrets` would allow graceful rotation but is
deliberately not enabled (see the `BETTER_AUTH_SECRETS` refusal above).

### Rate limiting and client IP

better-auth rate-limits only in production, in memory, per instance; `/sign-in*`
is 3 requests per 10 s per client IP, and in-process `auth.api` calls are never
limited. By default it trusts only a single, valid IP in `x-forwarded-for`. No
header, an appended chain (`client, proxy`) or Azure's `ip:port` all resolve to
no IP, and every such client shares one bucket (`no-trusted-ip|<path>`): about
one request every 3 s then blocks sign-in for everyone. Conversely, on a
`next start` exposed directly, a client sets `x-forwarded-for` itself and can
rotate past the limit or lock out a victim's IP.

The trustworthy source is host-specific, so `parseIpAddressOptions` in
`src/lib/auth.ts` maps two env vars onto `advanced.ipAddress`:

| Host | Setting (verify on your host) |
|---|---|
| Vercel | Blank (Vercel overwrites `x-forwarded-for`), or `AUTH_IP_ADDRESS_HEADERS=x-real-ip` |
| Cloudflare | `AUTH_IP_ADDRESS_HEADERS=cf-connecting-ip` |
| Azure App Service | `AUTH_IP_ADDRESS_HEADERS=x-client-ip` (`x-forwarded-for` carries `ip:port`) |
| nginx / proxy that appends to `x-forwarded-for` | `AUTH_TRUSTED_PROXIES=<proxy IPs/CIDRs>` |
| `next start` exposed directly | No trustworthy header; put a proxy in front |

Only name a header the edge always **overwrites**. Invalid header names or
proxy entries refuse startup (better-auth itself only warns and ignores a bad
proxy entry, which would silently fall back to the shared bucket). The
sign-in UI's handling of a 429 is tracked separately. Pinned by
`src/auth.ip-address.test.ts`, which includes a real rate-limited instance
showing one client locking out another when unconfigured.

### Email is never a key (synthetic `email`, real address in `mpEmail`)

> 🔒 **better-auth's `email` column holds a synthetic per-user value, not the
> MP address.** better-auth's core user schema declares `email` as
> `required: true, unique: true`, and its OAuth callback uses `findUserByEmail`
> as a fallback identity lookup (`oauth2/link-account.mjs`). Ministry Platform
> enforces **no** uniqueness on email addresses — households routinely share
> one across several contacts, each of whom may have a `dp_Users` login. The
> only unique identity MP gives us is `sub` (the User_GUID), so that is the
> only thing better-auth is allowed to key on.
>
> `mapProfileToUser` therefore returns `email: syntheticEmailForSub(sub)`
> (`<sub lowercased>@mp.invalid`, RFC 2606 reserved TLD) and moves the real
> address to the `mpEmail` additional field (nullable — MP does not require an
> email, and sign-in must not depend on one). The generic-oauth wrapper builds
> the local user as `{ email: raw.email, ..., ...mapped }`, so the mapped value
> is what better-auth persists. Two MP users sharing a real email now become
> two distinct better-auth users; neither is merged (the F2 takeover) nor
> refused (the lockout that `accountLinking: false` alone produced, and that a
> persistent database's `unique` constraint would have enforced too).
>
> **Consequences for app code:** never read `session.user.email` for display
> or mail; use `session.user.mpEmail` (cast, as with `userGuid`) and handle
> `null`. `src/components/layout/header.tsx` is the one current reader.
>
> **`sub` is validated, not defaulted.** `getUserInfo` runs `sanitizeGuid` on
> `profile.sub` and returns `null` if it is missing or malformed — better-auth's
> contract for "user info unusable", which makes the callback redirect with
> `unable_to_get_user_info` and mint nothing. (Throwing there is *not*
> equivalent: `provider.getUserInfo` is not wrapped in a try/catch in the
> callback route.) `mapProfileToUser` additionally throws if `sub` is somehow
> absent, and `userGuid` is `required: true`, so better-auth's `parseInputData`
> rejects user creation without it. The old `String(profile.sub ?? "")`
> fallback, which produced sessions with `userGuid: ""`, is gone.
>
> `src/auth.test.ts` guards all of this: the synthetic-email mapping, the
> `mpEmail: null` case, the `sub` refusals in `getUserInfo`, the
> `required` guard through the real better-auth parser, and an end-to-end
> `handleOAuthUserInfo` run in which two subs sharing one real email yield two
> distinct users.

### Account linking (disabled)

> 🔒 **`account.accountLinking.enabled` is explicitly `false`.** With a single
> OAuth provider, identity belongs to Ministry Platform, not better-auth —
> there is no legitimate reason for a second provider account to be linked
> onto an existing user by matching email. But that is exactly what
> better-auth's default OAuth callback does: when no account exists yet for
> the incoming `(providerId, sub)`, it falls back to `findUserByEmail`, and if
> both the stored user and the incoming profile are `emailVerified`, it
> implicitly links the new `sub` onto that **existing** user and issues a
> session for them. Since MP household/contact data commonly shares one email
> across multiple people, this is a real identity-takeover path: the second
> person to sign in with a shared email would silently inherit the first
> person's `userGuid` and MP `User_ID`.
>
> Setting `accountLinking: { enabled: false }` makes
> `node_modules/better-auth/dist/oauth2/link-account.mjs` take its
> `"account not linked"` refusal branch instead of merging
> (`accountLinking?.enabled === false` is one of the OR'd conditions gating
> that branch). This pairs with `getUserInfo` returning the provider's real
> `email_verified` claim (`profile.email_verified === true`, defaulting to
> `false`) rather than a hardcoded `true` — see the table entry below.
>
> `src/auth.test.ts` guards both halves: a config assertion that
> `accountLinking.enabled` stays `false`, `getUserInfo` guards for the
> `emailVerified` claim, and a behavioral test that drives the real
> `handleOAuthUserInfo` (from `better-auth/oauth2`) against the app's actual
> in-memory `auth` instance with two different `sub` values sharing one
> email, asserting the second sign-in is refused rather than merged.

### genericOAuth Configuration

| Setting | Value | Notes |
|---------|-------|-------|
| `providerId` | `"ministry-platform"` | Used in OAuth URLs and `signIn.social({ provider })` |
| `discoveryUrl` | `${MP_BASE_URL}/oauth/.well-known/openid-configuration` | OIDC auto-discovery |
| `requireIdTokenVerification` | `true` | Guarantees the code-flow id_token is verified: genericOAuth builds its verifier only when discovery yields both `issuer` and `jwks_uri`, and without this a partial discovery document left the provider live with verification silently off. With it, such a provider is skipped (sign-in 404s `PROVIDER_NOT_FOUND`). Pinned by `src/auth.oidc-hardening.test.ts` |
| `scopes` | `openid`, `http://www.thinkministry.com/dataplatform/scopes/all` | The second scope is the literal URI MP expects, not a short name. No `offline_access`: no refresh token is ever used. **The broad scope is kept deliberately (decision 2026-09-29):** MPNext is a template, and forks build features that need it. The user's token is minimised instead — no `offline_access`, no account cookie, access/refresh tokens blanked in memory (see Session Strategy). Whether userinfo works with a narrower scope is unverified (needs a non-production MP) |
| `pkce` | `false` | **Required** — MP does not support PKCE, and 1.7 defaults this to `true`. Not a pending follow-up (see [`nonce` binding is off](#nonce-binding-is-off-and-must-stay-off) for the consequence) |
| `disableIdTokenNonceBinding` | `true` | **Required.** MP does not echo `nonce` back in the `id_token`, and better-auth rejects a missing claim. See [`nonce` binding is off](#nonce-binding-is-off-and-must-stay-off) |
| `authorizationUrlParams` | `{ realm: "realm" }` | Extra query parameter MP's authorize endpoint expects |
| `getUserInfo` | Custom callback | Requires an id_token and binds it: the userinfo `sub` must equal the id_token `sub` (case-insensitive), else `null` + `auth.userinfo.sub_mismatch` — see [id_token sign-in is disabled](#id_token-sign-in-is-disabled-sign-insocial). Fetches OIDC userinfo; validates `sub` with `sanitizeGuid` and returns `null` (sign-in refused) if unusable; returns the real `email` on the raw profile and `emailVerified: profile.email_verified === true` (not hardcoded — see [Account linking](#account-linking-disabled)) |
| `mapProfileToUser` | Custom callback | Returns `userGuid: sub`, `email: <sub>@mp.invalid` (synthetic — see [Email is never a key](#email-is-never-a-key-synthetic-email-real-address-in-mpemail)), `mpEmail: real address or null`; throws if `sub` is absent |

### Better Auth 1.7 migration notes

Better Auth 1.7 rewrote the generic OAuth plugin as a first-class social
provider. What changed here, and why each line in `src/lib/auth.ts` looks the
way it does:

| Change | What we do |
|--------|-----------|
| `signIn.oauth2()` removed | `src/components/sign-in/sign-in.tsx` calls `authClient.signIn.social({ provider: "ministry-platform" })` |
| `genericOAuthClient()` dropped | Removed from `src/lib/auth-client.ts`; only `customSessionClient` remains |
| **Callback path moved** | `/api/auth/oauth2/callback/ministry-platform` → **`/api/auth/callback/ministry-platform`**. This URL must be registered as a redirect URI on the MP OAuth client (`OIDC_CLIENT_ID`) for every environment. |
| Account identity keyed on `(issuer, accountId)` | **Reverted in 1.7.3** — back to `(providerId, accountId)`, and `accountIssuer` was removed. See [Version Notes](#173--account-identity-reverted-breaking). |
| Account subject no longer falls back to `id` | `getUserInfo` returns `sub` (see below) |
| `pkce` defaults to `true` | Kept explicitly `false`: MP does not support PKCE (its discovery document lists `S256`, but that does not mean it works). Accepted risk F8 — see below |
| ID tokens verified against provider JWKS | Automatic — MP publishes `jwks_uri`. It also turns on `nonce` binding, which MP cannot satisfy, so `disableIdTokenNonceBinding: true` is set (below) |

> ⚠️ **`getUserInfo` must return `sub`, not `id`.** MP's discovery document
> advertises `id_token_signing_alg_values_supported`, so Better Auth treats the
> provider as OIDC and its default `accountSubject` resolver reads
> **`profile.sub`** off the raw profile. Pre-1.7 the resolver fell back to
> `profile.id`; that fallback is gone. Returning only `id` resolves the account
> subject to `""` and breaks account identity for every user. `src/auth.test.ts`
> guards this by calling the real configured `getUserInfo`.

> ⚠️ **`accountIssuer` is gone — do not re-add it.** The advice above held only
> for 1.7.0–1.7.2. **1.7.3 reverted it** (#11153, #10978): accounts are keyed on
> `(providerId, accountId)` again, a discovery failure no longer throws out of
> `betterAuth()`, and the option was removed, so setting it is a type error.
> `providerId` is now the whole stable half of the account key — if it drifts,
> every existing user silently becomes a new account. Details and the resulting
> `>= 1.7.3` version floor: [Version Notes](#173--account-identity-reverted-breaking).

> ℹ️ **RP-initiated logout: only the `id_token` is taken from better-auth.**
> MP's discovery document exposes `end_session_endpoint`, so 1.7 builds a
> provider logout URL (with `id_token_hint`) and `auth.api.signOut()` returns it
> as `url` when called with `disableRedirect: true`. `handleSignOut()` reads
> `id_token_hint` from that URL (MP origin only) and builds the final URL
> itself, so `post_logout_redirect_uri` stays exactly `BETTER_AUTH_URL` —
> better-auth would normalise it with a trailing slash, which would not match
> the value registered in MP. See [Logout Flow](#logout-flow).

#### `nonce` binding is off, and must stay off

> ⚠️ **`disableIdTokenNonceBinding: true` is load-bearing — do not remove it.**
> Because MP publishes a `jwks_uri`, better-auth 1.7 derives an id_token config
> from discovery, sets `requiresIdTokenNonce`, sends a server-generated `nonce`
> on the authorize request and then requires the claim back (OIDC Core
> §3.1.3.7). **Ministry Platform does not return it.** `nonceMatches()` treats
> an absent claim as a mismatch, so every sign-in failed with
> `/auth-error?error=unable_to_get_user_info` and the server log line
> `id_token failed verification against the discovery JWKS or expected nonce`.
> Verified 2026-09-12 by decoding a real MP id_token: `kid`, `alg`, `iss` and
> `aud` all matched; only `nonce` was missing. Fixed in `f88a9f1`.
>
> It looked intermittent at the time, and the reason was inverted from the
> obvious one: before better-auth 1.7.3, sign-in **succeeded** only when the
> boot-time discovery fetch had failed, because that left the id_token config
> undefined and skipped verification entirely. That fail-open mode is gone: a
> failed discovery now skips the provider (404 until a rebuild, see
> [Upgrade Checklist](#better-auth-upgrade-checklist) step 5), and
> `requireIdTokenVerification` refuses a partial one.
>
> **What is still checked:** the id_token signature against MP's JWKS, `iss`
> and `aud`, plus the app's own `exp`/`azp` checks in `getUserInfo`. **What is
> given up:** binding the id_token to this particular authorization request.
>
> **Accepted risk (F8), stated plainly:** with MP omitting `nonce` and not
> supporting PKCE, **nothing binds an authorization code to the browser that
> started the flow.** The `state` cookie check does not help (an attacker who
> obtains a victim's code starts their own flow, with their own valid state, and
> injects the code into it), and being a confidential client does not help
> either (the app redeems the injected code with its own secret) —
> authorization-code injection, RFC 9700 §4.5, reproduced against a mock OIDC
> provider. The remaining defences keep codes out of an attacker's reach: a
> dedicated MP OIDC client with exact redirect URIs (see
> [MP OAuth Client Setup](#mp-oauth-client-setup)), `Referrer-Policy`, and no
> code-bearing URLs in logs. The OAuth state is also **not one-time** in cookie
> mode: the same `(cookie, state)` pair validates any number of callbacks for its
> 10 minutes, even after a successful sign-in (`expireCookie` only asks the
> browser to drop it — `node_modules/better-auth/dist/state.mjs`), which makes an
> injection cheaper to repeat. Only a server-side state store
> (`storeStateStrategy: "database"` + `secondaryStorage`) would fix that.
>
> **Pinned:** `src/auth.code-flow.test.ts` asserts `disableIdTokenNonceBinding`
> and drives the real code flow against a mock provider that omits `nonce`.

### User Additional Fields

```typescript
// Exported as `userAdditionalFields` from src/lib/auth.ts
user: {
  additionalFields: {
    userGuid: {
      type: "string",
      required: true,  // parseInputData rejects user creation without it
      input: true,     // MUST be true — see warning below
    },
    mpEmail: {
      type: "string",
      required: false, // MP does not require an email; sign-in must not depend on one
      input: true,
    },
  },
}
```

> ⚠️ **`userGuid` MUST keep `input: true`.** It is populated server-side from the
> OAuth profile via `mapProfileToUser`, **not** by user input. As of better-auth
> **1.6**, `parseAdditionalUserInputFromProviderProfile` strips any additional
> field declared with `input: false` *before creating the user record*. Setting
> `input: false` therefore silently drops `userGuid` → `session.user.userGuid`
> becomes `undefined` → every MP profile lookup fails (blank avatar, dead user
> menu, `userId: null`). This regressed once during the 1.4→1.6 upgrade.
> `src/auth.test.ts` guards it by running the real better-auth parse function
> against the real field config. Do not "tighten" this back to `input: false`.
> Still true as of better-auth 1.7.

> 🔒 **`input: true` is only safe because `/update-user` is disabled.** These two
> settings are a matched pair — neither is correct alone. See
> [Disabled Endpoints](#disabled-endpoints) below before changing either.

### Disabled Endpoints

**The route allowlist is now the primary control.** better-auth 1.7.4 mounts
~30 endpoints under `/api/auth/*`, but this app's browser client calls exactly
three: `GET /get-session`, `GET /callback/ministry-platform`, and
`POST /sign-in/social`. `src/app/api/auth/[...all]/route.ts` exports
`allowedAuthRoutes` and 404s any request whose method+path isn't in it —
deny-by-default, so a new endpoint a future better-auth version adds is closed
until someone deliberately opens it here, rather than silently exposed.
`disabledPaths` below (matched inside `auth.handler` itself) remains as
defense in depth for the specific paths it names.

`POST /sign-out` and `GET /error` are deliberately NOT in the allowlist:
sign-out runs server-side via `auth.api.signOut()` (see
[Logout Flow](#logout-flow)), so no HTTP sign-out route is needed, and OAuth
failures now redirect to this app's own `/auth-error` page instead of
better-auth's built-in error page (see [OAuth Flow](#oauth-flow)). If the
browser ever needs to call `authClient.signOut()` directly, `POST /sign-out`
would need to be added to `allowedAuthRoutes` first — the 404 today makes that
missing step loud rather than a silent no-op.

`src/lib/auth.ts` exports `disabledAuthPaths` and passes it as `disabledPaths`:

```typescript
export const disabledAuthPaths = [
  "/update-user",
  "/change-email",
  "/change-password",
  "/set-password",
  "/delete-user",
  "/delete-user/callback",
  "/link-social", // own id_token branch — see "id_token sign-in is disabled"
];
```

better-auth matches `disabledPaths` in the router's `onRequest` — before rate
limiting, plugins, and `sessionMiddleware` — so these return **404** to
authenticated and anonymous callers alike.

> ⚠️ **`/update-user` is a privilege escalation if reopened.** Its body schema is
> `z.record(z.string(), z.any())`; it rejects only `email` and passes every other
> key to `parseUserInput`, which copies any additional field declared
> `input !== false` verbatim, with **no validator**, then re-mints the session
> cookie from the result. Its only gate is `sessionMiddleware`. Combined with
> `userGuid: input: true` (mandatory, above), any authenticated user could run
> `fetch('/api/auth/update-user', { method: 'POST', body: '{"userGuid":"<victim>"}' })`
> and assume that user's identity — their MP roles and groups on every
> authorization check, and their `User_ID` on every MP write, so `dp_Audit_Log`
> attributes the caller's actions to the victim. The stateless/no-database setup
> is **not** a mitigation: the handler falls back to `{ ...session.user,
> ...additionalFields }` when the adapter returns nothing, so the value still
> lands in the cookie.

**Why the fix lives at the endpoint layer.** As of better-auth 1.6 the `input`
flag governs *both* "may the OAuth provider profile populate this" (needs `true`)
and "may a user POST this" (needs `false`). No value satisfies both, so the
protection cannot live on the field. A field-level `validator.input` does not
work either — it runs on the provider-profile path too, so it can constrain the
GUID's *shape* but cannot distinguish `mapProfileToUser` from an attacker sending
a well-formed GUID.

**Testing.** `src/auth.test.ts` asserts **both halves** — that `userGuid` stays
writable *and* that these paths 404 (verified against the real `auth.handler`,
plus a control asserting a non-disabled path still routes). Removing either
protection fails the build. Do not delete one test to make the other pass.

**History.** Introduced 2026-07-09 in `c9d80d4`, which flipped `userGuid` to
`input: true` to repair sign-in after the 1.6 upgrade (`720f39d`) without closing
the endpoint that the flag had been implicitly guarding since February. Before
that, `input: false` made `/update-user` answer `400 — userGuid is not allowed to
be set`.

### id_token sign-in is disabled (`/sign-in/social`)

**The vulnerability (fixed 2026-09-28).** better-auth's `POST /sign-in/social`
has two modes. Without `idToken` it starts the normal authorization-code
redirect — the only mode this app uses. With
`idToken: { token, accessToken }` it signs the caller in *directly*: it verifies
the id_token (signature, `iss`, `aud`) and then calls our `getUserInfo` with the
**caller-supplied** `accessToken` (`node_modules/better-auth/dist/api/routes/sign-in.mjs`).
Because `discoveryUrl` is set, genericOAuth builds an id_token config for the
provider, which switches that mode **on** (`supportsIdTokenSignIn`), and
genericOAuth has no option to turn it off. Nothing bound the verified id_token
to the access token, so an attacker's own valid id_token plus **any other
user's** MP access token minted a session as that other user. Reproduced end to
end against a mock OIDC server. Dropping `discoveryUrl` would also close it but
is a separate trade-off (it removes JWKS verification of the code-flow id_token
too), so it stays.

Three independent layers now close it; keep all three:

| Layer | Where | What it does |
|---|---|---|
| **Primary** | `refuseIdTokenSignIn` — `hooks.before` in `src/lib/auth.ts` | If `ctx.path === "/sign-in/social"` and the body *has* an `idToken` key (presence, not truthiness), throws `APIError.from("NOT_FOUND", { code: "ID_TOKEN_SIGN_IN_DISABLED" })`. User hooks run for HTTP **and** in-process `auth.api.signInSocial`, so this covers callers the route never sees. 404, not 400, to match the route's deny posture and better-auth's own `ID_TOKEN_NOT_SUPPORTED` (also 404). The customSession/nextCookies plugins register hooks on their plugin objects, so the user `hooks` key does not displace them |
| **Defence in depth** | `getUserInfo` in `src/lib/auth.ts` | Decodes the id_token payload (hand-rolled base64url — `jose` is only a transitive dependency) and refuses (`null`, never a throw) unless its `sub` equals the userinfo `sub`, case-insensitively. Logs `auth.userinfo.sub_mismatch` with a `reason` (`missing_id_token`, `undecodable_id_token`, `missing_sub`, `mismatch`) and nothing else — no GUIDs, no token content. The decode is unverified on purpose: genericOAuth's wrapper has already verified the id_token before `getUserInfo` runs |
| **Route filter** | `isAllowedSignInSocialBody` in `src/app/api/auth/[...all]/route.ts` | For `POST /sign-in/social` only: Content-Type media type must be exactly `application/json` (params and case tolerated, any `,` refused); `request.clone().json()` must parse to a plain object whose keys are all in `allowedSignInSocialKeys` (`provider`, `callbackURL` — exactly what `authClient.signIn.social` sends) with `provider === "ministry-platform"`. Anything else gets the route's usual 404 without reaching better-auth. This also closes `scopes`, `loginHint`, `additionalParams`, `errorCallbackURL`, `newUserCallbackURL`, `additionalData`, `requestSignUp` and `disableRedirect` |

**A missing id_token fails closed.** Every legitimate caller supplies one: the
code-flow callback requests `openid`, for which OIDC Core §3.1.3.3 requires an
id_token in the token response (MP sends one), and the id_token mode cannot run
without one. An access token with nothing to bind it to therefore means an
unexpected code path, and is refused. If MP ever stopped sending id_tokens,
sign-in would fail loudly with `reason: "missing_id_token"` in the log.

**Why the Content-Type check is strict.** better-call uses its JSON parser only
when the header matches the anchored `/^application\/([a-z0-9.+-]*\+)?json/i`;
anything else falls through to *substring* matches for form, multipart, text and
octet-stream (`node_modules/better-call/dist/utils.mjs`, `getBody`). A filter
that JSON-parsed a body better-call then parses some other way would inspect
different keys than better-auth acts on. So the filter tests the **raw** header
against an anchored `/^application\/json[\t ]*(;|$)/i` — anything that passes
starts with `application/json`, so better-call's JSON parser is the one that
runs, on the same bytes the filter read. It is deliberately not `trim()`med: JS
`trim()` strips U+00A0 (NBSP), which HTTP does not treat as whitespace, so a
trimmed check accepted ` application/json` — a value better-call does
*not* parse as JSON (fixed 2026-09-29). The "no comma" rule (which also catches
a repeated Content-Type header, joined by `Headers.get` with `", "`) is belt and
braces: such a value still starts with `application/json`.

**It is also the CSRF guard for this endpoint.** better-auth validates `Origin`
only on cookie-bearing requests (`api/middlewares/origin-check.mjs`), and a
first sign-in carries no cookie. A cross-site form cannot send
`application/json` without a CORS preflight, so the route's JSON-only rule is
what stops a cross-site POST to `/sign-in/social` (login CSRF). By design;
noted in `src/auth.origin-check.test.ts` and pinned in `route.test.ts`.

**`/link-social` is closed separately.** It has an id_token branch of its own
that the hook does not inspect. It is session-gated and not in the route
allowlist, and this app never links accounts, so it is in `disabledAuthPaths`
(404 before any hook or session check). Re-enabling it would need the same
treatment as `/sign-in/social`.

**Testing.** `src/auth.id-token-sign-in.test.ts` drives the real `auth` against
a mock MP OIDC provider with really signed id_tokens: the hook refuses the
attack over HTTP and in-process; with the hook removed, the binding alone
refuses it (and a matched pair still signs in, proving the mode is live).
`src/auth.test.ts` covers every `getUserInfo` binding branch;
`src/app/api/auth/[...all]/route.test.ts` covers the body filter, including that
better-auth still receives the original body after the clone. Each layer was
mutation-checked: removing it turns tests red.

### customSession Callback

The callback delegates to `enrichSessionUser`, exported from `src/lib/auth.ts` so it
can be unit tested (the plugin closes over its callback and never exposes it). It does
one MP lookup — the acting user's `User_ID` — and withholds `WITHHELD_SESSION_FIELDS`
(`token`, `ipAddress`, `userAgent`) from the returned session. Nothing in `src/` read
them, and a raw session token handed to page JS would become a bearer credential the
day a `bearer` plugin is added. They stay on the in-memory row and inside the encrypted
`session_data`.

```typescript
// src/lib/auth.ts (simplified)
export async function enrichSessionUser(user, session) {
  const userGuid = user.userGuid;
  const userId = userGuid ? await resolveMpUserId(userGuid) : null;
  return {
    user: { ...user, userId },
    session: withholdSessionFields(session), // drops token/ipAddress/userAgent
  };
}

customSession(async ({ user, session }) => enrichSessionUser(user, session), options)
```

**Why `userId` is resolved here.** MP's audit log keys on the `$userId` passed to write
APIs, and the authorization gate needs the same value. Baking it into the session means
`SessionContextService` can read it without a `dp_Users` round-trip on every request.

**Why that is the *only* API call.** `customSession` runs on **every** `/get-session`
(and every server-side `auth.api.getSession()`), cookie cache or not — including
`useSession()`'s window-focus refetches — so anything expensive here is paid
constantly. It does **not** run at callback time, and its output is never stored in
the cookie (the cookie holds better-auth's own user/session fields; `userId` is
recomputed per call). `resolveMpUserId` is guarded by a process-wide
`Map<User_GUID, …>` (`userIdCache`) with a 15-minute TTL (`USER_ID_CACHE_TTL_MS`), so
it costs at most one MP call per (user × container × 15 min). The TTL means a deleted
or re-pointed `dp_Users` login loses its attributed `User_ID` within 15 minutes instead
of never; it does **not** end the session. A failed lookup never blocks session
creation: it returns `userId: null` and is **negative-cached** — 30 s when the lookup
threw (`USER_ID_FAILURE_CACHE_TTL_MS`, logged as `auth.session.user_id_unresolved`
with the error's name only, never the GUID) and 5 min when MP answered with no such
login (`USER_ID_NOT_FOUND_CACHE_TTL_MS`) — so an MP outage is not amplified by every
open tab. The write path surfaces the `null` as `mp.write.non_user` and the gate
refuses it as `no_mp_user`. The MP profile (name, email, photo) is loaded by
`ServerProviders` / `UserProvider`, not here.

## Auth Client (`src/lib/auth-client.ts`)

```typescript
import { createAuthClient } from "better-auth/react";
import { customSessionClient } from "better-auth/client/plugins";
import type { auth } from "./auth";

// `genericOAuthClient()` was dropped in better-auth 1.7 — generic OAuth
// providers are reached through the standard social sign-in API.
export const authClient = createAuthClient({
  plugins: [
    customSessionClient<typeof auth>(),
  ],
});
```

### Client-Side API

| Method | Purpose |
|--------|---------|
| `authClient.useSession()` | React hook — returns `{ data: session, isPending }` |
| `authClient.getSession()` | Async — returns `{ data: session }` |
| `authClient.signIn.social({ provider, callbackURL })` | Initiates OAuth flow (was `signIn.oauth2({ providerId })` before 1.7) |
| `authClient.signOut()` | **Not usable** — `POST /sign-out` is not in the route allowlist, so it 404s. Use the `handleSignOut` server action (full OIDC logout) |

## OAuth Flow

```
1. User visits app → proxy checks session cookie → no cookie → redirect to /signin
2. /signin page → authClient.signIn.social({ provider: "ministry-platform" })
3. Redirect to MP OAuth → user authenticates → redirect to callback
4. Callback URL: /api/auth/callback/ministry-platform
   (moved from /api/auth/oauth2/callback/... in better-auth 1.7 — must be
   registered as a redirect URI on the MP OAuth client)
5. Better Auth:
   a. Exchanges code for tokens
   b. Validates the oauth_state cookie, then verifies the id_token signature,
      iss and aud against MP's JWKS (nonce binding is disabled — MP omits it)
   c. Calls getUserInfo(tokens) → fetches OIDC profile → returns { sub, ... }
      (returns null, refusing sign-in, if sub is missing or malformed, if the
      id_token is missing, or if its sub differs from the userinfo sub)
   d. Calls mapProfileToUser(profile) → { userGuid: sub, email: <sub>@mp.invalid,
      mpEmail: real address or null }
   e. Resolves the account subject from profile.sub (OIDC default)
   f. Creates user record (id=generated, userGuid=sub, synthetic email, mpEmail, name)
   g. Creates account record (providerId="ministry-platform", accountId=sub;
      access/refresh tokens blanked, id_token kept)
   h. Creates the session → sets session_token + encrypted (JWE) session_data
      cookies. customSession does NOT run here; it runs on each /get-session,
      which is where userId is resolved from dp_Users
6. Redirect to callbackURL → app loads with session
7. ServerProviders (below AuthWrapper in the (web) layout) calls
   getCurrentUserProfile() during the server render and streams the promise to
   UserProvider (userGuid comes from the session, never from the caller)
```

### /signin must start exactly ONE OAuth flow

Step 2 is not idempotent and must never run twice for one page load.

`account.storeStateStrategy` is `"cookie"`, so each `signIn.social()` call mints
its own `state` and overwrites the single `oauth_state` cookie that step 5b
validates against. Two calls race, only the last cookie written can win, and the
loser's callback fails validation. It is intermittent, which makes it look like
an MP or network problem rather than a client bug.

When this was found (2026-09-12), nonce binding was still on as well, so each
call also minted a competing id_token `nonce` and the failure surfaced as
`/auth-error?error=unable_to_get_user_info` with `id_token failed verification
against the discovery JWKS or expected nonce` in the server log. Nonce binding
has since been disabled (MP never sent the claim — see
[`nonce` binding is off](#nonce-binding-is-off-and-must-stay-off)), but the
`state` race is independent of it and the guard is still required.

This actually happened (2026-09-12, fixed in `d201b10`). The guard in
`src/components/sign-in/sign-in.tsx`
was a `useState` flag read *inside* the `getSession()` callback, with the state
in the effect's dep array. React StrictMode double-invokes effects in dev: both
runs reached the async callback before `setIsRedirecting(true)` landed, both
had captured `false`, and both called `signIn.social()` — two
`POST /api/auth/sign-in/social` per attempt.

The guard must be a **ref, checked and set synchronously before the first
`await`**. A state flag cannot work here, no matter where it is read.
`src/app/signin/page.test.tsx` pins this with a StrictMode test; that test
fails against the old implementation.

`/signin` also no longer fails silently: a 429 from the rate limiter, a missing
provider (`PROVIDER_NOT_FOUND`), a failed session check or a failed start each
show a message with a retry button instead of a blank spinner, and automatic
restarts are capped (`MAX_AUTOMATIC_SIGN_IN_ATTEMPTS` = 2 per 2 minutes,
`src/components/sign-in/sign-in-attempts.ts`, cleared by `SessionGuard` once a
session is seen), so a callback that keeps failing cannot loop through MP
forever.

**On failure**, better-auth's callback redirects to `onAPIError.errorURL`
(`/auth-error`, configured in `src/lib/auth.ts`) with the failure code as a
query parameter: `/auth-error?error=<code>` (and, when available,
`&error_description=<text>`, which `src/app/auth-error/page.tsx` never
renders; the message comes from an allowlist of known codes, with a generic one
otherwise, and the code itself is echoed only if it matches `^[a-z0-9_]{1,64}$`,
so a crafted link cannot put attacker prose on the page). This replaces better-auth's built-in `/api/auth/error` page, which
the route allowlist (see [Disabled Endpoints](#disabled-endpoints)) no longer
exposes.

## Logout Flow

```
1. User clicks sign out → calls handleSignOut() server action
2. auth.api.signOut({ body: { disableRedirect: true } }) → deletes this
   process's in-memory session row and clears THIS browser's cookies (it does
   not revoke a copied cookie pair — see Session lifetime), and returns
   better-auth's provider logout URL (when this process holds the account
   row — one shared `auth` per process)
3. Redirect to MP endsession endpoint:
   ${MP_BASE_URL}/oauth/connect/endsession
     ?post_logout_redirect_uri=${BETTER_AUTH_URL}&client_id=${OIDC_CLIENT_ID}
     [&id_token_hint=<id_token>]
4. MP clears its session → redirects back to app
5. App loads without session → proxy redirects to /signin
   (Other open tabs: SessionGuard sees the session end and sends them to
   /signed-out, which starts no OAuth)
```

`client_id` is always sent and `id_token_hint` whenever it is available. Without either, an IdentityServer-style OP (MP) cannot tell which client's post-logout URIs to check: it shows a "log out?" prompt and does not redirect, so a user who closes the tab there leaves the MP SSO session alive on a shared PC. The `id_token` comes only from the in-memory account row of the process that handled sign-in (there is no account cookie — see [Session Strategy](#session-strategy); all bundle layers share one `auth`, see Session lifetime), so on another serverless instance only `client_id` is sent. **Tested against MP 2026-09-29 (Playwright):** with `id_token_hint`, MP logs out with no prompt and redirects back; with `client_id` alone, MP shows "Would you like to logout?" with a **Yes** button, and redirects only after Yes. `handleSignOut()` throws, after clearing the local session, if `OIDC_CLIENT_ID` is unset, or if `MINISTRY_PLATFORM_BASE_URL` or `BETTER_AUTH_URL`/`NEXTAUTH_URL` is unset or fails the `src/lib/env.ts` checks (non-https, malformed, credentials or query in the URL) — there is no localhost fallback. The `post_logout_redirect_uri` is the origin of `BETTER_AUTH_URL` (`getAuthBaseUrl()`: a path is refused, a single trailing `/` is dropped) and must be registered in the MP OAuth client configuration exactly as that origin.

Sign-out is entirely server-side (`auth.api.signOut()`, called in-process from
the server action) — the browser never calls a `/sign-out` HTTP endpoint, which
is why `POST /sign-out` is not in the route allowlist (see [Disabled Endpoints](#disabled-endpoints)).

## Route Protection (`src/proxy.ts`)

Uses `getSessionCookie()` from `better-auth/cookies` for fast cookie-only checks: it tests that a session cookie is **present**, not that it is valid (no decoding, no API calls). It is an optimistic redirect for signed-out visitors, not the gate — `AuthWrapper` and every server action re-validate the session.

`proxy()` also builds the per-request Content-Security-Policy nonce and attaches
the CSP to **every** response it produces, redirects included — see
[Security Headers](security-headers.md). That is why `/signin` must stay a server
component: a prerendered page has no request, so no nonce.

### Public Paths (no auth required)

- `/api` and `/api/*` — All API routes (Better Auth handles its own auth). Exact
  `/api` or under `/api/` — not `/apifoo` or `/api-keys`
- `/signin` — Sign-in page
- `/auth-error` — OAuth-failure landing page. Must stay public: a session-less
  visitor sent here after a failed callback would otherwise be bounced to
  `/signin`, which auto-starts OAuth again — a loop that never shows the
  failure.
- `/signed-out` — Where `SessionGuard` sends a tab whose session ended. Must
  stay public for the same reason: bounced to `/signin`, it would auto-start
  OAuth and, with the MP SSO session still alive, silently sign the tab back in.
- Excluded by the matcher (no proxy at all — no cookie redirect, no CSP):
  `/_next/static/` and `/assets/` as directories, `/_next/image` itself or under
  it, and `/favicon.ico` exactly. Each exclusion is escaped and anchored; the
  old prefix form also skipped e.g. `/faviconXico` and `/_next/staticX`.

### Protected Paths

Everything else requires a session cookie to be **present** (its value is not
checked here). Missing cookie → redirect to `/signin`. Note that server actions
are POSTs to page paths, so they pass the proxy with any cookie value too — which
is why every action gates itself.

### Authentication is not authorization

`src/proxy.ts` and `AuthWrapper` answer only "is there a session?". **Any** Ministry
Platform user can obtain one — MP's OIDC endpoint authenticates every `dp_Users`
record, and this app reads MP with its own client-credentials service account
(`dataplatform/scopes/all`), so MP's per-user record security never filters what
this app returns. Route protection therefore gets a user as far as the app shell
and no further:

| Route | Needs a session | Needs an MP security role |
|---|---|---|
| `/signin`, `/auth-error`, `/signed-out` | No | No |
| `/`, `/home`, `/no-access` | Yes | No |
| `/session-error` | A cookie only — the proxy passes any cookie value, and the page (outside `(web)`) does not validate it | No |
| `/contactlookup`, `/contactlookup/[guid]` | Yes | **Yes** — the layout redirects a role-less user to `/no-access` (UX); `[guid]/page.tsx` calls `requireSecurityRole` itself before any data call (enforcement) |

See [Authorization](#authorization-distinct-from-authentication) for the gate
behind the last row.

## Broken-Session Recovery

A session can authenticate successfully yet lack a `userGuid` (e.g. the
better-auth 1.6 regression, or a future provider/config change). Without a
`userGuid` the MP profile never loads, so `Header` renders its non-interactive
fallback — no dropdown, and therefore **no way to sign out**. To prevent that
dead end:

- `AuthWrapper` treats a session with no `userGuid` as unusable and redirects to
  `/session-error`.
- `/session-error` (in `src/app/session-error/`, **outside** the `(web)` route
  group so it isn't wrapped by `AuthWrapper`) renders a plain page with a
  `handleSignOut` form button, giving the user an unconditional exit.
- After sign-out the Better Auth cookie is cleared and the user is bounced to
  MP's endsession endpoint, then back through `/signin` for a fresh login.

Guarded by `src/components/layout/auth-wrapper.test.tsx`.

## Session Access Patterns

### Server Components

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const session = await auth.api.getSession({ headers: await headers() });
if (!session) {
  redirect("/signin");
}
```

### Server Actions

Any action that **reads or writes Ministry Platform data** calls the authorization
gate, not a bare session check. The gate implies an authenticated session (it fails
closed when no MP user resolves), so it replaces the session check rather than
following it — and it returns the acting `User_ID`, so a write never has to look one
up again:

```typescript
"use server";
import { AuthorizationService } from "@/services/authorizationService";

// A read.
export async function getThings() {
  await AuthorizationService.getInstance().requireSecurityRole({
    table: "Contacts",
    operation: "read",
  });
  // ...
}

// A write — take $userId from the gate's return value.
export async function updateThing() {
  const userId = await AuthorizationService.getInstance().requireSecurityRole({
    table: "Contact_Log",
    operation: "update",
  });
  // ... pass { $userId: userId } to the MP write
}
```

A bare session check is correct only for an action that touches **no per-person MP
data** — today that is `getCurrentUserProfile` (a user's own profile; any MP user may
sign in and must be able to load it) and `getMpTimezone` (one domain-wide config
string):

```typescript
"use server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function myAction() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw new Error("Authentication required");
  }

  // For MP API lookups, use userGuid (NOT user.id)
  const userGuid = (session.user as Record<string, unknown>).userGuid as string;
  // ... use userGuid to query dp_Users
}
```

### Client Components

```typescript
"use client";
import { authClient } from "@/lib/auth-client";

function MyComponent() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <Loading />;
  if (!session) return <NotAuthenticated />;

  // For MP API lookups, use userGuid
  const userGuid = (session.user as { userGuid?: string })?.userGuid;
}
```

### UserProvider Pattern

The full MP user profile is loaded during the server render and streamed to the client:

1. `ServerProviders` (`src/app/server-providers.tsx`) renders below `AuthWrapper`, so it
   only runs once a session is confirmed, and passes an **un-awaited** promise to
   `Providers` → `UserProvider`. Awaiting it would hold the whole shell on MP.
2. That promise comes from `getCurrentUserProfile()` — **it takes no parameters**.
   The `User_GUID` is read from the session server-side, never accepted from the
   caller: the profile discloses the user's name and email, and GUIDs are not
   usefully secret (they appear in the client session and in `/contactlookup` URLs)
3. `UserService.getUserProfile()` queries `dp_Users WHERE User_GUID = '{userGuid}'`.
   It re-reads the session itself and throws `UnauthorizedError` for any GUID but the
   session's own, so a future caller cannot turn it into a lookup of someone else
4. Returns the `CurrentUserProfile` DTO (`src/lib/dto`), built field by field:
   `First_Name`, `Nickname`, `Last_Name`, `Email_Address`, `Image_GUID`, plus the
   server-computed `canAccessContactFeatures` UX flag. No IDs, GUIDs, phone, roles or
   user groups — whatever a server action returns is readable by any script on the page
5. Profile available via `useUser()` hook in any client component. `useUser()`
   **suspends** until the promise settles. A failed load resolves to `null` (logged
   as `user.profile.load_failed`, name only) rather than rethrowing: the header — the
   shell's only sign-out control — sits above `(web)/error.tsx`, so a rejection used
   to replace the whole shell and leave no way to sign out. `refreshUserProfile()`
   reloads it through the same server action, inside `startTransition` so rendered
   consumers keep their content meanwhile.

Keep every `<Suspense>` around a `useUser()` caller tight and the same size as what
it replaces. Before 2026-09-29 the *whole* `Header` suspended behind an in-flow
`<div className="h-16" />` fallback while the profile loaded client-side after
hydration; the fixed bar vanished and `<main>` dropped 64px on every page load (CLS
≈ 0.05). Now only the avatar suspends, behind a same-size placeholder.

## Authorization (distinct from authentication)

**Authentication** answers "is there a valid session?" — `auth.api.getSession()`.
**Authorization** answers "may this session do this?" — `AuthorizationService`
(`src/services/authorizationService.ts`). They are separate gates; a valid session is
necessary but **not** sufficient for a read or a write.

### Decided policy (writes 2026-08-21; reads 2026-09-12)

> **Any Ministry Platform user may sign in.** A user with no security role gets a
> session, the app shell (header, avatar, user menu, sign-out) and the home page.
>
> **The contact-lookup and contact-log features require a *permitted* MP security
> role** — for reads as well as writes. The permitted roles are named in
> `MP_SECURITY_ROLES` (or `*` for "any MP security role"); with nothing configured,
> **nobody** is permitted (fail-closed default, 2026-09-28). A user who holds a
> permitted role may read, create, edit, and delete any contact log, including one
> another user created.

Sign-in itself is deliberately **not** role-gated. There is no role check in
`getUserInfo` / `mapProfileToUser`, in `customSession` / `enrichSessionUser`, or in
`AuthWrapper`; a role-less user must be able to reach a page that explains the problem
and offers a sign-out, not be bounced off the login screen.

**Why reads need a gate at all (F1).** Until 2026-09-12 the contact search, contact
details, contact logs and the page guard checked only that a session existed. That
proved nothing: MP's OIDC endpoint authenticates **any** `dp_Users` record, and this
app fetches all MP data with its own client-credentials service account
(`dataplatform/scopes/all`), so MP's per-user record security never applies to what
the app returns. A session was therefore not evidence that the caller may see pastoral
records; only this gate is.

**Why role membership and not ownership:**

- MP security roles (`dp_User_Roles` → `dp_Roles`) are the domain's own authorization
  mechanism. This app defers to them rather than inventing a parallel permission model
  that could drift out of sync with MP. Note the deferral is to role **membership**
  only: the gate does not consult MP's per-role table rights (`vw_mp_User_Rights`) or
  record-level security (`dp_Record_Security`), and `table`/`operation` do not affect
  the decision. That is why the role list must be chosen deliberately.
- Ownership (`Made_By`) is deliberately **not** a factor. Contact logs are shared
  pastoral records; staff need to correct and remove each other's entries. Gating on
  ownership would mean a supervisor could not fix a bad log through this app.
- The gate fails closed: a session whose MP `User_ID` never resolved is refused, and so
  is one whose role list cannot be established — and so is **everyone** when no role
  policy is configured (see [Configuring the gate](#configuring-the-gate)).

### The four layers

Three of these are enforcement; the fourth is presentation and is **not** a security
control. Each enforcement layer re-checks, because each is independently reachable — a
server action is a callable POST endpoint whether or not the page that calls it was
ever rendered.

| Layer | Where | What it does |
|---|---|---|
| **Page (server)** | `src/app/(web)/contactlookup/[guid]/page.tsx` (and every future page that reads MP data) | `requireSecurityRole` before any data call; an `UnauthorizedError` becomes `redirect("/no-access")`. **Each page must gate itself.** The `contactlookup/layout.tsx` check (`hasSecurityRole` → `/no-access`) is a UX redirect only: Next 16 renders the page as its own segment, so a layout `redirect()` does not stop the page running or its output reaching the RSC payload (`node_modules/next/dist/docs/01-app/02-guides/authentication.md`, "Layouts and auth checks"), and layouts are not re-rendered on client navigation |
| **Server action** | `contact-lookup/actions.ts`, `contact-lookup-details/actions.ts`, `contact-logs/actions.ts` | `requireSecurityRole` on every exported action, reads included |
| **Service** | `ContactService`, `ContactLogService` | `requireSecurityRole` inside each read and write method, so a future caller that bypasses the actions still cannot reach MP data |
| *UX only* | `layout/sidebar.tsx`, `home-demos/contact-lookup-demo-card.tsx` | Hide navigation a role-less user would only be refused at. Reads the server-computed `canAccessContactFeatures` flag (below) — never policy derived on the client from role names |

`AuthWrapper` is unchanged and stays the **authentication** gate for the `(web)` group
(plus the `/session-error` recovery path). It knows nothing about roles.

### Using the gate

```typescript
import { AuthorizationService } from "@/services/authorizationService";

// Throws UnauthorizedError when the caller may not do this.
// Returns the acting user's MP User_ID, so no dp_Users round-trip is needed.
const userId = await AuthorizationService.getInstance().requireSecurityRole({
  table: "Contact_Log",
  operation: "read", // "read" | "create" | "update" | "delete"
});
```

| Member | Signature | Use |
|---|---|---|
| `requireSecurityRole` | `(ctx: { table: string; operation: "read" \| "create" \| "update" \| "delete" }) => Promise<number>` | The gate. Throws `UnauthorizedError`; returns the acting MP `User_ID` |
| `requireSecurityRoleForWrite` | same, `operation` narrowed to the three write verbs | Thin alias kept for write call sites (and so a `read` passed at a write boundary is a type error) |
| `hasSecurityRole` | `(ctx) => Promise<{ permitted, userId, reason }>` | Non-throwing form the throwing gate is built on. Use for redirects and UI affordances — **never** as the enforcement point |
| `getSecurityRoles` | `(userId: number) => Promise<string[]>` | Role names from `dp_User_Roles`, memoized per RSC render (see [Caching](#caching-per-request-never-across-requests)) |

`hasSecurityRole` reports a *denial* as `permitted: false`, but still **throws** on
infrastructure failure at the role read (MP unreachable, an unusable acting `User_ID`)
so that failure can never be mistaken for "this user is not allowed". **Known gap:** a
failure one step earlier is not distinguished — if the session lookup throws, or the
MP `User_ID` could not be resolved (e.g. MP was down when `customSession` ran, and the
`null` is negative-cached for 30 s), `SessionContextService` yields `null` and the gate
reports `no_mp_user`, so the user sees `/no-access` rather than an error until the
cache entry lapses. It still fails closed.

The acting user comes from `SessionContextService`: `getCurrentUserId()` for reads,
`getActingUserIdForWrite()` for writes, so an unattributed write still emits the
structured `mp.write.non_user` warning before the gate refuses it. Server actions must
**not** re-implement the `dp_Users` lookup inline.

Denials are logged as a structured `mp.write.unauthorized` (writes) or
`mp.read.unauthorized` (reads) event — same shape, with `table`, `operation`, `userId`,
and a `reason` of `no_mp_user` / `no_security_role` / `role_not_permitted` /
`roles_not_configured` — so refused operations are greppable in production logs. A
missing or unusable role policy additionally emits one `mp.authz.config` warning per
process (`problem`: `unconfigured`, or `no_names:<VAR>` for a value like `","`). `hasSecurityRole` logs nothing: it runs on
every profile load, and the UI asking "may they?" is not an incident.

#### Logging policy (F5, closed 2026-09-12)

No debug/info logging (`console.log`/`.debug`/`.info`) is allowed in `src/` outside
`src/lib/providers/ministry-platform/scripts/` (dev-only CLI tools). Contact logs carry
pastoral notes and every MP read/write can carry member PII (names, emails, phones); a
hosting or log-aggregation platform retains `console.*` output with broader access and
longer retention than the MP database itself, so none of that content may reach a log
line.

`console.error`/`console.warn` in catch blocks may stay, but must log **identifiers and
shape, never content**: table name, record IDs/counts, HTTP status, and an error's
`name`/`message` — never an MP result set, a request body, `Notes`, emails, phones,
names, or a URL/query string containing `$filter`. The HTTP client's failure logs are the
canonical shape: `{ method, endpoint (path only, no query string), status, statusText }`,
and the thrown `Error`'s message keeps only `status`/`statusText`/`endpoint` — no
response body. The structured events above (`mp.read.unauthorized`,
`mp.write.unauthorized`, `mp.write.non_user`, and in `src/lib/auth.ts`
`auth.userinfo.invalid_sub`, `auth.userinfo.sub_mismatch`,
`auth.userinfo.id_token_claims_invalid`, `auth.userinfo.fetch_failed`,
`auth.session.user_id_unresolved` and `auth.discovery.rebuild`) are the greppable
contract this policy exists alongside; they log a `reason`/status/error name only —
never GUIDs, token contents or `err.message` — and are unaffected by it. Caller input
is never echoed into our own log lines or thrown messages either (log injection).

**Accepted: better-auth's own logger.** better-auth logs some request values
verbatim — e.g. the OAuth callback's `error`/`state` parse failures and the
rejected `Origin` in `Invalid origin: …` (`api/routes/callback.mjs`,
`api/middlewares/origin-check.mjs`) — so a crafted request can put
attacker-chosen text in a log line. That is outside this app's code and accepted;
the fix, if it is ever needed, is a custom `logger` in the better-auth options.

#### Attribution is server-authoritative (F4, closed 2026-09-12)

`Contact_Log.Made_By` and `Contact_Log.Contact_ID` are **never taken from the caller**.
A server action is a POST endpoint whose payload shape the caller controls, and
TypeScript types are erased at runtime, so a narrow parameter type guards nothing on
its own. Before this was closed, a role-holder could re-attribute a pastoral log to a
different staff member, or move it onto a different contact's record, with one crafted
request.

The rule, enforced in `ContactLogService` (the boundary every path goes through,
including one that bypasses the actions):

| Field | Create | Update |
|---|---|---|
| `Made_By` | the authorization gate's returned `User_ID` | **never sent** — MP keeps the original author; the editor is recorded in `dp_Audit_Log` via `$userId` |
| `Contact_ID` | caller-supplied subject contact, validated by `sanitizeNumericId` | **never sent** — MP preserves the row's existing value |

Mechanically: each write path parses the caller's payload through an **allowlist**
schema (`ContactLogSchema.pick({...})` — create: `Contact_ID`, `Contact_Log_Type_ID`,
`Notes`; update: `Contact_Log_Type_ID`, `Notes`; `Contact_Date` goes through
`DomainTimezoneService` separately), and a Zod object parse strips keys the schema
does not declare — so a smuggled `Made_By`, `Feedback_Entry_ID`,
`Original_Contact_Log_Entry`, `Planned_Contact_ID` or `Contact_Successful` is
*dropped*, not merely untyped. On create the server-stamped `Made_By` is spread
**last** into the record so nothing above it can win. `requireSecurityRole` runs
*first* in both methods, since its return value is the only source of attribution.

Two consequences worth knowing:

- `Made_By` means **who wrote the note** and does not change on edit. (From
  2026-09-12 until the 2026-09-28 review's fix landed on 2026-09-29, the update path
  re-stamped it with the editor, so any role-holder's trivial edit erased the original
  author.)
- The actions deliberately assemble **neither** field. Attribution has exactly one
  source; two layers stamping it could drift, and a caller value could slip past
  whichever was checked second.

### Caching: per request, never across requests

The gate now runs at up to three layers per request, so the `dp_User_Roles` read is
memoized with React's `cache()` from `"react"`, keyed by `User_ID`. The memo applies
only **during an RSC render** (a page or layout and the services it calls): those
calls cost one role read however many layers gate. It does **not** dedupe inside a
server action — Next runs an action outside a React render, where `cache()` calls
straight through — so an action that gates and then calls a gated service method
costs one role read per gate call. An extra MP read, never a wrong answer.

There is still **no cross-request cache** — no module-level map, no TTL. Roles are
re-read on the next request, so a revoked role stops working immediately. A cached
authorization decision against a shared production database is not a trade worth
making, and the per-request memo does not make it: a memo cannot outlive the request
that created it.

> ℹ️ **`cache()` outside a React request scope is a passthrough.** React calls straight
> through when no cache dispatcher is installed, which is the case under Vitest and in
> any plain Node caller. Tests therefore observe the *uncached* behaviour — which is
> exactly the behaviour that must hold in both environments — so the suite asserts "the
> decision is not carried across calls" and never asserts a hit count that only holds
> inside a request.

### Configuring the gate

`MP_SECURITY_ROLES` decides who may use the contact features, reads and writes alike.
It is resolved per call (no restart needed in tests; a redeploy picks up changes):

| Value | Meaning |
|---|---|
| `"Administrators,Pastoral Staff"` | The user must hold one of these roles. Case- and whitespace-insensitive |
| `*` | Any MP security role will do. Must be the **whole** value — `"Administrators,*"` is a list whose `*` entry matches nothing |
| unset / blank | **Nobody** is permitted (`reason: roles_not_configured`) |
| names no roles, e.g. `","` | Treated as unset — never as "any role" — with an `mp.authz.config` warning |

```
MP_SECURITY_ROLES="Administrators,Pastoral Staff"
```

> ⚠️ **Breaking change (2026-09-28).** Until then, unset/blank meant "any MP security
> role", so every fork inherited a policy under which e.g. a check-in kiosk account
> could read every pastoral note. The default now fails closed in every `NODE_ENV` (no
> prod/dev divergence). A deployment that relied on the old default must set
> `MP_SECURITY_ROLES=*` — or, better, name the roles. `npm run setup` prompts for it,
> and `npm run setup:check` warns when it is blank or names no roles.

> ⚠️ **`MP_WRITE_SECURITY_ROLES` is deprecated.** It predates the read gate and named
> only writes. It is still read as a fallback when `MP_SECURITY_ROLES` yields no usable
> policy (unset, blank, or naming no roles) — so `MP_SECURITY_ROLES=","` falls through
> to it rather than widening anything — but it now governs reads too, and
> `MP_SECURITY_ROLES` wins where both are usable. `*` works here as well. Migrate one
> variable at a time; new deployments should set only `MP_SECURITY_ROLES`.

> ⚠️ **Roles are matched by name, not `Role_ID` (deferred, decision 2026-09-29).**
> The gate compares the trimmed, lower-cased `dp_Roles.Role_Name` of each role the
> user holds against the list. MP role names are editable free text and are not
> unique, so **anyone who can create, rename or assign MP Security Roles can satisfy
> the gate** — e.g. by naming a new role "Pastoral Staff". Restrict who can edit
> Security Roles (and `dp_User_Roles`) in MP to the people you would trust with every
> pastoral note. A role whose name contains a comma cannot be listed. The future
> option is an ID-based variable (e.g. `MP_SECURITY_ROLE_IDS`); not implemented.

**Other known limitations (open):** there is one list for reads and writes; and the
gate does not consult MP's own per-role table rights (`vw_mp_User_Rights`) or
record-level security (see
[Additional Security Hardening § 3](../../docs/security/Additional_Security_Hardening.md)).

### `/no-access`

`src/app/(web)/no-access/page.tsx` is where the layout sends a user without a permitted
role (including everyone, when no role policy is configured). It is
**inside** the `(web)` group on purpose: the session is perfectly valid, so the user
keeps the header, the avatar and — the part that matters — sign-out. (Contrast
`/session-error`, which lives *outside* the group precisely because the shell cannot
render there.) The page is static, with no auto-redirect and no retry: the fix is an
administrator granting a role in MP, which cannot happen while the page refreshes
itself. Granting the role takes effect on the user's next request, with no need to sign
out and back in — there is no cached decision to expire.

### Open redirect on `/signin` (F3, closed 2026-09-12)

`callbackUrl` comes off the query string and was assigned straight to
`window.location.href` for a visitor who already had a session, so
`/signin?callbackUrl=https://evil.example` bounced the user off-site from a URL that
looks like this app's own login page. `sanitizeCallbackUrl` in
`src/components/sign-in/sign-in.tsx` now reduces it to a same-origin relative path,
falling back to `/`. The value must start with `/` and must not start with `//`; it
must contain **no** backslash anywhere (special-scheme URLs treat `\` as `/`), no C0/C1
control character or DEL (the URL parser silently strips tab/CR/LF *after* string
checks — the F3b bypass, fixed 2026-09-25), and no `%2f`/`%5c` in the path; finally
`new URL(raw, sentinel)` must stay on the sentinel origin, and the **raw** value (not
the normalized one) is returned. The rules mirror better-auth's `isSafeRelativeURL`.
The sanitized value feeds **both** sinks: the `location.href` assignment and the
`callbackURL` handed to `signIn.social` (which better-auth also validates
server-side; defence in depth).

### Closed findings

| Finding | Closed | Fix |
|---|---|---|
| **F1** (High) — reads gated on a session only, at one layer | 2026-09-12 | Role gate at the page, action **and** service layers; `mp.read.unauthorized` denial log |
| **F3** (Medium) — open redirect via `callbackUrl` on `/signin` | 2026-09-12 | `sanitizeCallbackUrl`, applied to both redirect sinks |
| **F10** (Low) — `ContactService.updateContact` wrote with no authorization | 2026-09-12 | Calls `requireSecurityRole({ table: "Contacts", operation: "update" })` and uses its `User_ID` for `$userId` |
| **F11** (Low) — `getMpTimezone` had no check at all | 2026-09-12 | Authenticated-session check (its only consumer is the role-gated contact page) |
| **F5** (Medium) — member PII and pastoral notes written to server logs at info level | 2026-09-12 | Removed all `console.log`/`.debug`/`.info` from non-script `src/`; error logs now carry identifiers/shape only (no request bodies, result sets, `Notes`, or `$filter`/full URLs); see § Logging policy above |
| **F4** (Medium) — contact-log writes accepted `Made_By`/`Contact_ID` from the caller | 2026-09-12 | `ContactLogService` stamps `Made_By` from the gate and strips both keys at runtime with allowlist `.pick()` schemas; `Contact_ID` is never sent on update, and since 2026-09-29 (`dc4a25b`) neither is `Made_By`, so an edit keeps the original author; see § Attribution is server-authoritative above |
| **F2** (High) — a shared MP email could merge two people onto one better-auth user | 2026-09-12 | `accountLinking.enabled: false`, a synthetic `email` derived from `sub`, the real address moved to `mpEmail`, and `emailVerified` from the provider's own claim; see § Email is never a key and § Account linking |
| **F7** (Low) — OAuth failures landed on better-auth's built-in error page | 2026-09-12 | `onAPIError.errorURL: "/auth-error"` plus the route allowlist, which no longer exposes `GET /error`; see § OAuth Flow |
| **id_token substitution** (Low) — `POST /sign-in/social` with an attacker's id_token and a victim's access token minted the victim's session | 2026-09-28 | `refuseIdTokenSignIn` (`hooks.before`), the `getUserInfo` sub binding, and the route's `/sign-in/social` body filter; see § id_token sign-in is disabled |
| **Any-role default** (Medium) — unset `MP_SECURITY_ROLES` let any MP role (e.g. check-in) read all contacts and pastoral notes; `","` also widened to "any role" | 2026-09-28 | Fail closed when unset/blank/no names; explicit `*` for any role; setup prompts, `setup:check` warns; see § Configuring the gate |
| **F9** (Medium) — no HTTP security headers, no CSP | 2026-09-12 | Static headers in `next.config.ts`, nonce-based CSP built per request in `src/proxy.ts`; see [Security Headers](security-headers.md) |

**Accepted risk:** **F8** — no PKCE and no `nonce`, because MP supports neither, so
nothing binds an authorization code to the browser that started the flow. `pkce: false`
is required, not a pending follow-up. See
[`nonce` binding is off](#nonce-binding-is-off-and-must-stay-off).

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `MINISTRY_PLATFORM_BASE_URL` | Yes | MP API URL (OAuth discovery, token, userinfo, API, end-session). Validated at module load by `getMpBaseUrl` (`src/lib/env.ts`): `https://` (plain `http://localhost` / `127.0.0.1` / `[::1]` only outside production), no credentials, query or fragment; a path is allowed and trailing slashes are stripped. A bad or unset value throws — the error names the variable, never the value |
| `BETTER_AUTH_URL` | Yes* | The app's origin: better-auth's `baseURL` (OAuth `redirect_uri`, trusted origin) and the exact `post_logout_redirect_uri`. Fallback: `NEXTAUTH_URL`. **Required** (unset, better-auth would derive the base URL from the request's `Host` header). Validated by `getAuthBaseUrl`: origin only (a path is refused; one trailing `/` tolerated), no credentials/query/fragment, `https://` for every real host in every environment; loopback `http://` is allowed even with `NODE_ENV=production` so `next build` / `next start` work locally and in CI. With an https origin in production, `advanced.useSecureCookies` is pinned `true` |
| `BETTER_AUTH_SECRET` | Yes* | Session signing/encryption secret, **≥ 32 chars** (enforced) and random (`openssl rand -base64 32`; entropy is only warned about). Fallback: `NEXTAUTH_SECRET`. The app refuses to start without a valid one — see [Secret and environment guard](#secret-and-environment-guard) |
| `TEST` | **Never in production** | better-auth reads a truthy `TEST` as a test run and skips secret validation; the app refuses to start with `TEST` set and `NODE_ENV=production` |
| `OIDC_CLIENT_ID` | Yes | OAuth client ID registered in MP (user login) — a dedicated client, see [MP OAuth Client Setup](#mp-oauth-client-setup) |
| `OIDC_CLIENT_SECRET` | Yes | OAuth client secret (user login) |
| `MINISTRY_PLATFORM_CLIENT_ID` | Yes | Client-credentials service account used for **all** MP data access. Auth depends on it too: `customSession` resolves `User_ID` and `AuthorizationService` reads `dp_User_Roles` through it. Use a **separate** API Client from `OIDC_CLIENT_ID` (see [MP OAuth Client Setup](#mp-oauth-client-setup)) |
| `MINISTRY_PLATFORM_CLIENT_SECRET` | Yes | Secret for the above |
| `MP_SECURITY_ROLES` | For the contact features | Comma-separated MP role **names** permitted to use the gated contact features (reads **and** writes), or `*` for any security role. Unset, blank, or naming no roles = **nobody** (fail closed). Matched by name, so restrict who can edit MP Security Roles. See [Configuring the gate](#configuring-the-gate). |
| `CSP_ENFORCE` | No | CSP enforces by default; only the exact string `false` drops it to `Content-Security-Policy-Report-Only`. See [Security Headers](security-headers.md) |
| `NEXT_PUBLIC_MINISTRY_PLATFORM_FILE_URL` | For contact photos | MP file endpoint the avatar/photos load from; its origin becomes the CSP `img-src` entry (`originOf`, which ignores a non-http(s) or malformed value) |
| `AUTH_IP_ADDRESS_HEADERS` | Host-dependent | Comma-separated headers the sign-in rate limiter reads the client IP from, in order. Only a header your edge overwrites. See [Rate limiting and client IP](#rate-limiting-and-client-ip) |
| `AUTH_TRUSTED_PROXIES` | Host-dependent | Comma-separated proxy IPs/CIDRs skipped (right to left) in an appended `x-forwarded-for` chain. Invalid entries refuse startup |
| `MP_WRITE_SECURITY_ROLES` | No | **Deprecated** — the write-only predecessor of `MP_SECURITY_ROLES`, read only when that yields no usable policy, and now governing reads too. |

*Fallback variables allow gradual migration from NextAuth.

## MP OAuth Client Setup

Use **two dedicated MP API Clients** (Administration > API Clients), not a shared
one such as `TM.Widgets`:

- **Sign-in client** (`OIDC_CLIENT_ID`, e.g. `MPNext`): Authorization Code flow
  **only** — no Implicit, Hybrid or Resource Owner. Because MP supports neither PKCE
  nor `nonce` (F8), exact redirect URIs on a dedicated confidential client are the main
  defence against authorization-code injection. Configure, per environment, exactly:
  - **Redirect URI**: `{BETTER_AUTH_URL}/api/auth/callback/ministry-platform`
    (was `…/api/auth/oauth2/callback/ministry-platform` before better-auth 1.7) — no
    wildcards, no extra entries
  - **Post-Logout Redirect URI**: `{BETTER_AUTH_URL}` — the app sends
    the origin of `BETTER_AUTH_URL` as `post_logout_redirect_uri`, so register
    exactly that origin (no trailing slash, no `/signin`)
- **Data client** (`MINISTRY_PLATFORM_CLIENT_ID`, e.g. `MPNext.API`): Client
  Credentials **only**, no redirect URIs, and a dedicated least-privilege MP Client
  User — every server-side read and write runs with that user's permissions.

## MP Service-Account Client

`src/lib/providers/ministry-platform/` (`client.ts`, `auth/client-credentials.ts`,
`utils/http-client.ts`) is what `customSession` and the role gate call through, so its
failure modes are auth's too:

- **Token lifecycle.** One token per process, refreshed 5 min before expiry;
  concurrent callers share a single in-flight refresh. The token response is
  validated (non-empty `access_token`, `token_type` `bearer`) and its `expires_in`
  clamped to 30 s – 1 h. A failed refresh is negative-cached for 5–30 s (jittered) so
  callers fail fast instead of hammering a token endpoint that is down. A 401
  invalidates the rejected token (only if nobody replaced it already) and retries the
  request **once**.
- **Deadlines and redirects.** 10 s for the token request, 20 s per API request
  (a fresh signal per attempt), 60 s for multipart uploads; every MP fetch
  (and the userinfo call in `getUserInfo`) uses `redirect: "error"`, so a redirect can
  never re-send the bearer elsewhere.
- **Path guard.** `HttpClient.buildUrl` refuses any endpoint that does not start with
  `/` or contains `..`, `?`, `#`, `\`, `%2e`/`%2f`/`%5c` or a control character, and
  checks the resolved URL stays under the API root. An unusable base URL throws
  `Invalid MP API base URL`.
- **Logging.** Failures log method, path (no query string; file unique IDs redacted
  to `{uniqueId}`, since they are download capabilities), status and the error
  *name*; token errors include the HTTP status. Never a response body.

## Better Auth Upgrade Checklist

`npm audit fix` or a manual `npm update` can bump `better-auth` across **minor**
versions (e.g. 1.7 → 1.8). (`npm run setup` no longer can: it installs with `npm ci`
from the lockfile and never runs `npm update`.) CI runs lint + `tsc --noEmit`, the
unit tests (both Vitest projects), `next build` + the prerender check, and the
lockfile check. The auth suites drive the real `auth` instance against a mock OIDC
provider (`src/test-utils/mock-oidc.ts`), but nothing exercises a real MP login, so
MP-specific regressions still ship silently. After any change to
the `better-auth` version, do this before merging:

1. **Read the changelog** between the old and new version, focusing on:
   `genericOAuth`, `customSession`, `additionalFields`, cookie cache / session
   serialization, `mapProfileToUser`, and account identity (`accountSubject` /
   `accountIssuer`).
2. **Check whether the callback path moved.** It changed once already (1.7:
   `/api/auth/oauth2/callback/:id` → `/api/auth/callback/:id`). A moved callback
   needs the new redirect URI registered on the MP OAuth client in **every**
   environment before deploy — nothing in CI catches this.
3. **Run the auth tests**: `npm run test:run -- src/auth`. These are real
   library guards, not simulations:
   - `better-auth 1.6 guard` — `userGuid` still survives provider-profile parsing.
   - `better-auth 1.7 guard` (getUserInfo) — the profile still carries `sub`, which
     the OIDC `accountSubject` resolver reads.
   - account identity — `providerId` stays pinned and no issuer option has crept
     back in (see 1.7.3 below).
   - disabled endpoints — `/update-user` and friends still 404. **Never** relax
     this to make an unrelated failure go away; see
     [Disabled Endpoints](#disabled-endpoints) for why it is load-bearing.
   - id_token sign-in — also run `src/auth.id-token-sign-in.test.ts`. It
     drives the real `/sign-in/social` id_token mode against a mock OIDC
     provider; if an upgrade renames the path, moves the mode, or adds a new
     body key, the hook or the route filter may silently stop applying. See
     [id_token sign-in is disabled](#id_token-sign-in-is-disabled-sign-insocial).
   - session lifetime — run `src/auth.session-lifetime.test.ts` and
     `src/auth.secret-guard.test.ts`. The first walks a fake clock through the
     real instance; if an upgrade changes the stateless `refreshCache` default,
     how `expiresAt` is checked, or when the in-memory row slides, the pinned
     12 h / 1 h ceilings move. The second re-reads better-auth's
     `DEFAULT_SECRET` and the `disableOriginCheck` resolution. See
     [Session lifetime and revocation](#session-lifetime-and-revocation-stateless).
   - the mock-OIDC suites — `src/auth.code-flow.test.ts` (state binding,
     `pkce`/nonce pins, the full callback), `src/auth.oidc-hardening.test.ts`
     (`requireIdTokenVerification`, `exp`/`azp`, JWE strategy),
     `src/auth.origin-check.test.ts`, `src/auth.session-config.test.ts`,
     `src/auth.rate-limit.test.ts` and `src/auth.discovery-rebuild.test.ts`. Each
     has mutation controls (origin check off, `trustedOrigins: ["*"]`, cookie
     strategy, `expiresIn`, `refreshCache`, sub binding, nonce, PKCE, account
     cookie); a green run after an upgrade means those still bite. Simplest:
     `npm run test:run -- src/auth`.
4. **Manual smoke test (required — nothing else catches this):**
   - `npm run dev`, sign in through Ministry Platform.
   - Open `/api/auth/get-session` and confirm the session `user` object contains
     **`userGuid`** (non-null) and **`userId`** (non-null).
   - Confirm the header avatar renders and the user menu opens.
   - Sign out and confirm the MP end-session redirect completes.
   - Existing sessions predate the new user-record shape, so **sign out and log in
     fresh** — don't test against a stale session.
5. **If sign-in fails at the callback**, check the dev-server log for the
   provider-level errors better-auth emits at init and callback time:
   - `id_token failed verification against the discovery JWKS or expected nonce`
     → if `disableIdTokenNonceBinding: true` has gone missing from the config,
     put it back: MP never sends the `nonce` claim (see
     [`nonce` binding is off](#nonce-binding-is-off-and-must-stay-off)). With it
     set, this line means JWKS/issuer/audience changed instead.
   - `Discovery fetch failed for "ministry-platform"`, or `Provider
     "ministry-platform": … Provider skipped.` → MP discovery was unreachable
     (or, with `requireIdTokenVerification`, lacked a usable `issuer` or
     `jwks_uri`) when the instance was built. Since 1.7.3 this no longer throws out
     of `betterAuth()` (#10978); the provider is skipped and sign-in fails closed
     with `404 PROVIDER_NOT_FOUND`. It heals without a restart: the exported `auth`
     is a `selfHealingAuth` facade, and the next sign-in or callback request after
     a 30 s cooldown (`DISCOVERY_REBUILD_COOLDOWN_MS`) rebuilds the instance —
     single-flight, waiting at most 10 s — and swaps it in only if the provider is
     now present. Look for `auth.discovery.rebuild` with `outcome` `recovered`,
     `provider_still_missing` or `create_failed`. `/get-session` never triggers a
     rebuild. Because the facade delegates to the *current* instance, never cache
     `auth.api` in a module-level variable.
6. If `userGuid` is missing, check `parseAdditionalUserInputFromProviderProfile`
   in `node_modules/better-auth/dist/db/schema.mjs` — the library may have changed
   how additional fields flow from the OAuth profile into the user record.

## Known Limitations

1. **No database (top refactor priority)**: With no `database` in the config, Better Auth uses an in-memory adapter. Sessions live only in the in-memory store + cookies, so a process restart ends each session once its 1-hour cookie cache expires. On serverless/Vercel this is severe: **every cold start or new function instance has an empty session store**, so once the 1-hour JWE cookie cache expires, a request that lands on a fresh instance returns `null` and the user is sent back through sign-in (usually silent while the MP session is alive). This also makes auth bugs hard to reproduce. The adapter also **grows without bound** (every sign-in adds user/account/session rows; nothing prunes them, bounded only by the sign-in rate limit) and has **no unique constraint**, so concurrent first sign-ins can create duplicate user rows (harmless today — nothing keys on them). **Recommendation:** configure a persistent database adapter or `secondaryStorage` (e.g. a Vercel Marketplace Postgres/Neon, or SQLite for local dev) before relying on this in production.
2. **userGuid type cast**: `session.user.userGuid` requires a type cast because `customSessionClient` doesn't infer `additionalFields` from `genericOAuth`. This is a Better Auth type limitation.
3. **Token refresh**: None, by design. `offline_access` is not requested and the user's access/refresh tokens are not retained (see [Session Strategy](#session-strategy)); the app never calls MP with the user's token.
4. **No server-side revocation, no MP re-validation of a live session** *(accepted 2026-09-29)*: sign-out cannot revoke a copied cookie pair, and nothing re-checks the `dp_Users` login while a session is live (only `dp_User_Roles` is re-read per request, and `userIdCache` re-resolves `User_ID` every 15 min without ending the session). Bounded by the 12 h / 1 h ceilings in [Session lifetime and revocation](#session-lifetime-and-revocation-stateless); closed properly only by a server-side store (§ 1).
5. **Cookie hardening residue (accepted, theoretical):**
   - **No `__Host-` prefix.** better-auth uses `__Secure-` and has no `__Host-` option. better-call keeps the first of duplicate cookies and browsers send longer-`Path` cookies first, so a *sibling subdomain* could plant state/session cookies (login CSRF). Relevant only on a custom domain with untrusted sibling subdomains (`*.vercel.app` and `*.azurewebsites.net` are on the Public Suffix List). Host the app on a dedicated subdomain.
   - **OAuth state is not one-time** in cookie mode (10-minute replay window) — see [`nonce` binding is off](#nonce-binding-is-off-and-must-stay-off).
   - **A null `/get-session` does not clear stale cookies.** customSession returns `ctx.json(null)` and drops better-auth's cookie deletions (`plugins/custom-session/index.mjs`). Not exploitable — `AuthWrapper` still redirects — and the route now adds `Cache-Control: no-store` to every `/api/auth` response, the null one included.
   - **One secret, no domain separation** for the raw HMAC use — see [Secret and environment guard](#secret-and-environment-guard).

## Version Notes

### 1.7.3 — account identity reverted (breaking)

1.7.0–1.7.2 keyed accounts on `(issuer, accountId)` and refused to initialize a
discovery provider whose issuer it could not resolve, so this config carried an
explicit `accountIssuer`. **1.7.3 reverted both halves**: accounts are identified
by `(providerId, accountId)` again as in 1.6 (#11153), and a discovery failure no
longer takes down the auth API (#10978). The option was **removed**, so setting
it is now a type error — `accountIssuer` was dropped from `src/lib/auth.ts` when
we moved to 1.7.4.

Consequence: `providerId` is now the whole stable half of the account key. If it
ever drifts, every existing user silently becomes a new account. `src/auth.test.ts`
asserts it stays pinned.

Because our config no longer sets an issuer, **`better-auth` must stay `>= 1.7.3`**
(`package.json` floors at `^1.7.4`). Resolving to 1.7.0–1.7.2 would reintroduce the
issuer requirement with nothing satisfying it.

### 1.7.3 — schema validation on init (inert here)

1.7.3 enabled adapter schema validation by default, rejecting auth requests on a
detected mismatch. **This is inert in this app**: the check is attached per-adapter
via `registerSchemaCheck`, which nothing registers for our no-database setup, so
`ctx.checkSchema` is `undefined` and the per-request check is a no-op. It can be
disabled outright with `advanced.database.validateSchema: false` if a persistent
adapter is ever added and its schema legitimately differs.

### 1.7.4

No changes affecting this config (OpenTelemetry opt-out, Expo/Metro and Drizzle
fixes, `testUtils` additions). Verified against the release notes, not assumed.

## Incident Response — forged sessions outlive the patch

*Corrected 2026-09-28. Earlier text said "up to 1 hour", reasoning from
`cookieCache.maxAge`; it missed better-auth's stateless `refreshCache` default.*

If a session was tampered with via `/update-user` **before** it was disabled, the
forged `userGuid` lives in that user's session cookie **until its
`session.expiresAt` — up to 7 days after the original sign-in** — on any deployment
that runs the pre-2026-09-28 session config. Verified on better-auth 1.7.4: with no
database, `refreshCache: true` is merged in silently, and `/get-session` re-signs the
forged `session_data` from the cookie itself every hour with no store lookup (the
negative control in `src/auth.session-lifetime.test.ts` pins it: a cookie pair
copied before sign-out is still valid at 6.98 days and first refused at 7.01 days,
polled every 50 minutes). On a long-running `next start` that was not
restarted, the in-memory row carried the forged user too and slid `expiresAt` daily,
so add the process uptime. (Not verified for better-auth 1.6.x; assume the same.)
Closing the endpoint stops new forgeries; it does **not** revoke one already minted
into a cookie. After deploying that fix:

- Treat **up to 7 days** after deploy (plus process uptime on long-running hosts) as
  still-exposed for any session already forged — unless `BETTER_AUTH_SECRET` is
  rotated.
- **Rotating `BETTER_AUTH_SECRET` is mandatory, not optional.** With no database
  there is no server-side session store to clear; rotation is the lever that
  invalidates a forged cookie on every deployment, and it invalidates **every**
  session cookie at once (all users must sign in again). A `cookieCache.version`
  bump alone is not a substitute: the forged cookie is signed with the live secret.
- Deploying the 2026-09-28 session settings (`refreshCache: false`, 12 h absolute)
  also ends a forged cookie within 1 h of that deploy — the redeploy wipes the
  in-memory rows and the new config never re-mints a cookie without one — but
  rotate anyway: it is the only lever that does not depend on which config every
  instance is running.
- `dp_Audit_Log` is the record of what a forged session did: writes carry the
  impersonated user's `User_ID`, so attribution during the exposure window cannot
  be trusted on its face. Review **at least the 7 days after deploy** (or up to the
  secret rotation, if that came sooner), not one hour.

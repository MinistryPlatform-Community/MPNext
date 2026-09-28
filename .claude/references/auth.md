# Authentication Reference Guide

This document provides detailed context about the authentication system for LLM assistants working on the MPNext project.

## Overview

MPNext uses **Better Auth** with the **genericOAuth** plugin to authenticate users against Ministry Platform's OIDC endpoints. Sessions are stateless (JWT cookie cache, no database). The full MP user profile is loaded client-side by `UserProvider`; the only thing the session itself resolves server-side is the MP `User_ID` (see [customSession Callback](#customsession-callback)).

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
| `src/proxy.ts` | Route protection (session cookie check) |
| `src/app/auth-error/page.tsx` | Landing page for a failed OAuth callback (`onAPIError.errorURL`) — outside the (web) route group, public in `src/proxy.ts` |
| `src/contexts/user-context.tsx` | `UserProvider` — loads MP user profile client-side |
| `src/contexts/session-context.tsx` | `useAppSession()` — thin wrapper around `authClient.useSession()` |
| `src/components/layout/auth-wrapper.tsx` | Server guard for the (web) group — redirects to `/signin` (no session) or `/session-error` (session without `userGuid`). Authentication only; it does **not** check roles |
| `src/app/session-error/page.tsx` | Recovery page for broken sessions — provides a sign-out even when the header/menu can't render (outside the (web) group, so not self-guarded) |
| `src/components/user-menu/actions.ts` | `handleSignOut()` — OIDC logout flow |
| `src/app/signin/page.tsx` | Sign-in **route** — a server component whose only job is `export const dynamic = "force-dynamic"` (route segment config is ignored in a `"use client"` file, and the nonce-based CSP needs a per-request render) and rendering `<SignIn />` |
| `src/components/sign-in/sign-in.tsx` | The sign-in page body — auto-redirects to OAuth exactly once per page load (ref guard), and sanitizes `callbackUrl` to a same-origin relative path (see [Open redirect on `/signin`](#open-redirect-on-signin-f3-closed-2026-09-12)) |
| `src/services/authorizationService.ts` | The **authorization** gate — MP security-role check for reads and writes |
| `src/services/sessionContextService.ts` | Resolves the acting MP `User_ID` from the session (`getCurrentUserId`, `getActingUserIdForWrite`) — the single source the gate reads |
| `src/app/(web)/contactlookup/layout.tsx` | Page-layer gate over `/contactlookup/**` — redirects a role-less user to `/no-access` |
| `src/app/(web)/no-access/page.tsx` | "You need a security role" page. **Inside** the (web) group, so the header and sign-out still render |

## Auth Configuration (`src/lib/auth.ts`)

### Plugins

| Plugin | Purpose |
|--------|---------|
| `genericOAuth` | Ministry Platform OAuth provider config |
| `customSession` | Adds `firstName`/`lastName` (name splitting) and `userId` (MP `User_ID`, resolved from `dp_Users` and process-cached) |
| `nextCookies` | Next.js cookie integration |

### Session Strategy

- **Cookie cache**: JWT strategy, 1-hour TTL (`session.cookieCache`)
- **Account cookie**: OAuth tokens stored in cookie (`storeAccountCookie: true`)
- **State**: OAuth state stored in cookie (`storeStateStrategy: "cookie"`)
- **No database**: Uses in-memory adapter (data lost on server restart, users must re-login)

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
| `scopes` | `openid`, `offline_access`, `http://www.thinkministry.com/dataplatform/scopes/all` | Full MP API access. The third scope is the literal URI MP expects, not a short name |
| `pkce` | `false` | Explicitly disabled — 1.7 defaults this to `true` (see 1.7 notes below) |
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
| `pkce` defaults to `true` | Kept explicitly `false`; MP discovery *does* advertise `S256`, so enabling it is the open follow-up (F8) |
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

> ℹ️ **RP-initiated logout is available but unused.** MP's discovery document
> exposes `end_session_endpoint`, so 1.7 can build the provider logout URL
> itself (including `id_token_hint`, which our hand-rolled URL omits).
> `handleSignOut()` still constructs the URL manually and ignores the `url` that
> `auth.api.signOut()` now returns — a possible simplification, deliberately
> left out of the 1.7 migration.

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
> It looked intermittent, and the reason is inverted from the obvious one:
> sign-in **succeeded** only when the boot-time discovery fetch had failed,
> because that leaves the id_token config undefined and skips verification
> entirely. A working discovery meant a broken sign-in.
>
> **What is still checked:** the id_token signature against MP's JWKS, plus
> `iss` and `aud`. **What is given up:** binding the id_token to this particular
> authorization request. Residual risk is id_token replay/injection, mitigated
> by the OAuth `state` cookie check that still runs and by this being a
> confidential client that exchanges the code with a client secret. Enabling
> PKCE (F8) would narrow it further and is the natural follow-up.
>
> **Not currently pinned by a test.** `src/auth.test.ts` asserts `pkce`,
> `providerId`, `scopes` and `authorizationUrlParams`, but nothing asserts
> `disableIdTokenNonceBinding`, so a config edit that drops it fails only at a
> real sign-in. Worth adding to that config assertion.

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

**Why the Content-Type check is strict.** better-call chooses its body parser
by *substring* match (`node_modules/better-call/dist/utils.mjs`, `getBody`), so
`text/html, application/json, application/x-www-form-urlencoded` is accepted and
parsed as **form** data. A filter that JSON-parsed that body would inspect
different keys than better-auth then acts on. With an exact `application/json`
media type and no comma, better-call's JSON parser is the one that runs, on the
same bytes the filter read. The comma rule also catches a repeated Content-Type
header, which `Headers.get` joins with `", "`.

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
name splitting **and** one MP lookup: the acting user's `User_ID`.

```typescript
// src/lib/auth.ts
export async function enrichSessionUser(user, session) {
  const userGuid = user.userGuid;
  const userId = userGuid ? await resolveMpUserId(userGuid) : null;
  return {
    user: {
      ...user,
      firstName: user.name?.split(" ")[0] || "",
      lastName: user.name?.split(" ").slice(1).join(" ") || "",
      userId,
    },
    session,
  };
}

customSession(async ({ user, session }) => enrichSessionUser(user, session), options)
```

**Why `userId` is resolved here.** MP's audit log keys on the `$userId` passed to write
APIs, and the authorization gate needs the same value. Baking it into the session means
`SessionContextService` can read it without a `dp_Users` round-trip on every request.

**Why that is the *only* API call.** `customSession` runs on every `getSession()` once
the cookie cache expires, so anything expensive here is paid constantly.
`resolveMpUserId` is guarded by a process-wide `Map<User_GUID, User_ID>`
(`userIdCache`) — the mapping is stable per user, so it costs at most one MP call per
(user × container). A failed lookup is **not** cached and never blocks session
creation: it logs and returns `userId: null`, which the write path then surfaces as
`mp.write.non_user` and the gate refuses as `no_mp_user`. The full MP profile (name,
photo, roles, groups) is still loaded client-side by `UserProvider`, not here.

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
   g. Creates account record (providerId="ministry-platform", accountId=sub, tokens)
   h. customSession resolves userId from dp_Users, then creates the session →
      sets JWT cookie
6. Redirect to callbackURL → app loads with session
7. UserProvider calls getCurrentUserProfile() → loads MP profile (userGuid comes
   from the session, never from the caller)
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

**On failure**, better-auth's callback redirects to `onAPIError.errorURL`
(`/auth-error`, configured in `src/lib/auth.ts`) with the failure code as a
query parameter: `/auth-error?error=<code>` (and, when available,
`&error_description=<text>`, which `src/app/auth-error/page.tsx` never
renders). This replaces better-auth's built-in `/api/auth/error` page, which
the route allowlist (see [Disabled Endpoints](#disabled-endpoints)) no longer
exposes.

## Logout Flow

```
1. User clicks sign out → calls handleSignOut() server action
2. auth.api.signOut() → clears Better Auth session cookie
3. Redirect to MP endsession endpoint:
   ${MP_BASE_URL}/oauth/connect/endsession?post_logout_redirect_uri=${APP_URL}
4. MP clears its session → redirects back to app
5. App loads without session → proxy redirects to /signin
```

No `id_token_hint` is passed (optional in OIDC spec). The `post_logout_redirect_uri` must be registered in the MP OAuth client configuration.

Sign-out is entirely server-side (`auth.api.signOut()`, called in-process from
the server action) — the browser never calls a `/sign-out` HTTP endpoint, which
is why `POST /sign-out` is not in the route allowlist (see [Disabled Endpoints](#disabled-endpoints)).

## Route Protection (`src/proxy.ts`)

Uses `getSessionCookie()` from `better-auth/cookies` for fast cookie-only checks (no JWT decoding or API calls).

`proxy()` also builds the per-request Content-Security-Policy nonce and attaches
the CSP to **every** response it produces, redirects included — see
[Security Headers](security-headers.md). That is why `/signin` must stay a server
component: a prerendered page has no request, so no nonce.

### Public Paths (no auth required)

- `/api/*` — All API routes (Better Auth handles its own auth)
- `/signin` — Sign-in page
- `/auth-error` — OAuth-failure landing page. Must stay public: a session-less
  visitor sent here after a failed callback would otherwise be bounced to
  `/signin`, which auto-starts OAuth again — a loop that never shows the
  failure.
- `/_next/*`, `/favicon.ico`, `/assets/*` — Static assets (excluded by matcher)

### Protected Paths

Everything else requires a valid session cookie. Missing cookie → redirect to `/signin`.

### Authentication is not authorization

`src/proxy.ts` and `AuthWrapper` answer only "is there a session?". **Any** Ministry
Platform user can obtain one — MP's OIDC endpoint authenticates every `dp_Users`
record, and this app reads MP with its own client-credentials service account
(`dataplatform/scopes/all`), so MP's per-user record security never filters what
this app returns. Route protection therefore gets a user as far as the app shell
and no further:

| Route | Needs a session | Needs an MP security role |
|---|---|---|
| `/signin`, `/auth-error` | No | No |
| `/`, `/home`, `/no-access`, `/session-error` | Yes | No |
| `/contactlookup`, `/contactlookup/[guid]` | Yes | **Yes** — `src/app/(web)/contactlookup/layout.tsx` redirects to `/no-access` |

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

`UserProvider` in `src/contexts/user-context.tsx` loads the full MP user profile client-side:

1. Waits for a session from `authClient.useSession()`
2. Calls the `getCurrentUserProfile()` server action — **it takes no parameters**.
   The `User_GUID` is read from the session server-side, never accepted from the
   caller: the profile discloses the user's roles and user groups, and GUIDs are not
   usefully secret (they appear in the client session and in `/contactlookup` URLs)
3. `UserService.getUserProfile()` queries `dp_Users WHERE User_GUID = '{userGuid}'`
4. Returns `MPUserProfile` (First_Name, Last_Name, Email_Address, Image_GUID, `roles`,
   `userGroups`, plus the server-computed `canAccessContactFeatures` UX flag)
5. Profile available via `useUser()` hook in any client component

## Authorization (distinct from authentication)

**Authentication** answers "is there a valid session?" — `auth.api.getSession()`.
**Authorization** answers "may this session do this?" — `AuthorizationService`
(`src/services/authorizationService.ts`). They are separate gates; a valid session is
necessary but **not** sufficient for a read or a write.

### Decided policy (writes 2026-08-21; reads 2026-09-12)

> **Any Ministry Platform user may sign in.** A user with no security role gets a
> session, the app shell (header, avatar, user menu, sign-out) and the home page.
>
> **The contact-lookup and contact-log features require an MP security role** — for
> reads as well as writes. Any user who holds one may read, create, edit, and delete
> any contact log, including one another user created.

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
  that could drift out of sync with MP.
- Ownership (`Made_By`) is deliberately **not** a factor. Contact logs are shared
  pastoral records; staff need to correct and remove each other's entries. Gating on
  ownership would mean a supervisor could not fix a bad log through this app.
- The gate fails closed: a session whose MP `User_ID` never resolved is refused, and so
  is one whose role list cannot be established.

### The four layers

Three of these are enforcement; the fourth is presentation and is **not** a security
control. Each enforcement layer re-checks, because each is independently reachable — a
server action is a callable POST endpoint whether or not the page that calls it was
ever rendered.

| Layer | Where | What it does |
|---|---|---|
| **Page (server)** | `src/app/(web)/contactlookup/layout.tsx` | `hasSecurityRole` → `redirect("/no-access")`. Covers `[guid]/page.tsx` too: React renders the layout first and only renders `children` once it returns, so a redirect means the page component — and its server-action calls — never run |
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
| `getSecurityRoles` | `(userId: number) => Promise<string[]>` | Role names from `dp_User_Roles`, memoized per request |

`hasSecurityRole` reports a *denial* as `permitted: false`, but still **throws** on
infrastructure failure (MP unreachable, an unusable acting `User_ID`) so "MP is down"
can never be mistaken for "this user is not allowed".

The acting user comes from `SessionContextService`: `getCurrentUserId()` for reads,
`getActingUserIdForWrite()` for writes, so an unattributed write still emits the
structured `mp.write.non_user` warning before the gate refuses it. Server actions must
**not** re-implement the `dp_Users` lookup inline.

Denials are logged as a structured `mp.write.unauthorized` (writes) or
`mp.read.unauthorized` (reads) event — same shape, with `table`, `operation`, `userId`,
and a `reason` of `no_mp_user` / `no_security_role` / `role_not_permitted` — so refused
operations are greppable in production logs. `hasSecurityRole` logs nothing: it runs on
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
`mp.write.unauthorized`, `mp.write.non_user`, and `auth.userinfo.invalid_sub` /
`auth.userinfo.sub_mismatch` in `src/lib/auth.ts`) are the greppable contract this policy exists alongside; they already
log identifiers only and are unaffected by it.

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
| `Made_By` | the authorization gate's returned `User_ID` | the authorization gate's returned `User_ID` |
| `Contact_ID` | caller-supplied subject contact, validated by `sanitizeNumericId` | **never sent** — MP preserves the row's existing value |

Mechanically: `Made_By` (and on update `Contact_ID`) are added to the `.omit({...})` on
`ContactLogSchema`, and a Zod object parse strips keys the schema does not declare — so
a smuggled key is *dropped*, not merely untyped. The server-stamped `Made_By` is then
spread **last** into the record so nothing above it can win. `requireSecurityRole` runs
*first* in both methods, since its return value is the only source of attribution.

Two consequences worth knowing:

- `Made_By` on an edited log now reads as **the staff member who last wrote the row**,
  not necessarily whoever originally made the contact. This was a deliberate call
  (2026-09-12); MP's audit trail additionally records every edit via `$userId`.
- The actions deliberately assemble **neither** field. Attribution has exactly one
  source; two layers stamping it could drift, and a caller value could slip past
  whichever was checked second.

### Caching: per request, never across requests

The gate now runs at up to three layers per request, so the `dp_User_Roles` read is
memoized **per request** with React's `cache()` from `"react"`, keyed by `User_ID`. One
request costs at most one role read no matter how many layers call the gate.

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

### Tightening the gate

Set `MP_SECURITY_ROLES` to a comma-separated list of MP role names to require one of
those specific roles instead of "any role". Comparison is case- and
whitespace-insensitive. Unset or blank means any security role is sufficient (the
default policy above). It applies to reads and writes alike.

```
MP_SECURITY_ROLES="Administrators,Pastoral Staff"
```

> ⚠️ **`MP_WRITE_SECURITY_ROLES` is deprecated.** It predates the read gate and named
> only writes. It is still read as a fallback when `MP_SECURITY_ROLES` is unset or
> blank — so an existing deployment is not silently widened to "any role" by this
> change — but it now governs reads too, and `MP_SECURITY_ROLES` wins where both are
> set. Migrate one variable at a time; new deployments should set only
> `MP_SECURITY_ROLES`.

### `/no-access`

`src/app/(web)/no-access/page.tsx` is where the layout sends a role-less user. It is
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
`src/components/sign-in/sign-in.tsx` now reduces it to a same-origin relative path — it must start
with `/` and must not start with `//` or `/\` (browsers normalize the latter to the
former) — and the sanitized value feeds **both** sinks: the `location.href` assignment
and the `callbackURL` handed to `signIn.social` (which better-auth also validates
server-side; defence in depth).

### Closed findings

| Finding | Closed | Fix |
|---|---|---|
| **F1** (High) — reads gated on a session only, at one layer | 2026-09-12 | Role gate at the page, action **and** service layers; `mp.read.unauthorized` denial log |
| **F3** (Medium) — open redirect via `callbackUrl` on `/signin` | 2026-09-12 | `sanitizeCallbackUrl`, applied to both redirect sinks |
| **F10** (Low) — `ContactService.updateContact` wrote with no authorization | 2026-09-12 | Calls `requireSecurityRole({ table: "Contacts", operation: "update" })` and uses its `User_ID` for `$userId` |
| **F11** (Low) — `getMpTimezone` had no check at all | 2026-09-12 | Authenticated-session check (its only consumer is the role-gated contact page) |
| **F5** (Medium) — member PII and pastoral notes written to server logs at info level | 2026-09-12 | Removed all `console.log`/`.debug`/`.info` from non-script `src/`; error logs now carry identifiers/shape only (no request bodies, result sets, `Notes`, or `$filter`/full URLs); see § Logging policy above |
| **F4** (Medium) — contact-log writes accepted `Made_By`/`Contact_ID` from the caller | 2026-09-12 | `ContactLogService` stamps `Made_By` from the gate and strips both keys via the schema `.omit()`; `Contact_ID` is never sent on update; see § Attribution is server-authoritative above |
| **F2** (High) — a shared MP email could merge two people onto one better-auth user | 2026-09-12 | `accountLinking.enabled: false`, a synthetic `email` derived from `sub`, the real address moved to `mpEmail`, and `emailVerified` from the provider's own claim; see § Email is never a key and § Account linking |
| **F7** (Low) — OAuth failures landed on better-auth's built-in error page | 2026-09-12 | `onAPIError.errorURL: "/auth-error"` plus the route allowlist, which no longer exposes `GET /error`; see § OAuth Flow |
| **id_token substitution** (High) — `POST /sign-in/social` with an attacker's id_token and a victim's access token minted the victim's session | 2026-09-28 | `refuseIdTokenSignIn` (`hooks.before`), the `getUserInfo` sub binding, and the route's `/sign-in/social` body filter; see § id_token sign-in is disabled |
| **F9** (Medium) — no HTTP security headers, no CSP | 2026-09-12 | Static headers in `next.config.ts`, nonce-based CSP built per request in `src/proxy.ts`; see [Security Headers](security-headers.md) |

**Still open:** **F8** — PKCE is explicitly `false` even though MP advertises `S256`.
See the `pkce` row in [genericOAuth Configuration](#genericoauth-configuration).

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `MINISTRY_PLATFORM_BASE_URL` | Yes | MP server URL (OAuth discovery, API) |
| `BETTER_AUTH_URL` | Yes* | App URL for callbacks. Fallback: `NEXTAUTH_URL` |
| `BETTER_AUTH_SECRET` | Yes* | Session signing secret. Fallback: `NEXTAUTH_SECRET` |
| `OIDC_CLIENT_ID` | Yes | OAuth client ID registered in MP (user login) |
| `OIDC_CLIENT_SECRET` | Yes | OAuth client secret (user login) |
| `MINISTRY_PLATFORM_CLIENT_ID` | Yes | Client-credentials service account used for **all** MP data access. Auth depends on it too: `customSession` resolves `User_ID` and `AuthorizationService` reads `dp_User_Roles` through it. May be the same client as `OIDC_CLIENT_ID` |
| `MINISTRY_PLATFORM_CLIENT_SECRET` | Yes | Secret for the above |
| `MP_SECURITY_ROLES` | No | Comma-separated MP role names permitted to use the gated contact features (reads **and** writes). Unset or blank = any security role. See [Authorization](#authorization-distinct-from-authentication). |
| `MP_WRITE_SECURITY_ROLES` | No | **Deprecated** — the write-only predecessor of `MP_SECURITY_ROLES`, read only when that is unset or blank, and now governing reads too. |

*Fallback variables allow gradual migration from NextAuth.

## MP OAuth Client Setup

The following URLs must be configured in the Ministry Platform OAuth client:

- **OAuth2 Callback URL**: `{APP_URL}/api/auth/callback/ministry-platform`
  (was `{APP_URL}/api/auth/oauth2/callback/ministry-platform` before better-auth 1.7)
- **Post-Logout Redirect URI**: `{APP_URL}` (or `{APP_URL}/signin`)

## Better Auth Upgrade Checklist

`npm audit fix` and `npm update` can bump `better-auth` across **minor** versions
(e.g. 1.4 → 1.6). Our CI (`build` + `lint` + unit tests) does **not** exercise a
real OAuth login, so session/OAuth regressions ship silently. After any change to
the `better-auth` version, do this before merging:

1. **Read the changelog** between the old and new version, focusing on:
   `genericOAuth`, `customSession`, `additionalFields`, cookie cache / session
   serialization, `mapProfileToUser`, and account identity (`accountSubject` /
   `accountIssuer`).
2. **Check whether the callback path moved.** It changed once already (1.7:
   `/api/auth/oauth2/callback/:id` → `/api/auth/callback/:id`). A moved callback
   needs the new redirect URI registered on the MP OAuth client in **every**
   environment before deploy — nothing in CI catches this.
3. **Run the auth tests**: `npm run test:run src/auth.test.ts`. Four tests are
   real library guards, not simulations:
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
   - `discovery returned no valid data` → MP discovery is unreachable. Since
     1.7.3 this no longer throws out of `betterAuth()` (#10978), so the app still
     boots — but sign-in stays broken until discovery returns, because the
     endpoints and JWKS come from it.
6. If `userGuid` is missing, check `parseAdditionalUserInputFromProviderProfile`
   in `node_modules/better-auth/dist/db/schema.mjs` — the library may have changed
   how additional fields flow from the OAuth profile into the user record.

## Known Limitations

1. **No database (top refactor priority)**: With no `database` in the config, Better Auth uses an in-memory adapter. Sessions live only in the in-memory store + cookies, so they are lost whenever the process restarts. On serverless/Vercel this is severe: **every cold start or new function instance has an empty session store**, so once the 1-hour JWT cookie cache expires, a request that lands on a fresh instance returns `null` and the user appears logged out (blank avatar / redirect to `/signin`) intermittently. This also makes auth bugs hard to reproduce. **Recommendation:** configure a persistent database adapter (e.g. a Vercel Marketplace Postgres/Neon, or SQLite for local dev) before relying on this in production.
2. ~~**mapProfileToUser type narrowness**~~ *(resolved in better-auth 1.7)*: `mapProfileToUser` now returns `OAuthMappedUser`, which permits arbitrary extra keys, so the old `as Record<string, unknown>` cast is gone. The type does forbid returning `id` — provider identity is owned by `accountSubject`.
3. **userGuid type cast**: `session.user.userGuid` requires a type cast because `customSessionClient` doesn't infer `additionalFields` from `genericOAuth`. This is a Better Auth type limitation.
4. **Token refresh**: Not explicitly implemented. The `storeAccountCookie` stores refresh tokens, but automatic refresh behavior in stateless mode is unverified.
5. **Cookie cache staleness**: The 1-hour JWT cookie cache means `customSession` changes won't take effect until the cache expires or the user re-authenticates.

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

If a session was tampered with via `/update-user` **before** it was disabled, the
forged `userGuid` lives in that user's **JWT cookie cache for up to 1 hour**
(`session.cookieCache.maxAge`). Closing the endpoint stops new forgeries; it does
**not** revoke one already minted into a cookie. After deploying that fix:

- Treat the hour following deploy as still-exposed for any session already forged.
- Forcing sign-out is the only immediate revocation. With no database there is no
  server-side session store to clear, so the practical lever is rotating
  `BETTER_AUTH_SECRET`, which invalidates **every** session cookie at once (all
  users must sign in again).
- `dp_Audit_Log` is the record of what a forged session did: writes carry the
  impersonated user's `User_ID`, so attribution during the exposure window cannot
  be trusted on its face.

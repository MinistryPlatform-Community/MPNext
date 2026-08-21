# Authentication Reference Guide

This document provides detailed context about the authentication system for LLM assistants working on the MPNext project.

## Overview

MPNext uses **Better Auth** with the **genericOAuth** plugin to authenticate users against Ministry Platform's OIDC endpoints. Sessions are stateless (JWT cookie cache, no database). User profiles are loaded client-side by `UserProvider`.

## Critical: user.id vs userGuid

Better Auth generates its own internal `user.id` (a random nanoid-style string like `1gYSNMvy6OqAm9q3DdVhtKj3Czkxd0ms`). This is **NOT** the Ministry Platform User_GUID.

The MP User_GUID (the OAuth `sub` claim) is stored as `user.userGuid` via `additionalFields` + `mapProfileToUser`.

| Field | Value | Use For |
|-------|-------|---------|
| `session.user.id` | Better Auth internal ID | Auth guards (checking if session exists) |
| `session.user.userGuid` | MP User_GUID (UUID) | All MP API lookups (`dp_Users`, profile fetching) |

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
| `src/app/api/auth/[...all]/route.ts` | Route handler (all auth endpoints) |
| `src/proxy.ts` | Route protection (session cookie check) |
| `src/contexts/user-context.tsx` | `UserProvider` — loads MP user profile client-side |
| `src/contexts/session-context.tsx` | `useAppSession()` — thin wrapper around `authClient.useSession()` |
| `src/components/layout/auth-wrapper.tsx` | Server guard for the (web) group — redirects to `/signin` (no session) or `/session-error` (session without `userGuid`) |
| `src/app/session-error/page.tsx` | Recovery page for broken sessions — provides a sign-out even when the header/menu can't render (outside the (web) group, so not self-guarded) |
| `src/components/user-menu/actions.ts` | `handleSignOut()` — OIDC logout flow |
| `src/app/signin/page.tsx` | Sign-in page — auto-redirects to OAuth |

## Auth Configuration (`src/lib/auth.ts`)

### Plugins

| Plugin | Purpose |
|--------|---------|
| `genericOAuth` | Ministry Platform OAuth provider config |
| `customSession` | Adds `firstName`/`lastName` (name splitting only, no API calls) |
| `nextCookies` | Next.js cookie integration |

### Session Strategy

- **Cookie cache**: JWT strategy, 1-hour TTL (`session.cookieCache`)
- **Account cookie**: OAuth tokens stored in cookie (`storeAccountCookie: true`)
- **State**: OAuth state stored in cookie (`storeStateStrategy: "cookie"`)
- **No database**: Uses in-memory adapter (data lost on server restart, users must re-login)

### genericOAuth Configuration

| Setting | Value | Notes |
|---------|-------|-------|
| `providerId` | `"ministry-platform"` | Used in OAuth URLs and `signIn.social({ provider })` |
| `discoveryUrl` | `${MP_BASE_URL}/oauth/.well-known/openid-configuration` | OIDC auto-discovery |
| `accountIssuer` | `${MP_BASE_URL}/oauth` | Pins the account-identity namespace (see 1.7 notes below) |
| `scopes` | `openid`, `offline_access`, `dataplatform/scopes/all` | Full MP API access |
| `pkce` | `false` | Explicitly disabled — 1.7 defaults this to `true` (see 1.7 notes below) |
| `getUserInfo` | Custom callback | Fetches OIDC userinfo, returns `sub: profile.sub` |
| `mapProfileToUser` | Custom callback | Stores `profile.sub` as `userGuid` |

### Better Auth 1.7 migration notes

Better Auth 1.7 rewrote the generic OAuth plugin as a first-class social
provider. What changed here, and why each line in `src/lib/auth.ts` looks the
way it does:

| Change | What we do |
|--------|-----------|
| `signIn.oauth2()` removed | `src/app/signin/page.tsx` calls `authClient.signIn.social({ provider: "ministry-platform" })` |
| `genericOAuthClient()` dropped | Removed from `src/lib/auth-client.ts`; only `customSessionClient` remains |
| **Callback path moved** | `/api/auth/oauth2/callback/ministry-platform` → **`/api/auth/callback/ministry-platform`**. This URL must be registered as a redirect URI on the MP OAuth client (`OIDC_CLIENT_ID`) for every environment. |
| Account identity keyed on `(issuer, accountId)` | `accountIssuer` is set explicitly (see below) |
| Account subject no longer falls back to `id` | `getUserInfo` returns `sub` (see below) |
| `pkce` defaults to `true` | Kept explicitly `false`; MP discovery *does* advertise `S256`, so this is a candidate follow-up |
| ID tokens verified against provider JWKS | Automatic — MP publishes `jwks_uri`; also enables `nonce` binding |

> ⚠️ **`getUserInfo` must return `sub`, not `id`.** MP's discovery document
> advertises `id_token_signing_alg_values_supported`, so Better Auth treats the
> provider as OIDC and its default `accountSubject` resolver reads
> **`profile.sub`** off the raw profile. Pre-1.7 the resolver fell back to
> `profile.id`; that fallback is gone. Returning only `id` resolves the account
> subject to `""` and breaks account identity for every user. `src/auth.test.ts`
> guards this by calling the real configured `getUserInfo`.

> ⚠️ **`accountIssuer` must stay set.** 1.7 refuses to initialize a discovery
> provider whose issuer it cannot pin down — a failed discovery fetch **throws
> out of `betterAuth()`** instead of degrading silently as it did in 1.6.
> Declaring the issuer keeps the account namespace stable across a transient MP
> outage and keeps `src/lib/auth.ts` importable without network access (tests,
> CI). Discovery still supplies the endpoints and the JWKS used to verify ID
> tokens.

> ℹ️ **`nonce` binding is now on.** Because MP publishes a `jwks_uri`, Better
> Auth sends a server-generated `nonce` and rejects a callback whose `id_token`
> does not echo it (OIDC Core §3.1.3.7). If MP ever stops returning the `nonce`
> claim, sign-in fails with an `id_token failed verification` error; the escape
> hatch is `disableIdTokenNonceBinding: true`, which removes `id_token` replay
> protection.

> ℹ️ **RP-initiated logout is available but unused.** MP's discovery document
> exposes `end_session_endpoint`, so 1.7 can build the provider logout URL
> itself (including `id_token_hint`, which our hand-rolled URL omits).
> `handleSignOut()` still constructs the URL manually and ignores the `url` that
> `auth.api.signOut()` now returns — a possible simplification, deliberately
> left out of the 1.7 migration.

### User Additional Fields

```typescript
// Exported as `userAdditionalFields` from src/lib/auth.ts
user: {
  additionalFields: {
    userGuid: {
      type: "string",
      required: false,
      input: true,  // MUST be true — see warning below
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

### customSession Callback

The `customSession` callback only does lightweight name splitting. It does **not** make any API calls. Profile loading is handled by `UserProvider` on the client side.

```typescript
customSession(async ({ user, session }) => ({
  user: {
    ...user,
    firstName: user.name?.split(" ")[0] || "",
    lastName: user.name?.split(" ").slice(1).join(" ") || "",
  },
  session,
}), options)
```

**Why no API calls in customSession?** It runs on every `getSession()` call when the cookie cache expires. Making MP API calls here would be slow and fragile.

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
| `authClient.signOut()` | Clears local session (use `handleSignOut` for full OIDC logout) |

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
   b. Verifies the id_token against MP's JWKS and the expected nonce
   c. Calls getUserInfo(tokens) → fetches OIDC profile → returns { sub, ... }
   d. Calls mapProfileToUser(profile) → returns { userGuid: profile.sub }
   e. Resolves the account subject from profile.sub (OIDC default)
   f. Creates user record (id=generated, userGuid=sub, email, name)
   g. Creates account record (issuer=MP issuer, accountId=sub, tokens)
   h. Creates session → sets JWT cookie
6. Redirect to callbackURL → app loads with session
7. UserProvider calls getCurrentUserProfile(userGuid) → loads MP profile
```

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

## Route Protection (`src/proxy.ts`)

Uses `getSessionCookie()` from `better-auth/cookies` for fast cookie-only checks (no JWT decoding or API calls).

### Public Paths (no auth required)

- `/api/*` — All API routes (Better Auth handles its own auth)
- `/signin` — Sign-in page
- `/_next/*`, `/favicon.ico`, `/assets/*` — Static assets (excluded by matcher)

### Protected Paths

Everything else requires a valid session cookie. Missing cookie → redirect to `/signin`.

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

1. Reads `session.user.userGuid` from `authClient.useSession()`
2. Calls `getCurrentUserProfile(userGuid)` server action
3. `UserService.getUserProfile()` queries `dp_Users WHERE User_GUID = '{userGuid}'`
4. Returns `MPUserProfile` (First_Name, Last_Name, Email, Image_GUID, etc.)
5. Profile available via `useUser()` hook in any client component

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `MINISTRY_PLATFORM_BASE_URL` | Yes | MP server URL (OAuth discovery, API) |
| `BETTER_AUTH_URL` | Yes* | App URL for callbacks. Fallback: `NEXTAUTH_URL` |
| `BETTER_AUTH_SECRET` | Yes* | Session signing secret. Fallback: `NEXTAUTH_SECRET` |
| `OIDC_CLIENT_ID` | Yes | OAuth client ID registered in MP |
| `OIDC_CLIENT_SECRET` | Yes | OAuth client secret |

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
3. **Run the auth tests**: `npm run test:run src/auth.test.ts`. Three tests are
   real library guards, not simulations:
   - `better-auth 1.6 guard` — `userGuid` still survives provider-profile parsing.
   - `better-auth 1.7 guard` (getUserInfo) — the profile still carries `sub`, which
     the OIDC `accountSubject` resolver reads.
   - `better-auth 1.7 guard` (accountIssuer) — the issuer is still pinned, so a
     discovery failure can't throw out of `betterAuth()` or re-key accounts.
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
     → MP isn't echoing the `nonce`, or JWKS/audience changed. Escape hatch:
     `disableIdTokenNonceBinding: true` (costs `id_token` replay protection).
   - `discovery returned no valid data` → MP discovery is unreachable; the pinned
     `accountIssuer` keeps init from throwing, but sign-in still needs discovery
     for the endpoints.
6. If `userGuid` is missing, check `parseAdditionalUserInputFromProviderProfile`
   in `node_modules/better-auth/dist/db/schema.mjs` — the library may have changed
   how additional fields flow from the OAuth profile into the user record.

## Known Limitations

1. **No database (top refactor priority)**: With no `database` in the config, Better Auth uses an in-memory adapter. Sessions live only in the in-memory store + cookies, so they are lost whenever the process restarts. On serverless/Vercel this is severe: **every cold start or new function instance has an empty session store**, so once the 1-hour JWT cookie cache expires, a request that lands on a fresh instance returns `null` and the user appears logged out (blank avatar / redirect to `/signin`) intermittently. This also makes auth bugs hard to reproduce. **Recommendation:** configure a persistent database adapter (e.g. a Vercel Marketplace Postgres/Neon, or SQLite for local dev) before relying on this in production.
2. ~~**mapProfileToUser type narrowness**~~ *(resolved in better-auth 1.7)*: `mapProfileToUser` now returns `OAuthMappedUser`, which permits arbitrary extra keys, so the old `as Record<string, unknown>` cast is gone. The type does forbid returning `id` — provider identity is owned by `accountSubject`.
3. **userGuid type cast**: `session.user.userGuid` requires a type cast because `customSessionClient` doesn't infer `additionalFields` from `genericOAuth`. This is a Better Auth type limitation.
4. **Token refresh**: Not explicitly implemented. The `storeAccountCookie` stores refresh tokens, but automatic refresh behavior in stateless mode is unverified.
5. **Cookie cache staleness**: The 1-hour JWT cookie cache means `customSession` changes won't take effect until the cache expires or the user re-authenticates.

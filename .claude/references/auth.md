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
| `src/components/layout/auth-wrapper.tsx` | Server component — redirects unauthenticated users |
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
| `providerId` | `"ministry-platform"` | Used in OAuth URLs and `signIn.oauth2()` |
| `discoveryUrl` | `${MP_BASE_URL}/oauth/.well-known/openid-configuration` | OIDC auto-discovery |
| `scopes` | `openid`, `offline_access`, `dataplatform/scopes/all` | Full MP API access |
| `pkce` | `false` | MP doesn't support PKCE |
| `getUserInfo` | Custom callback | Fetches OIDC userinfo, returns `id: profile.sub` |
| `mapProfileToUser` | Custom callback | Stores `profile.id` (sub) as `userGuid` |

### User Additional Fields

```typescript
user: {
  additionalFields: {
    userGuid: {
      type: "string",
      required: false,
      input: false,  // Cannot be set by users during signup
    },
  },
}
```

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
import { genericOAuthClient, customSessionClient } from "better-auth/client/plugins";
import type { auth } from "./auth";

export const authClient = createAuthClient({
  plugins: [
    genericOAuthClient(),
    customSessionClient<typeof auth>(),
  ],
});
```

### Client-Side API

| Method | Purpose |
|--------|---------|
| `authClient.useSession()` | React hook — returns `{ data: session, isPending }` |
| `authClient.getSession()` | Async — returns `{ data: session }` |
| `authClient.signIn.oauth2({ providerId, callbackURL })` | Initiates OAuth flow |
| `authClient.signOut()` | Clears local session (use `handleSignOut` for full OIDC logout) |

## OAuth Flow

```
1. User visits app → proxy checks session cookie → no cookie → redirect to /signin
2. /signin page → authClient.signIn.oauth2({ providerId: "ministry-platform" })
3. Redirect to MP OAuth → user authenticates → redirect to callback
4. Callback URL: /api/auth/oauth2/callback/ministry-platform
5. Better Auth:
   a. Exchanges code for tokens
   b. Calls getUserInfo(tokens) → fetches OIDC profile → returns { id: sub, ... }
   c. Calls mapProfileToUser(profile) → returns { userGuid: profile.id }
   d. Creates user record (id=generated, userGuid=sub, email, name)
   e. Creates account record (accountId=sub, tokens)
   f. Creates session → sets JWT cookie
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

- **OAuth2 Callback URL**: `{APP_URL}/api/auth/oauth2/callback/ministry-platform`
- **Post-Logout Redirect URI**: `{APP_URL}` (or `{APP_URL}/signin`)

## Known Limitations

1. **No database**: In-memory adapter means all sessions are lost on server restart. Users must re-login after each restart. For production, configure a database adapter.
2. **mapProfileToUser type narrowness**: The genericOAuth TypeScript type for `mapProfileToUser` doesn't include `additionalFields`. The return must be cast to `Record<string, unknown>` for extra fields. The runtime code does pass them through correctly.
3. **userGuid type cast**: `session.user.userGuid` requires a type cast because `customSessionClient` doesn't infer `additionalFields` from `genericOAuth`. This is a Better Auth type limitation.
4. **Token refresh**: Not explicitly implemented. The `storeAccountCookie` stores refresh tokens, but automatic refresh behavior in stateless mode is unverified.
5. **Cookie cache staleness**: The 1-hour JWT cookie cache means `customSession` changes won't take effect until the cache expires or the user re-authenticates.

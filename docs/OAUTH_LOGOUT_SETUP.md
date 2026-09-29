# OAuth Logout Configuration for Ministry Platform

## Current Status
✅ Server-side sign-out via the `handleSignOut()` server action
✅ OIDC RP-initiated logout with `client_id` and (when available) `id_token_hint`
⚠️ Requires a **Post-Logout Redirect URI** registered on the MP OAuth client

## What's Working
- Better Auth session cookie cleared server-side by `auth.api.signOut()`
- The browser is then redirected to Ministry Platform's `end_session` endpoint,
  which ends the MP OAuth (SSO) session
- MP redirects back to the app, which now has no session, so `src/proxy.ts`
  sends the user to `/signin`

## Implementation

All of it lives in `src/components/user-menu/actions.ts`:

```typescript
export async function handleSignOut() {
  // Clear the Better Auth session first; ask for the provider logout URL
  // instead of a redirect.
  const result = await auth.api.signOut({
    headers: await headers(),
    body: { disableRedirect: true },
  });

  // Throws (after sign-out) if MINISTRY_PLATFORM_BASE_URL,
  // BETTER_AUTH_URL/NEXTAUTH_URL or OIDC_CLIENT_ID is unset.

  const params = new URLSearchParams({
    post_logout_redirect_uri: appUrl,   // BETTER_AUTH_URL, verbatim
    client_id: clientId,                // OIDC_CLIENT_ID
  });
  // id_token_hint is read from better-auth's URL (MP origin only), when present
  if (idTokenHint) params.set('id_token_hint', idTokenHint);

  redirect(`${baseUrl}/oauth/connect/endsession?${params.toString()}`);
}
```

Callers: the user menu (`src/components/user-menu/user-menu.tsx`) and the
broken-session recovery page (`src/app/session-error/page.tsx`), which wires it to
a plain `<form action={handleSignOut}>` so a user with an unusable session can
still get out.

### Sign-out is server-side only

`POST /api/auth/sign-out` is **not** in `allowedAuthRoutes`
(`src/app/api/auth/[...all]/route.ts`), so `authClient.signOut()` from the
browser returns 404. That is deliberate: sign-out runs in-process through
`auth.api.signOut()`, so no HTTP sign-out route is needed, and the 404 makes an
accidental client-side call loud instead of a silent no-op. If a client-side
sign-out is ever genuinely required, add the path to the allowlist first.

### `client_id` and `id_token_hint`

Without `id_token_hint` or `client_id`, the OP cannot tell which client's
registered post-logout URIs to check. IdentityServer-style providers (MP's
`/connect/endsession` is the IdentityServer convention) then show a "log out?"
prompt and do not redirect back. A user who closes the tab at that prompt
leaves the MP SSO session alive, and on a shared PC the next person is signed
straight in as them.

So the URL always carries `client_id`, and carries `id_token_hint` whenever
the id_token is available. better-auth 1.7 builds a provider logout URL that
includes `id_token_hint`, and `auth.api.signOut({ body: { disableRedirect: true } })`
returns it as `url`. `handleSignOut()` takes only the `id_token_hint` from it
(and only from a URL on the MP origin), then builds the final URL itself. That
keeps `post_logout_redirect_uri` exactly `BETTER_AUTH_URL`: better-auth would
normalise it with a trailing slash, which would not match the registered value.

The id_token is not in any cookie (`storeAccountCookie` is off). It lives only
in the in-memory account row of the server process that handled sign-in. Every
Next bundle layer in that process shares one `auth` instance (`sharedInstance`
in `src/lib/auth.ts`); before that fix, the sign-out server action ran in a
different module copy from the OAuth callback and never had the id_token. On a
different serverless instance, only `client_id` is sent.

**Tested against MP 2026-09-29 (Playwright, `next build && next start`):**

- With `id_token_hint`: no prompt. MP logs out, redirects to the app, and the
  next sign-in asks for credentials.
- With `client_id` only: MP shows "Would you like to logout?" with a **Yes**
  button. After Yes, the MP session ends as above; closing the tab instead
  leaves it alive.

## Ministry Platform OAuth Configuration

Register **Post-Logout Redirect URIs** on the MP OAuth client (the one named by
`OIDC_CLIENT_ID`). The value sent is `BETTER_AUTH_URL` verbatim — an origin with
**no trailing slash and no path** — so that exact string must be registered.

**Production:**
```
https://yourdomain.com
```

**Development:**
```
http://localhost:3000
```

Without this, MP rejects the `post_logout_redirect_uri` and the user is left on
an MP error page, or is auto-logged back in on the next sign-in (SSO behavior).

## Environment Variables

```env
MINISTRY_PLATFORM_BASE_URL=https://your-mp-instance.com/ministryplatformapi
BETTER_AUTH_URL=https://yourdomain.com  # Production
BETTER_AUTH_URL=http://localhost:3000   # Development
```

`handleSignOut()` clears the local session, then throws if
`MINISTRY_PLATFORM_BASE_URL`, `OIDC_CLIENT_ID`, or both `BETTER_AUTH_URL` and
its `NEXTAUTH_URL` fallback are unset. There is no localhost fallback.

## Testing

Unit coverage: `src/components/user-menu/actions.test.ts` pins the
`auth.api.signOut` call, `client_id` on every redirect, `id_token_hint` taken
from better-auth's URL (and ignored when off-origin, malformed or empty), the
exact `post_logout_redirect_uri`, the `NEXTAUTH_URL` fallback, and the throws
for missing configuration. `src/auth.user-oauth-tokens.test.ts` drives a mocked
sign-in and shows the real `auth` instance returns the retained id_token as
`id_token_hint`.

**Manual (the only thing that exercises MP):**
1. Sign in to the application
2. Click "Sign out"
3. You should bounce through Ministry Platform briefly, then back to the app
4. You land on `/signin`, which immediately restarts the OAuth flow
5. MP should now ask for credentials rather than signing you straight back in —
   if it does not, the MP session was not ended (check the post-logout redirect
   URI registration)
6. On a serverless deployment where sign-out may land on another instance,
   expect MP's "Would you like to logout?" prompt (URL carries `client_id` but
   no `id_token_hint`); click **Yes** to finish

## References
- [OpenID Connect RP-Initiated Logout Spec](https://openid.net/specs/openid-connect-rpinitiated-1_0.html)
- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Auth Reference](../.claude/references/auth.md) — § Logout Flow

## Alternative considered: local-only logout

Clearing only the Better Auth cookie and skipping the MP end-session redirect is
simpler, but leaves the MP SSO session alive — the next visit to `/signin`
signs the user straight back in without a credential prompt. **Not used here.**
Sign-out must mean signed out at both the application and the identity provider.

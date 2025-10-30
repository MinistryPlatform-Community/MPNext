# OAuth Logout Configuration for Ministry Platform

## Current Status
✅ Basic sign-out implemented using NextAuth server action  
⚠️ OIDC RP-initiated logout not yet configured

## What's Working
- Application-level session termination via `signOut()` server action
- NextAuth clears local session cookies
- User is logged out of the Next.js application

## What's Missing (For Complete OIDC Logout)

### 1. Ministry Platform OAuth Configuration
You need to register **Post-Logout Redirect URIs** in your Ministry Platform OAuth client settings:

**Production:**
```
https://yourdomain.com/
https://yourdomain.com/signin
```

**Development:**
```
http://localhost:3000/
http://localhost:3000/signin
```

### 2. Implementation Details

#### OIDC RP-Initiated Logout Flow:
When a user clicks "Sign out", the current implementation:
1. ✅ Destroys NextAuth session (JWT)
2. ❌ Does NOT notify Ministry Platform to end the OAuth session

#### To implement full logout:
The `signOut()` function should redirect to Ministry Platform's end_session endpoint:

```
${MINISTRY_PLATFORM_BASE_URL}/oauth/connect/endsession?
  id_token_hint={ID_TOKEN}&
  post_logout_redirect_uri={YOUR_APP_URL}
```

**Why this matters:**
- Without OIDC logout, users remain authenticated at Ministry Platform
- If they click "Sign in" again, they're auto-logged back in (SSO)
- True logout requires ending the session at both application AND identity provider

### 3. Required Changes

#### Store ID Token in JWT Callback:
Already implemented in `src/auth.ts`:
```typescript
idToken: account.id_token,  // ✅ Line 63
```

#### Option A: Redirect-based logout (Recommended)
Modify `signOut()` to use `redirect` parameter:

```typescript
// In user-menu/actions.ts
export async function handleSignOut() {
  const mpOauthUrl = `${process.env.MINISTRY_PLATFORM_BASE_URL}/oauth`;
  const endSessionUrl = `${mpOauthUrl}/connect/endsession`;
  
  // Get current session to extract id_token
  const session = await auth();
  const idToken = session?.idToken;
  
  const params = new URLSearchParams({
    post_logout_redirect_uri: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  });
  
  if (idToken) {
    params.append('id_token_hint', idToken);
  }
  
  // Sign out of NextAuth first
  await signOut({ 
    redirect: false  // Don't redirect yet
  });
  
  // Then redirect to MP's end_session endpoint
  redirect(`${endSessionUrl}?${params.toString()}`);
}
```

#### Option B: Simple logout (Current Implementation)
Current implementation only logs out of NextAuth locally. This is acceptable if:
- You don't need to clear Ministry Platform session
- Users are okay with auto-login on next visit (SSO behavior)

### 4. Environment Variables
Ensure these are set:

```env
MINISTRY_PLATFORM_BASE_URL=https://your-mp-instance.com
NEXTAUTH_URL=https://yourdomain.com  # Production
NEXTAUTH_URL=http://localhost:3000   # Development
```

### 5. Testing

**Test basic logout:**
1. Sign in to application
2. Click "Sign out"
3. Verify you're redirected and session is cleared
4. Try accessing protected route - should redirect to signin

**Test OIDC logout (if implemented):**
1. Sign in to application
2. Click "Sign out"
3. Should redirect to Ministry Platform briefly
4. Then redirect back to your app
5. Try signing in again - should require credentials (not auto-login)

## References
- [OpenID Connect RP-Initiated Logout Spec](https://openid.net/specs/openid-connect-rpinitiated-1_0.html)
- [NextAuth.js v5 Logout Documentation](https://authjs.dev/guides/basics/signout)

## Decision Required

Choose implementation based on your requirements:

**Option A (Full OIDC Logout):**
- Pros: True logout from identity provider, no auto-login
- Cons: More complex, requires Ministry Platform configuration
- Use when: Security requires clearing all sessions

**Option B (Local Logout Only - Current):**
- Pros: Simpler, works immediately
- Cons: SSO session remains, users auto-login
- Use when: SSO convenience is preferred

Currently implemented: **Option B**

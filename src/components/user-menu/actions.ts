'use server';

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Pulls the `id_token_hint` out of the provider logout URL better-auth returns
 * from `signOut`. better-auth can only build that URL on the instance whose
 * in-memory account row still holds the user's id_token (the token is not in
 * any cookie — `storeAccountCookie` is off), so this is null on any other
 * serverless instance. Only a URL on the MP origin is trusted.
 */
function idTokenHintFrom(providerLogoutUrl: unknown, mpOrigin: string): string | null {
  if (typeof providerLogoutUrl !== "string") return null;
  try {
    const url = new URL(providerLogoutUrl);
    if (url.origin !== mpOrigin) return null;
    return url.searchParams.get("id_token_hint") || null;
  } catch {
    return null;
  }
}

export async function handleSignOut() {
  // Clear the Better Auth session first, so a misconfigured environment below
  // still signs the user out of this app. `disableRedirect` asks better-auth for the
  // provider logout URL instead of a Location header; only its id_token is
  // used — the URL itself is rebuilt below so `post_logout_redirect_uri` is
  // exactly the value registered in MP.
  const result = await auth.api.signOut({
    headers: await headers(),
    body: { disableRedirect: true },
  });

  const baseUrl = process.env.MINISTRY_PLATFORM_BASE_URL;
  if (!baseUrl) {
    throw new Error('MINISTRY_PLATFORM_BASE_URL is not configured');
  }
  // No localhost fallback: a post-logout redirect to the wrong origin either
  // fails MP's registered-URI check or sends the user somewhere unexpected.
  const appUrl = process.env.BETTER_AUTH_URL || process.env.NEXTAUTH_URL;
  if (!appUrl) {
    throw new Error('BETTER_AUTH_URL is not configured');
  }
  const clientId = process.env.OIDC_CLIENT_ID;
  if (!clientId) {
    throw new Error('OIDC_CLIENT_ID is not configured');
  }

  // Without `id_token_hint` or `client_id` the OP cannot tell which client's
  // registered post-logout URIs to check, so IdentityServer-style providers
  // (MP) prompt "log out?" and do not redirect — leaving the MP SSO session
  // alive on a shared PC if the tab is closed there. `client_id` is always
  // sent; `id_token_hint` whenever this instance still has the id_token.
  const endSessionUrl = `${baseUrl}/oauth/connect/endsession`;
  const params = new URLSearchParams({
    post_logout_redirect_uri: appUrl,
    client_id: clientId,
  });
  const idTokenHint = idTokenHintFrom(
    (result as { url?: unknown } | undefined)?.url,
    new URL(baseUrl).origin,
  );
  if (idTokenHint) params.set('id_token_hint', idTokenHint);

  redirect(`${endSessionUrl}?${params.toString()}`);
}

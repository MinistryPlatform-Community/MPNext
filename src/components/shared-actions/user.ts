'use server';

import { MPUserProfile } from "@/lib/providers/ministry-platform/types";
import { UserService } from '@/services/userService';
import { AuthorizationService } from '@/services/authorizationService';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Fetches the signed-in user's own profile from Ministry Platform.
 *
 * Takes no parameters by design. The User_GUID is read from the session rather
 * than accepted from the caller, because this action also discloses the user's
 * roles and user groups — an arbitrary-GUID parameter would let any caller read
 * the authorization model for any user whose GUID they knew, and GUIDs are not
 * usefully secret (they appear in the client session and in /contactlookup URLs).
 *
 * If a feature ever needs to read another user's profile, add a separate,
 * explicitly role-gated function rather than widening this one. The service
 * enforces the same rule on its own: `UserService.getUserProfile` re-reads the
 * session and refuses any GUID but the caller's (2026-09-28), so it stays safe
 * even for a caller that forgets this reasoning.
 *
 * Requires only an authenticated session: any MP user may sign in and see the
 * app shell, so their own profile (avatar, name, sign-out menu) must load even
 * with no security role. The profile carries `canAccessContactFeatures` so the
 * UI can hide links the user would only be refused at — see below.
 *
 * @returns The signed-in user's profile data, or undefined if MP has no match
 */
export async function getCurrentUserProfile(): Promise<MPUserProfile | undefined> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw new Error('Authentication required');
  }

  const userGuid = (session.user as { userGuid?: string }).userGuid;
  if (!userGuid) {
    throw new Error('User GUID not found in session');
  }

  const userService = await UserService.getInstance();
  const userProfile = await userService.getUserProfile(userGuid);
  if (!userProfile) return undefined;

  // UX only — NOT a security control. Computed server-side with the same gate
  // the pages, actions and services enforce with (`hasSecurityRole` is the
  // non-throwing form `requireSecurityRole` is built on), so the nav and the
  // enforcement can never disagree about policy. Hiding a link stops a
  // role-less user being handed something that will only refuse them; it does
  // not stop anyone calling the action directly, which is why all three
  // enforcement layers exist.
  const decision = await AuthorizationService.getInstance().hasSecurityRole({
    table: 'Contacts',
    operation: 'read',
  });

  return { ...userProfile, canAccessContactFeatures: decision.permitted };
}

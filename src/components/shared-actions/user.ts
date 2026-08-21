'use server';

import { MPUserProfile } from "@/lib/providers/ministry-platform/types";
import { UserService } from '@/services/userService';
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
 * explicitly role-gated function rather than widening this one.
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
  return userProfile;
}

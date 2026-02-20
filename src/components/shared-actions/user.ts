'use server';

import { auth } from "@/auth";
import { MPUserProfile } from "@/lib/providers/ministry-platform/types";
import { UserService } from '@/services/userService';

/**
 * Fetches the current user's profile from Ministry Platform
 * @param id - The user's GUID
 * @returns The user's profile data
 */
export async function getCurrentUserProfile(id: string): Promise<MPUserProfile> {
  const session = await auth();
  const userService = await UserService.getInstance(session?.accessToken);
  const userProfile = await userService.getUserProfile(id);
  return userProfile;
}

'use server';

import { MPUserProfile } from "@/lib/providers/ministry-platform/types";
import { UserService } from '@/services/userService';

export async function getCurrentUserProfile(id:string): Promise<MPUserProfile> {
  console.log('getCurrentUserProfile');
  console.log(id);
  const userService = await UserService.getInstance();
  const userProfile = await userService.getUserProfile(id);
  console.log(userProfile);
  return userProfile;
}
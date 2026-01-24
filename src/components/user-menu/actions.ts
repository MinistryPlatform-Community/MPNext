'use server';

import { signOut, auth } from "@/auth";
import { redirect } from "next/navigation";

export async function handleSignOut() {
  const session = await auth();

  await signOut({ redirect: false });

  const baseUrl = process.env.MINISTRY_PLATFORM_BASE_URL;
  if (!baseUrl) {
    throw new Error('MINISTRY_PLATFORM_BASE_URL is not configured');
  }

  const endSessionUrl = `${baseUrl}/oauth/connect/endsession`;
  const params = new URLSearchParams({
    post_logout_redirect_uri: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  });

  if (session?.idToken) {
    params.append('id_token_hint', session.idToken as string);
  }

  redirect(`${endSessionUrl}?${params.toString()}`);
}

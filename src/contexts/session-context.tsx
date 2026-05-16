"use client";

import { authClient } from "@/lib/auth-client";

type SessionData = typeof authClient.$Infer.Session;

export type { SessionData };

export function useAppSession() {
  const { data } = authClient.useSession();
  return data;
}

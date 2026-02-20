"use client";

import { createContext, useContext } from "react";
import { authClient } from "@/lib/auth-client";

type SessionData = typeof authClient.$Infer.Session;

const SessionContext = createContext<SessionData | null>(null);

export type { SessionData };

export function useAppSession() {
  const { data } = authClient.useSession();
  return data;
}

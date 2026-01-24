"use client";

import { createContext, useContext } from "react";
import type { Session } from "next-auth";

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session;
}) {
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}

export function useAppSession() {
  const session = useContext(SessionContext);
  if (session === null) {
    throw new Error("useAppSession must be used within a SessionProvider");
  }
  return session;
}

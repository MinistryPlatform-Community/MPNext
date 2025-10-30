'use client';

import { createContext, useContext } from 'react';
import type { Session } from 'next-auth';

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session;
}) {
  console.log('SessionProvider session: ', session);
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const session = useContext(SessionContext);
  if (session === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return session;
}
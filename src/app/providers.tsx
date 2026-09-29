"use client";

import { UserProvider } from "@/contexts/user-context";
import { ReactNode } from "react";
import type { CurrentUserProfile } from "@/lib/dto";

interface ProvidersProps {
  /** Started server-side by `ServerProviders`; see `UserProvider`. */
  profilePromise: Promise<CurrentUserProfile | null>;
  children: ReactNode;
}

export function Providers({ profilePromise, children }: ProvidersProps) {
  return (
    <UserProvider profilePromise={profilePromise}>
      {children}
    </UserProvider>
  );
}

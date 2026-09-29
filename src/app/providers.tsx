"use client";

import { UserProvider } from "@/contexts/user-context";
import { ReactNode } from "react";
import type { MPUserProfile } from "@/lib/providers/ministry-platform/types";

interface ProvidersProps {
  /** Started server-side by `ServerProviders`; see `UserProvider`. */
  profilePromise: Promise<MPUserProfile | null>;
  children: ReactNode;
}

export function Providers({ profilePromise, children }: ProvidersProps) {
  return (
    <UserProvider profilePromise={profilePromise}>
      {children}
    </UserProvider>
  );
}

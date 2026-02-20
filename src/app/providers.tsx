"use client";

import { UserProvider } from "@/contexts/user-context";
import { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <UserProvider>
      {children}
    </UserProvider>
  );
}

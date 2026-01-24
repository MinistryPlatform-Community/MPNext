"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { MPUserProfile } from "@/lib/providers/ministry-platform/types";
import { getCurrentUserProfile } from "@/components/shared-actions/user";

interface UserContextValue {
  userProfile: MPUserProfile | null;
  isLoading: boolean;
  error: Error | null;
  refreshUserProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const { data: session, status } = useSession();
  const [userProfile, setUserProfile] = useState<MPUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadUserProfile = useCallback(async () => {
    if (!session?.user?.id) {
      setUserProfile(null);
      setIsLoading(false);
      return;
    }

    if (session.userProfile) {
      setUserProfile(session.userProfile);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const profile = await getCurrentUserProfile(session.user.id);
      setUserProfile(profile);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load user profile"));
      setUserProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, session?.userProfile]);

  useEffect(() => {
    if (status === "authenticated") {
      loadUserProfile();
    } else if (status === "unauthenticated") {
      setUserProfile(null);
      setIsLoading(false);
    }
  }, [session?.user?.id, session?.userProfile, status, loadUserProfile]);

  const refreshUserProfile = async () => {
    await loadUserProfile();
  };

  return (
    <UserContext.Provider value={{ userProfile, isLoading, error, refreshUserProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

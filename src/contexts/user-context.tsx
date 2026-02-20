"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { authClient } from "@/lib/auth-client";
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
  const { data: session, isPending } = authClient.useSession();
  const [userProfile, setUserProfile] = useState<MPUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // userGuid is the MP User_GUID stored as an additionalField on the Better Auth user.
  // Better Auth generates its own internal user.id, so we use userGuid for MP lookups.
  const userGuid = (session?.user as { userGuid?: string } | undefined)?.userGuid;

  const loadUserProfile = useCallback(async () => {
    if (!userGuid) {
      setUserProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const profile = await getCurrentUserProfile(userGuid);
      setUserProfile(profile);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load user profile"));
      setUserProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [userGuid]);

  useEffect(() => {
    if (!isPending && userGuid) {
      loadUserProfile();
    } else if (!isPending && !session) {
      setUserProfile(null);
      setIsLoading(false);
    }
  }, [userGuid, isPending, loadUserProfile, session]);

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

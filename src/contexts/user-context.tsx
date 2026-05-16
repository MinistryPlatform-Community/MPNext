"use client";

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
  use,
  ReactNode,
} from "react";
import { authClient } from "@/lib/auth-client";
import { MPUserProfile } from "@/lib/providers/ministry-platform/types";
import { getCurrentUserProfile } from "@/components/shared-actions/user";

interface UserContextValue {
  userProfilePromise: Promise<MPUserProfile | null>;
  refreshUserProfile: () => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

const RESOLVED_NULL: Promise<MPUserProfile | null> = Promise.resolve(null);

export function UserProvider({ children }: UserProviderProps) {
  const { data: session, isPending } = authClient.useSession();
  const [refreshKey, setRefreshKey] = useState(0);

  // userGuid is the MP User_GUID stored as an additionalField on the Better Auth user.
  // Better Auth generates its own internal user.id, so we use userGuid for MP lookups.
  const userGuid = (session?.user as { userGuid?: string } | undefined)?.userGuid;

  const [userProfilePromise, setUserProfilePromise] =
    useState<Promise<MPUserProfile | null>>(RESOLVED_NULL);

  // Server actions trigger router cache invalidation, so the fetch must be
  // kicked off from an effect — calling during render would setState on the
  // Router mid-render. set-state-in-effect is disabled because driving a
  // Suspense-consumed promise into state is the React 19 pattern for this.
  useEffect(() => {
    if (isPending) return;
    if (!userGuid) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUserProfilePromise(RESOLVED_NULL);
      return;
    }
    setUserProfilePromise(getCurrentUserProfile(userGuid).then((p) => p ?? null));
  }, [userGuid, isPending, refreshKey]);

  const refreshUserProfile = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const value = useMemo<UserContextValue>(
    () => ({ userProfilePromise, refreshUserProfile }),
    [userProfilePromise, refreshUserProfile]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

interface UseUserResult {
  userProfile: MPUserProfile | null;
  refreshUserProfile: () => void;
}

export function useUser(): UseUserResult {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  const userProfile = use(context.userProfilePromise);
  return { userProfile, refreshUserProfile: context.refreshUserProfile };
}

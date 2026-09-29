"use client";

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  use,
  startTransition,
  ReactNode,
} from "react";
import { MPUserProfile } from "@/lib/providers/ministry-platform/types";
import { getCurrentUserProfile } from "@/components/shared-actions/user";

interface UserContextValue {
  userProfilePromise: Promise<MPUserProfile | null>;
  refreshUserProfile: () => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

interface UserProviderProps {
  /**
   * The signed-in user's MP profile, started on the server by the `(web)`
   * layout and streamed to the client un-awaited. Starting it there — rather
   * than in an effect after hydration — is what keeps the header from
   * flickering: the old client-side load waited for hydration, then a
   * get-session fetch, then a server-action POST, and replaced the whole
   * header with its Suspense fallback for the duration.
   */
  profilePromise: Promise<MPUserProfile | null>;
  children: ReactNode;
}

export function UserProvider({ profilePromise, children }: UserProviderProps) {
  // Only set by `refreshUserProfile`. Until then the server-started promise is
  // the source of truth, including a fresh one from a server re-render
  // (`router.refresh()`), which replaces the layout's props.
  const [refreshedPromise, setRefreshedPromise] =
    useState<Promise<MPUserProfile | null> | null>(null);

  const userProfilePromise = refreshedPromise ?? profilePromise;

  const refreshUserProfile = useCallback(() => {
    // A transition, so components already showing a profile keep showing it
    // until the new one resolves instead of dropping back to their Suspense
    // fallbacks.
    startTransition(() => {
      setRefreshedPromise(getCurrentUserProfile().then((p) => p ?? null));
    });
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

/**
 * Reads the signed-in user's MP profile. **Suspends** until it has loaded, so
 * every caller must sit inside a `<Suspense>` whose fallback occupies exactly
 * the space the loaded UI will — keep the boundary as tight as possible (the
 * header wraps only its avatar), or loading the profile shifts the page.
 */
export function useUser(): UseUserResult {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  const userProfile = use(context.userProfilePromise);
  return { userProfile, refreshUserProfile: context.refreshUserProfile };
}

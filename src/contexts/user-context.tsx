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

/**
 * Logs a failed profile load (identifiers and shape only — never the message,
 * per the F5 logging policy) and degrades to "no profile".
 */
function profileLoadFailed(error: unknown): null {
  console.error("user.profile.load_failed", {
    name: error instanceof Error ? error.name : typeof error,
  });
  return null;
}

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

  // A failed load resolves to `null` instead of rejecting. The header — the
  // shell's only sign-out control — reads this promise and sits in
  // `(web)/layout.tsx`, ABOVE `(web)/error.tsx`, so a rejection used to
  // escape to the root boundary, replace the whole shell, and leave a
  // signed-in user with no way to sign out ("Go to sign in" just bounced back
  // to the same failure). As `null` it renders the no-profile header, whose
  // menu still offers sign-out. Memoised so `use()` sees a stable promise.
  const safeServerPromise = useMemo(
    () => profilePromise.catch(profileLoadFailed),
    [profilePromise]
  );
  const userProfilePromise = refreshedPromise ?? safeServerPromise;

  const refreshUserProfile = useCallback(() => {
    // A transition, so components already showing a profile keep showing it
    // until the new one resolves instead of dropping back to their Suspense
    // fallbacks.
    startTransition(() => {
      setRefreshedPromise(
        getCurrentUserProfile().then((p) => p ?? null, profileLoadFailed)
      );
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

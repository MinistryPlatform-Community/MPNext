import { ReactNode } from "react";
import { Providers } from "@/app/providers";
import { getCurrentUserProfile } from "@/components/shared-actions/user";

/**
 * Server half of the `(web)` provider tree: starts the signed-in user's MP
 * profile load during the server render and hands the *un-awaited* promise to
 * the client `Providers`. React streams it, so the page shell is not held up by
 * Ministry Platform, and the header avatar usually arrives in the same response
 * instead of after hydration + a get-session fetch + a server-action POST.
 *
 * Must render BELOW `AuthWrapper`. The load starts when this component renders,
 * and React renders it only after `AuthWrapper` has confirmed a session — so a
 * signed-out request is redirected before any MP call is made. (Calling
 * `getCurrentUserProfile()` in the layout body instead would start it before
 * the guard runs.) `getCurrentUserProfile` re-checks the session itself anyway.
 *
 * A failed load rejects the promise; `useUser()` rethrows it on the client to
 * the nearest error boundary, as the client-side load did.
 */
export function ServerProviders({ children }: { children: ReactNode }) {
  const profilePromise = getCurrentUserProfile().then((p) => p ?? null);
  return <Providers profilePromise={profilePromise}>{children}</Providers>;
}

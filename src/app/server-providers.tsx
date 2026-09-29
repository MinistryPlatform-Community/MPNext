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
 * A failed load rejects this promise, but that rejection never reaches an
 * error boundary: `UserProvider` (src/contexts/user-context.tsx) catches it,
 * logs `user.profile.load_failed`, and resolves to `null`, so `useUser()`
 * returns no profile and the header renders its no-profile state — which
 * still offers sign-out. (It used to rethrow to the root boundary and take the
 * shell's only sign-out control with it.)
 *
 * The promise resolves to the `CurrentUserProfile` DTO, not the MP row: it is
 * serialised into the page for the client, so it carries only what the client
 * renders (see src/lib/dto/user-profile.ts).
 */
export function ServerProviders({ children }: { children: ReactNode }) {
  const profilePromise = getCurrentUserProfile().then((p) => p ?? null);
  return <Providers profilePromise={profilePromise}>{children}</Providers>;
}

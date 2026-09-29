"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { subscribeToSignOut } from "@/contexts/sign-out-broadcast";
import { clearSignInAttempts } from "@/components/sign-in/sign-in-attempts";

/**
 * Client-side half of the protected shell's session check.
 *
 * `AuthWrapper` checks the session once, on the server, when the page is
 * rendered. After that the page — contact records, pastoral notes — stays on
 * screen however long the tab is left open, including after the user signs
 * out in another tab or the session expires. On a shared office machine that
 * is member data left in plain view.
 *
 * This watches better-auth's client session (which refetches on tab focus and
 * whenever another tab broadcasts a sign-out, see
 * `src/contexts/sign-out-broadcast.ts`) and, the moment it goes from a session
 * to none, stops rendering the page and replaces the location with `/signin`.
 * `replace`, not `href`, so Back doesn't return to the member-data page.
 *
 * Only a real "no session" answer counts: better-auth keeps the previous
 * session on a network error and nulls it only for a successful empty
 * response or a 401, so a flaky connection doesn't sign anyone out. And only a
 * transition counts — a null before any session was ever seen here is the
 * initial load, which `AuthWrapper` has already vouched for.
 *
 * Seeing a working session also clears `/signin`'s automatic-restart counter
 * (`src/components/sign-in/sign-in-attempts.ts`), so a normal sign-in never
 * accumulates toward its loop cap.
 */
export function SessionGuard({ children }: { children: ReactNode }) {
  const { data, isPending, refetch } = authClient.useSession();
  const hadSessionRef = useRef(false);
  const [signedOut, setSignedOut] = useState(false);

  useEffect(() => {
    if (data) {
      hadSessionRef.current = true;
      clearSignInAttempts();
      return;
    }
    if (!isPending && hadSessionRef.current) {
      setSignedOut(true);
      window.location.replace("/signin");
    }
  }, [data, isPending]);

  useEffect(() => subscribeToSignOut(() => void refetch()), [refetch]);

  if (signedOut) return null;
  return <>{children}</>;
}

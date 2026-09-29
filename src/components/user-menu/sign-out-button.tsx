"use client";

import { useState } from "react";
import { unstable_rethrow } from "next/navigation";
import { broadcastSignOut } from "@/contexts/sign-out-broadcast";
import { handleSignOut } from "./actions";

/**
 * Runs `handleSignOut`, then tells the other tabs (see
 * `src/contexts/sign-out-broadcast.ts`). Shared by the user menu and every
 * stand-alone sign-out control, so they all behave the same.
 *
 * The broadcast is in `finally`: `handleSignOut` clears the session cookie
 * before anything that can throw, and ends in `redirect()`, so by the time the
 * call settles either way the session is gone and other tabs should re-check.
 *
 * `unstable_rethrow` must stay the first statement of the catch: the redirect
 * is a NEXT_REDIRECT control-flow throw that Next has to see, or a successful
 * sign-out would surface as an error instead of navigating to MP's logout.
 *
 * Returns the error message on a genuine failure, `null` otherwise.
 */
export async function signOutEverywhere(): Promise<string | null> {
  try {
    await handleSignOut();
    return null;
  } catch (err) {
    unstable_rethrow(err);
    return err instanceof Error ? err.message : "Sign out failed";
  } finally {
    broadcastSignOut();
  }
}

interface SignOutButtonProps {
  className?: string;
  label?: string;
}

/**
 * A stand-alone sign-out control for places that have no user menu: the
 * header when the MP profile didn't load, the error boundaries, and `/signin`
 * when sign-in keeps looping. Without one, a shared/kiosk machine could be left
 * signed in with nothing on screen that signs it out.
 */
export function SignOutButton({ className, label = "Sign out" }: SignOutButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // A plain async handler, like the user menu's — not a transition, which
  // would route a rethrown NEXT_REDIRECT into the nearest error boundary.
  const onClick = async () => {
    setError(null);
    setPending(true);
    const message = await signOutEverywhere();
    // Only reached on failure or a non-redirecting return; a successful
    // sign-out is navigating away.
    setPending(false);
    if (message) setError(message);
  };

  return (
    <>
      <button type="button" onClick={onClick} disabled={pending} className={className}>
        {pending ? "Signing out..." : label}
      </button>
      {error && (
        <span role="alert" className="block text-sm text-red-600 mt-2">
          Sign out failed: {error}
        </span>
      )}
    </>
  );
}

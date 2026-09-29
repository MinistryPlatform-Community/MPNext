/**
 * Cross-tab "someone signed out" signal.
 *
 * Sign-out runs as a server action (`handleSignOut` in
 * `src/components/user-menu/actions.ts`), not through `authClient.signOut()`,
 * so better-auth's own client never broadcasts it and other open tabs keep
 * showing member data until they happen to refetch the session. The sign-out
 * controls post on this channel once the action has returned; `SessionGuard`
 * in every other tab listens, refetches its session, and — finding none —
 * leaves the protected page.
 *
 * The message carries no data. A receiver treats it only as a hint to
 * re-check the session with the server, never as proof of sign-out, so a
 * forged message (any same-origin script could post one) can at worst cause a
 * harmless extra `/get-session` request.
 *
 * `BroadcastChannel` is missing in some embedded browsers and in older test
 * environments; both functions are then no-ops, and tabs fall back to
 * better-auth's refetch-on-focus.
 */

export const SIGN_OUT_CHANNEL = "mpnext.auth";
const SIGN_OUT_MESSAGE = "signed-out";

function openChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  try {
    return new BroadcastChannel(SIGN_OUT_CHANNEL);
  } catch {
    return null;
  }
}

/** Tells every other tab of this origin to re-check its session. */
export function broadcastSignOut(): void {
  const channel = openChannel();
  if (!channel) return;
  try {
    channel.postMessage(SIGN_OUT_MESSAGE);
  } catch {
    // A closed/unusable channel is not worth failing a sign-out over.
  } finally {
    channel.close();
  }
}

/**
 * Calls `onSignOut` whenever another tab broadcasts a sign-out. Returns the
 * unsubscribe function (for a `useEffect` cleanup).
 */
export function subscribeToSignOut(onSignOut: () => void): () => void {
  const channel = openChannel();
  if (!channel) return () => {};
  channel.onmessage = (event: MessageEvent) => {
    if (event.data === SIGN_OUT_MESSAGE) onSignOut();
  };
  return () => channel.close();
}

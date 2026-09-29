/**
 * Counts the automatic navigations `/signin` makes on its own — starting the
 * MP OAuth flow, or bouncing an already-signed-in visitor to their callback —
 * so a sign-in that can never "stick" stops instead of looping forever.
 *
 * The loop this guards against: a session is minted, but the next server
 * render can't read it back (instances with different secrets, a cookie
 * dropped for size, ...). `AuthWrapper` sends the user back to `/signin`,
 * which sees no session and restarts OAuth; MP's SSO completes silently; and
 * the user bounces between the two with nothing on screen but a spinner.
 *
 * `sessionStorage` scopes the count to one tab and survives the full-page
 * navigations of the OAuth round trip. The protected shell clears it
 * (`clearSignInAttempts`, from `SessionGuard`) as soon as it sees a working
 * session, so a legitimate sign-in never accumulates toward the cap. Entries
 * older than `ATTEMPT_WINDOW_MS` are ignored for the same reason.
 *
 * Every storage access is wrapped: `sessionStorage` can throw (private mode,
 * blocked site data). If it is unusable the cap simply does not apply — the
 * old, uncapped behaviour — rather than blocking sign-in.
 */

const STORAGE_KEY = "mpnext.signin.autoAttempts";

/** Automatic navigations allowed within the window before `/signin` stops. */
export const MAX_AUTOMATIC_SIGN_IN_ATTEMPTS = 2;

/** How long a recorded attempt counts toward the cap. */
export const ATTEMPT_WINDOW_MS = 2 * 60 * 1000;

function readAttempts(now: number): number[] {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (t): t is number => typeof t === "number" && now - t < ATTEMPT_WINDOW_MS && t <= now,
    );
  } catch {
    return [];
  }
}

/**
 * Records one automatic attempt if the cap allows it. Returns `false` — and
 * records nothing — when the tab has already made
 * `MAX_AUTOMATIC_SIGN_IN_ATTEMPTS` inside the window, i.e. the caller must
 * stop and show an error instead of navigating.
 */
export function recordAutomaticSignInAttempt(now: number = Date.now()): boolean {
  const attempts = readAttempts(now);
  if (attempts.length >= MAX_AUTOMATIC_SIGN_IN_ATTEMPTS) return false;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...attempts, now]));
  } catch {
    // Storage unusable: no cap, see the module comment.
  }
  return true;
}

/** Forgets every recorded attempt (a session was seen, or the user retried). */
export function clearSignInAttempts(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear if storage is unusable.
  }
}

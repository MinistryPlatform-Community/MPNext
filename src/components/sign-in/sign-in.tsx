"use client";

import { useEffect, useRef, Suspense } from "react";
import { authClient } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";

// C0 controls, DEL and C1 controls. The WHATWG URL parser silently STRIPS tab,
// LF and CR from anywhere in the input before it parses — i.e. AFTER every
// string check below has run. So `/\t/evil.example` (from
// `?callbackUrl=/%09/evil.example`) passes a `startsWith("//")` test and then
// navigates as `//evil.example`: off-site. Refusing all control characters
// closes that and any other parser-stripped variant in one rule.
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/;
// A percent-encoded `/` or `\` in the PATH can be decoded by a router or proxy
// downstream into a real separator (`/%2F/evil` -> `//evil`). Only the path is
// checked: `%2F` in a query string or fragment is ordinary data.
const ENCODED_SEPARATOR = /%2f|%5c/i;
// A throwaway base for the final resolution check. `.invalid` is reserved
// (RFC 2606), so it can never collide with a real origin.
const SENTINEL = "https://sentinel.invalid";

/**
 * Reduces a `callbackUrl` query parameter to a safe, same-origin destination.
 *
 * F3 (2026-09-12): the raw parameter was assigned straight to
 * `window.location.href` for an already-signed-in visitor, which made /signin an
 * open redirect — `?callbackUrl=https://evil.example` sent the user off-site
 * from a URL that looks like this app's own login. Only a relative path rooted
 * at `/` is honored; everything else falls back to `/`.
 *
 * The rules deliberately mirror better-auth's server-side `isSafeRelativeURL`
 * (`better-auth/dist/auth/trusted-origins.mjs`), which already refuses these
 * values as a `callbackURL` on the signed-out path. The signed-in path is a
 * bare `location.href` assignment with no server in the loop, so this function
 * is the ONLY check there — and client and server should agree on what "safe"
 * means, or a URL that one accepts and the other rejects strands the user.
 *
 * Exported for direct unit testing only; the barrel exports just `SignIn`.
 */
export function sanitizeCallbackUrl(raw: string | null | undefined): string {
  if (typeof raw !== "string" || !raw.startsWith("/")) return "/";
  // `//evil` is protocol-relative (another origin). ANY backslash is refused,
  // not just a leading `/\`: special-scheme URLs treat `\` as `/`, so `/\evil`
  // becomes `//evil`, and a backslash has no legitimate use in our paths.
  if (raw.startsWith("//") || raw.includes("\\") || CONTROL_CHARS.test(raw)) return "/";
  const pathEnd = raw.search(/[?#]/);
  if (ENCODED_SEPARATOR.test(pathEnd === -1 ? raw : raw.slice(0, pathEnd))) return "/";
  // Backstop: let the real URL parser resolve it and insist it stays on our
  // origin. After the checks above no input is known to fail this, but it is
  // what guards us if a browser's parser ever diverges from the string rules.
  try {
    if (new URL(raw, SENTINEL).origin !== SENTINEL) return "/";
  } catch {
    return "/";
  }
  // Return the RAW value, never the `new URL()`-normalized form: dot-segment
  // removal turns `/.//evil.com` into the pathname `//evil.com`, which would
  // itself be a protocol-relative redirect. Raw `/.//evil.com` resolves safely
  // to this origin's `//evil.com` path.
  return raw;
}

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = sanitizeCallbackUrl(searchParams?.get("callbackUrl"));
  // Guards against starting a second OAuth flow. A ref, checked and set
  // SYNCHRONOUSLY before the first await, is the only thing that works here.
  //
  // The previous guard was `useState` read inside the `getSession()` callback,
  // with the state in the effect's own dep array. That cannot hold: React
  // StrictMode double-invokes effects in dev, both runs reach the async
  // callback before either `setIsRedirecting(true)` has landed, and both
  // captured `isRedirecting === false` in their closure — so both called
  // `signIn.social()`. The server log showed two `POST /api/auth/sign-in/social`
  // on every single sign-in attempt.
  //
  // That is not cosmetic. Each call mints its own state + id_token nonce and
  // OVERWRITES the single `oauth_state` cookie better-auth keys the callback
  // on (`storeStateStrategy: "cookie"`), so the two flows race and only the
  // last cookie written can validate. Sign-in failed intermittently with
  // `unable_to_get_user_info` — better-auth rejecting the id_token because the
  // nonce it expected belonged to the other flow.
  //
  // A ref survives StrictMode's mount/unmount/remount (same component
  // instance), so the second effect run returns before touching the network.
  const signInStartedRef = useRef(false);

  useEffect(() => {
    if (signInStartedRef.current) return;
    signInStartedRef.current = true;

    // Check if user is already signed in
    authClient.getSession().then(({ data: session }) => {
      if (session) {
        // User is already signed in, redirect to callback URL
        window.location.href = callbackUrl;
      } else {
        // User is not signed in, initiate sign in
        // better-auth 1.7 routes generic OAuth providers through the standard
        // social sign-in path; `signIn.oauth2()` was removed.
        authClient.signIn.social({
          provider: "ministry-platform",
          callbackURL: callbackUrl,
        });
      }
    });
  }, [callbackUrl]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Redirecting to sign in...</h2>
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
      </div>
    </div>
  );
}

function SignInFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Loading...</h2>
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
      </div>
    </div>
  );
}

/**
 * The whole body of the /signin route.
 *
 * It lives here rather than in `src/app/signin/page.tsx` because of F9: route
 * segment config such as `export const dynamic` is ignored in a file marked
 * "use client", so the page was still being prerendered at build time and
 * therefore rendering without a CSP nonce. Keeping the client code in its own
 * module lets the route file be a server component that can opt out of
 * prerendering. See the comment in that file.
 */
export function SignIn() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInContent />
    </Suspense>
  );
}

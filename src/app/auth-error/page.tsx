import Link from "next/link";

/**
 * Our own landing page for a failed Ministry Platform OAuth sign-in.
 *
 * better-auth's OAuth callback (node_modules/better-auth/dist/api/routes/
 * callback.mjs, oauth2/link-account.mjs) redirects every callback failure to
 * `onAPIError.errorURL` (set to "/auth-error" in src/lib/auth.ts) with the
 * machine-readable failure as a query parameter: `?error=<code>` and,
 * sometimes, `&error_description=<text>`. Previously this landed on
 * better-auth's own built-in `/api/auth/error` page, which the route allowlist
 * in src/app/api/auth/[...all]/route.ts now closes (it isn't in
 * `allowedAuthRoutes`), so this app needs somewhere for those failures to go.
 *
 * Deliberately no auto-redirect back into the OAuth flow: a failing OAuth
 * loop (bad MP config, revoked client, ...) must land somewhere stable that a
 * human can read, not bounce the user straight back into the same failure.
 *
 * `error_description` is NEVER rendered. It's better-auth/provider-controlled
 * text, not something this app validates, so only the short `error` CODE is
 * ever shown. `?error=` is attacker-controlled too (anyone can link here, or
 * chain it through `/signin?callbackUrl=/auth-error?error=...` so it lands
 * after a genuine MP login), so the code is echoed only when it is one of the
 * codes mapped below or at least *looks* like a machine code
 * (`CODE_SHAPE`: lowercase letters, digits and `_`, at most 64 characters —
 * a future better-auth code still shows up for support). Anything else —
 * free text such as "Your account is locked. Call 555-0100" — gets the
 * generic message with no raw value echoed at all, so the page can't be used
 * to put arbitrary prose on this app's own origin.
 *
 * Lives outside the (web) route group, like src/app/session-error/page.tsx,
 * so it is not wrapped by AuthWrapper (there is no session yet to check) and
 * `src/proxy.ts` allowlists it as a public path so an unauthenticated visit
 * here doesn't bounce to /signin and restart the OAuth flow that just failed.
 */

// Known better-auth OAuth callback failure codes this app explains in plain
// English. See node_modules/better-auth/dist/oauth2/errors.mjs
// (OAUTH_CALLBACK_ERROR_CODES) and callback.mjs for the full set this app has
// observed; anything not listed here — including a code from a future
// better-auth version — falls back to the generic message below.
const KNOWN_ERROR_MESSAGES: Record<string, string> = {
  // Also what a Ministry Platform blip during the callback looks like (the
  // id_token could not be verified, or userinfo did not answer), so the
  // message invites a retry.
  unable_to_get_user_info:
    "We couldn't read your Ministry Platform account. Please try again in a moment.",
  account_not_linked:
    "This Ministry Platform account isn't linked to an existing sign-in here.",
  email_not_found:
    "Your Ministry Platform account doesn't have an email address on file, which sign-in requires.",
  invalid_code: "Sign-in didn't complete. Please try again.",
  // better-auth's actual code for an expired/missing OAuth state is
  // `state_not_found`; `state_mismatch` is kept as an alias in case a
  // different better-auth version names it that.
  state_not_found: "Sign-in didn't complete. Please try again.",
  state_mismatch: "Sign-in didn't complete. Please try again.",
  nonce_binding_missing: "Sign-in didn't complete. Please try again.",
};

// Shape of a better-auth/OAuth error code. Excludes spaces, punctuation and
// uppercase, so a spoofed sentence can't pass as a "code". Every key of
// KNOWN_ERROR_MESSAGES matches it (the test suite pins that).
const CODE_SHAPE = /^[a-z0-9_]{1,64}$/;

const GENERIC_MESSAGE =
  "Something went wrong signing you in with Ministry Platform. Please try again.";

interface AuthErrorPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AuthErrorPage({
  searchParams,
}: AuthErrorPageProps) {
  const params = await searchParams;
  const rawCode = params.error;
  const code =
    typeof rawCode === "string" && CODE_SHAPE.test(rawCode)
      ? rawCode
      : undefined;
  // hasOwn, not a bare lookup: `?error=constructor` matches CODE_SHAPE and
  // would otherwise pick up Object.prototype.constructor.
  const message =
    code && Object.hasOwn(KNOWN_ERROR_MESSAGES, code)
      ? KNOWN_ERROR_MESSAGES[code]
      : GENERIC_MESSAGE;

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold mb-3">Sign-in didn&apos;t work</h1>
        <p className="text-gray-600 mb-2">{message}</p>
        {code ? (
          <p className="text-gray-400 text-sm mb-6">Error code: {code}</p>
        ) : (
          <div className="mb-6" />
        )}
        <Link
          href="/signin"
          className="inline-flex items-center justify-center rounded-md bg-[#344767] px-5 py-2.5 text-white font-medium hover:bg-[#2d3a5f] focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          Try signing in again
        </Link>
      </div>
    </div>
  );
}

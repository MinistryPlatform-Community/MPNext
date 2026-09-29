import Link from "next/link";

/**
 * Where a tab lands after its session ended.
 *
 * `SessionGuard` (src/components/layout/session-guard.tsx) replaces the
 * location with this page when the client session goes from present to none —
 * sign-out in this tab or another (see src/contexts/sign-out-broadcast.ts), or
 * the session expiring. It used to go to `/signin`, but `/signin` starts OAuth
 * on its own: if the user's Ministry Platform SSO session was still alive, the
 * tab silently signed straight back in, undoing a sign-out on a shared
 * machine. This page therefore starts nothing. The only way back in is a click
 * on "Sign in again".
 *
 * Deliberately static: it reads no session and redirects nowhere, so it works
 * without a session cookie, can never loop, and never triggers the MP `User_ID`
 * lookup that reading a session runs. A visitor who is in fact still signed in
 * (say, they signed in again in another tab) sees the same page; the link
 * takes them to `/signin`, which forwards a signed-in visitor to `/` without
 * starting OAuth.
 *
 * Lives outside the (web) route group, like /auth-error and /session-error, so
 * AuthWrapper does not wrap it, and `src/proxy.ts` allowlists it as a public
 * path so a cookie-less visit is not bounced to `/signin`.
 */
/**
 * Rendered per request, never prerendered (F9).
 *
 * Same reason as `src/app/signin/page.tsx`: the nonce-based CSP in
 * `src/proxy.ts` can only be applied to a page Next renders per request; a
 * prerendered page has no nonce and its framework scripts are blocked.
 */
export const dynamic = "force-dynamic";

export default function SignedOutPage() {
  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold mb-3">You&apos;ve been signed out</h1>
        <p className="text-gray-600 mb-6">
          Your session in this app has ended. Sign in again to keep working.
        </p>
        <Link
          href="/signin"
          className="inline-flex items-center justify-center rounded-md bg-[#344767] px-5 py-2.5 text-white font-medium hover:bg-[#2d3a5f] focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          Sign in again
        </Link>
      </div>
    </div>
  );
}

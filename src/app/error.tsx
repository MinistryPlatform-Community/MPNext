"use client";

import { useEffect } from "react";
import { SignOutButton } from "@/components/user-menu";

const SECONDARY_CLASS =
  "inline-flex items-center justify-center rounded-md border border-gray-300 px-5 py-2.5 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300";

/**
 * Error boundary for the routes that sit OUTSIDE the `(web)` route group —
 * `/signin`, `/session-error` and `/auth-error`.
 *
 * Those pages render without the app shell (no Header, no user menu), so this
 * boundary matches their bare, centred layout rather than the shell card used by
 * `(web)/error.tsx`.
 *
 * These are the recovery routes themselves, which is exactly why they need a
 * boundary: a throw in `/session-error` would otherwise strand a user whose
 * session is already broken, with no way to sign out. It deliberately offers a
 * plain link to `/signin` alongside retry, because on these routes a retry of
 * the same broken state is often not the way out.
 *
 * It also catches anything thrown by the `(web)` shell ABOVE `(web)/error.tsx`
 * — the Header and the layout itself — so it can be showing for a user who is
 * still signed in. "Go to sign in" does not help them: `/signin` sees the
 * session and sends them straight back into the same failure. Hence the
 * sign-out button, so a shared machine can always be signed out from here.
 *
 * Note this does NOT catch errors thrown by the root `layout.tsx` itself —
 * `error.tsx` never wraps the layout of its own segment. That case is
 * `global-error.tsx`.
 */
export default function RootError({
  error,
  retry,
}: {
  // `digest` is set for errors thrown on the server; client-thrown errors have none.
  error: Error & { digest?: string };
  // Next 16 renamed this prop: it is `retry`, not the `reset` of earlier versions.
  retry: () => void;
}) {
  useEffect(() => {
    // Identifiers and shape only — never `error.message`. See the F5 logging
    // policy in .claude/references/auth.md § Logging policy.
    console.error("ui.render.error", {
      boundary: "root",
      name: error.name,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold mb-3">Something went wrong</h1>
        <p className="text-gray-600 mb-6">
          We couldn&apos;t load this page. Try again, or start a new sign-in. If
          this keeps happening, contact your administrator.
        </p>
        {error.digest && (
          <p className="text-gray-600 mb-6 text-sm">
            Reference code: <code className="font-mono">{error.digest}</code>
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => retry()}
            className="inline-flex items-center justify-center rounded-md bg-[#344767] px-5 py-2.5 text-white font-medium hover:bg-[#2d3a5f] focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            Try again
          </button>
          <a
            href="/signin"
            className={SECONDARY_CLASS}
          >
            Go to sign in
          </a>
        </div>
        <div className="mt-4">
          <SignOutButton className={SECONDARY_CLASS} />
        </div>
      </div>
    </div>
  );
}

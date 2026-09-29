"use client";

import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { SignOutButton } from "@/components/user-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Error boundary for the authenticated app shell.
 *
 * Until this file existed the app had no error boundary at all, so a throw in
 * any client component escaped to Next's default global error screen and took
 * the whole page with it. That was not hypothetical: `formatDateTime` in
 * `contact-logs.tsx` threw `RangeError: Invalid time value` on an unparseable
 * `Contact_Date`, and one bad row blanked the entire contact page.
 *
 * Deliberately INSIDE the `(web)` route group. `error.tsx` is wrapped by the
 * layout of its own segment, so the Header — and therefore the avatar, the user
 * menu and sign-out — keep rendering around this card. That is the same reasoning
 * as `/no-access`: a user who hits an error must still be able to leave. An
 * error boundary at `src/app/` would replace the shell instead.
 *
 * The card carries its own sign-out button as well, because the text tells the
 * user to "sign out and back in" and the header's menu is behind an avatar
 * they may not recognise as one.
 */
export default function WebError({
  error,
  retry,
}: {
  // `digest` is set for errors thrown on the server; client-thrown errors have none.
  error: Error & { digest?: string };
  // Next 16 renamed this prop: it is `retry`, not the `reset` of earlier versions.
  // `retry()` re-fetches and re-renders the segment; `reset()` only clears the
  // error state without re-fetching, which is rarely what you want here.
  retry: () => void;
}) {
  useEffect(() => {
    // Identifiers and shape only — never `error.message`. Per the F5 logging
    // policy (.claude/references/auth.md § Logging policy) MP content must not
    // reach a log line, and this boundary sits above components that render
    // pastoral notes, names and emails, so a render error's message is not
    // guaranteed to be content-free the way a controlled catch block's is.
    // `digest` is the join key to the un-redacted server-side log.
    console.error("ui.render.error", {
      boundary: "web",
      name: error.name,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="container mx-auto max-w-2xl p-8 sm:p-20">
      <Card>
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            This part of the page failed to load. Your session is still active.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Trying again will reload just this section. If it keeps failing,
            sign out and back in, or contact your Ministry Platform
            administrator.
          </p>
          {error.digest && (
            <p>
              Reference code: <code className="font-mono">{error.digest}</code>
            </p>
          )}
          <div className="flex flex-wrap items-start gap-3">
            <Button onClick={() => retry()}>Try again</Button>
            <div>
              <SignOutButton className={buttonVariants({ variant: "outline" })} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

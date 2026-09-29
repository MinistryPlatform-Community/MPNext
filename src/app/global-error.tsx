"use client";

import { useEffect, useSyncExternalStore } from "react";

const BUTTON_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "0.375rem",
  border: "none",
  background: "#344767",
  color: "#ffffff",
  fontWeight: 500,
  fontSize: "1rem",
  padding: "0.625rem 1.25rem",
  cursor: "pointer",
} as const;

// Nothing to subscribe to: the store only answers "are we in the browser yet".
const subscribeNever = () => () => {};

/**
 * Last-resort boundary for a failure in the root `layout.tsx` itself.
 *
 * `error.tsx` never wraps the layout of its own segment, so a throw in the root
 * layout escapes both `src/app/error.tsx` and `(web)/error.tsx`. This file is
 * the only thing between that and Next's default error screen. It REPLACES the
 * root layout when active, so it must render its own `<html>` and `<body>`.
 *
 * Three constraints follow from that, all of them load-bearing:
 *
 *  1. It imports nothing from the app — no shadcn components, no providers, no
 *     `globals.css`. Whatever failed may be exactly that code, and per Next's
 *     docs `global-error` does not get the app's global styles anyway.
 *  2. Styling is therefore inline. That is safe here: the CSP set in
 *     `src/proxy.ts` is `style-src 'self' 'unsafe-inline'` with NO nonce
 *     (see .claude/references/security-headers.md), so inline style attributes
 *     are permitted. A nonce-based `style-src` would silently drop all of this.
 *  3. `metadata`/`generateMetadata` exports are not supported in a client
 *     component, so the tab title uses React's `<title>` element instead.
 *  4. It must work WITHOUT JavaScript. Next prerenders this file at build time
 *     (`/_global-error` in the prerender manifest, served as the static 500
 *     page), and a prerender has no request and so no CSP nonce: under the
 *     enforced nonce-based `script-src` its scripts are blocked and it never
 *     hydrates. It cannot opt out — error boundaries must be client
 *     components, which can neither read `headers()` nor honour
 *     `export const dynamic`. So the primary recovery control is a plain
 *     `<a href="/">` (a full reload), and the `retry()` button is rendered
 *     only once hydrated (`useSyncExternalStore`'s server snapshot is
 *     `false`), so the static copy never shows a button that does nothing.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  // Next 16 renamed this prop: it is `retry`, not the `reset` of earlier versions.
  retry: () => void;
}) {
  const hydrated = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

  useEffect(() => {
    // Identifiers and shape only — never `error.message`. See the F5 logging
    // policy in .claude/references/auth.md § Logging policy.
    console.error("ui.render.error", {
      boundary: "global",
      name: error.name,
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          color: "#1f2937",
          background: "#ffffff",
        }}
      >
        <title>Something went wrong</title>
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              margin: "0 0 0.75rem",
            }}
          >
            Something went wrong
          </h1>
          <p style={{ color: "#4b5563", margin: "0 0 1.5rem" }}>
            The application failed to start. Reload the app, and if this keeps
            happening contact your administrator.
          </p>
          {error.digest && (
            <p
              style={{
                color: "#4b5563",
                fontSize: "0.875rem",
                margin: "0 0 1.5rem",
              }}
            >
              Reference code:{" "}
              <code style={{ fontFamily: "ui-monospace, monospace" }}>
                {error.digest}
              </code>
            </p>
          )}
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {/*
              A plain link, not a button: it is the one control that works on
              the prerendered, nonce-less copy of this page (see constraint 4).
              A full navigation also re-runs the root layout from scratch,
              which is what a root-layout failure needs anyway.
            */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- deliberate: <Link> needs hydration, which the static copy of this page never gets */}
            <a href="/" style={{ ...BUTTON_STYLE, textDecoration: "none" }}>
              Reload the app
            </a>
            {hydrated && (
              <button
                type="button"
                onClick={() => retry()}
                style={{
                  ...BUTTON_STYLE,
                  background: "#ffffff",
                  color: "#344767",
                  border: "1px solid #d1d5db",
                }}
              >
                Try again
              </button>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { StrictMode, use } from "react";

/**
 * /signin page tests.
 *
 * This page has no UI to speak of — it is a redirector, and every branch in it
 * is a way to strand the user:
 *
 * - It must pass provider "ministry-platform" to `authClient.signIn.social()`.
 *   better-auth 1.7 removed `signIn.oauth2()` and routes generic OAuth through
 *   the social path; getting the provider id or the method wrong produces a
 *   spinner that never resolves rather than an error.
 * - It must forward `callbackUrl` so a deep link survives the round trip, and
 *   fall back to "/" when the query string is missing (or `useSearchParams()`
 *   itself returns null, which it can during prerender).
 * - An already-signed-in visitor must be bounced to the callback URL instead of
 *   being pushed through OAuth again.
 * - The `isRedirecting` latch must survive the effect re-running (setting the
 *   state re-triggers the effect via its own dep array) or the page fires a
 *   second sign-in mid-navigation.
 * - `callbackUrl` is attacker-controlled and lands in `window.location.href`,
 *   so it must be reduced to a same-origin relative path first (F3,
 *   2026-09-12). The open-redirect cases are covered in their own block below.
 *
 * `authClient` is mocked throughout — no test here may reach a real auth
 * endpoint or the Ministry Platform identity server.
 */

const { mockGetSession, mockSignInSocial, mockUseSearchParams } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockSignInSocial: vi.fn(),
  mockUseSearchParams: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    getSession: mockGetSession,
    signIn: { social: mockSignInSocial },
  },
}));

vi.mock("next/navigation", () => ({
  useSearchParams: mockUseSearchParams,
}));

// Only rendered on the sign-in-loop error screen (covered in
// src/components/sign-in/sign-in.test.tsx); stubbed so this suite never loads
// the real sign-out server action or the server auth config behind it.
vi.mock("@/components/user-menu/sign-out-button", () => ({
  SignOutButton: () => <button type="button">Sign out</button>,
}));

import SignIn from "./page";

/** Builds a stand-in for the ReadonlyURLSearchParams the page reads. */
function searchParams(query: string) {
  return new URLSearchParams(query);
}

describe("/signin page", () => {
  let originalLocation: PropertyDescriptor | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    // The page caps its automatic restarts per tab in sessionStorage; every
    // test here is a fresh visit, so none may inherit another's count.
    window.sessionStorage.clear();
    // The page navigates by assigning window.location.href; jsdom treats that
    // as a real navigation it cannot perform, so swap in a plain object we can
    // assert against.
    originalLocation = Object.getOwnPropertyDescriptor(window, "location");
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: { href: "http://localhost:3000/signin" },
    });
    vi.spyOn(console, "log").mockImplementation(() => {});
    mockUseSearchParams.mockReturnValue(searchParams(""));
    mockGetSession.mockResolvedValue({ data: null });
    mockSignInSocial.mockResolvedValue(undefined);
  });

  afterEach(() => {
    if (originalLocation) {
      Object.defineProperty(window, "location", originalLocation);
    }
    vi.restoreAllMocks();
  });

  it("renders the redirecting state", async () => {
    render(<SignIn />);

    expect(
      screen.getByRole("heading", { name: /redirecting to sign in/i })
    ).toBeInTheDocument();
    await waitFor(() => expect(mockGetSession).toHaveBeenCalled());
  });

  it("starts Ministry Platform OAuth when there is no session", async () => {
    mockUseSearchParams.mockReturnValue(searchParams("callbackUrl=%2Fcontactlookup"));

    render(<SignIn />);

    await waitFor(() => expect(mockSignInSocial).toHaveBeenCalledTimes(1));
    expect(mockSignInSocial).toHaveBeenCalledWith({
      provider: "ministry-platform",
      callbackURL: "/contactlookup",
    });
    expect(window.location.href).toBe("http://localhost:3000/signin");
  });

  it("falls back to / when no callbackUrl query param is present", async () => {
    mockUseSearchParams.mockReturnValue(searchParams(""));

    render(<SignIn />);

    await waitFor(() =>
      expect(mockSignInSocial).toHaveBeenCalledWith({
        provider: "ministry-platform",
        callbackURL: "/",
      })
    );
  });

  it("falls back to / when useSearchParams() returns null", async () => {
    mockUseSearchParams.mockReturnValue(null);

    render(<SignIn />);

    await waitFor(() =>
      expect(mockSignInSocial).toHaveBeenCalledWith({
        provider: "ministry-platform",
        callbackURL: "/",
      })
    );
  });

  it("sends an already-signed-in visitor straight to the callback URL", async () => {
    mockUseSearchParams.mockReturnValue(searchParams("callbackUrl=%2Fcontactlookup%2Fabc"));
    mockGetSession.mockResolvedValue({ data: { user: { id: "ba-1" } } });

    render(<SignIn />);

    await waitFor(() => expect(window.location.href).toBe("/contactlookup/abc"));
    // No second trip through OAuth for a session that already works.
    expect(mockSignInSocial).not.toHaveBeenCalled();
  });

  it("does not start a second sign-in when the effect re-runs", async () => {
    render(<SignIn />);

    // The ref guard is set synchronously on the first run, so a re-run returns
    // before it touches the network at all — getSession included.
    await waitFor(() => expect(mockSignInSocial).toHaveBeenCalledTimes(1));
    expect(mockGetSession).toHaveBeenCalledTimes(1);
  });

  it("starts exactly one OAuth flow under StrictMode's double-invoked effects", async () => {
    // The regression test for the real outage. React StrictMode double-invokes
    // effects in dev, and the old guard — a useState flag read inside the
    // getSession() callback, with the state in the effect's dep array — could
    // not stop it: both runs reached the async callback with `false` captured
    // in their closure, so both called signIn.social(). The server log showed
    // two POST /api/auth/sign-in/social on every attempt.
    //
    // Each call mints its own state and id_token nonce and overwrites the one
    // `oauth_state` cookie better-auth validates the callback against, so the
    // two flows raced and sign-in failed intermittently with
    // `unable_to_get_user_info` — the id_token's nonce belonging to the flow
    // that lost.
    render(
      <StrictMode>
        <SignIn />
      </StrictMode>
    );

    await waitFor(() => expect(mockSignInSocial).toHaveBeenCalledTimes(1));
    expect(mockGetSession).toHaveBeenCalledTimes(1);
  });

  it("shows the loading fallback while the search params are still suspended", () => {
    // useSearchParams() suspends during prerender/streaming; the page wraps its
    // content in <Suspense> precisely so that does not blow up the route.
    const pending = new Promise<void>(() => {});
    mockUseSearchParams.mockImplementation(() => {
      use(pending);
      return searchParams("");
    });

    render(<SignIn />);

    expect(screen.getByRole("heading", { name: /loading/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /redirecting/i })).toBeNull();
    expect(mockGetSession).not.toHaveBeenCalled();
  });

  /**
   * F3 (2026-09-12) — open redirect.
   *
   * `callbackUrl` comes from the query string and was assigned straight to
   * `window.location.href` for an already-signed-in visitor, so a link to
   * `/signin?callbackUrl=https://evil.example` bounced the user off-site from a
   * URL that looks like this app's own login page. Only a relative path rooted
   * at `/` is honored now.
   *
   * Both sinks are asserted, because sanitizing one is not enough: the
   * `location.href` assignment (no server involved at all) and the
   * `callbackURL` handed to `signIn.social` (which better-auth also validates
   * server-side, but defence in depth is the point).
   */
  describe("callbackUrl sanitizing (F3 open redirect)", () => {
    const hostile = [
      ["an absolute https URL", "https://evil.example"],
      ["an absolute http URL", "http://evil.example/path"],
      ["a protocol-relative URL", "//evil.example"],
      // A literal backslash: browsers normalize `/\evil.example` to `//evil.example`.
      ["a backslash-escaped protocol-relative URL", "/\\evil.example"],
      ["a javascript: URL", "javascript:alert(1)"],
      ["a relative path with no leading slash", "evil.example"],
      // The WHATWG URL parser strips tab/LF/CR from anywhere in the input
      // before parsing, so each of these passes a naive `startsWith("//")`
      // check and then navigates as `//evil.example` (or `/\evil.example`).
      ["a tab-split protocol-relative URL", "/\t/evil.example"],
      ["an LF-split protocol-relative URL", "/\n/evil.example"],
      ["a CR-split protocol-relative URL", "/\r/evil.example"],
      ["a tab-split backslash URL", "/\t\\evil.example"],
      ["a double-tab-split protocol-relative URL", "/\t\t/evil.example"],
      ["a path containing NUL", "/ok\u0000"],
      ["a DEL-split protocol-relative URL", "/\u007f/evil.example"],
      // Any backslash, not just a leading `/\` — special schemes read `\` as `/`.
      ["a path with an embedded backslash", "/a\\b"],
      // Encoded separators in the path can be decoded downstream into `//`.
      ["an encoded-slash protocol-relative URL", "/%2F/evil.example"],
      ["an encoded-backslash URL", "/%5Cevil.example"],
    ] as const;

    it.each(hostile)(
      "sends an already-signed-in visitor to / rather than %s",
      async (_label, raw) => {
        mockUseSearchParams.mockReturnValue(
          new URLSearchParams([["callbackUrl", raw]])
        );
        mockGetSession.mockResolvedValue({ data: { user: { id: "ba-1" } } });

        render(<SignIn />);

        await waitFor(() => expect(window.location.href).toBe("/"));
        expect(window.location.href).not.toContain("evil.example");
      }
    );

    it.each(hostile)("never hands %s to signIn.social", async (_label, raw) => {
      mockUseSearchParams.mockReturnValue(
        new URLSearchParams([["callbackUrl", raw]])
      );

      render(<SignIn />);

      await waitFor(() =>
        expect(mockSignInSocial).toHaveBeenCalledWith({
          provider: "ministry-platform",
          callbackURL: "/",
        })
      );
    });

    it("refuses a tab smuggled in through the real query-string decode path", async () => {
      // `%09` is decoded by URLSearchParams to a literal tab — this is exactly
      // the shape an attacker would put in a link.
      mockUseSearchParams.mockReturnValue(
        searchParams("callbackUrl=/%09/evil.example")
      );
      expect(searchParams("callbackUrl=/%09/evil.example").get("callbackUrl")).toBe(
        "/\t/evil.example"
      );
      mockGetSession.mockResolvedValue({ data: { user: { id: "ba-1" } } });

      render(<SignIn />);

      await waitFor(() => expect(window.location.href).toBe("/"));
    });

    it("refuses the same smuggled tab on the signed-out signIn.social path", async () => {
      mockUseSearchParams.mockReturnValue(
        searchParams("callbackUrl=/%09/evil.example")
      );

      render(<SignIn />);

      await waitFor(() =>
        expect(mockSignInSocial).toHaveBeenCalledWith({
          provider: "ministry-platform",
          callbackURL: "/",
        })
      );
    });

    // Legitimate destinations must come through byte-for-byte unchanged — in
    // particular never as the `new URL()`-normalized form, which would turn
    // `/.//evil.com` into the protocol-relative `//evil.com`.
    const benign = [
      "/",
      "/dashboard",
      "/contactlookup?x=1",
      "/contactlookup/abc?tab=logs",
      "/reports?year=2026#top",
      // `//` and encoded separators are only dangerous in the path.
      "/a?x=//evil.com",
      "/a?next=%2F%2Fx",
      // A literal `%09` (three characters), not a decoded tab.
      "/%09/x",
      "/.//evil.com",
    ];

    it.each(benign)(
      "sends an already-signed-in visitor to %s unchanged",
      async (raw) => {
        mockUseSearchParams.mockReturnValue(
          new URLSearchParams([["callbackUrl", raw]])
        );
        mockGetSession.mockResolvedValue({ data: { user: { id: "ba-1" } } });

        render(<SignIn />);

        await waitFor(() => expect(mockGetSession).toHaveBeenCalled());
        await waitFor(() => expect(window.location.href).toBe(raw));
      }
    );

    it.each(benign)("hands %s to signIn.social unchanged", async (raw) => {
      mockUseSearchParams.mockReturnValue(
        new URLSearchParams([["callbackUrl", raw]])
      );

      render(<SignIn />);

      await waitFor(() =>
        expect(mockSignInSocial).toHaveBeenCalledWith({
          provider: "ministry-platform",
          callbackURL: raw,
        })
      );
    });

    it("preserves a legitimate relative path with a query string", async () => {
      mockUseSearchParams.mockReturnValue(
        new URLSearchParams([["callbackUrl", "/contactlookup?x=1"]])
      );

      render(<SignIn />);

      await waitFor(() =>
        expect(mockSignInSocial).toHaveBeenCalledWith({
          provider: "ministry-platform",
          callbackURL: "/contactlookup?x=1",
        })
      );
    });

    it("preserves a legitimate deep link for an already-signed-in visitor", async () => {
      mockUseSearchParams.mockReturnValue(
        new URLSearchParams([["callbackUrl", "/contactlookup/abc?tab=logs"]])
      );
      mockGetSession.mockResolvedValue({ data: { user: { id: "ba-1" } } });

      render(<SignIn />);

      await waitFor(() =>
        expect(window.location.href).toBe("/contactlookup/abc?tab=logs")
      );
    });

    it("treats a bare / as valid", async () => {
      mockUseSearchParams.mockReturnValue(
        new URLSearchParams([["callbackUrl", "/"]])
      );

      render(<SignIn />);

      await waitFor(() =>
        expect(mockSignInSocial).toHaveBeenCalledWith({
          provider: "ministry-platform",
          callbackURL: "/",
        })
      );
    });
  });

  /**
   * F9: /signin must never be prerendered.
   *
   * Two facts are load-bearing together, and both fail silently. The
   * nonce-based CSP in src/proxy.ts can only be stamped onto a page Next
   * renders per request; and route segment config is IGNORED in a module
   * marked "use client" — which is how this route was written before, and why
   * the build output still read "○ /signin" with the export already in place.
   * Putting "use client" back at the top of page.tsx would silently restore
   * prerendering, and an unhydrated /signin is a spinner that never reaches
   * Ministry Platform.
   */
  describe("rendering mode", () => {
    it("opts out of prerendering", async () => {
      const pageModule = await import("./page");

      expect(pageModule.dynamic).toBe("force-dynamic");
    });

    it("keeps the route file a server component, so that opt-out is honored", async () => {
      const { readFile } = await import("node:fs/promises");
      const { join } = await import("node:path");
      const source = await readFile(
        join(process.cwd(), "src", "app", "signin", "page.tsx"),
        "utf-8"
      );

      // The directive at the top of the file, not the phrase — this file's own
      // comments explain why it must not be there.
      expect(source.trimStart()).not.toMatch(/^["']use client["']/);
    });
  });
});

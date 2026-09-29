import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const { mockGetSession, mockSignInSocial } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockSignInSocial: vi.fn(),
}));

// Mocked throughout: nothing here may reach a real auth endpoint.
vi.mock("@/lib/auth-client", () => ({
  authClient: { getSession: mockGetSession, signIn: { social: mockSignInSocial } },
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("callbackUrl=%2Fcontactlookup"),
}));

// The real button calls the sign-out server action; its own behaviour is
// covered in src/components/user-menu/sign-out-button.test.tsx.
vi.mock("@/components/user-menu/sign-out-button", () => ({
  SignOutButton: () => <button type="button">Sign out</button>,
}));

import { sanitizeCallbackUrl, SignIn } from "./sign-in";
import { MAX_AUTOMATIC_SIGN_IN_ATTEMPTS } from "./sign-in-attempts";

/**
 * Direct unit tests for the /signin open-redirect guard (F3).
 *
 * The rendered-page tests in src/app/signin/page.test.tsx prove both sinks
 * (`location.href` and `signIn.social`'s `callbackURL`) receive the sanitized
 * value. These pin the function's rules on their own, including the
 * `new URL()` backstop, which no real input is known to reach once the string
 * checks have run — so it is exercised with a stubbed parser instead.
 *
 * The rules mirror better-auth's server-side `isSafeRelativeURL`
 * (better-auth/dist/auth/trusted-origins.mjs), which is not exported, so the
 * parity is by construction rather than asserted against it here.
 */
describe("sanitizeCallbackUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["an empty string", ""],
    ["a non-string smuggled past the type", 42 as unknown as string],
  ])("returns / for %s", (_label, raw) => {
    expect(sanitizeCallbackUrl(raw)).toBe("/");
  });

  it.each([
    "https://evil.example/",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    // WHATWG strips tab/LF/CR before parsing, after any string check runs.
    "/\t/evil.example",
    "/\n/evil.example",
    "/\r/evil.example",
    "/\t\\evil.example",
    "/\t\t/evil.example",
    "/ok\u0000",
    "/\u007f/evil.example",
    // C1 control range, which better-auth also refuses.
    "/\u0085/evil.example",
    "/a\\b",
    "/%2F/evil.example",
    "/%2f/evil.example",
    "/%5Cevil.example",
    "/%5cevil.example",
  ])("refuses %j", (raw) => {
    expect(sanitizeCallbackUrl(raw)).toBe("/");
  });

  it("refuses the value URLSearchParams decodes from callbackUrl=/%09/evil.example", () => {
    const raw = new URLSearchParams("callbackUrl=/%09/evil.example").get("callbackUrl");

    expect(raw).toBe("/\t/evil.example");
    expect(sanitizeCallbackUrl(raw)).toBe("/");
  });

  it.each([
    "/",
    "/dashboard",
    "/contactlookup?x=1",
    "/contactlookup/abc?tab=logs",
    "/reports?year=2026#top",
    // `//` and encoded separators are only dangerous in the path.
    "/a?x=//evil.com",
    "/a?next=%2F%2Fx",
    "/a#%5C",
    // A literal `%09` (three characters), not a decoded tab.
    "/%09/x",
  ])("passes %j through unchanged", (raw) => {
    expect(sanitizeCallbackUrl(raw)).toBe(raw);
  });

  it("returns /.//evil.com byte-for-byte, never the URL-normalized //evil.com", () => {
    // `new URL("/.//evil.com", base).pathname` is "//evil.com" — returning that
    // would itself be a protocol-relative redirect.
    expect(new URL("/.//evil.com", "https://x.invalid").pathname).toBe("//evil.com");
    expect(sanitizeCallbackUrl("/.//evil.com")).toBe("/.//evil.com");
  });

  describe("URL-parser backstop", () => {
    it("returns / if the parser resolves the value to another origin", () => {
      vi.stubGlobal(
        "URL",
        class {
          origin = "https://evil.example";
        }
      );

      expect(sanitizeCallbackUrl("/dashboard")).toBe("/");
    });

    it("returns / if the parser throws", () => {
      vi.stubGlobal(
        "URL",
        class {
          constructor() {
            throw new TypeError("Invalid URL");
          }
        }
      );

      expect(sanitizeCallbackUrl("/dashboard")).toBe("/");
    });
  });
});

/**
 * Error handling (security-signin-page-swallows-errors, 2026-09-28).
 *
 * Every failure used to be ignored: a `{ error }` from `signIn.social` (429
 * from the rate limiter, 404 PROVIDER_NOT_FOUND when the provider was not
 * registered — before issue #101, whenever OIDC discovery failed at boot) or a
 * failed `getSession()` left a spinner that never resolved, and
 * nothing capped how often the page restarted OAuth by itself.
 */
describe("SignIn error handling", () => {
  let originalLocation: PropertyDescriptor | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    originalLocation = Object.getOwnPropertyDescriptor(window, "location");
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: { href: "http://localhost:3000/signin" },
    });
    mockGetSession.mockResolvedValue({ data: null, error: null });
    mockSignInSocial.mockResolvedValue({ data: { url: "https://mp.example/oauth" }, error: null });
  });

  afterEach(() => {
    if (originalLocation) Object.defineProperty(window, "location", originalLocation);
  });

  it("keeps the redirecting state while a successful sign-in navigates away", async () => {
    render(<SignIn />);

    await waitFor(() => expect(mockSignInSocial).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("heading", { name: /redirecting to sign in/i })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows a rate-limit message on a 429 and makes no further attempt", async () => {
    mockSignInSocial.mockResolvedValue({
      data: null,
      error: { status: 429, statusText: "Too Many Requests" },
    });

    render(<SignIn />);

    expect(await screen.findByRole("heading", { name: /too many sign-in attempts/i })).toBeInTheDocument();
    expect(screen.getByText(/wait a minute/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /redirecting/i })).toBeNull();
    expect(mockSignInSocial).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe("http://localhost:3000/signin");
  });

  it("shows a provider-unavailable message on a 404", async () => {
    mockSignInSocial.mockResolvedValue({ data: null, error: { status: 404 } });

    render(<SignIn />);

    expect(
      await screen.findByRole("heading", { name: /ministry platform sign-in is unavailable/i })
    ).toBeInTheDocument();
  });

  it("recognises PROVIDER_NOT_FOUND by its code even without a status", async () => {
    mockSignInSocial.mockResolvedValue({ data: null, error: { code: "PROVIDER_NOT_FOUND" } });

    render(<SignIn />);

    expect(
      await screen.findByRole("heading", { name: /ministry platform sign-in is unavailable/i })
    ).toBeInTheDocument();
  });

  it("shows a generic start failure for any other sign-in error", async () => {
    mockSignInSocial.mockResolvedValue({ data: null, error: { status: 500 } });

    render(<SignIn />);

    expect(await screen.findByRole("heading", { name: /sign-in couldn't start/i })).toBeInTheDocument();
  });

  it("treats a thrown signIn.social as a start failure, not a spinner", async () => {
    mockSignInSocial.mockRejectedValue(new TypeError("Failed to fetch"));

    render(<SignIn />);

    expect(await screen.findByRole("heading", { name: /sign-in couldn't start/i })).toBeInTheDocument();
  });

  it("reports a failed session read instead of starting OAuth", async () => {
    mockGetSession.mockResolvedValue({ data: null, error: { status: 500 } });

    render(<SignIn />);

    expect(await screen.findByRole("heading", { name: /couldn't check your sign-in/i })).toBeInTheDocument();
    expect(mockSignInSocial).not.toHaveBeenCalled();
  });

  it("reports a rate-limited session read as a rate limit", async () => {
    mockGetSession.mockResolvedValue({ data: null, error: { status: 429 } });

    render(<SignIn />);

    expect(await screen.findByRole("heading", { name: /too many sign-in attempts/i })).toBeInTheDocument();
    expect(mockSignInSocial).not.toHaveBeenCalled();
  });

  it("reports a thrown session read", async () => {
    mockGetSession.mockRejectedValue(new TypeError("Failed to fetch"));

    render(<SignIn />);

    expect(await screen.findByRole("heading", { name: /couldn't check your sign-in/i })).toBeInTheDocument();
    expect(mockSignInSocial).not.toHaveBeenCalled();
  });

  it("tolerates an undefined result from either call", async () => {
    mockGetSession.mockResolvedValue(undefined);
    mockSignInSocial.mockResolvedValue(undefined);

    render(<SignIn />);

    await waitFor(() => expect(mockSignInSocial).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("retries on 'Try again' and clears the error once the retry succeeds", async () => {
    mockSignInSocial
      .mockResolvedValueOnce({ data: null, error: { status: 429 } })
      .mockResolvedValueOnce({ data: { url: "https://mp.example/oauth" }, error: null });

    render(<SignIn />);
    fireEvent.click(await screen.findByRole("button", { name: /try again/i }));

    await waitFor(() => expect(mockSignInSocial).toHaveBeenCalledTimes(2));
    expect(mockGetSession).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("heading", { name: /redirecting to sign in/i })).toBeInTheDocument();
  });

  describe("automatic restart cap", () => {
    it(`stops after ${MAX_AUTOMATIC_SIGN_IN_ATTEMPTS} automatic OAuth starts in one tab`, async () => {
      // Each render is one more return to /signin in the same tab — what a
      // session that can't be read back produces.
      for (let i = 1; i <= MAX_AUTOMATIC_SIGN_IN_ATTEMPTS; i++) {
        const { unmount } = render(<SignIn />);
        await waitFor(() => expect(mockSignInSocial).toHaveBeenCalledTimes(i));
        unmount();
      }

      render(<SignIn />);

      expect(await screen.findByRole("heading", { name: /sign-in isn't completing/i })).toBeInTheDocument();
      expect(mockSignInSocial).toHaveBeenCalledTimes(MAX_AUTOMATIC_SIGN_IN_ATTEMPTS);
      // The loop screen offers a way out: sign out (clears the stuck cookie),
      // and a link to the stable help page.
      expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /more help/i })).toHaveAttribute(
        "href",
        "/auth-error?error=signin_loop"
      );
    });

    it("counts the already-signed-in bounce too", async () => {
      mockGetSession.mockResolvedValue({ data: { user: { id: "ba-1" } }, error: null });

      for (let i = 0; i < MAX_AUTOMATIC_SIGN_IN_ATTEMPTS; i++) {
        const { unmount } = render(<SignIn />);
        await waitFor(() => expect(window.location.href).toBe("/contactlookup"));
        window.location.href = "http://localhost:3000/signin";
        unmount();
      }

      render(<SignIn />);

      expect(await screen.findByRole("heading", { name: /sign-in isn't completing/i })).toBeInTheDocument();
      expect(window.location.href).toBe("http://localhost:3000/signin");
    });

    it("lets the user start again by hand once the cap has stopped the loop", async () => {
      for (let i = 1; i <= MAX_AUTOMATIC_SIGN_IN_ATTEMPTS; i++) {
        const { unmount } = render(<SignIn />);
        await waitFor(() => expect(mockSignInSocial).toHaveBeenCalledTimes(i));
        unmount();
      }
      render(<SignIn />);

      fireEvent.click(await screen.findByRole("button", { name: /try again/i }));

      await waitFor(() =>
        expect(mockSignInSocial).toHaveBeenCalledTimes(MAX_AUTOMATIC_SIGN_IN_ATTEMPTS + 1)
      );
      expect(screen.queryByRole("alert")).toBeNull();
    });

    it("does not show the Sign out control for non-loop errors", async () => {
      mockSignInSocial.mockResolvedValue({ data: null, error: { status: 429 } });

      render(<SignIn />);

      await screen.findByRole("alert");
      expect(screen.queryByRole("button", { name: /sign out/i })).toBeNull();
      expect(screen.queryByRole("link", { name: /more help/i })).toBeNull();
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * /signed-out page tests.
 *
 * `SessionGuard` sends a tab here once its session has ended. The page exists
 * because `/signin` auto-starts OAuth: with the MP SSO session still alive, a
 * tab sent to `/signin` silently signed back in. So the property that matters
 * most is a negative one — rendering this page must never start a sign-in
 * and must never read the session (it has to work with no cookie at all).
 *
 * `@/lib/auth-client` and `@/lib/auth` are mocked only so that an accidental
 * use would be observable; the page should touch neither.
 */

const { mockSignInSocial, mockGetSession, mockServerGetSession } = vi.hoisted(() => ({
  mockSignInSocial: vi.fn(),
  mockGetSession: vi.fn(),
  mockServerGetSession: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: { social: mockSignInSocial },
    getSession: mockGetSession,
    useSession: vi.fn(() => ({ data: null, isPending: false })),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mockServerGetSession } },
}));

import SignedOutPage from "./page";

describe("/signed-out page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("says the user has been signed out", () => {
    render(<SignedOutPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: /you've been signed out/i })
    ).toBeInTheDocument();
  });

  it("offers a plain link back to /signin", () => {
    render(<SignedOutPage />);

    const link = screen.getByRole("link", { name: /sign in again/i });
    expect(link).toHaveAttribute("href", "/signin");
  });

  it("renders without a session and never starts OAuth or reads the session", async () => {
    render(<SignedOutPage />);
    // Let any effect or pending microtask run before asserting the negative.
    await Promise.resolve();

    expect(mockSignInSocial).not.toHaveBeenCalled();
    expect(mockGetSession).not.toHaveBeenCalled();
    expect(mockServerGetSession).not.toHaveBeenCalled();
  });

  it("takes no props, so it cannot depend on a session or query string", () => {
    expect(SignedOutPage.length).toBe(0);
  });

  /**
   * F9: a prerendered page has no CSP nonce, so its framework scripts would be
   * blocked under the enforcing policy.
   */
  it("opts out of prerendering", async () => {
    const pageModule = await import("./page");

    expect(pageModule.dynamic).toBe("force-dynamic");
  });
});

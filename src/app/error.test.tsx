import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

/**
 * Error boundary for the routes outside the `(web)` group — `/signin`,
 * `/session-error`, `/auth-error`.
 *
 * These are the recovery routes, so the escape hatch matters more here than
 * anywhere: a user reaching this boundary may already have a broken session, and
 * a retry of the same broken state is often not the way out. The link to
 * `/signin` is therefore part of the contract, not decoration.
 *
 * Same PII guarantee as the shell boundary: identifiers and shape only, never
 * `error.message`. See .claude/references/auth.md § Logging policy.
 */

const { mockHandleSignOut } = vi.hoisted(() => ({
  mockHandleSignOut: vi.fn(),
}));

// The real action reaches better-auth and MP's logout endpoint.
vi.mock("@/components/user-menu/actions", () => ({
  handleSignOut: mockHandleSignOut,
}));

import RootError from "./error";

describe("root error boundary", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  function renderBoundary(
    overrides: { error?: Error & { digest?: string }; retry?: () => void } = {}
  ) {
    const retry = overrides.retry ?? vi.fn();
    const error = overrides.error ?? new Error("boom");
    render(<RootError error={error} retry={retry} />);
    return { retry, error };
  }

  it("renders the failure heading", () => {
    renderBoundary();

    expect(
      screen.getByRole("heading", { name: /something went wrong/i })
    ).toBeInTheDocument();
  });

  it("calls retry when the user asks to try again", () => {
    const { retry } = renderBoundary();

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("offers a way out to /signin that does not depend on retrying", () => {
    renderBoundary();

    // A plain anchor, not a router push: whatever failed may be the very code a
    // client-side navigation would run.
    const link = screen.getByRole("link", { name: /go to sign in/i });
    expect(link).toHaveAttribute("href", "/signin");
  });

  it("offers sign-out, because a signed-in user can land here too", async () => {
    // This boundary also catches throws from the (web) shell above
    // (web)/error.tsx — the header, the layout — where "Go to sign in" just
    // bounces a still-valid session back into the same failure. Without a
    // sign-out here a shared machine stayed signed in.
    mockHandleSignOut.mockResolvedValue(undefined);
    renderBoundary();

    fireEvent.click(screen.getByRole("button", { name: /^sign out$/i }));

    await waitFor(() => expect(mockHandleSignOut).toHaveBeenCalledTimes(1));
  });

  it("shows the digest when present and omits it otherwise", () => {
    const { unmount } = render(
      <RootError
        error={Object.assign(new Error("boom"), { digest: "deadbeef" })}
        retry={vi.fn()}
      />
    );
    expect(screen.getByText("deadbeef")).toBeInTheDocument();
    unmount();

    renderBoundary();
    expect(screen.queryByText(/reference code/i)).not.toBeInTheDocument();
  });

  it("logs identifiers and shape only, tagged with the root boundary", () => {
    renderBoundary({
      error: Object.assign(new RangeError("boom"), { digest: "deadbeef" }),
    });

    expect(errorSpy).toHaveBeenCalledWith("ui.render.error", {
      boundary: "root",
      name: "RangeError",
      digest: "deadbeef",
    });
  });

  it("never writes the error message to the log", () => {
    renderBoundary({ error: new Error("token abc.def.ghi for jane@example.com") });

    const logged = JSON.stringify(errorSpy.mock.calls);
    expect(logged).not.toContain("jane@example.com");
    expect(logged).not.toContain("abc.def.ghi");
  });
});

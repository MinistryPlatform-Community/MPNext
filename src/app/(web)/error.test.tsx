import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

/**
 * Error boundary for the authenticated shell.
 *
 * Two things here are guarantees rather than details, and each has its own test:
 *
 * 1. The boundary must never log `error.message`. It sits above components that
 *    render pastoral notes, names and emails, so a render error's message is not
 *    guaranteed to be content-free — and the F5 logging policy
 *    (.claude/references/auth.md § Logging policy) forbids MP content reaching a
 *    log line. A future "let's include the message, it helps debugging" change
 *    must fail here.
 * 2. The recovery control must call Next's `retry`. In Next 16 the prop is
 *    `retry`, NOT the `reset` of earlier versions; wiring the button to a
 *    stale-named prop would render fine and silently do nothing, which is the
 *    failure mode this guards.
 */

const { mockHandleSignOut } = vi.hoisted(() => ({
  mockHandleSignOut: vi.fn(),
}));

// The real action reaches better-auth and MP's logout endpoint.
vi.mock("@/components/user-menu/actions", () => ({
  handleSignOut: mockHandleSignOut,
}));

import WebError from "./error";

describe("(web) error boundary", () => {
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
    render(<WebError error={error} retry={retry} />);
    return { retry, error };
  }

  it("tells the user the failure is contained and the session survives", () => {
    renderBoundary();

    // shadcn's CardTitle renders a <div>, not a heading element — the same
    // shape the /no-access page uses — so this matches on text, not role.
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/your session is still active/i)).toBeInTheDocument();
  });

  it("calls retry when the user asks to try again", () => {
    const { retry } = renderBoundary();

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("offers sign-out on the card itself, as its own text advises", async () => {
    mockHandleSignOut.mockResolvedValue(undefined);
    renderBoundary();

    fireEvent.click(screen.getByRole("button", { name: /^sign out$/i }));

    await waitFor(() => expect(mockHandleSignOut).toHaveBeenCalledTimes(1));
  });

  it("shows the digest as a reference code so it can be matched to server logs", () => {
    const error = Object.assign(new Error("boom"), { digest: "abc123def" });
    renderBoundary({ error });

    expect(screen.getByText("abc123def")).toBeInTheDocument();
  });

  it("omits the reference code when there is no digest (client-thrown errors)", () => {
    renderBoundary();

    expect(screen.queryByText(/reference code/i)).not.toBeInTheDocument();
  });

  it("logs identifiers and shape only", () => {
    const error = Object.assign(new TypeError("boom"), { digest: "abc123def" });
    renderBoundary({ error });

    expect(errorSpy).toHaveBeenCalledWith("ui.render.error", {
      boundary: "web",
      name: "TypeError",
      digest: "abc123def",
    });
  });

  it("never writes the error message to the log", () => {
    // The message is the field most likely to carry MP record content.
    const error = new Error("Contact Jane Doe jane@example.com pastoral note");
    renderBoundary({ error });

    const logged = JSON.stringify(errorSpy.mock.calls);
    expect(logged).not.toContain("Jane Doe");
    expect(logged).not.toContain("jane@example.com");
    expect(logged).not.toContain("pastoral note");
  });

  it("does not render the error message to the page either", () => {
    renderBoundary({
      error: new Error("Contact Jane Doe jane@example.com pastoral note"),
    });

    expect(screen.queryByText(/jane@example\.com/i)).not.toBeInTheDocument();
  });
});

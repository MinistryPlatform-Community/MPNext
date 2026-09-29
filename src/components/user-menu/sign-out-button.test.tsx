import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { redirect } from "next/navigation";

/**
 * SignOutButton / signOutEverywhere tests.
 *
 * The stand-alone sign-out control used where there is no user menu: the
 * header when the MP profile failed, the error boundaries, and /signin's loop
 * screen (security-no-signout-when-profile-fails). It must:
 *
 *  - call the sign-out server action,
 *  - tell other tabs (security-shared-device-session-persistence),
 *  - let Next's NEXT_REDIRECT signal through — `handleSignOut` ends in
 *    `redirect()` and Next rejects the client-side action promise with it, so
 *    swallowing it would turn every successful sign-out into an error,
 *  - and show a genuine failure on screen instead of dropping it.
 *
 * `./actions` is mocked (the real one reaches better-auth and MP's logout).
 * `next/navigation` is NOT mocked: `unstable_rethrow` must see Next's real
 * signal shape.
 */

const { mockHandleSignOut, mockBroadcastSignOut } = vi.hoisted(() => ({
  mockHandleSignOut: vi.fn(),
  mockBroadcastSignOut: vi.fn(),
}));

vi.mock("./actions", () => ({
  handleSignOut: mockHandleSignOut,
}));

vi.mock("@/contexts/sign-out-broadcast", () => ({
  broadcastSignOut: mockBroadcastSignOut,
}));

import { SignOutButton, signOutEverywhere } from "./sign-out-button";

function redirectSignal(): unknown {
  try {
    redirect("https://mp.example.org/oauth/connect/endsession");
  } catch (err) {
    return err;
  }
  throw new Error("redirect() did not throw");
}

describe("signOutEverywhere", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("signs out, broadcasts, and returns null on success", async () => {
    mockHandleSignOut.mockResolvedValue(undefined);

    await expect(signOutEverywhere()).resolves.toBeNull();
    expect(mockHandleSignOut).toHaveBeenCalledTimes(1);
    expect(mockBroadcastSignOut).toHaveBeenCalledTimes(1);
  });

  it("re-throws Next's redirect signal, still broadcasting first", async () => {
    const signal = redirectSignal();
    mockHandleSignOut.mockRejectedValue(signal);

    await expect(signOutEverywhere()).rejects.toBe(signal);
    expect(mockBroadcastSignOut).toHaveBeenCalledTimes(1);
  });

  it("returns the message of a genuine failure (the session is already cleared)", async () => {
    mockHandleSignOut.mockRejectedValue(new Error("OIDC_CLIENT_ID is not configured"));

    await expect(signOutEverywhere()).resolves.toBe("OIDC_CLIENT_ID is not configured");
    expect(mockBroadcastSignOut).toHaveBeenCalledTimes(1);
  });

  it("falls back to a generic message for a non-Error rejection", async () => {
    mockHandleSignOut.mockRejectedValue("socket hang up");

    await expect(signOutEverywhere()).resolves.toBe("Sign out failed");
  });
});

describe("SignOutButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a labelled button with the caller's class", () => {
    render(<SignOutButton className="my-class" />);

    const button = screen.getByRole("button", { name: "Sign out" });
    expect(button).toHaveClass("my-class");
    expect(mockHandleSignOut).not.toHaveBeenCalled();
  });

  it("accepts a custom label", () => {
    render(<SignOutButton label="Sign out and start over" />);

    expect(screen.getByRole("button", { name: "Sign out and start over" })).toBeInTheDocument();
  });

  it("signs out on click and shows progress while the action runs", async () => {
    let finish!: () => void;
    mockHandleSignOut.mockReturnValue(
      new Promise<void>((resolve) => {
        finish = resolve;
      })
    );
    render(<SignOutButton />);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    const pending = await screen.findByRole("button", { name: "Signing out..." });
    expect(pending).toBeDisabled();
    expect(mockHandleSignOut).toHaveBeenCalledTimes(1);

    finish();
    await waitFor(() => expect(screen.getByRole("button", { name: "Sign out" })).toBeEnabled());
    expect(screen.queryByRole("alert")).toBeNull();
    expect(mockBroadcastSignOut).toHaveBeenCalledTimes(1);
  });

  it("shows a genuine failure on screen", async () => {
    mockHandleSignOut.mockRejectedValue(new Error("network down"));
    render(<SignOutButton />);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Sign out failed: network down");
    expect(screen.getByRole("button", { name: "Sign out" })).toBeEnabled();
  });

  it("clears a previous failure when tried again", async () => {
    mockHandleSignOut
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce(undefined);
    render(<SignOutButton />);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    expect(mockHandleSignOut).toHaveBeenCalledTimes(2);
  });
});

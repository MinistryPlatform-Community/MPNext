import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * /auth-error page tests.
 *
 * better-auth's OAuth callback redirects failures here with `?error=<code>`
 * and, sometimes, `&error_description=<text>` (see the comment on
 * `onAPIError` in src/lib/auth.ts). The page is an async server component
 * that awaits `searchParams` (Next.js 16), so it's rendered directly by
 * calling the function and awaiting the JSX it returns, per the async-page
 * pattern used elsewhere in this repo (see contactlookup/[guid]/page.test.tsx).
 */

import AuthErrorPage from "./page";

async function renderWithParams(params: Record<string, string | undefined>) {
  const jsx = await AuthErrorPage({ searchParams: Promise.resolve(params) });
  render(jsx);
}

describe("/auth-error page", () => {
  it("maps a known code to its plain-English message", async () => {
    await renderWithParams({ error: "unable_to_get_user_info" });

    expect(
      screen.getByText(/couldn't read your Ministry Platform account/i),
    ).toBeInTheDocument();
  });

  it("maps account_not_linked to its plain-English message", async () => {
    await renderWithParams({ error: "account_not_linked" });

    expect(
      screen.getByText(/isn't linked to an existing sign-in/i),
    ).toBeInTheDocument();
  });

  it("falls back to the generic message for an unrecognized code", async () => {
    await renderWithParams({ error: "some_future_better_auth_code" });

    expect(
      screen.getByText(/something went wrong signing you in/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/couldn't read your Ministry Platform account/i),
    ).not.toBeInTheDocument();
  });

  it("falls back to the generic message when no code is present", async () => {
    await renderWithParams({});

    expect(
      screen.getByText(/something went wrong signing you in/i),
    ).toBeInTheDocument();
  });

  it("always offers a sign-in link", async () => {
    await renderWithParams({ error: "unable_to_get_user_info" });

    const link = screen.getByRole("link", { name: /try signing in again/i });
    expect(link).toHaveAttribute("href", "/signin");
  });

  it("offers the sign-in link even with no error code", async () => {
    await renderWithParams({});

    expect(
      screen.getByRole("link", { name: /try signing in again/i }),
    ).toHaveAttribute("href", "/signin");
  });

  it("never renders error_description content", async () => {
    await renderWithParams({
      error: "unable_to_get_user_info",
      error_description: "SUPER_SECRET_RAW_DESCRIPTION_TEXT",
    });

    expect(
      screen.queryByText(/SUPER_SECRET_RAW_DESCRIPTION_TEXT/),
    ).not.toBeInTheDocument();
  });

  it("echoes a code-shaped but unrecognized code for support", async () => {
    await renderWithParams({ error: "some_future_better_auth_code" });

    expect(
      screen.getByText("Error code: some_future_better_auth_code"),
    ).toBeInTheDocument();
  });

  it.each([
    "unable_to_get_user_info",
    "account_not_linked",
    "email_not_found",
    "invalid_code",
    "state_not_found",
    "state_mismatch",
    "nonce_binding_missing",
  ])("shows the known code %s alongside its message", async (known) => {
    await renderWithParams({ error: known });

    expect(screen.getByText(`Error code: ${known}`)).toBeInTheDocument();
    expect(
      screen.queryByText(/something went wrong signing you in/i),
    ).not.toBeInTheDocument();
  });

  it.each([
    ["free text", "Your account is locked. Call 555-0100"],
    ["short free text", "Call 555"],
    ["uppercase", "STATE_MISMATCH"],
    ["punctuation", "state-mismatch"],
    ["over 64 characters", "a".repeat(65)],
    ["a 5,000-character message", "x ".repeat(2554)],
    ["an empty string", ""],
  ])("does not echo %s as an error code", async (_label, spoof) => {
    await renderWithParams({ error: spoof });

    expect(screen.queryByText(/Error code/)).not.toBeInTheDocument();
    if (spoof.trim()) {
      expect(screen.queryByText(spoof, { exact: false })).not.toBeInTheDocument();
    }
    expect(
      screen.getByText(/something went wrong signing you in/i),
    ).toBeInTheDocument();
  });

  it("does not echo a repeated ?error= (array value)", async () => {
    const jsx = await AuthErrorPage({
      searchParams: Promise.resolve({ error: ["state_mismatch", "Call 555"] }),
    });
    render(jsx);

    expect(screen.queryByText(/Error code/)).not.toBeInTheDocument();
  });

  it("does not resolve Object.prototype members as known messages", async () => {
    await renderWithParams({ error: "constructor" });

    expect(
      screen.getByText(/something went wrong signing you in/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Error code: constructor")).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { redirect } from "next/navigation";
import type { MPUserProfile } from "@/lib/providers/ministry-platform/types";

/**
 * UserMenu component tests.
 *
 * This dropdown is the application's only sign-out affordance. `AuthWrapper`
 * sends a session that is authenticated but missing `userGuid` to
 * /session-error precisely so the user still reaches a sign-out control — if
 * this menu stops opening, or its item stops invoking the action, a user with a
 * broken session is stranded in the app with no way out and no error on screen.
 * See `src/components/layout/auth-wrapper.test.tsx`.
 *
 * What is guarded here:
 *  1. the menu actually opens from the caller-supplied trigger (Radix `asChild`
 *     means a wrong child element silently yields an unopenable menu);
 *  2. selecting "Sign out" calls the server action exactly once, and calls
 *     `onClose` *before* it, so the parent's drawer/sidebar is not left open
 *     across the navigation the action performs;
 *  3. the identity header degrades safely — MP returns `Nickname` and
 *     `Email_Address` as optional/null, and this label is rendered from raw
 *     profile fields with no guard beyond the `||` fallback;
 *  4. a rejected sign-out is reported to the user via `alert` and does not
 *     escape as an unhandled rejection — while Next's own NEXT_REDIRECT signal
 *     is re-thrown untouched, so the happy path stays silent.
 *
 * On (4): `handleSignOut` ends in `redirect()`, which Next implements by
 * throwing. In Next 16 that reaches the client too — the app router's
 * server-action reducer deliberately *rejects* the action promise with a
 * redirect error (`router-reducer/reducers/server-action-reducer.js`, "the
 * action promise will be rejected with a redirect so that it's handled by
 * RedirectBoundary"). So a bare try/catch around `handleSignOut()` would alert
 * on every *successful* sign-out. `unstable_rethrow` is what separates the two,
 * and the tests below pin both halves: a real failure alerts, a redirect signal
 * does not.
 *
 * `./actions` is mocked in full: the real `handleSignOut` hits Better Auth and
 * redirects to Ministry Platform's end-session endpoint. It is covered
 * separately in `actions.test.ts`. `next/navigation` is deliberately NOT
 * mocked — `unstable_rethrow`'s whole job is recognising Next's real signal
 * shape, so a mock would test the mock.
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

import { UserMenu } from "./user-menu";

// Radix primitives need a few browser APIs jsdom does not implement. Without
// these, DropdownMenu throws on mount rather than failing an assertion, which
// makes every test below look like a component bug.
function installJsdomPolyfills() {
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
  const proto = Element.prototype as unknown as Record<string, unknown>;
  proto.hasPointerCapture ??= () => false;
  proto.setPointerCapture ??= () => {};
  proto.releasePointerCapture ??= () => {};
  proto.scrollIntoView ??= () => {};
}

/**
 * Builds the exact object Next rejects a server action with when that action
 * called `redirect()`. Constructed by letting Next's own `redirect()` throw
 * rather than hand-rolling a digest string, so this fixture cannot drift from
 * the framework: the client reducer takes that same `getRedirectError(...)`
 * value and only sets `handled` on it before rejecting.
 */
function makeRedirectSignal(destination: string): unknown {
  try {
    redirect(destination);
  } catch (err) {
    (err as { handled?: boolean }).handled = true;
    return err;
  }
  throw new Error(
    "next/navigation's redirect() did not throw — the control-flow signal this component guards against has changed shape"
  );
}

/**
 * Runs `run()` with Node's unhandled-rejection reporting diverted into an array
 * and returns what was collected.
 *
 * Note this is the inverse of what it was used for before the fix: it used to
 * hide an escaping rejection so the broken behavior could be pinned without
 * failing the run. Now it is an assertion target — genuine failures must
 * collect *nothing* (they are caught and alerted), and a NEXT_REDIRECT signal
 * must collect *itself* (proving it was re-thrown, not swallowed).
 */
async function captureUnhandledRejections(
  run: () => Promise<void>
): Promise<unknown[]> {
  const captured: unknown[] = [];
  const priorListeners = process.listeners("unhandledRejection");
  process.removeAllListeners("unhandledRejection");
  process.on("unhandledRejection", (reason) => captured.push(reason));

  try {
    await run();
    // Node reports an unhandled rejection only once the microtask queue has
    // drained and the promise is still unhandled; yield the macrotask turns
    // that takes before reading the result.
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
    return captured;
  } finally {
    process.removeAllListeners("unhandledRejection");
    for (const listener of priorListeners) {
      process.on(
        "unhandledRejection",
        listener as NodeJS.UnhandledRejectionListener
      );
    }
  }
}

const profile: MPUserProfile = {
  User_ID: 7,
  User_GUID: "ab12cd34-ef56-7890-abcd-ef1234567890",
  Contact_ID: 42,
  First_Name: "Samuel",
  Nickname: "Sam",
  Last_Name: "Ortiz",
  Email_Address: "sam@example.com",
  Mobile_Phone: "555-0100",
  Image_GUID: null,
  roles: ["Administrators"],
  userGroups: [],
};

function renderMenu(
  overrides: {
    userProfile?: MPUserProfile | null;
    onClose?: () => void;
    children?: React.ReactNode;
  } = {}
) {
  const {
    userProfile = profile,
    onClose,
    // The real caller passes an avatar button. UserMenu itself renders no
    // avatar — it only wraps whatever trigger the parent supplies — so the
    // initials-vs-image fallback is exercised here as "whatever child we are
    // given becomes the trigger".
    children = <button type="button">Open user menu</button>,
  } = overrides;

  return render(
    <UserMenu userProfile={userProfile} onClose={onClose}>
      {children}
    </UserMenu>
  );
}

/** Opens the dropdown and returns its menu scope. */
async function openMenu(
  overrides: Parameters<typeof renderMenu>[0] = {},
  triggerName: RegExp = /open user menu/i
) {
  renderMenu(overrides);
  const trigger = screen.getByRole("button", { name: triggerName });
  // Radix opens on pointerdown (primary button), not click.
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
  return within(await screen.findByRole("menu"));
}

describe("UserMenu", () => {
  let alertSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    installJsdomPolyfills();
    vi.clearAllMocks();
    mockHandleSignOut.mockResolvedValue(undefined);
    // jsdom's window.alert only logs "not implemented"; stub it so the calls are
    // assertable (and so a regression cannot spam the test output).
    alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("opening", () => {
    it("renders the supplied child as the trigger and nothing else until opened", () => {
      renderMenu();

      expect(
        screen.getByRole("button", { name: /open user menu/i })
      ).toBeInTheDocument();
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      expect(screen.queryByText("Sign out")).not.toBeInTheDocument();
    });

    it("opens on trigger activation and shows the identity header and Sign out", async () => {
      const menu = await openMenu();

      expect(menu.getByText("Sam Ortiz")).toBeInTheDocument();
      expect(menu.getByText("sam@example.com")).toBeInTheDocument();
      expect(menu.getByRole("menuitem", { name: /sign out/i })).toBeInTheDocument();
    });

    it("opens from a non-button trigger, since the parent passes an avatar", async () => {
      const menu = await openMenu(
        {
          children: (
            <span role="button" tabIndex={0}>
              SO
            </span>
          ),
        },
        /^SO$/
      );

      expect(menu.getByRole("menuitem", { name: /sign out/i })).toBeInTheDocument();
    });

    it("offers exactly one menu item, so no unlabelled action can be clicked by accident", async () => {
      const menu = await openMenu();

      expect(menu.getAllByRole("menuitem")).toHaveLength(1);
    });
  });

  describe("sign out", () => {
    it("calls handleSignOut once when the item is selected", async () => {
      const menu = await openMenu();

      fireEvent.click(menu.getByRole("menuitem", { name: /sign out/i }));

      await waitFor(() => expect(mockHandleSignOut).toHaveBeenCalledTimes(1));
      expect(mockHandleSignOut).toHaveBeenCalledWith();
    });

    it("closes the parent shell before invoking the action", async () => {
      const order: string[] = [];
      const onClose = vi.fn(() => {
        order.push("onClose");
      });
      mockHandleSignOut.mockImplementation(async () => {
        order.push("handleSignOut");
      });

      const menu = await openMenu({ onClose });
      fireEvent.click(menu.getByRole("menuitem", { name: /sign out/i }));

      await waitFor(() => expect(mockHandleSignOut).toHaveBeenCalledTimes(1));
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(order).toEqual(["onClose", "handleSignOut"]);
    });

    it("signs out without an onClose handler", async () => {
      const menu = await openMenu({ onClose: undefined });

      fireEvent.click(menu.getByRole("menuitem", { name: /sign out/i }));

      await waitFor(() => expect(mockHandleSignOut).toHaveBeenCalledTimes(1));
    });

    it("does not call handleSignOut merely by opening the menu", async () => {
      await openMenu();

      expect(mockHandleSignOut).not.toHaveBeenCalled();
    });

    it("reports a rejected sign-out to the user instead of dropping it", async () => {
      const onClose = vi.fn();
      mockHandleSignOut.mockRejectedValueOnce(new Error("network down"));

      const escaped = await captureUnhandledRejections(async () => {
        const menu = await openMenu({ onClose });
        fireEvent.click(menu.getByRole("menuitem", { name: /sign out/i }));

        await waitFor(() => expect(alertSpy).toHaveBeenCalledTimes(1));
      });

      expect(alertSpy).toHaveBeenCalledWith("Error: network down");
      // The failure is now handled, so nothing escapes to the runtime.
      expect(escaped).toEqual([]);
      // Ordering is unchanged: the shell still closes before the action runs.
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("falls back to a generic message when the rejection is not an Error", async () => {
      // Server actions can reject with a plain serialized value, not only an
      // Error instance — `err.message` would be undefined there.
      mockHandleSignOut.mockRejectedValueOnce("socket hang up");

      const escaped = await captureUnhandledRejections(async () => {
        const menu = await openMenu();
        fireEvent.click(menu.getByRole("menuitem", { name: /sign out/i }));

        await waitFor(() => expect(alertSpy).toHaveBeenCalledTimes(1));
      });

      expect(alertSpy).toHaveBeenCalledWith("Error: Sign out failed");
      expect(escaped).toEqual([]);
    });

    it("stays silent when the sign-out succeeds", async () => {
      mockHandleSignOut.mockResolvedValueOnce(undefined);

      const escaped = await captureUnhandledRejections(async () => {
        const menu = await openMenu();
        fireEvent.click(menu.getByRole("menuitem", { name: /sign out/i }));

        await waitFor(() => expect(mockHandleSignOut).toHaveBeenCalledTimes(1));
      });

      expect(alertSpy).not.toHaveBeenCalled();
      expect(escaped).toEqual([]);
    });

    it("re-throws Next's NEXT_REDIRECT signal rather than alerting on it", async () => {
      // This is the happy path in production: `handleSignOut` ends in
      // `redirect()`, and Next rejects the client-side action promise with this
      // signal. Alerting here would break every successful sign-out.
      const signal = makeRedirectSignal(
        "https://mp.example.org/oauth/connect/endsession?post_logout_redirect_uri=http%3A%2F%2Flocalhost%3A3000"
      );
      // Guard the fixture itself: if Next stops tagging the signal this way the
      // test is no longer exercising what it claims to.
      expect((signal as Error).message).toBe("NEXT_REDIRECT");
      expect((signal as { digest: string }).digest).toMatch(/^NEXT_REDIRECT;/);

      mockHandleSignOut.mockRejectedValueOnce(signal);

      const escaped = await captureUnhandledRejections(async () => {
        const menu = await openMenu();
        fireEvent.click(menu.getByRole("menuitem", { name: /sign out/i }));

        await waitFor(() => expect(mockHandleSignOut).toHaveBeenCalledTimes(1));
      });

      expect(alertSpy).not.toHaveBeenCalled();
      // Re-thrown, not swallowed: it propagates out of the handler untouched so
      // Next's own machinery still owns the navigation.
      expect(escaped).toEqual([signal]);
    });
  });

  describe("identity header fallbacks", () => {
    it("falls back to First_Name when Nickname is absent", async () => {
      const menu = await openMenu({
        userProfile: { ...profile, Nickname: "" },
      });

      expect(menu.getByText("Samuel Ortiz")).toBeInTheDocument();
    });

    it("renders without an email address", async () => {
      const menu = await openMenu({
        userProfile: { ...profile, Email_Address: null },
      });

      expect(menu.getByText("Sam Ortiz")).toBeInTheDocument();
      expect(menu.getByRole("menuitem", { name: /sign out/i })).toBeInTheDocument();
    });

    it("still opens and offers sign out when every name field is empty", async () => {
      const menu = await openMenu({
        userProfile: {
          ...profile,
          First_Name: "",
          Nickname: "",
          Last_Name: "",
          Email_Address: null,
        },
      });

      // The point is that the menu is usable even with a degenerate profile:
      // a user whose profile lookup half-failed must still be able to sign out.
      expect(menu.getByRole("menuitem", { name: /sign out/i })).toBeInTheDocument();

      fireEvent.click(menu.getByRole("menuitem", { name: /sign out/i }));
      await waitFor(() => expect(mockHandleSignOut).toHaveBeenCalledTimes(1));
    });

    it("opens and signs out with no profile at all (the load failed)", async () => {
      const menu = await openMenu({ userProfile: null });

      expect(menu.getByText(/profile couldn.t be loaded/i)).toBeInTheDocument();
      fireEvent.click(menu.getByRole("menuitem", { name: /sign out/i }));
      await waitFor(() => expect(mockHandleSignOut).toHaveBeenCalledTimes(1));
    });
  });

  describe("other tabs", () => {
    it("broadcasts the sign-out once the action has settled", async () => {
      const menu = await openMenu();

      fireEvent.click(menu.getByRole("menuitem", { name: /sign out/i }));

      await waitFor(() => expect(mockBroadcastSignOut).toHaveBeenCalledTimes(1));
      expect(mockHandleSignOut.mock.invocationCallOrder[0]).toBeLessThan(
        mockBroadcastSignOut.mock.invocationCallOrder[0]
      );
    });

    it("broadcasts on the redirecting (successful) path too", async () => {
      mockHandleSignOut.mockRejectedValueOnce(makeRedirectSignal("https://mp.example.org/x"));

      await captureUnhandledRejections(async () => {
        const menu = await openMenu();
        fireEvent.click(menu.getByRole("menuitem", { name: /sign out/i }));
        await waitFor(() => expect(mockBroadcastSignOut).toHaveBeenCalledTimes(1));
      });
    });
  });
});

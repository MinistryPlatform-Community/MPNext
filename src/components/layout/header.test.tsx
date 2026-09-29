import { describe, it, expect, vi, beforeEach } from "vitest";
import { use } from "react";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import type { MPUserProfile } from "@/lib/providers/ministry-platform/types";

/**
 * Header tests.
 *
 * The Header is rendered on every authenticated page and reads from two
 * independent sources that can disagree: `useUser()` (the MP profile, fetched
 * asynchronously) and `useAppSession()` (the Better Auth session). The profile
 * is `null` for the whole first paint, so the risks worth guarding are:
 *
 * 1. It must render — and stay interactive — before the profile arrives. An
 *    unguarded `userProfile.X` here would blank the entire app shell on load.
 * 2. The avatar has two shapes (MP image vs. fallback icon) keyed on
 *    `Image_GUID`, which is null for most contacts. Both are asserted so a
 *    broken image URL never becomes the default experience.
 * 3. The tooltip/title falls back MP name -> session name -> session mpEmail ->
 *    literal "User menu". Each rung is covered: these are exactly the states
 *    seen when the MP profile lookup fails but the session is healthy. The
 *    email rung reads `mpEmail` (the real MP address), never `session.user.email`,
 *    which is a synthetic `<sub>@mp.invalid` value — see `syntheticEmailForSub`
 *    in src/lib/auth.ts.
 * 4. The sidebar is owned here, not by the Sidebar itself. Header holds the
 *    open/close state and renders the backdrop, so opening and both closing
 *    paths are exercised end to end.
 * 5. Only the avatar may suspend on the profile. When the whole header
 *    suspended, its layout-level fallback replaced the fixed bar and shifted
 *    the page 64px on every load; the bar, hamburger and sidebar must stay
 *    rendered while `useUser()` is pending, and HeaderSkeleton (the layout's
 *    safety-net fallback) must keep the same fixed, h-16 shape.
 *
 * The contexts are mocked rather than wrapped in real providers: UserProvider
 * calls a server action that hits Ministry Platform, and nothing in this test
 * file may reach MP. The user-menu server action is mocked for the same reason.
 */

const { mockUseUser, mockUseAppSession, mockHandleSignOut } = vi.hoisted(() => ({
  mockUseUser: vi.fn(),
  mockUseAppSession: vi.fn(),
  mockHandleSignOut: vi.fn(),
}));

vi.mock("@/contexts", () => ({
  useUser: mockUseUser,
  useAppSession: mockUseAppSession,
}));

// UserMenu's sign-out is a server action that calls Better Auth and Ministry
// Platform. Stub it so the real dropdown can render without any network path.
vi.mock("@/components/user-menu/actions", () => ({
  handleSignOut: mockHandleSignOut,
}));

import { Header, HeaderSkeleton } from "./header";

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

const profile: MPUserProfile = {
  User_ID: 7,
  User_GUID: "ab12cd34-ef56-7890-abcd-ef1234567890",
  Contact_ID: 42,
  First_Name: "Sam",
  Nickname: "Sam",
  Last_Name: "Ortiz",
  Email_Address: "sam@example.com",
  Mobile_Phone: null,
  Image_GUID: null,
  roles: [],
  userGroups: [],
};

function setUser(userProfile: MPUserProfile | null) {
  mockUseUser.mockReturnValue({ userProfile, refreshUserProfile: vi.fn() });
}

/** Makes `useUser()` suspend, as it does while the profile is in flight. */
function setUserPending() {
  const never = new Promise<never>(() => {});
  mockUseUser.mockImplementation(() => use(never));
}

function setSession(session: unknown) {
  mockUseAppSession.mockReturnValue(session);
}

/** The avatar button, which is the DropdownMenu trigger when signed in. */
function avatarButton() {
  return screen.getByRole("button", { name: "User menu" });
}

/** Radix opens on pointerdown, not click. */
function openMenu(trigger: HTMLElement) {
  fireEvent.pointerDown(
    trigger,
    new MouseEvent("pointerdown", { bubbles: true, button: 0 })
  );
  fireEvent.click(trigger);
}

describe("Header", () => {
  beforeEach(() => {
    installJsdomPolyfills();
    vi.clearAllMocks();
    vi.stubEnv(
      "NEXT_PUBLIC_MINISTRY_PLATFORM_FILE_URL",
      "https://files.example.com"
    );
    setUser(null);
    setSession(null);
  });

  describe("app title", () => {
    it("falls back to 'MPNext' when NEXT_PUBLIC_APP_NAME is unset", () => {
      vi.stubEnv("NEXT_PUBLIC_APP_NAME", "");
      render(<Header />);

      expect(
        screen.getByRole("heading", { name: "MPNext" })
      ).toBeInTheDocument();
    });

    it("uses NEXT_PUBLIC_APP_NAME when configured", () => {
      vi.stubEnv("NEXT_PUBLIC_APP_NAME", "Grace Church Portal");
      render(<Header />);

      expect(
        screen.getByRole("heading", { name: "Grace Church Portal" })
      ).toBeInTheDocument();
    });
  });

  // `null` is what `useUser()` yields when MP has no profile for the user
  // (`getCurrentUserProfile` returned undefined) AND — since UserProvider now
  // catches the rejection — when the profile load failed outright.
  describe("when there is no MP profile", () => {
    it("renders the shell with an avatar button and no MP image", () => {
      setUser(null);
      render(<Header />);

      expect(
        screen.getByRole("button", { name: "Open menu" })
      ).toBeInTheDocument();
      expect(avatarButton()).toBeInTheDocument();
      // No MP image is attempted without a profile.
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });

    it("still opens a menu that offers sign-out (security-no-signout-when-profile-fails)", async () => {
      // This used to render a bare, menu-less avatar: a user whose profile
      // failed had no sign-out control anywhere on screen.
      setUser(null);
      setSession({ user: { name: "Sam Ortiz" } });
      render(<Header />);

      openMenu(avatarButton());

      const menu = await screen.findByRole("menu");
      expect(
        within(menu).getByText(/profile couldn.t be loaded/i)
      ).toBeInTheDocument();
      fireEvent.click(within(menu).getByRole("menuitem", { name: /sign out/i }));
      await waitFor(() => expect(mockHandleSignOut).toHaveBeenCalledTimes(1));
    });

    it("offers sign-out even before the client session has loaded", async () => {
      // The header only renders behind AuthWrapper, so a session exists even
      // while `useAppSession()` is still null.
      setUser(null);
      setSession(null);
      render(<Header />);

      openMenu(avatarButton());

      const menu = await screen.findByRole("menu");
      expect(
        within(menu).getByRole("menuitem", { name: /sign out/i })
      ).toBeInTheDocument();
    });

    it("survives a session that exists before the profile does", () => {
      setUser(null);
      setSession({ user: { name: "Sam Ortiz", email: "sam@example.com" } });
      render(<Header />);

      expect(avatarButton()).toBeInTheDocument();
    });
  });

  describe("while useUser() is suspended", () => {
    it("keeps the fixed bar, hamburger and title on screen", () => {
      vi.stubEnv("NEXT_PUBLIC_APP_NAME", "");
      setUserPending();
      render(<Header />);

      const header = screen.getByRole("banner");
      expect(header.className).toContain("fixed");
      expect(
        screen.getByRole("button", { name: "Open menu" })
      ).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "MPNext" })).toBeInTheDocument();
    });

    it("shows a same-size placeholder in the avatar slot", () => {
      setUserPending();
      render(<Header />);

      const button = avatarButton();
      expect(button.className).toContain("p-1");
      expect(button.querySelector("svg.h-8.w-8")).not.toBeNull();
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });

    it("keeps the sidebar usable", async () => {
      // Outside act(): inside it, React holds every commit until the pending
      // profile settles — which this one never does — so the click would never
      // land. A browser commits it, and that is the behaviour under test.
      const env = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
      env.IS_REACT_ACT_ENVIRONMENT = false;
      try {
        setUserPending();
        const { container } = render(<Header />);
        const hamburger = await screen.findByRole("button", { name: "Open menu" });
        const panel = container.querySelector(".w-64") as HTMLElement;

        fireEvent.click(hamburger);

        await waitFor(() => {
          expect(panel.className).toContain("translate-x-0");
        });
        expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
      } finally {
        env.IS_REACT_ACT_ENVIRONMENT = true;
      }
    });
  });

  describe("HeaderSkeleton", () => {
    it("matches the header's fixed, h-16 shape so it cannot shift <main>", () => {
      render(<HeaderSkeleton />);

      const skeleton = screen.getByRole("banner");
      const real = render(<Header />).container.querySelector("header") as HTMLElement;

      expect(skeleton.className).toBe(real.className);
      expect(skeleton.firstElementChild?.className).toBe(
        real.firstElementChild?.className
      );
      expect(skeleton).toHaveAttribute("aria-busy", "true");
    });

    it("shows the app title but no interactive controls", () => {
      vi.stubEnv("NEXT_PUBLIC_APP_NAME", "Grace Church Portal");
      render(<HeaderSkeleton />);

      expect(
        screen.getByRole("heading", { name: "Grace Church Portal" })
      ).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("signed-in avatar", () => {
    it("renders the MP profile image when the contact has an Image_GUID", () => {
      setUser({ ...profile, Image_GUID: "img-guid-1" });
      render(<Header />);

      const img = screen.getByRole("img", { name: "Sam Ortiz" });
      expect(img.getAttribute("src")).toContain(
        "https://files.example.com/img-guid-1"
      );
      expect(img.getAttribute("src")).toContain("thumbnail=true");
    });

    it("labels the image generically when the profile has no name", () => {
      setUser({
        ...profile,
        First_Name: "",
        Last_Name: "",
        Image_GUID: "img-guid-1",
      });
      render(<Header />);

      expect(
        screen.getByRole("img", { name: "User avatar" })
      ).toBeInTheDocument();
    });

    it("falls back to an icon when the contact has no Image_GUID", () => {
      setUser(profile);
      render(<Header />);

      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      expect(avatarButton()).toBeInTheDocument();
    });
  });

  describe("avatar tooltip fallback chain", () => {
    it("prefers the MP first and last name", () => {
      setUser(profile);
      setSession({
        user: { name: "Session Name", email: "session@example.com" },
      });
      render(<Header />);

      expect(avatarButton()).toHaveAttribute("title", "Sam Ortiz");
    });

    it("falls back to the session name when the MP name is incomplete", () => {
      setUser({ ...profile, Last_Name: "" });
      setSession({
        user: { name: "Session Name", email: "session@example.com" },
      });
      render(<Header />);

      expect(avatarButton()).toHaveAttribute("title", "Session Name");
    });

    it("falls back to the real MP email (mpEmail) when there is no session name", () => {
      setUser({ ...profile, First_Name: "" });
      setSession({
        user: {
          email: "ab12cd34-ef56-7890-abcd-ef1234567890@mp.invalid",
          mpEmail: "session@example.com",
        },
      });
      render(<Header />);

      expect(avatarButton()).toHaveAttribute("title", "session@example.com");
    });

    it("never shows the synthetic session.user.email, even when mpEmail is null", () => {
      // MP does not require an email, so mpEmail can be null. The synthetic
      // better-auth email must not leak into the UI in that case either.
      setUser({ ...profile, First_Name: "" });
      setSession({
        user: {
          email: "ab12cd34-ef56-7890-abcd-ef1234567890@mp.invalid",
          mpEmail: null,
        },
      });
      render(<Header />);

      expect(avatarButton()).toHaveAttribute("title", "User menu");
      expect(avatarButton().getAttribute("title")).not.toContain("mp.invalid");
    });

    it("falls back to a literal label when the session carries no identity", () => {
      setUser({ ...profile, First_Name: "", Last_Name: "" });
      setSession(null);
      render(<Header />);

      expect(avatarButton()).toHaveAttribute("title", "User menu");
    });
  });

  describe("user menu", () => {
    it("opens the dropdown with the signed-in identity", async () => {
      setUser(profile);
      render(<Header />);

      openMenu(avatarButton());

      const menu = await screen.findByRole("menu");
      expect(within(menu).getByText(/Sam\s+Ortiz/)).toBeInTheDocument();
      expect(within(menu).getByText("sam@example.com")).toBeInTheDocument();
      expect(
        within(menu).getByRole("menuitem", { name: /sign out/i })
      ).toBeInTheDocument();
      // Rendering the menu must never trigger the sign-out action.
      expect(mockHandleSignOut).not.toHaveBeenCalled();
    });
  });

  describe("sidebar ownership", () => {
    it("keeps the sidebar closed until the hamburger is pressed", () => {
      setUser(profile);
      const { container } = render(<Header />);

      const panel = container.querySelector(".w-64") as HTMLElement;
      expect(panel.className).toContain("-translate-x-full");

      fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
      expect(panel.className).toContain("translate-x-0");
    });

    it("closes the sidebar from its own close button", () => {
      setUser(profile);
      const { container } = render(<Header />);
      const panel = container.querySelector(".w-64") as HTMLElement;

      fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
      fireEvent.click(screen.getByRole("button", { name: "Close menu" }));

      expect(panel.className).toContain("-translate-x-full");
    });

    it("closes the sidebar when the backdrop is clicked", () => {
      setUser(profile);
      const { container } = render(<Header />);
      const panel = container.querySelector(".w-64") as HTMLElement;
      const backdrop = container.querySelector(".inset-0") as HTMLElement;

      fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
      expect(backdrop.className).toContain("pointer-events-auto");

      fireEvent.click(backdrop);

      expect(panel.className).toContain("-translate-x-full");
      expect(backdrop.className).toContain("pointer-events-none");
    });
  });
});

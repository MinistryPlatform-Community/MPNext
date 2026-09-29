import { describe, it, expect, vi, beforeEach } from "vitest";
import { use } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import type { MPUserProfile } from "@/lib/providers/ministry-platform/types";

/**
 * Sidebar navigation tests.
 *
 * The Sidebar is the app's only navigation surface, and it is rendered
 * unconditionally by the Header — it is always in the DOM, and `isOpen` only
 * slides it in or out. That design has three regression risks these tests
 * guard:
 *
 * 1. The nav list is built from module-level constants. If a route is renamed
 *    in the app router but not here (or an entry is accidentally dropped while
 *    uncommenting one of the placeholder items), the link silently 404s. The
 *    first test pins both the visible labels and their hrefs.
 * 2. Because the panel is always mounted, `onClose` is the only thing that
 *    dismisses it. A missing handler on either the X button or a nav link
 *    leaves the drawer covering the page after navigation, so both paths are
 *    asserted separately.
 * 3. The Contact Lookup entry is conditional on `canAccessContactFeatures`
 *    (2026-09-12, F1). This is UX ONLY — the /contactlookup layout, the server
 *    actions and the services each enforce independently — so the tests below
 *    say "hidden", never "protected". What they do pin is that the decision is
 *    read from the SERVER-COMPUTED flag and not re-derived on the client from
 *    `roles`, and that it fails closed when the profile is absent.
 *
 * 4. Entries must be `next/link`, not `<a>`. A plain anchor reloads the whole
 *    document, remounting the app shell and reloading the MP profile on every
 *    click — which is what made navigation flicker like a refresh.
 * 5. Only the gated entry may wait on the profile: the drawer and Dashboard
 *    must render while `useUser()` is still suspended.
 *
 * `@/contexts` is mocked: the real UserProvider calls a server action that
 * reaches Ministry Platform, and nothing in this file may touch MP. `next/link`
 * is mocked to a marked anchor so the tests can tell it from a plain `<a>`.
 *
 * Note: this component takes no route input and has no active-link state, so
 * there is no "current page" highlight to test. Open/closed is expressed purely
 * as a transform class, which is why that one assertion looks at className.
 */

const { mockUseUser } = vi.hoisted(() => ({
  mockUseUser: vi.fn(),
}));

vi.mock("@/contexts", () => ({
  useUser: mockUseUser,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a data-next-link="" href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { Sidebar } from "./sidebar";

const baseProfile: MPUserProfile = {
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

/** Stubs `useUser()` with a profile carrying the given access flag. */
function withAccess(canAccessContactFeatures: boolean | undefined) {
  mockUseUser.mockReturnValue({
    userProfile: { ...baseProfile, canAccessContactFeatures },
    refreshUserProfile: vi.fn(),
  });
}

describe("Sidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withAccess(true);
  });

  it("renders every navigation item with its route", () => {
    render(<Sidebar isOpen onClose={() => {}} />);

    const links = screen.getAllByRole("link");
    expect(links.map((l) => [l.textContent, l.getAttribute("href")])).toEqual([
      ["Dashboard", "/"],
      ["Contact Lookup", "/contactlookup"],
    ]);
  });

  it("navigates with next/link, not a document-reloading <a>", () => {
    render(<Sidebar isOpen onClose={() => {}} />);

    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveAttribute("data-next-link");
    }
  });

  it("renders the drawer and Dashboard while the profile is still loading", () => {
    const never = new Promise<never>(() => {});
    mockUseUser.mockImplementation(() => use(never));
    render(<Sidebar isOpen onClose={() => {}} />);

    expect(screen.getByRole("heading", { name: "Menu" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Contact Lookup" })).toBeNull();
  });

  it("labels the drawer and exposes an accessible close control", () => {
    render(<Sidebar isOpen onClose={() => {}} />);

    expect(screen.getByRole("heading", { name: "Menu" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Close menu" })
    ).toBeInTheDocument();
  });

  it("calls onClose when the close button is pressed", () => {
    const onClose = vi.fn();
    render(<Sidebar isOpen onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Close menu" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when a navigation link is followed", () => {
    const onClose = vi.fn();
    render(<Sidebar isOpen onClose={onClose} />);

    const link = screen.getByRole("link", { name: "Contact Lookup" });
    // jsdom cannot navigate; let the component's handler run, then swallow the
    // default so the run isn't polluted with "Not implemented: navigation".
    link.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(link);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stays mounted when closed, but slid off-screen", () => {
    const { container, rerender } = render(
      <Sidebar isOpen={false} onClose={() => {}} />
    );
    const panel = container.firstElementChild as HTMLElement;

    // Still rendered — links exist even while hidden.
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(panel.className).toContain("-translate-x-full");

    rerender(<Sidebar isOpen onClose={() => {}} />);
    expect(panel.className).toContain("translate-x-0");
    expect(panel.className).not.toContain("-translate-x-full");
  });

  /**
   * UX layer of the F1 fix. Not a security control — see the file header.
   */
  describe("Contact Lookup visibility", () => {
    it("shows the entry when the server says the user may use the feature", () => {
      withAccess(true);
      render(<Sidebar isOpen onClose={() => {}} />);

      expect(
        screen.getByRole("link", { name: "Contact Lookup" })
      ).toBeInTheDocument();
    });

    it("hides the entry for a signed-in user without access", () => {
      withAccess(false);
      render(<Sidebar isOpen onClose={() => {}} />);

      expect(screen.queryByRole("link", { name: "Contact Lookup" })).toBeNull();
    });

    it("still shows the Dashboard to a user without access", () => {
      // Any MP user may sign in and use the app shell; only the contact
      // features are gated. A role-less user must not get an empty menu.
      withAccess(false);
      render(<Sidebar isOpen onClose={() => {}} />);

      const links = screen.getAllByRole("link");
      expect(links.map((l) => [l.textContent, l.getAttribute("href")])).toEqual([
        ["Dashboard", "/"],
      ]);
    });

    it("hides the entry when the flag is absent (fails closed)", () => {
      withAccess(undefined);
      render(<Sidebar isOpen onClose={() => {}} />);

      expect(screen.queryByRole("link", { name: "Contact Lookup" })).toBeNull();
    });

    it("hides the entry while the profile is still null", () => {
      mockUseUser.mockReturnValue({ userProfile: null, refreshUserProfile: vi.fn() });
      render(<Sidebar isOpen onClose={() => {}} />);

      expect(screen.queryByRole("link", { name: "Contact Lookup" })).toBeNull();
      expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    });

    it("does not derive access from the role list on the client", () => {
      // Policy must come from the server-computed flag. A profile carrying
      // roles but `canAccessContactFeatures: false` (e.g. MP_SECURITY_ROLES
      // names other roles) must still hide the link.
      mockUseUser.mockReturnValue({
        userProfile: {
          ...baseProfile,
          roles: ["Administrators", "Pastoral Staff"],
          canAccessContactFeatures: false,
        },
        refreshUserProfile: vi.fn(),
      });
      render(<Sidebar isOpen onClose={() => {}} />);

      expect(screen.queryByRole("link", { name: "Contact Lookup" })).toBeNull();
    });
  });
});

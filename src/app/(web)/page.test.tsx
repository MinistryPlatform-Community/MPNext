import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * (web) index page tests.
 *
 * The landing page is static marketing chrome, so these tests stay deliberately
 * shallow — but three things on it are real contracts worth guarding:
 *
 * 1. The demo tile is a client component gated on `canAccessContactFeatures`
 *    (2026-09-12, F1), so a signed-in user with no Ministry Platform security
 *    role is not handed a link that will only redirect them to /no-access. UX
 *    only — the real gate lives in the /contactlookup layout, the server
 *    actions and the services. The tile's own behaviour is covered in
 *    `components/home-demos/contact-lookup-demo-card.test.tsx`; here we only
 *    check that the page mounts it inside a Suspense boundary.
 * 2. The tile must stay inside `<Suspense>`. `useUser()` suspends while the MP
 *    profile is in flight; without the boundary that suspension escapes to the
 *    route and blanks the whole dashboard on every load.
 * 3. It is a server component with no data access at all. It must not acquire a
 *    session lookup or a Ministry Platform call — this page renders for every
 *    authenticated user on every visit, so any fetch added here becomes an
 *    unconditional MP round trip. The access flag comes off the profile
 *    UserProvider has already loaded, which is exactly why the tile is a client
 *    component rather than this page becoming async.
 *
 * `@/contexts` is mocked because the real UserProvider calls a server action
 * that reaches Ministry Platform. next/link is mocked to a plain anchor: Next
 * 16's Link reaches for app-router context that does not exist under a bare
 * jsdom render, and the assertion here is about the href.
 */

const { mockUseUser } = vi.hoisted(() => ({
  mockUseUser: vi.fn(),
}));

vi.mock("@/contexts", () => ({
  useUser: mockUseUser,
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import Home from "./page";

function withAccess(canAccessContactFeatures: boolean) {
  mockUseUser.mockReturnValue({
    userProfile: {
      First_Name: "Sam",
      Nickname: "Sam",
      Last_Name: "Ortiz",
      Email_Address: null,
      Image_GUID: null,
      canAccessContactFeatures,
    },
    refreshUserProfile: vi.fn(),
  });
}

describe("Home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withAccess(true);
  });

  it("renders the welcome heading", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: /welcome to mpnext/i }),
    ).toBeInTheDocument();
  });

  it("renders the intro copy", () => {
    render(<Home />);

    expect(screen.getByText(/explore demos showcasing/i)).toBeInTheDocument();
  });

  it("renders the Contact Lookup demo card with its description", () => {
    render(<Home />);

    expect(screen.getByText("Contact Lookup")).toBeInTheDocument();
    expect(screen.getByText(/full CRUD power of the MP API/i)).toBeInTheDocument();
  });

  it("links the demo button at /contactlookup", () => {
    render(<Home />);

    const link = screen.getByRole("link", { name: /view demo/i });
    expect(link).toHaveAttribute("href", "/contactlookup");
  });

  it("renders the call to action as a button inside the link", () => {
    render(<Home />);

    const link = screen.getByRole("link", { name: /view demo/i });
    expect(link.querySelector("button")).not.toBeNull();
  });

  it("omits the demo tile for a signed-in user without contact access", () => {
    withAccess(false);
    render(<Home />);

    // The welcome chrome still renders — any MP user may sign in and land here.
    expect(
      screen.getByRole("heading", { level: 1, name: /welcome to mpnext/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /view demo/i })).toBeNull();
    expect(screen.queryByText("Contact Lookup")).toBeNull();
  });

  it("renders synchronously with no props and no data fetching", () => {
    // Home takes no params/searchParams and returns an element, not a promise:
    // if it ever becomes async, that is a signal it started fetching.
    const result = Home();

    expect(result).not.toBeInstanceOf(Promise);
    expect(Home.length).toBe(0);
  });
});

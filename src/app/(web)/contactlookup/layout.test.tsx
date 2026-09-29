import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * /contactlookup layout tests — the page-layer half of the F1 fix.
 *
 * This layout redirects a signed-in user with no Ministry Platform security
 * role to an explanation instead of a broken screen of thrown server actions.
 * It is a UX redirect only, not what protects the child pages — each page,
 * action and service gates itself (see "child pages gate themselves" below).
 *
 * Two properties are worth pinning, and neither is visible in the rendered DOM:
 *
 * 1. A refusal must be a redirect to /no-access, not an error. `/no-access`
 *    lives inside the (web) group, so the header and the sign-out menu survive.
 * 2. An MP failure must NOT become a redirect. If "MP is unreachable" silently
 *    rendered as "you are not allowed", an outage would look like a
 *    company-wide permissions change.
 *
 * The gate is mocked: nothing here may reach the production MP database.
 */

const {
  mockHasSecurityRole,
  mockRequireSecurityRole,
  mockRedirect,
  mockGetContactDetails,
  mockGetContactLogsByContactId,
  mockGetMpTimezone,
  MockUnauthorizedError,
} = vi.hoisted(() => ({
  mockHasSecurityRole: vi.fn(),
  mockRequireSecurityRole: vi.fn(),
  // Mirror next/navigation's redirect(), which halts execution by throwing.
  mockRedirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  mockGetContactDetails: vi.fn(),
  mockGetContactLogsByContactId: vi.fn(),
  mockGetMpTimezone: vi.fn(),
  MockUnauthorizedError: class UnauthorizedError extends Error {},
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("@/services/authorizationService", () => ({
  AuthorizationService: {
    getInstance: () => ({
      hasSecurityRole: mockHasSecurityRole,
      requireSecurityRole: mockRequireSecurityRole,
    }),
  },
  UnauthorizedError: MockUnauthorizedError,
}));

// The [guid] page's data sources, for the "child pages gate themselves" block.
vi.mock("@/components/contact-lookup-details/actions", () => ({
  getContactDetails: mockGetContactDetails,
  getContactLogsByContactId: mockGetContactLogsByContactId,
}));

vi.mock("@/components/shared-actions/domain", () => ({
  getMpTimezone: mockGetMpTimezone,
}));

vi.mock("@/components/contact-lookup-details", () => ({
  ContactLookupDetails: () => <div data-testid="contact-lookup-details" />,
}));

import ContactLookupLayout from "./layout";
import ContactLookupDetailPage from "./[guid]/page";

const GUID = "ab12cd34-ef56-7890-abcd-ef1234567890";

function permitted() {
  return { permitted: true, userId: 99, reason: null };
}

function refused(reason: string) {
  return { permitted: false, userId: reason === "no_mp_user" ? null : 99, reason };
}

describe("/contactlookup layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasSecurityRole.mockResolvedValue(permitted());
    mockRequireSecurityRole.mockResolvedValue(99);
    mockGetContactDetails.mockResolvedValue({ Contact_ID: 42 });
    mockGetContactLogsByContactId.mockResolvedValue([]);
    mockGetMpTimezone.mockResolvedValue("America/New_York");
  });

  it("renders children for a user who holds a security role", async () => {
    const element = await ContactLookupLayout({
      children: <div data-testid="gated-page" />,
    });
    render(element);

    expect(screen.getByTestId("gated-page")).toBeInTheDocument();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("asks the gate for read access to Contacts", async () => {
    await ContactLookupLayout({ children: null });

    expect(mockHasSecurityRole).toHaveBeenCalledWith({
      table: "Contacts",
      operation: "read",
    });
  });

  it("redirects a signed-in user with no security role to /no-access", async () => {
    mockHasSecurityRole.mockResolvedValueOnce(refused("no_security_role"));

    await expect(
      ContactLookupLayout({ children: <div data-testid="gated-page" /> })
    ).rejects.toThrow("REDIRECT:/no-access");

    expect(mockRedirect).toHaveBeenCalledWith("/no-access");
  });

  it("redirects a session with no Ministry Platform user to /no-access", async () => {
    mockHasSecurityRole.mockResolvedValueOnce(refused("no_mp_user"));

    await expect(ContactLookupLayout({ children: null })).rejects.toThrow(
      "REDIRECT:/no-access"
    );
  });

  it("redirects a user whose role is not on MP_SECURITY_ROLES", async () => {
    mockHasSecurityRole.mockResolvedValueOnce(refused("role_not_permitted"));

    await expect(ContactLookupLayout({ children: null })).rejects.toThrow(
      "REDIRECT:/no-access"
    );
  });

  /**
   * The layout's redirect does NOT protect child pages. Next 16 renders the
   * [guid] page as its own segment, independently of this layout, so the page
   * runs — and its output can reach the RSC payload — even when the layout
   * redirects (node_modules/next/dist/docs/01-app/02-guides/authentication.md,
   * "Layouts and auth checks"). The old test here asserted "nothing rendered"
   * after building the child element itself, which was always true and so
   * could never fail.
   *
   * What is pinned instead: the layout redirects (above), and — separately,
   * with the layout nowhere in the call — the detail page's OWN gate refuses a
   * role-less user before any data call. Delete the page's gate and this fails.
   */
  describe("child pages gate themselves", () => {
    it("the [guid] page refuses a role-less user on its own, before fetching", async () => {
      mockRequireSecurityRole.mockRejectedValueOnce(
        new MockUnauthorizedError("Not authorized")
      );

      await expect(
        ContactLookupDetailPage({ params: Promise.resolve({ guid: GUID }) })
      ).rejects.toThrow("REDIRECT:/no-access");

      expect(mockRequireSecurityRole).toHaveBeenCalledWith({
        table: "Contacts",
        operation: "read",
      });
      expect(mockGetContactDetails).not.toHaveBeenCalled();
      expect(mockGetContactLogsByContactId).not.toHaveBeenCalled();
      expect(mockGetMpTimezone).not.toHaveBeenCalled();
    });

    it("the [guid] page runs its data calls only once its gate permits", async () => {
      await ContactLookupDetailPage({ params: Promise.resolve({ guid: GUID }) });

      expect(mockRequireSecurityRole).toHaveBeenCalledTimes(1);
      expect(mockGetContactDetails).toHaveBeenCalledWith(GUID);
      expect(mockRequireSecurityRole.mock.invocationCallOrder[0]).toBeLessThan(
        mockGetContactDetails.mock.invocationCallOrder[0]
      );
    });
  });

  it("surfaces an MP failure instead of redirecting", async () => {
    mockHasSecurityRole.mockRejectedValueOnce(new Error("MP unavailable"));

    await expect(ContactLookupLayout({ children: null })).rejects.toThrow(
      "MP unavailable"
    );
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("does not redirect a role-less user anywhere else — /no-access only", async () => {
    // A redirect to /signin would be wrong: the session is valid, and /signin
    // auto-starts OAuth, which would loop straight back here.
    mockHasSecurityRole.mockResolvedValueOnce(refused("no_security_role"));

    await expect(ContactLookupLayout({ children: null })).rejects.toThrow();

    expect(mockRedirect.mock.calls[0][0]).toBe("/no-access");
    expect(mockRedirect).toHaveBeenCalledTimes(1);
  });
});

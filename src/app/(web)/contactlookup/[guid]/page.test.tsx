import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * /contactlookup/[guid] detail route tests.
 *
 * This page is the streaming seam of the contact detail view, and every
 * interesting thing about it is invisible in the rendered DOM:
 *
 * - `params` is a Promise in Next.js 16. Reading `params.guid` without awaiting
 *   yields `undefined` and the page then looks up the string "undefined" in MP
 *   — a silent wrong-record fetch, not a crash. The first test pins the await.
 * - The two data promises are deliberately NOT awaited here; they are handed to
 *   <ContactLookupDetails> so the Suspense boundary can stream. If someone
 *   "fixes" this by awaiting them, the whole page blocks on the slowest MP call
 *   and the fallback never shows. Tests below assert the props are still
 *   pending promises wired to the right actions.
 * - The contact-log fetch is chained off the contact, guarded by `Contact_ID`.
 *   A contact record with no `Contact_ID` must short-circuit to `[]` rather
 *   than calling the log action with `undefined`, which would sanitize-throw.
 * - `mpTimezone` IS awaited and passed down; without it, MP wall-clock
 *   datetimes get re-interpreted in the browser's zone (see
 *   .claude/references/ministryplatform.datetimehandling.md).
 *
 * Every action is mocked. Nothing here may reach the production MP database.
 */

const {
  mockGetContactDetails,
  mockGetContactLogsByContactId,
  mockGetMpTimezone,
  mockRequireSecurityRole,
  mockRedirect,
  MockUnauthorizedError,
  captured,
} = vi.hoisted(() => ({
  mockGetContactDetails: vi.fn(),
  mockGetContactLogsByContactId: vi.fn(),
  mockGetMpTimezone: vi.fn(),
  mockRequireSecurityRole: vi.fn(),
  // Mirror next/navigation's redirect(), which halts execution by throwing.
  mockRedirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  MockUnauthorizedError: class UnauthorizedError extends Error {},
  captured: { props: null as Record<string, unknown> | null },
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("@/services/authorizationService", () => ({
  AuthorizationService: {
    getInstance: () => ({ requireSecurityRole: mockRequireSecurityRole }),
  },
  UnauthorizedError: MockUnauthorizedError,
}));

vi.mock("@/components/contact-lookup-details/actions", () => ({
  getContactDetails: mockGetContactDetails,
  getContactLogsByContactId: mockGetContactLogsByContactId,
}));

vi.mock("@/components/shared-actions/domain", () => ({
  getMpTimezone: mockGetMpTimezone,
}));

vi.mock("@/components/contact-lookup-details", () => ({
  ContactLookupDetails: (props: Record<string, unknown>) => {
    captured.props = props;
    return <div data-testid="contact-lookup-details" />;
  },
}));

import ContactLookupDetailPage from "./page";

const GUID = "ab12cd34-ef56-7890-abcd-ef1234567890";

/** The props <ContactLookupDetails> was rendered with, typed for convenience. */
function detailProps() {
  const props = captured.props;
  if (!props) throw new Error("ContactLookupDetails was never rendered");
  return props as {
    contactPromise: Promise<{ Contact_ID?: number }>;
    contactLogsPromise: Promise<unknown[]>;
    mpTimezone: string;
  };
}

async function renderPage(guid = GUID) {
  const element = await ContactLookupDetailPage({
    // Next.js 16: params is async and must be awaited by the page.
    params: Promise.resolve({ guid }),
  });
  render(element);
  return detailProps();
}

describe("/contactlookup/[guid] page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    captured.props = null;
    mockRequireSecurityRole.mockResolvedValue(99);
    mockGetMpTimezone.mockResolvedValue("America/New_York");
    mockGetContactDetails.mockResolvedValue({ Contact_ID: 42, Display_Name: "Ortiz, Sam" });
    mockGetContactLogsByContactId.mockResolvedValue([{ Contact_Log_ID: 501 }]);
  });

  it("awaits params and looks the contact up by the route guid", async () => {
    await renderPage();

    expect(mockGetContactDetails).toHaveBeenCalledWith(GUID);
    expect(mockGetContactDetails).toHaveBeenCalledTimes(1);
    // A non-awaited `params.guid` would have produced `undefined` here.
    expect(mockGetContactDetails).not.toHaveBeenCalledWith(undefined);
  });

  it("renders the detail component inside the Suspense boundary", async () => {
    await renderPage();

    expect(screen.getByTestId("contact-lookup-details")).toBeInTheDocument();
  });

  it("hands down the unresolved contact promise rather than awaiting it", async () => {
    const props = await renderPage();

    expect(props.contactPromise).toBeInstanceOf(Promise);
    await expect(props.contactPromise).resolves.toMatchObject({ Contact_ID: 42 });
  });

  it("chains the contact-log fetch off the resolved contact's Contact_ID", async () => {
    const props = await renderPage();

    await expect(props.contactLogsPromise).resolves.toEqual([{ Contact_Log_ID: 501 }]);
    expect(mockGetContactLogsByContactId).toHaveBeenCalledWith(42);
    expect(mockGetContactLogsByContactId).toHaveBeenCalledTimes(1);
  });

  it("short-circuits to an empty log list when the contact has no Contact_ID", async () => {
    mockGetContactDetails.mockResolvedValue({ Display_Name: "Ortiz, Sam" });

    const props = await renderPage();

    await expect(props.contactLogsPromise).resolves.toEqual([]);
    // Calling the action with an undefined ID would throw inside sanitizeNumericId.
    expect(mockGetContactLogsByContactId).not.toHaveBeenCalled();
  });

  it("short-circuits when Contact_ID is present but zero", async () => {
    mockGetContactDetails.mockResolvedValue({ Contact_ID: 0 });

    const props = await renderPage();

    await expect(props.contactLogsPromise).resolves.toEqual([]);
    expect(mockGetContactLogsByContactId).not.toHaveBeenCalled();
  });

  it("awaits and passes the MP time zone down", async () => {
    mockGetMpTimezone.mockResolvedValue("America/Chicago");

    const props = await renderPage();

    expect(mockGetMpTimezone).toHaveBeenCalledTimes(1);
    // Awaited, not a promise — the child renders wall-clock values with it.
    expect(props.mpTimezone).toBe("America/Chicago");
  });

  it("still renders when the contact lookup fails, deferring the error to Suspense", async () => {
    mockGetContactDetails.mockRejectedValue(new Error("Contact not found"));

    const props = await renderPage("not-a-real-guid");

    // The page itself does not throw: the rejection travels inside the promise
    // so the error boundary below the Suspense seam handles it.
    expect(screen.getByTestId("contact-lookup-details")).toBeInTheDocument();
    await expect(props.contactPromise).rejects.toThrow("Contact not found");
    // The derived log promise rejects with the same error rather than hanging.
    await expect(props.contactLogsPromise).rejects.toThrow("Contact not found");
    expect(mockGetContactLogsByContactId).not.toHaveBeenCalled();
  });

  it("propagates an empty guid to the action, which owns the validation", async () => {
    mockGetContactDetails.mockRejectedValue(new Error("GUID is required"));

    const props = await renderPage("");

    expect(mockGetContactDetails).toHaveBeenCalledWith("");
    await expect(props.contactPromise).rejects.toThrow("GUID is required");
    await expect(props.contactLogsPromise).rejects.toThrow("GUID is required");
  });

  it("surfaces a failed time-zone lookup instead of rendering with a wrong zone", async () => {
    mockGetMpTimezone.mockRejectedValue(new Error("Domain not configured"));
    // The contact promise is created before the throw; keep it handled so the
    // rejection does not leak out of this test.
    mockGetContactDetails.mockResolvedValue({ Contact_ID: 42 });

    await expect(
      ContactLookupDetailPage({ params: Promise.resolve({ guid: GUID }) })
    ).rejects.toThrow("Domain not configured");

    expect(captured.props).toBeNull();
  });

  /**
   * The page gates itself. The `/contactlookup` layout's redirect does not
   * stop this segment rendering in Next 16, so this check — not the layout —
   * is what keeps a role-less user's request from running the data calls.
   */
  describe("its own authorization gate", () => {
    it("checks read access to Contacts before any data call", async () => {
      await renderPage();

      expect(mockRequireSecurityRole).toHaveBeenCalledWith({
        table: "Contacts",
        operation: "read",
      });
      expect(mockRequireSecurityRole.mock.invocationCallOrder[0]).toBeLessThan(
        mockGetContactDetails.mock.invocationCallOrder[0]
      );
    });

    it("redirects a refused user to /no-access without fetching anything", async () => {
      mockRequireSecurityRole.mockRejectedValueOnce(
        new MockUnauthorizedError("Not authorized")
      );

      await expect(
        ContactLookupDetailPage({ params: Promise.resolve({ guid: GUID }) })
      ).rejects.toThrow("REDIRECT:/no-access");

      expect(mockGetContactDetails).not.toHaveBeenCalled();
      expect(mockGetContactLogsByContactId).not.toHaveBeenCalled();
      expect(mockGetMpTimezone).not.toHaveBeenCalled();
      expect(captured.props).toBeNull();
    });

    it("surfaces an MP failure in the gate instead of redirecting", async () => {
      mockRequireSecurityRole.mockRejectedValueOnce(new Error("MP unavailable"));

      await expect(
        ContactLookupDetailPage({ params: Promise.resolve({ guid: GUID }) })
      ).rejects.toThrow("MP unavailable");

      expect(mockRedirect).not.toHaveBeenCalled();
      expect(mockGetContactDetails).not.toHaveBeenCalled();
    });
  });
});

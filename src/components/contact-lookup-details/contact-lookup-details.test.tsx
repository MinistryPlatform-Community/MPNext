import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Suspense } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import type { ContactLookupDetails as ContactLookupDetailsType, ContactLogDisplay } from "@/lib/dto";

/**
 * ContactLookupDetails component tests.
 *
 * This panel is the read side of the contact lookup: it unwraps two server
 * promises with React's `use()` and renders whatever Ministry Platform returned.
 * Every field it shows is nullable in practice even though the DTO types them as
 * `string`, because the MP `Contacts` row is sparse for most real records — a
 * contact with no nickname, no email, no mobile and no photo is ordinary, not an
 * edge case. So the branches guarded here are the ones that actually fire in
 * production:
 *
 *  1. photo vs. initials fallback, including the initials themselves (they are
 *     derived from nickname-or-first-name, so a nickname change silently
 *     changes the avatar);
 *  2. the nickname-wins display-name rule, including a whitespace-only nickname,
 *     which `.trim()` is there to reject — without it the heading renders as a
 *     blank first name;
 *  3. "N/A" placeholders and the mailto:/tel: links, since a missing value that
 *     rendered as an empty `<a>` would be an unclickable dead link;
 *  4. the null-contact guard, which is unreachable through the declared types
 *     but is the only thing between a lookup miss and a crash in the panel;
 *  5. the props handed to ContactLogs — particularly `onRefresh`, which is the
 *     sole route by which a log mutation gets reflected back on screen.
 *
 * ContactLogs is mocked: it is covered in its own test file, and importing it
 * for real drags in `contact-logs/actions.ts`, which reaches Ministry Platform.
 * No date formatting happens in this component — contact dates are formatted
 * downstream in ContactLogs via the MP timezone, which is why `mpTimezone` is
 * asserted as passed through rather than re-derived here.
 */

const { mockContactLogsRender } = vi.hoisted(() => ({
  mockContactLogsRender: vi.fn(),
}));

vi.mock("@/components/contact-logs", async () => {
  const React = await import("react");
  return {
    ContactLogs: (props: Record<string, unknown>) => {
      mockContactLogsRender(props);
      const logs = props.contactLogs as ContactLogDisplay[];
      return React.createElement(
        "div",
        { "data-testid": "contact-logs" },
        `contact-logs:${logs.length}`
      );
    },
  };
});

const { mockRefresh } = vi.hoisted(() => ({ mockRefresh: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

import { ContactLookupDetails } from "./contact-lookup-details";

const MP_TZ = "America/New_York";

const contact: ContactLookupDetailsType = {
  Contact_ID: 42,
  Contact_GUID: "ab12cd34-ef56-7890-abcd-ef1234567890",
  First_Name: "Samuel",
  Nickname: "Sam",
  Last_Name: "Ortiz",
  Email_Address: "sam@example.com",
  Mobile_Phone: "555-0100",
  Image_GUID: "99887766-5544-3322-1100-ffeeddccbbaa",
};

const logs: ContactLogDisplay[] = [
  {
    Contact_Log_ID: 501,
    Contact_Date: "2026-08-20T14:30:00",
    Notes: "Called about the new members class.",
    Contact_Log_Type: "Phone Call",
  },
];

type Overrides = {
  contact?: Partial<ContactLookupDetailsType> | null;
  contactLogs?: ContactLogDisplay[];
  mpTimezone?: string;
};

/**
 * Renders inside a Suspense boundary — the component unwraps its props with
 * `use()`, so it suspends on its first render pass even for already-resolved
 * promises. The render has to happen inside an *awaited* `act` scope: the
 * synchronous scope `render()` opens on its own cannot resume a suspension, so
 * without this every assertion below would see only the fallback.
 */
async function renderDetails(overrides: Overrides = {}) {
  const resolved =
    overrides.contact === null
      ? (null as unknown as ContactLookupDetailsType)
      : { ...contact, ...overrides.contact };

  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(
      <Suspense fallback={<div>Loading contact…</div>}>
        <ContactLookupDetails
          contactPromise={Promise.resolve(resolved)}
          contactLogsPromise={Promise.resolve(overrides.contactLogs ?? logs)}
          mpTimezone={overrides.mpTimezone ?? MP_TZ}
        />
      </Suspense>
    );
  });
  return result;
}

/** The props ContactLogs was last rendered with. */
function lastContactLogsProps() {
  const calls = mockContactLogsRender.mock.calls;
  expect(calls.length).toBeGreaterThan(0);
  return calls[calls.length - 1][0] as Record<string, unknown>;
}

describe("ContactLookupDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv(
      "NEXT_PUBLIC_MINISTRY_PLATFORM_FILE_URL",
      "https://test-mp.example.com/ministryplatformapi/files"
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("suspense", () => {
    it("stays on the fallback while the server promises are pending", async () => {
      // Never-resolving promises stand in for an in-flight server fetch: the
      // panel must show nothing of the record — not a half-populated header —
      // until both promises settle.
      const pending = new Promise<never>(() => {});
      await act(async () => {
        render(
          <Suspense fallback={<div>Loading contact…</div>}>
            <ContactLookupDetails
              contactPromise={pending}
              contactLogsPromise={pending}
              mpTimezone={MP_TZ}
            />
          </Suspense>
        );
      });

      expect(screen.getByText("Loading contact…")).toBeInTheDocument();
      expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
      expect(mockContactLogsRender).not.toHaveBeenCalled();
    });

    it("replaces the fallback once the contact resolves", async () => {
      await renderDetails();

      expect(screen.queryByText("Loading contact…")).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Sam Ortiz"
      );
    });
  });

  describe("a fully populated contact", () => {
    it("renders every section: name, GUID, details and the logs panel", async () => {
      await renderDetails();

      expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
        "Sam Ortiz"
      );
      expect(
        screen.getByText(`GUID: ${contact.Contact_GUID}`)
      ).toBeInTheDocument();

      expect(screen.getByText("First Name")).toBeInTheDocument();
      expect(screen.getByText("Samuel")).toBeInTheDocument();
      expect(screen.getByText("Nickname")).toBeInTheDocument();
      expect(screen.getByText("Last Name")).toBeInTheDocument();
      expect(screen.getByText("Ortiz")).toBeInTheDocument();
      expect(screen.getByText("Email Address")).toBeInTheDocument();
      expect(screen.getByText("Mobile Phone")).toBeInTheDocument();

      expect(screen.getByTestId("contact-logs")).toHaveTextContent(
        "contact-logs:1"
      );
    });

    it("links the email and phone so they are actionable", async () => {
      await renderDetails();

      const email = await screen.findByRole("link", { name: "sam@example.com" });
      expect(email).toHaveAttribute("href", "mailto:sam@example.com");

      const phone = screen.getByRole("link", { name: "555-0100" });
      expect(phone).toHaveAttribute("href", "tel:555-0100");

      expect(screen.queryByText("N/A")).not.toBeInTheDocument();
    });

    it("renders the photo from the MP file URL with a thumbnail request", async () => {
      await renderDetails();

      const image = await screen.findByRole("img", { name: "Sam Ortiz" });
      // next/image rewrites src for optimization; `unoptimized` keeps the URL
      // intact, which is what makes the MP file endpoint reachable at all.
      expect(image.getAttribute("src")).toBe(
        `https://test-mp.example.com/ministryplatformapi/files/${contact.Image_GUID}?$thumbnail=true`
      );
    });
  });

  describe("display name", () => {
    it("prefers the nickname over the first name", async () => {
      await renderDetails();

      expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
        "Sam Ortiz"
      );
      expect(screen.queryByRole("heading", { name: /Samuel Ortiz/ })).toBeNull();
    });

    it("falls back to the first name when there is no nickname", async () => {
      await renderDetails({ contact: { Nickname: "", Image_GUID: "" } });

      expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
        "Samuel Ortiz"
      );
      // The Nickname row is dropped entirely rather than shown empty.
      expect(screen.queryByText("Nickname")).not.toBeInTheDocument();
    });

    it("treats a whitespace-only nickname as absent", async () => {
      await renderDetails({ contact: { Nickname: "   ", Image_GUID: "" } });

      expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
        "Samuel Ortiz"
      );
      // The row still renders — "   " is truthy — but the heading must not.
      expect(screen.getByText("Nickname")).toBeInTheDocument();
    });
  });

  describe("initials fallback when there is no photo", () => {
    it("uses the nickname initial, not the first-name initial", async () => {
      await renderDetails({ contact: { Image_GUID: "" } });

      expect(await screen.findByText("SO")).toBeInTheDocument();
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });

    it("uses the first-name initial when there is no nickname", async () => {
      await renderDetails({ contact: { Image_GUID: "", Nickname: "", First_Name: "Dana" } });

      expect(await screen.findByText("DO")).toBeInTheDocument();
    });

    it("renders an empty avatar rather than crashing when both names are missing", async () => {
      await renderDetails({
        contact: {
          Image_GUID: "",
          Nickname: "",
          First_Name: "",
          Last_Name: "",
        },
      });

      // Nothing to initialise from: the heading is blank but the panel renders.
      expect(await screen.findByRole("heading", { level: 1 })).toBeInTheDocument();
      expect(screen.getAllByText("N/A").length).toBeGreaterThanOrEqual(2);
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });
  });

  describe("sparse records", () => {
    it("shows N/A instead of dead links when email and mobile are missing", async () => {
      await renderDetails({
        contact: { Email_Address: "", Mobile_Phone: "", Image_GUID: "" },
      });

      await screen.findByRole("heading", { level: 1 });
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
      expect(screen.getAllByText("N/A")).toHaveLength(2);
    });

    it("shows N/A for a missing first or last name", async () => {
      await renderDetails({
        contact: { First_Name: "", Last_Name: "", Image_GUID: "" },
      });

      await screen.findByRole("heading", { level: 1 });
      expect(screen.getAllByText("N/A")).toHaveLength(2);
    });

    it("renders with no contact logs at all", async () => {
      await renderDetails({ contactLogs: [] });

      await screen.findByRole("heading", { level: 1 });
      expect(screen.getByTestId("contact-logs")).toHaveTextContent(
        "contact-logs:0"
      );
    });

    it("renders a contact with every optional field empty", async () => {
      await renderDetails({
        contact: {
          Nickname: "",
          Email_Address: "",
          Mobile_Phone: "",
          Image_GUID: "",
        },
        contactLogs: [],
      });

      expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
        "Samuel Ortiz"
      );
      expect(screen.getByTestId("contact-logs")).toBeInTheDocument();
    });
  });

  describe("no contact found", () => {
    it("renders the warning panel and no logs section", async () => {
      await renderDetails({ contact: null });

      expect(await screen.findByText("No Contact Found")).toBeInTheDocument();
      expect(
        screen.getByText("No contact details found for the provided GUID.")
      ).toBeInTheDocument();
      expect(screen.queryByTestId("contact-logs")).not.toBeInTheDocument();
      expect(mockContactLogsRender).not.toHaveBeenCalled();
    });
  });

  describe("props handed to ContactLogs", () => {
    it("passes the contact identity and the MP timezone through untouched", async () => {
      await renderDetails({ mpTimezone: "America/Chicago" });

      await screen.findByTestId("contact-logs");
      const props = lastContactLogsProps();

      expect(props.contactId).toBe(42);
      expect(props.contactNickname).toBe("Sam");
      expect(props.contactLastName).toBe("Ortiz");
      // The timezone must reach ContactLogs verbatim — it is what converts MP
      // wall-clock contact dates for display.
      expect(props.mpTimezone).toBe("America/Chicago");
      expect(props.contactLogs).toEqual(logs);
    });

    it("refreshes the route when ContactLogs signals a mutation", async () => {
      await renderDetails();

      await screen.findByTestId("contact-logs");
      const onRefresh = lastContactLogsProps().onRefresh as () => void;

      expect(mockRefresh).not.toHaveBeenCalled();
      onRefresh();

      await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
    });
  });
});

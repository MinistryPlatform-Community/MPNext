import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import type { ContactLogDisplay } from "@/lib/dto";

/**
 * ContactLogs component tests — targeted, not exhaustive.
 *
 * This component is the only interactive path in the app that mutates Ministry
 * Platform data, so these tests cover the three places where a regression would
 * silently corrupt or delete real member records:
 *
 * 1. the delete-confirmation gate  — delete must not fire before confirmation
 * 2. client-side validation        — invalid forms must never reach the action
 * 3. error surfacing               — a failed action must be shown, and must not
 *                                    close the dialog or signal a refresh as if
 *                                    it had succeeded
 *
 * See `.claude/references/testing.md`.
 */

const {
  mockGetContactLogTypes,
  mockCreateContactLog,
  mockUpdateContactLog,
  mockDeleteContactLog,
} = vi.hoisted(() => ({
  mockGetContactLogTypes: vi.fn(),
  mockCreateContactLog: vi.fn(),
  mockUpdateContactLog: vi.fn(),
  mockDeleteContactLog: vi.fn(),
}));

vi.mock("./actions", () => ({
  getContactLogTypes: mockGetContactLogTypes,
  createContactLog: mockCreateContactLog,
  updateContactLog: mockUpdateContactLog,
  deleteContactLog: mockDeleteContactLog,
}));

import { ContactLogs } from "./contact-logs";

// Radix primitives need a few browser APIs jsdom does not implement. Without
// these, Dialog/AlertDialog/Select throw on mount rather than failing an
// assertion, which makes every test below look like a component bug.
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

const MP_TZ = "America/New_York";

const logs: ContactLogDisplay[] = [
  {
    Contact_Log_ID: 501,
    Contact_Date: "2026-08-20T14:30:00",
    Notes: "Called about the new members class.",
    Contact_Log_Type: "Phone Call",
    // Deliberately a DIFFERENT user than the acting one: the component offers
    // edit/delete on other people's logs, matching the decided policy.
    MadeByContact: [
      {
        Contact_ID: 12345,
        First_Name: "Dana",
        Nickname: "Dana",
        Last_Name: "Reyes",
        Email_Address: "dana@example.com",
        Mobile_Phone: null,
        Image_GUID: null,
      },
    ],
  },
];

function renderLogs(overrides: Partial<Parameters<typeof ContactLogs>[0]> = {}) {
  return render(
    <ContactLogs
      contactLogs={logs}
      contactId={42}
      contactNickname="Sam"
      contactLastName="Ortiz"
      mpTimezone={MP_TZ}
      {...overrides}
    />
  );
}

/** Renders, opens the "Add Log" dialog, and returns its form scope. */
async function openCreateDialog(
  overrides: Partial<Parameters<typeof ContactLogs>[0]> = {}
) {
  renderLogs(overrides);
  fireEvent.click(screen.getByRole("button", { name: /add log/i }));
  return within(await screen.findByRole("dialog"));
}

describe("ContactLogs", () => {
  let alertSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    installJsdomPolyfills();
    vi.clearAllMocks();
    mockGetContactLogTypes.mockResolvedValue([
      { Contact_Log_Type_ID: 1, Contact_Log_Type: "Phone Call", Description: null },
    ]);
    // The component reports failures with window.alert(); jsdom's default
    // implementation logs "not implemented" noise, so stub it.
    alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("delete confirmation gate", () => {
    it("opens the confirmation without calling deleteContactLog", async () => {
      renderLogs();

      clickDeleteIcon();

      // The confirmation is now on screen and nothing has been deleted.
      expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
      expect(mockDeleteContactLog).not.toHaveBeenCalled();
    });

    it("does not call deleteContactLog when the confirmation is cancelled", async () => {
      renderLogs();

      clickDeleteIcon();
      const dialog = await screen.findByRole("alertdialog");
      fireEvent.click(within(dialog).getByRole("button", { name: /cancel/i }));

      await waitFor(() =>
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
      );
      expect(mockDeleteContactLog).not.toHaveBeenCalled();
    });

    it("calls deleteContactLog with the log ID only after the confirmation is accepted", async () => {
      const onRefresh = vi.fn();
      mockDeleteContactLog.mockResolvedValueOnce(undefined);
      renderLogs({ onRefresh });

      clickDeleteIcon();
      const dialog = await screen.findByRole("alertdialog");
      expect(mockDeleteContactLog).not.toHaveBeenCalled();

      fireEvent.click(within(dialog).getByRole("button", { name: /^delete$/i }));

      await waitFor(() => expect(mockDeleteContactLog).toHaveBeenCalledWith(501));
      expect(mockDeleteContactLog).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
    });

    it("surfaces a delete failure and does not signal a refresh", async () => {
      const onRefresh = vi.fn();
      mockDeleteContactLog.mockRejectedValueOnce(
        new Error("Not authorized: an MP security role is required")
      );
      renderLogs({ onRefresh });

      clickDeleteIcon();
      const dialog = await screen.findByRole("alertdialog");
      fireEvent.click(within(dialog).getByRole("button", { name: /^delete$/i }));

      await waitFor(() =>
        expect(alertSpy).toHaveBeenCalledWith(
          "Error: Not authorized: an MP security role is required"
        )
      );
      expect(onRefresh).not.toHaveBeenCalled();
      // The row is still on screen — nothing was optimistically removed.
      expect(
        screen.getByText("Called about the new members class.")
      ).toBeInTheDocument();
    });
  });

  describe("form validation before submit", () => {
    it("does not call createContactLog when Notes is empty", async () => {
      const form = await openCreateDialog();

      fireEvent.click(form.getByRole("button", { name: /create log/i }));

      expect(await screen.findByText("Notes are required")).toBeInTheDocument();
      expect(mockCreateContactLog).not.toHaveBeenCalled();
    });

    it("does not call createContactLog when the contact date is cleared", async () => {
      const form = await openCreateDialog();

      fireEvent.change(form.getByLabelText(/contact date/i), { target: { value: "" } });
      fireEvent.change(form.getByLabelText(/notes/i), {
        target: { value: "Left a voicemail." },
      });
      fireEvent.click(form.getByRole("button", { name: /create log/i }));

      expect(
        await screen.findByText("Contact date and time is required")
      ).toBeInTheDocument();
      expect(mockCreateContactLog).not.toHaveBeenCalled();
    });

    it("submits a valid form with the contact ID and notes", async () => {
      const onRefresh = vi.fn();
      mockCreateContactLog.mockResolvedValueOnce({ Contact_Log_ID: 900 });
      const form = await openCreateDialog({ onRefresh });

      fireEvent.change(form.getByLabelText(/notes/i), {
        target: { value: "Left a voicemail." },
      });
      fireEvent.click(form.getByRole("button", { name: /create log/i }));

      await waitFor(() => expect(mockCreateContactLog).toHaveBeenCalledTimes(1));
      expect(mockCreateContactLog).toHaveBeenCalledWith(
        expect.objectContaining({
          Contact_ID: 42,
          Notes: "Left a voicemail.",
        })
      );
      // Only the fields the form edits (plus the subject contact) — the
      // cross-record links and flags the service no longer accepts are not sent.
      expect(Object.keys(mockCreateContactLog.mock.calls[0][0]).sort()).toEqual([
        "Contact_Date",
        "Contact_ID",
        "Contact_Log_Type_ID",
        "Notes",
      ]);
      await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
    });
  });

  describe("action failure surfacing", () => {
    it("alerts on a create failure, keeps the dialog open, and does not refresh", async () => {
      const onRefresh = vi.fn();
      mockCreateContactLog.mockRejectedValueOnce(new Error("Required fields are missing"));
      const form = await openCreateDialog({ onRefresh });

      fireEvent.change(form.getByLabelText(/notes/i), { target: { value: "A note." } });
      fireEvent.click(form.getByRole("button", { name: /create log/i }));

      await waitFor(() =>
        expect(alertSpy).toHaveBeenCalledWith("Error: Required fields are missing")
      );
      expect(onRefresh).not.toHaveBeenCalled();
      // Dialog stays open so the user can retry without retyping the note.
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("falls back to a generic message when the action rejects with a non-Error", async () => {
      mockCreateContactLog.mockRejectedValueOnce("boom");
      const form = await openCreateDialog();

      fireEvent.change(form.getByLabelText(/notes/i), { target: { value: "A note." } });
      fireEvent.click(form.getByRole("button", { name: /create log/i }));

      await waitFor(() =>
        expect(alertSpy).toHaveBeenCalledWith("Error: Failed to create contact log")
      );
    });

    it("renders the empty state without crashing when there are no logs", async () => {
      renderLogs({ contactLogs: [] });

      expect(screen.getByText("No contact logs found")).toBeInTheDocument();
      // Log types still load — the create form needs them.
      await waitFor(() => expect(mockGetContactLogTypes).toHaveBeenCalled());
    });

    it("keeps rendering when the log-types lookup fails", async () => {
      mockGetContactLogTypes.mockRejectedValueOnce(new Error("MP unavailable"));
      renderLogs();

      await waitFor(() => expect(mockGetContactLogTypes).toHaveBeenCalled());
      expect(screen.getByText(/Contact Logs \(1\)/)).toBeInTheDocument();
    });
  });

  describe("edit flow", () => {
    it("opens the edit dialog prefilled and updates the log", async () => {
      const onRefresh = vi.fn();
      mockUpdateContactLog.mockResolvedValueOnce({ Contact_Log_ID: 501 });
      renderLogs({ onRefresh });

      fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));
      const dialog = await screen.findByRole("dialog");
      const form = within(dialog);
      expect(form.getByLabelText(/notes/i)).toHaveValue(
        "Called about the new members class."
      );
      // MP wall-clock is passed through to the datetime-local input unchanged.
      expect(form.getByLabelText(/contact date/i)).toHaveValue("2026-08-20T14:30");

      fireEvent.change(form.getByLabelText(/notes/i), { target: { value: "Corrected." } });
      fireEvent.click(form.getByRole("button", { name: /save changes/i }));

      await waitFor(() => expect(mockUpdateContactLog).toHaveBeenCalledTimes(1));
      expect(mockUpdateContactLog).toHaveBeenCalledWith(
        501,
        expect.objectContaining({ Notes: "Corrected." })
      );
      // Made_By is not sent by the component — the action does not stamp it
      // either, so an edit never rewrites who made the contact.
      expect(mockUpdateContactLog.mock.calls[0][1]).not.toHaveProperty("Made_By");
      await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
    });

    it("surfaces an update failure without refreshing", async () => {
      const onRefresh = vi.fn();
      mockUpdateContactLog.mockRejectedValueOnce(new Error("Invalid Contact Log ID"));
      renderLogs({ onRefresh });

      fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));
      const form = within(await screen.findByRole("dialog"));
      fireEvent.click(form.getByRole("button", { name: /save changes/i }));

      await waitFor(() =>
        expect(alertSpy).toHaveBeenCalledWith("Error: Invalid Contact Log ID")
      );
      expect(onRefresh).not.toHaveBeenCalled();
    });
  });
  // ---------------------------------------------------------------------------
  // Coverage-driven cases. The blocks above encode the safety guarantees; these
  // exercise the remaining rendering, cancellation and fallback paths so a
  // regression in any of them fails a test rather than reaching a real contact.
  // ---------------------------------------------------------------------------

  /** A promise whose settlement the test controls, for in-flight assertions. */
  function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  }

  /** Renders, opens the edit dialog for the first log row, returns its scope. */
  async function openEditDialog(
    overrides: Partial<Parameters<typeof ContactLogs>[0]> = {}
  ) {
    renderLogs(overrides);
    fireEvent.click(screen.getAllByRole("button", { name: /^edit$/i })[0]);
    return within(await screen.findByRole("dialog"));
  }

  describe("log entry rendering", () => {
    const variedLogs: ContactLogDisplay[] = [
      {
        Contact_Log_ID: 601,
        Contact_Date: "2026-08-21T09:00:00",
        Notes: "Sent the welcome email.",
        Contact_Log_Type: "Email",
        // No nickname — the byline falls back to the first name.
        MadeByContact: [
          {
            Contact_ID: 1,
            First_Name: "Alex",
            Nickname: null,
            Last_Name: "Kim",
            Email_Address: null,
            Mobile_Phone: null,
            Image_GUID: null,
          },
        ],
      },
      {
        Contact_Log_ID: 602,
        Contact_Date: "2026-08-22T10:15:00",
        Notes: "Met after the service.",
        Contact_Log_Type: "Meeting",
        MadeByContact: [],
      },
      {
        Contact_Log_ID: 603,
        Contact_Date: "2026-08-23T11:00:00",
        Notes: "Dropped by the house.",
        Contact_Log_Type: "Visit",
      },
      {
        Contact_Log_ID: 604,
        Contact_Date: "2026-08-24T12:00:00",
        Notes: "Coffee downtown.",
        Contact_Log_Type: "Coffee",
      },
      {
        Contact_Log_ID: 605,
        Contact_Date: "2026-08-25T13:00:00",
        // A log MP left untyped, with no notes.
        Notes: "",
        Contact_Log_Type: null,
      },
    ];

    it("labels every log type, including unrecognised and missing ones", () => {
      renderLogs({ contactLogs: variedLogs });

      expect(screen.getByText(/Contact Logs \(5\)/)).toBeInTheDocument();
      for (const label of ["Email", "Meeting", "Visit", "Coffee"]) {
        expect(screen.getByText(label)).toBeInTheDocument();
      }
      // A null type is shown as "Unknown" rather than an empty badge.
      expect(screen.getByText("Unknown")).toBeInTheDocument();
    });

    it("falls back to the first name when the author has no nickname", () => {
      renderLogs({ contactLogs: variedLogs });

      expect(screen.getByText("Alex Kim")).toBeInTheDocument();
    });

    it("renders rows with no author and rows with no notes", () => {
      renderLogs({ contactLogs: variedLogs });

      // 602 has an empty author array, 603 has none at all — neither should
      // render a byline, and the empty-notes row should render no note text.
      expect(screen.getByText("Met after the service.")).toBeInTheDocument();
      expect(screen.getByText("Dropped by the house.")).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: /^edit$/i })).toHaveLength(5);
    });
  });

  describe("date rendering", () => {
    const withDate = (date: string): ContactLogDisplay[] => [
      { ...logs[0], Contact_Date: date },
    ];

    it("renders an MP wall-clock datetime in the MP time zone", () => {
      renderLogs({ contactLogs: withDate("2026-08-20T14:30:00") });

      expect(screen.getByText("Aug 20, 2026, 2:30 PM")).toBeInTheDocument();
    });

    it("falls back to Date parsing for a value carrying a UTC offset", () => {
      // Not MP's usual shape, but it must not render garbage: 18:30Z is
      // 2:30 PM in America/New_York.
      renderLogs({ contactLogs: withDate("2026-08-20T18:30:00+00:00") });

      expect(screen.getByText("Aug 20, 2026, 2:30 PM")).toBeInTheDocument();
    });

    it("renders a date-only value at midnight MP time", () => {
      renderLogs({ contactLogs: withDate("2026-08-22") });

      expect(screen.getByText("Aug 22, 2026, 12:00 AM")).toBeInTheDocument();
    });

    it("prefills the edit form with midnight for a date-only value", async () => {
      const form = await openEditDialog({ contactLogs: withDate("2026-08-22") });

      expect(form.getByLabelText(/contact date/i)).toHaveValue("2026-08-22T00:00");
    });

    it("renders a placeholder instead of throwing for a blank date", () => {
      expect(() => renderLogs({ contactLogs: withDate("") })).not.toThrow();

      expect(screen.getByText("—")).toBeInTheDocument();
    });

    it("renders a placeholder for a value no parser can read", () => {
      renderLogs({ contactLogs: withDate("not-a-date") });

      expect(screen.getByText("—")).toBeInTheDocument();
    });

    it("keeps rendering the other rows when one log has an unusable date", () => {
      // The regression guard: formatDateTime is called unguarded during row
      // render and the app has no error boundary, so a throw here would blank
      // the whole page rather than one row.
      renderLogs({
        contactLogs: [
          { ...logs[0], Contact_Log_ID: 701, Contact_Date: "2026-08-20T14:30:00" },
          {
            ...logs[0],
            Contact_Log_ID: 702,
            Contact_Date: "not-a-date",
            Notes: "Row with a broken date.",
          },
          {
            ...logs[0],
            Contact_Log_ID: 703,
            Contact_Date: "2026-08-22T09:00:00",
            Notes: "Row after the broken one.",
          },
        ],
      });

      expect(screen.getByText("Aug 20, 2026, 2:30 PM")).toBeInTheDocument();
      expect(screen.getByText("Aug 22, 2026, 9:00 AM")).toBeInTheDocument();
      expect(screen.getByText("—")).toBeInTheDocument();
      expect(screen.getByText("Row with a broken date.")).toBeInTheDocument();
      expect(screen.getByText("Row after the broken one.")).toBeInTheDocument();
      expect(screen.getByText(/Contact Logs \(3\)/)).toBeInTheDocument();
    });

    it("prefills an empty contact date when the log has no date", async () => {
      // Only reachable now that a blank date no longer crashes the row before
      // the edit dialog can be opened.
      const form = await openEditDialog({ contactLogs: withDate("") });

      expect(form.getByLabelText(/contact date/i)).toHaveValue("");
    });
  });

  describe("cancel and dismissal paths", () => {
    it("closes the create dialog without calling createContactLog", async () => {
      const form = await openCreateDialog();
      fireEvent.change(form.getByLabelText(/notes/i), {
        target: { value: "Typed but abandoned." },
      });

      fireEvent.click(form.getByRole("button", { name: /cancel/i }));

      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      );
      expect(mockCreateContactLog).not.toHaveBeenCalled();
    });

    it("discards the typed note when the create dialog is reopened", async () => {
      const form = await openCreateDialog();
      fireEvent.change(form.getByLabelText(/notes/i), {
        target: { value: "Typed but abandoned." },
      });
      fireEvent.click(form.getByRole("button", { name: /cancel/i }));
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      );

      fireEvent.click(screen.getByRole("button", { name: /add log/i }));
      const reopened = within(await screen.findByRole("dialog"));

      expect(reopened.getByLabelText(/notes/i)).toHaveValue("");
      expect(mockCreateContactLog).not.toHaveBeenCalled();
    });

    it("closes the edit dialog without calling updateContactLog", async () => {
      const form = await openEditDialog();

      fireEvent.click(form.getByRole("button", { name: /cancel/i }));

      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      );
      expect(mockUpdateContactLog).not.toHaveBeenCalled();
    });

    it("opens the create dialog from the empty state without calling any action", async () => {
      renderLogs({ contactLogs: [] });

      fireEvent.click(screen.getByRole("button", { name: /add log/i }));

      const dialog = await screen.findByRole("dialog");
      expect(
        within(dialog).getByText(/Create New Contact Log - Sam Ortiz/)
      ).toBeInTheDocument();
      expect(mockCreateContactLog).not.toHaveBeenCalled();
    });
  });

  describe("in-flight state", () => {
    it("disables the create button and shows progress while the action runs", async () => {
      const pending = deferred<{ Contact_Log_ID: number }>();
      mockCreateContactLog.mockReturnValueOnce(pending.promise);
      const form = await openCreateDialog();

      fireEvent.change(form.getByLabelText(/notes/i), {
        target: { value: "A note." },
      });
      fireEvent.click(form.getByRole("button", { name: /create log/i }));

      const busy = await screen.findByRole("button", { name: /creating/i });
      expect(busy).toBeDisabled();
      // A second click while in flight must not queue a second write.
      fireEvent.click(busy);
      expect(mockCreateContactLog).toHaveBeenCalledTimes(1);

      pending.resolve({ Contact_Log_ID: 900 });
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      );
    });

    it("disables the save button and shows progress while the update runs", async () => {
      const pending = deferred<{ Contact_Log_ID: number }>();
      mockUpdateContactLog.mockReturnValueOnce(pending.promise);
      const form = await openEditDialog();

      fireEvent.click(form.getByRole("button", { name: /save changes/i }));

      const busy = await screen.findByRole("button", { name: /saving/i });
      expect(busy).toBeDisabled();
      fireEvent.click(busy);
      expect(mockUpdateContactLog).toHaveBeenCalledTimes(1);

      pending.resolve({ Contact_Log_ID: 501 });
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      );
    });
  });

  describe("log type selection", () => {
    it("sends the ID of the log type chosen in the dropdown", async () => {
      mockCreateContactLog.mockResolvedValueOnce({ Contact_Log_ID: 901 });
      const form = await openCreateDialog();
      await waitFor(() => expect(mockGetContactLogTypes).toHaveBeenCalled());

      await selectLogType(form, "Phone Call");
      fireEvent.change(form.getByLabelText(/notes/i), {
        target: { value: "Rang twice." },
      });
      fireEvent.click(form.getByRole("button", { name: /create log/i }));

      await waitFor(() => expect(mockCreateContactLog).toHaveBeenCalledTimes(1));
      expect(mockCreateContactLog).toHaveBeenCalledWith(
        expect.objectContaining({ Contact_Log_Type_ID: 1 })
      );
    });

    it("sends a null type ID when the log's type is not in the fetched list", async () => {
      mockUpdateContactLog.mockResolvedValueOnce({ Contact_Log_ID: 501 });
      const form = await openEditDialog({
        contactLogs: [
          { ...logs[0], Contact_Log_Type: "Email" },
        ],
      });

      fireEvent.click(form.getByRole("button", { name: /save changes/i }));

      await waitFor(() => expect(mockUpdateContactLog).toHaveBeenCalledTimes(1));
      expect(mockUpdateContactLog).toHaveBeenCalledWith(
        501,
        expect.objectContaining({ Contact_Log_Type_ID: null })
      );
    });
  });

  describe("optional props and fallbacks", () => {
    it("labels the dialog generically when no name is supplied", async () => {
      const form = await openCreateDialog({
        contactNickname: undefined,
        contactLastName: undefined,
      });

      expect(form.getByText(/Create New Contact Log - Contact/)).toBeInTheDocument();
    });

    it("completes a create when no onRefresh callback is provided", async () => {
      mockCreateContactLog.mockResolvedValueOnce({ Contact_Log_ID: 902 });
      const form = await openCreateDialog();

      fireEvent.change(form.getByLabelText(/notes/i), {
        target: { value: "No refresh handler." },
      });
      fireEvent.click(form.getByRole("button", { name: /create log/i }));

      await waitFor(() => expect(mockCreateContactLog).toHaveBeenCalledTimes(1));
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      );
    });

    it("completes an update when no onRefresh callback is provided", async () => {
      mockUpdateContactLog.mockResolvedValueOnce({ Contact_Log_ID: 501 });
      const form = await openEditDialog();

      fireEvent.click(form.getByRole("button", { name: /save changes/i }));

      await waitFor(() => expect(mockUpdateContactLog).toHaveBeenCalledTimes(1));
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      );
    });

    it("completes a delete when no onRefresh callback is provided", async () => {
      mockDeleteContactLog.mockResolvedValueOnce(undefined);
      renderLogs();

      clickDeleteIcon();
      const dialog = await screen.findByRole("alertdialog");
      fireEvent.click(within(dialog).getByRole("button", { name: /^delete$/i }));

      await waitFor(() => expect(mockDeleteContactLog).toHaveBeenCalledWith(501));
      expect(alertSpy).not.toHaveBeenCalled();
    });

    it("prefills empty strings for a log with no notes and no type", async () => {
      const form = await openEditDialog({
        contactLogs: [
          {
            ...logs[0],
            Notes: "",
            Contact_Log_Type: null,
          },
        ],
      });

      expect(form.getByLabelText(/notes/i)).toHaveValue("");
      // Nothing chosen, so the placeholder is still showing.
      expect(form.getByText("Select log type")).toBeInTheDocument();
    });

    it("falls back to a generic message when the update rejects with a non-Error", async () => {
      mockUpdateContactLog.mockRejectedValueOnce("boom");
      const form = await openEditDialog();

      fireEvent.click(form.getByRole("button", { name: /save changes/i }));

      await waitFor(() =>
        expect(alertSpy).toHaveBeenCalledWith("Error: Failed to update contact log")
      );
    });

    it("falls back to a generic message when the delete rejects with a non-Error", async () => {
      mockDeleteContactLog.mockRejectedValueOnce("boom");
      renderLogs();

      clickDeleteIcon();
      const dialog = await screen.findByRole("alertdialog");
      fireEvent.click(within(dialog).getByRole("button", { name: /^delete$/i }));

      await waitFor(() =>
        expect(alertSpy).toHaveBeenCalledWith("Error: Failed to delete contact log")
      );
    });

    it("does not delete when the confirmed log has a falsy ID", async () => {
      // Contact_Log_ID 0 is not a real MP key, but the guard in confirmDelete is
      // a falsy check rather than a null check — this pins that behaviour so the
      // guard cannot silently start deleting an unintended record.
      renderLogs({ contactLogs: [{ ...logs[0], Contact_Log_ID: 0 }] });

      clickDeleteIcon();
      const dialog = await screen.findByRole("alertdialog");
      fireEvent.click(within(dialog).getByRole("button", { name: /^delete$/i }));

      await waitFor(() =>
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
      );
      expect(mockDeleteContactLog).not.toHaveBeenCalled();
    });
  });

});

/**
 * Clicks the icon-only delete button in the first log row. It has no accessible
 * name, so it is identified as the button that is not "Edit".
 */
function clickDeleteIcon() {
  const buttons = screen.getAllByRole("button");
  const deleteButton = buttons.find(
    (b) => b.querySelector("svg") && !/edit|add log/i.test(b.textContent ?? "")
  );
  if (!deleteButton) throw new Error("delete button not found");
  fireEvent.click(deleteButton);
}

/**
 * Opens the Radix Select for log type and picks an option by its label.
 * jsdom does not implement PointerEvent, so Radix never sees the pointer press
 * that opens the listbox in a browser; the keyboard path it also supports is
 * driven instead.
 */
async function selectLogType(
  form: ReturnType<typeof within>,
  label: string
) {
  fireEvent.keyDown(form.getByRole("combobox"), { key: "ArrowDown" });
  const option = await screen.findByRole("option", { name: label });
  fireEvent.keyDown(option, { key: "Enter" });
  await waitFor(() =>
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
  );
}

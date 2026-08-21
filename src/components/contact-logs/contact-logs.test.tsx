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
 * See `.claude/TODO/contact-logs-component-untested.md` (the original gap) and
 * `.claude/references/testing.md`.
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
    Contact_ID: 42,
    Contact_Date: "2026-08-20T14:30:00",
    Notes: "Called about the new members class.",
    Contact_Log_Type: "Phone Call",
    Contact_Log_Type_ID: 1,
    // Deliberately a DIFFERENT user than the acting one: the component offers
    // edit/delete on other people's logs, matching the decided policy.
    Made_By: 12345,
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

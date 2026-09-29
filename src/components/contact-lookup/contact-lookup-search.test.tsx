import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CONTACT_SEARCH_MAX_LENGTH, type ContactSearch } from "@/lib/dto";

/**
 * ContactLookupSearch tests.
 *
 * This input is the only caller of the `searchContacts` server action, which
 * returns real Ministry Platform contacts (names, emails, mobile numbers). The
 * action is mocked here — these tests must never reach MP.
 *
 * What they guard:
 *
 * 1. the empty/whitespace gate — a blank box must not fire a server round trip
 *    (the action returns [] for a blank term, so a regression here is invisible
 *    in the UI but still hits the server on every stray Enter press), while
 *    still reporting [] to the parent so a stale result list is cleared rather
 *    than left on screen after the user empties the box
 * 2. the trim contract — the action is called with the trimmed term, so a paste
 *    with trailing whitespace still finds the contact
 * 3. the in-flight lock — input and button are disabled while the transition is
 *    pending, so a double Enter cannot fire two overlapping searches
 * 4. error surfacing — a rejected action reaches onSearchError rather than
 *    leaving the parent stuck on "Searching..." forever
 */

const { mockSearchContacts } = vi.hoisted(() => ({
  mockSearchContacts: vi.fn(),
}));

vi.mock("./actions", () => ({
  searchContacts: mockSearchContacts,
}));

import { ContactLookupSearch } from "./contact-lookup-search";

const results: ContactSearch[] = [
  {
    Contact_ID: 1,
    Contact_GUID: "11111111-1111-1111-1111-111111111111",
    First_Name: "Jonathan",
    Nickname: "Jon",
    Last_Name: "Doe",
    Email_Address: "jon@example.com",
    Mobile_Phone: "555-0100",
    Image_GUID: "",
  },
];

/** A promise whose settlement this test controls, to hold a search in flight. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function renderSearch(
  overrides: Partial<Parameters<typeof ContactLookupSearch>[0]> = {}
) {
  const onSearchResults = vi.fn();
  const onSearchError = vi.fn();
  const onSearchStart = vi.fn();
  render(
    <ContactLookupSearch
      onSearchResults={onSearchResults}
      onSearchError={onSearchError}
      onSearchStart={onSearchStart}
      {...overrides}
    />
  );
  return {
    onSearchResults,
    onSearchError,
    onSearchStart,
    input: screen.getByRole("textbox"),
    button: () => screen.getByRole("button"),
  };
}

function type(input: HTMLElement, value: string) {
  fireEvent.change(input, { target: { value } });
}

function pressEnter(input: HTMLElement) {
  fireEvent.keyPress(input, { key: "Enter", code: "Enter", charCode: 13 });
}

describe("ContactLookupSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchContacts.mockResolvedValue([]);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("caps the input at the server's search-term limit", () => {
    const { input } = renderSearch();

    expect(input).toHaveAttribute("maxLength", String(CONTACT_SEARCH_MAX_LENGTH));
  });

  describe("empty and whitespace input", () => {
    it("keeps the search button disabled until something is typed", () => {
      const { button, onSearchResults } = renderSearch();

      expect(button()).toBeDisabled();

      // The button path is unchanged by the empty-term clear: the disabled
      // button swallows the click, so only Enter can clear the list.
      fireEvent.click(button());
      expect(onSearchResults).not.toHaveBeenCalled();
      expect(mockSearchContacts).not.toHaveBeenCalled();
    });

    it("leaves the button disabled for a whitespace-only term", () => {
      const { input, button } = renderSearch();

      type(input, "   ");

      expect(button()).toBeDisabled();
    });

    it("clears the results without calling the action when Enter is pressed on an empty box", async () => {
      const { input, onSearchStart, onSearchResults, onSearchError } =
        renderSearch();

      pressEnter(input);

      // The parent is told to empty its list — this is how a user wipes stale
      // matches after clearing the box — but no MP round trip is made.
      expect(onSearchResults).toHaveBeenCalledWith([]);
      await waitFor(() => expect(mockSearchContacts).not.toHaveBeenCalled());
      expect(onSearchStart).not.toHaveBeenCalled();
      expect(onSearchError).not.toHaveBeenCalled();
    });

    it("clears the results without calling the action when Enter is pressed on a whitespace-only term", async () => {
      const { input, onSearchStart, onSearchResults, onSearchError } =
        renderSearch();

      type(input, "  \t ");
      pressEnter(input);

      expect(onSearchResults).toHaveBeenCalledWith([]);
      await waitFor(() => expect(mockSearchContacts).not.toHaveBeenCalled());
      expect(onSearchStart).not.toHaveBeenCalled();
      expect(onSearchError).not.toHaveBeenCalled();
    });

    it("does not clear the results on a non-Enter key in an empty box", async () => {
      const { input, onSearchResults } = renderSearch();

      fireEvent.keyPress(input, { key: "a", code: "KeyA", charCode: 97 });

      expect(onSearchResults).not.toHaveBeenCalled();
      await waitFor(() => expect(mockSearchContacts).not.toHaveBeenCalled());
    });

    it("does not throw clearing an empty box without an onSearchResults callback", () => {
      render(<ContactLookupSearch />);

      pressEnter(screen.getByRole("textbox"));

      expect(mockSearchContacts).not.toHaveBeenCalled();
    });

    it("ignores non-Enter keys", async () => {
      const { input } = renderSearch();

      type(input, "Jon");
      fireEvent.keyPress(input, { key: "a", code: "KeyA", charCode: 97 });

      await waitFor(() => expect(mockSearchContacts).not.toHaveBeenCalled());
    });
  });

  describe("submitting a search", () => {
    it("calls the action with the typed term when the button is clicked", async () => {
      mockSearchContacts.mockResolvedValueOnce(results);
      const { input, button, onSearchStart, onSearchResults, onSearchError } =
        renderSearch();

      type(input, "Doe");
      fireEvent.click(button());

      expect(onSearchStart).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(onSearchResults).toHaveBeenCalledWith(results));
      expect(mockSearchContacts).toHaveBeenCalledWith("Doe");
      expect(mockSearchContacts).toHaveBeenCalledTimes(1);
      expect(onSearchError).not.toHaveBeenCalled();
    });

    it("submits on Enter as well as on click", async () => {
      mockSearchContacts.mockResolvedValueOnce(results);
      const { input, onSearchResults } = renderSearch();

      type(input, "Doe");
      pressEnter(input);

      await waitFor(() => expect(onSearchResults).toHaveBeenCalledWith(results));
      expect(mockSearchContacts).toHaveBeenCalledWith("Doe");
    });

    it("trims surrounding whitespace before calling the action", async () => {
      const { input, button } = renderSearch();

      type(input, "   Doe   ");
      fireEvent.click(button());

      await waitFor(() => expect(mockSearchContacts).toHaveBeenCalledWith("Doe"));
    });

    it("works without any of the optional callbacks", async () => {
      mockSearchContacts.mockResolvedValueOnce(results);
      render(<ContactLookupSearch />);

      const input = screen.getByRole("textbox");
      type(input, "Doe");
      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => expect(mockSearchContacts).toHaveBeenCalledWith("Doe"));
    });
  });

  describe("in-flight state", () => {
    it("disables the input and button and shows 'Searching...' until the action settles", async () => {
      const pending = deferred<ContactSearch[]>();
      mockSearchContacts.mockReturnValueOnce(pending.promise);
      const { input, onSearchResults } = renderSearch();

      type(input, "Doe");
      fireEvent.click(screen.getByRole("button"));

      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Searching..." })).toBeDisabled()
      );
      expect(input).toBeDisabled();

      // A second click while pending must not start another MP round trip —
      // the disabled button swallows it.
      fireEvent.click(screen.getByRole("button"));
      expect(mockSearchContacts).toHaveBeenCalledTimes(1);

      pending.resolve(results);

      await waitFor(() => expect(onSearchResults).toHaveBeenCalledWith(results));
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Search" })).toBeEnabled()
      );
      expect(input).toBeEnabled();
    });

    it("honours the disabled prop", () => {
      const { input, button } = renderSearch({ disabled: true });

      type(input, "Doe");

      expect(input).toBeDisabled();
      expect(button()).toBeDisabled();
    });
  });

  describe("errors", () => {
    it("surfaces the action's message via onSearchError", async () => {
      mockSearchContacts.mockRejectedValueOnce(
        new Error("Failed to search contacts")
      );
      const { input, button, onSearchError, onSearchResults } = renderSearch();

      type(input, "Doe");
      fireEvent.click(button());

      await waitFor(() =>
        expect(onSearchError).toHaveBeenCalledWith("Failed to search contacts")
      );
      expect(onSearchResults).not.toHaveBeenCalled();
      // The failure is not swallowed — the box becomes usable again.
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Search" })).toBeEnabled()
      );
    });

    it("falls back to a generic message when the action rejects with a non-Error", async () => {
      mockSearchContacts.mockRejectedValueOnce("boom");
      const { input, button, onSearchError } = renderSearch();

      type(input, "Doe");
      fireEvent.click(button());

      await waitFor(() =>
        expect(onSearchError).toHaveBeenCalledWith(
          "An error occurred while searching"
        )
      );
    });

    it("does not throw when the action rejects and no onSearchError is supplied", async () => {
      mockSearchContacts.mockRejectedValueOnce(new Error("MP unavailable"));
      render(<ContactLookupSearch />);

      type(screen.getByRole("textbox"), "Doe");
      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => expect(mockSearchContacts).toHaveBeenCalled());
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument()
      );
    });
  });

  describe("placeholder", () => {
    it("uses the default placeholder", () => {
      renderSearch();

      expect(screen.getByPlaceholderText("Search contacts...")).toBeInTheDocument();
    });

    it("uses a supplied placeholder", () => {
      renderSearch({ placeholder: "Find a member" });

      expect(screen.getByPlaceholderText("Find a member")).toBeInTheDocument();
    });
  });
});

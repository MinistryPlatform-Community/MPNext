import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";

/**
 * SessionGuard tests (security-shared-device-session-persistence, tab half).
 *
 * `AuthWrapper` checks the session once, server-side. Before this guard, a
 * tab left open after sign-out elsewhere (or session expiry) kept showing
 * contact records and pastoral notes indefinitely. The guard must:
 *
 *  - drop the page and replace the location with /signed-out when the client
 *    session goes from present to null,
 *  - NOT do that for the initial pending → null load, or while the session is
 *    merely pending/refetching,
 *  - re-check the session when another tab broadcasts a sign-out,
 *  - clear /signin's automatic-restart counter when it sees a session.
 *
 * `authClient.useSession` is mocked: nothing here may reach a real endpoint.
 */

type SessionState = {
  data: unknown;
  isPending: boolean;
  refetch: () => Promise<void>;
};

const { mockUseSession, mockSubscribe, mockClearAttempts, signOutListeners } =
  vi.hoisted(() => ({
    mockUseSession: vi.fn(),
    mockSubscribe: vi.fn(),
    mockClearAttempts: vi.fn(),
    signOutListeners: [] as Array<() => void>,
  }));

vi.mock("@/lib/auth-client", () => ({
  authClient: { useSession: mockUseSession },
}));

vi.mock("@/contexts/sign-out-broadcast", () => ({
  subscribeToSignOut: mockSubscribe,
}));

vi.mock("@/components/sign-in/sign-in-attempts", () => ({
  clearSignInAttempts: mockClearAttempts,
}));

import { SessionGuard } from "./session-guard";

const refetch = vi.fn(async () => {});
const SESSION = { user: { id: "ba-1" }, session: { id: "s-1" } };

function setSession(state: Partial<SessionState>) {
  mockUseSession.mockReturnValue({ data: null, isPending: false, refetch, ...state });
}

function guarded() {
  return (
    <SessionGuard>
      <p data-testid="member-data">Pastoral note</p>
    </SessionGuard>
  );
}

describe("SessionGuard", () => {
  let originalLocation: PropertyDescriptor | undefined;
  const replace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    signOutListeners.length = 0;
    mockSubscribe.mockImplementation((listener: () => void) => {
      signOutListeners.push(listener);
      return () => {
        signOutListeners.splice(signOutListeners.indexOf(listener), 1);
      };
    });
    originalLocation = Object.getOwnPropertyDescriptor(window, "location");
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: { href: "http://localhost:3000/contactlookup/abc", replace },
    });
  });

  afterEach(() => {
    if (originalLocation) Object.defineProperty(window, "location", originalLocation);
  });

  it("renders the page while the session is present", () => {
    setSession({ data: SESSION });

    render(guarded());

    expect(screen.getByTestId("member-data")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("leaves for /signed-out (not /signin) and stops rendering member data when the session ends", () => {
    setSession({ data: SESSION });
    const { rerender } = render(guarded());

    setSession({ data: null, isPending: false });
    rerender(guarded());

    expect(replace).toHaveBeenCalledWith("/signed-out");
    expect(replace).toHaveBeenCalledTimes(1);
    // /signin auto-starts OAuth; with the MP SSO session alive that would
    // silently sign this tab straight back in.
    expect(replace).not.toHaveBeenCalledWith("/signin");
    expect(screen.queryByTestId("member-data")).toBeNull();
  });

  it("does not redirect on the initial load before any session was seen", () => {
    // AuthWrapper has already vouched for this request; the client hook starts
    // pending/null and must not bounce the user on that.
    setSession({ data: null, isPending: true });
    const { rerender } = render(guarded());

    setSession({ data: null, isPending: false });
    rerender(guarded());

    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByTestId("member-data")).toBeInTheDocument();
  });

  it("does not redirect while a refetch is pending", () => {
    setSession({ data: SESSION });
    const { rerender } = render(guarded());

    setSession({ data: null, isPending: true });
    rerender(guarded());

    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByTestId("member-data")).toBeInTheDocument();
  });

  it("clears /signin's restart counter once a working session is seen", () => {
    setSession({ data: SESSION });

    render(guarded());

    expect(mockClearAttempts).toHaveBeenCalled();
  });

  it("re-checks the session when another tab broadcasts a sign-out", () => {
    setSession({ data: SESSION });
    render(guarded());

    expect(signOutListeners).toHaveLength(1);
    act(() => signOutListeners[0]());

    expect(refetch).toHaveBeenCalledTimes(1);
    // The broadcast is only a hint: nothing leaves until the server says so.
    expect(replace).not.toHaveBeenCalled();
  });

  it("follows through when that re-check finds the session gone", () => {
    setSession({ data: SESSION });
    const { rerender } = render(guarded());

    act(() => signOutListeners[0]());
    setSession({ data: null, isPending: false });
    rerender(guarded());

    expect(replace).toHaveBeenCalledWith("/signed-out");
  });

  it("unsubscribes from the broadcast on unmount", () => {
    setSession({ data: SESSION });
    const { unmount } = render(guarded());

    unmount();

    expect(signOutListeners).toHaveLength(0);
  });
});

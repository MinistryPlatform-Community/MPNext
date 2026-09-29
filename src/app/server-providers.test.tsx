import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * ServerProviders tests.
 *
 * ServerProviders starts the MP profile load during the server render and
 * passes the un-awaited promise to the client Providers. What is worth pinning:
 * it starts exactly one load per render, it does not await it (awaiting would
 * hold the whole shell on Ministry Platform), it normalizes "no MP profile" to
 * the null useUser() expects, and it passes a rejection through rather than
 * swallowing it. Its position below AuthWrapper is pinned in
 * src/app/(web)/layout.test.tsx.
 */

const { mockGetCurrentUserProfile, mockProviders } = vi.hoisted(() => ({
  mockGetCurrentUserProfile: vi.fn(),
  mockProviders: vi.fn(),
}));

vi.mock("@/components/shared-actions/user", () => ({
  getCurrentUserProfile: mockGetCurrentUserProfile,
}));

vi.mock("@/app/providers", () => ({
  Providers: ({
    children,
    profilePromise,
  }: {
    children: React.ReactNode;
    profilePromise: Promise<unknown>;
  }) => {
    mockProviders(profilePromise);
    return <div data-testid="providers">{children}</div>;
  },
}));

import { ServerProviders } from "./server-providers";

function passedPromise(): Promise<unknown> {
  return mockProviders.mock.calls[0][0] as Promise<unknown>;
}

describe("ServerProviders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders its children inside Providers", () => {
    mockGetCurrentUserProfile.mockResolvedValue(null);
    render(
      <ServerProviders>
        <span data-testid="child">page</span>
      </ServerProviders>,
    );

    expect(screen.getByTestId("providers")).toContainElement(screen.getByTestId("child"));
  });

  it("starts one profile load and passes the promise without awaiting it", () => {
    // Never settles: if ServerProviders awaited it, this render could not complete.
    mockGetCurrentUserProfile.mockReturnValue(new Promise(() => {}));

    render(
      <ServerProviders>
        <span data-testid="child" />
      </ServerProviders>,
    );

    expect(mockGetCurrentUserProfile).toHaveBeenCalledTimes(1);
    expect(mockGetCurrentUserProfile).toHaveBeenCalledWith();
    expect(passedPromise()).toBeInstanceOf(Promise);
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("resolves to the profile", async () => {
    const profile = { User_ID: 1, First_Name: "John" };
    mockGetCurrentUserProfile.mockResolvedValue(profile);
    render(<ServerProviders>{null}</ServerProviders>);

    await expect(passedPromise()).resolves.toBe(profile);
  });

  it("normalizes a missing MP profile to null", async () => {
    mockGetCurrentUserProfile.mockResolvedValue(undefined);
    render(<ServerProviders>{null}</ServerProviders>);

    await expect(passedPromise()).resolves.toBeNull();
  });

  it("passes a load failure through for the client error boundary", async () => {
    mockGetCurrentUserProfile.mockRejectedValue(new Error("MP down"));
    render(<ServerProviders>{null}</ServerProviders>);

    await expect(passedPromise()).rejects.toThrow("MP down");
  });
});

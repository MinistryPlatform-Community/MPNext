import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * Providers composition tests.
 *
 * Providers is the client-side context boundary for the (web) route group. Every
 * component that calls useUser()/useAppSession() is rendered underneath it, so a
 * regression here (a provider dropped, or children accidentally rendered outside
 * the provider tree) surfaces far away as "useUser must be used within a
 * UserProvider" in an unrelated feature.
 *
 * UserProvider is mocked deliberately: this file guards the *composition*, not
 * the provider's behaviour. The real UserProvider suspends on the profile
 * promise and calls the getCurrentUserProfile server action on refresh — pulling those in here would turn
 * a structural test into an integration test against Ministry Platform. Its own
 * behaviour is covered in src/contexts/user-context.test.tsx.
 */

const { mockUserProvider } = vi.hoisted(() => ({
  mockUserProvider: vi.fn(),
}));

vi.mock("@/contexts/user-context", () => ({
  UserProvider: ({
    children,
    profilePromise,
  }: {
    children: React.ReactNode;
    profilePromise: Promise<unknown>;
  }) => {
    mockUserProvider(profilePromise);
    return <div data-testid="user-provider">{children}</div>;
  },
}));

import { Providers } from "./providers";

const profilePromise = Promise.resolve(null);

describe("Providers", () => {
  it("renders its children", () => {
    render(
      <Providers profilePromise={profilePromise}>
        <span data-testid="child">page</span>
      </Providers>,
    );

    expect(screen.getByTestId("child")).toHaveTextContent("page");
  });

  it("mounts UserProvider", () => {
    render(
      <Providers profilePromise={profilePromise}>
        <span />
      </Providers>,
    );

    expect(screen.getByTestId("user-provider")).toBeInTheDocument();
    expect(mockUserProvider).toHaveBeenCalled();
  });

  it("hands the server-started profile promise to UserProvider", () => {
    render(
      <Providers profilePromise={profilePromise}>
        <span />
      </Providers>,
    );

    // Forwarded as-is: re-wrapping it would hand UserProvider a new promise on
    // every render and re-suspend the avatar each time.
    expect(mockUserProvider).toHaveBeenCalledWith(profilePromise);
  });

  it("renders children INSIDE UserProvider, not beside it", () => {
    render(
      <Providers profilePromise={profilePromise}>
        <span data-testid="child">page</span>
      </Providers>,
    );

    // The nesting is the whole point: a sibling arrangement still renders, but
    // every useUser() consumer below would throw at runtime.
    const provider = screen.getByTestId("user-provider");
    expect(provider).toContainElement(screen.getByTestId("child"));
  });

  it("renders multiple children in order", () => {
    render(
      <Providers profilePromise={profilePromise}>
        <span data-testid="first">1</span>
        <span data-testid="second">2</span>
      </Providers>,
    );

    const provider = screen.getByTestId("user-provider");
    expect(provider.textContent).toBe("12");
  });

  it("is a named export (no default export to drift from)", async () => {
    const mod = await import("./providers");

    expect(typeof mod.Providers).toBe("function");
    expect("default" in mod).toBe(false);
  });
});

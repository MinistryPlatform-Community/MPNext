import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * (web) route-group layout tests.
 *
 * This layout is the authenticated shell. The single most important thing it
 * does is sit every page in the group underneath <AuthWrapper>, which is the
 * server-side session guard (see src/components/layout/auth-wrapper.test.tsx).
 * If a refactor ever moves AuthWrapper out of this tree — or nests it *inside*
 * Providers/children instead of above them — every page in (web) silently
 * becomes publicly reachable. Nothing else in the codebase would fail: the build
 * passes, types pass, the pages still render. So the guard's presence AND its
 * position are asserted explicitly here.
 *
 * The rest of the tests pin the chrome contract: ServerProviders (which starts
 * the MP profile load) wraps the page content below the guard, Header sits
 * behind a Suspense boundary whose fallback is the fixed HeaderSkeleton — never
 * an in-flow placeholder, which pushed <main> down 64px on every load — the
 * breadcrumb is present, and the page children land in <main>.
 *
 * next/font/google is mocked because it is a build-time transform: unmocked it
 * attempts a Google Fonts fetch at import time under Vitest.
 */

const { mockAuthWrapper, mockHeader, mockBreadcrumb, mockProviders } = vi.hoisted(
  () => ({
    mockAuthWrapper: vi.fn(),
    mockHeader: vi.fn(),
    mockBreadcrumb: vi.fn(),
    mockProviders: vi.fn(),
  }),
);

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans", className: "geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono", className: "geist-mono" }),
}));

vi.mock("@/components/layout", () => ({
  AuthWrapper: ({ children }: { children: React.ReactNode }) => {
    mockAuthWrapper();
    return <div data-testid="auth-wrapper">{children}</div>;
  },
  Header: () => {
    mockHeader();
    return <header data-testid="header">Header</header>;
  },
  HeaderSkeleton: () => <header data-testid="header-skeleton" />,
  DynamicBreadcrumb: () => {
    mockBreadcrumb();
    return <nav data-testid="breadcrumb">Breadcrumb</nav>;
  },
}));

vi.mock("@/app/server-providers", () => ({
  ServerProviders: ({ children }: { children: React.ReactNode }) => {
    mockProviders();
    return <div data-testid="providers">{children}</div>;
  },
}));

import WebLayout, { metadata, viewport } from "./layout";

async function renderLayout(children: React.ReactNode = <p data-testid="page">page</p>) {
  const tree = await WebLayout({ children });
  render(tree);
}

describe("WebLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page children", async () => {
    await renderLayout();

    expect(screen.getByTestId("page")).toHaveTextContent("page");
  });

  it("wraps the entire subtree in the AuthWrapper guard", async () => {
    await renderLayout();

    const guard = screen.getByTestId("auth-wrapper");
    expect(mockAuthWrapper).toHaveBeenCalledTimes(1);
    // Guard must be an ANCESTOR of the page — a sibling guard protects nothing.
    expect(guard).toContainElement(screen.getByTestId("page"));
  });

  it("puts AuthWrapper outside Providers, not inside it", async () => {
    await renderLayout();

    const guard = screen.getByTestId("auth-wrapper");
    const providers = screen.getByTestId("providers");

    expect(guard).toContainElement(providers);
    expect(providers).not.toContainElement(guard);
  });

  it("renders the page inside Providers so client contexts are available", async () => {
    await renderLayout();

    expect(mockProviders).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("providers")).toContainElement(screen.getByTestId("page"));
  });

  it("renders Header and DynamicBreadcrumb chrome", async () => {
    await renderLayout();

    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("breadcrumb")).toBeInTheDocument();
  });

  it("renders Header inside a Suspense boundary whose fallback is the header skeleton", async () => {
    const tree = await WebLayout({ children: null });

    // Walk the returned element tree rather than the DOM: Suspense leaves no
    // trace in the rendered output once its child has resolved.
    type El = { type?: unknown; props?: { children?: unknown; fallback?: unknown } };
    const suspense = (function find(node: unknown): El | undefined {
      if (!node || typeof node !== "object") return undefined;
      const el = node as El;
      if (typeof el.type === "symbol" && String(el.type).includes("react.suspense")) {
        return el;
      }
      const children = el.props?.children;
      if (Array.isArray(children)) {
        for (const child of children) {
          const hit = find(child);
          if (hit) return hit;
        }
        return undefined;
      }
      return find(children);
    })(tree);

    expect(suspense).toBeDefined();
    // The fallback must be the fixed skeleton: an in-flow placeholder (the old
    // `<div className="h-16" />`) is what shifted <main> on every page load.
    render(suspense!.props!.fallback as React.ReactElement);
    expect(screen.getByTestId("header-skeleton")).toBeInTheDocument();
  });

  it("places the page children inside <main>", async () => {
    await renderLayout();

    const main = document.querySelector("main");
    expect(main).not.toBeNull();
    expect(main).toContainElement(screen.getByTestId("page"));
  });

  it("applies both Geist font variables to the layout wrapper", async () => {
    await renderLayout();

    const wrapper = document.querySelector(".flex.flex-col");
    expect(wrapper?.className).toContain("--font-geist-sans");
    expect(wrapper?.className).toContain("--font-geist-mono");
  });
});

describe("WebLayout metadata", () => {
  it("describes the app and points at the favicon", () => {
    expect(metadata.description).toBe("Ministry Platform Pastor Application");
    expect(metadata.icons).toEqual({ icon: "/assets/icons/favicon.ico" });
  });

  it("falls back to 'MPNext' when NEXT_PUBLIC_APP_NAME is unset", () => {
    // test-setup.ts never sets NEXT_PUBLIC_APP_NAME, so this is the default path.
    expect(metadata.title).toBe("MPNext");
  });

  it("sets the PWA theme colour", () => {
    expect(viewport.themeColor).toBe("#000000");
  });
});

describe("WebLayout metadata with NEXT_PUBLIC_APP_NAME set", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses the configured app name as the document title", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_NAME", "Grace Church Portal");
    vi.resetModules();

    const mod = await import("./layout");

    expect(mod.metadata.title).toBe("Grace Church Portal");
  });
});

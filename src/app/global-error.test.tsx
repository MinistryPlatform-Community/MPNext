import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";

/**
 * Last-resort boundary for a failure in the root layout.
 *
 * The structural assertions here are the point. `global-error` REPLACES the root
 * layout, so it must render its own `<html>` and `<body>`; if someone "tidies"
 * those away to match the other boundaries, the page renders as a fragment with
 * no document and Next's fallback takes over again — exactly the situation this
 * file exists to prevent. That failure is invisible in review, so it is pinned.
 *
 * It must also import nothing from the app: whatever failed may be that very
 * code. The import-surface assertion below is deliberately crude but catches the
 * common regression (someone reaching for the shadcn Button).
 */

import GlobalError from "./global-error";

describe("global error boundary", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // React also warns here about <html> nested in the test container; the spy
    // swallows that too, so every assertion below uses toHaveBeenCalledWith
    // rather than a call count.
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  function renderBoundary(
    overrides: { error?: Error & { digest?: string }; retry?: () => void } = {}
  ) {
    const retry = overrides.retry ?? vi.fn();
    const error = overrides.error ?? new Error("boom");
    render(<GlobalError error={error} retry={retry} />);
    return { retry, error };
  }

  it("renders its own html and body, because it replaces the root layout", () => {
    // Asserted through server markup, not the DOM. React 19 treats <html>,
    // <body> and <title> as document-level and HOISTS them out of the client
    // render container — after `render()` the container's first child is the
    // inner <div>, and querying it for "html"/"body" finds nothing even though
    // the component returns them. Calling the component as a plain function
    // does not work either: it uses useEffect, and hooks need a real render.
    // renderToStaticMarkup performs a real render and emits the actual tags.
    const markup = renderToStaticMarkup(
      <GlobalError error={new Error("boom")} retry={vi.fn()} />
    );

    expect(markup).toContain("<html");
    expect(markup).toContain("<body");
  });

  it("sets a document title without a metadata export", () => {
    // `metadata`/`generateMetadata` are unavailable in a client component, so
    // the title comes from React's <title> element. React hoists it to the
    // document, which is why this is asserted on document.title.
    renderBoundary();

    expect(document.title).toBe("Something went wrong");
  });

  it("pulls in no app code, since the app is what failed", () => {
    // A shadcn/provider import here would be loaded by the very boundary that
    // exists to survive the app failing to load.
    // Read via a cwd-relative path, not `new URL(..., import.meta.url)`:
    // under Vitest `import.meta.url` is not a file: URL and readFileSync
    // rejects it with "The URL must be of scheme file".
    const source = readFileSync("src/app/global-error.tsx", "utf8");
    const appImports = source
      .split("\n")
      .filter((line) => /^import /.test(line))
      .filter((line) => line.includes("@/") || line.includes("globals.css"));

    expect(appImports).toEqual([]);
  });

  it("renders the failure heading and, once hydrated, a retry control", () => {
    const { retry } = renderBoundary();

    expect(
      screen.getByRole("heading", { name: /something went wrong/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  /**
   * security-prerendered-nonceless-pages: Next prerenders this boundary
   * (`/_global-error`, the static 500 page). A prerender has no request and so
   * no CSP nonce, so under the enforced nonce-based script-src the static copy
   * never hydrates — its old "Try again" button did nothing. The static markup
   * must therefore carry a recovery control that works without JavaScript, and
   * must not carry a button that needs it.
   */
  describe("without JavaScript (the prerendered, nonce-less copy)", () => {
    const staticMarkup = () =>
      renderToStaticMarkup(<GlobalError error={new Error("boom")} retry={vi.fn()} />);

    it("offers a plain link that reloads the app", () => {
      const markup = staticMarkup();

      expect(markup).toMatch(/<a[^>]+href="\/"[^>]*>Reload the app<\/a>/);
    });

    it("does not render a retry button that could never work", () => {
      expect(staticMarkup()).not.toContain("<button");
    });

    it("keeps the no-JS link after hydration too", () => {
      renderBoundary();

      expect(screen.getByRole("link", { name: /reload the app/i })).toHaveAttribute("href", "/");
    });
  });

  it("logs identifiers and shape only, tagged with the global boundary", () => {
    renderBoundary({
      error: Object.assign(new Error("boom"), { digest: "cafebabe" }),
    });

    expect(errorSpy).toHaveBeenCalledWith("ui.render.error", {
      boundary: "global",
      name: "Error",
      digest: "cafebabe",
    });
  });

  it("never writes the error message to the log", () => {
    renderBoundary({ error: new Error("jane@example.com pastoral note") });

    const logged = JSON.stringify(errorSpy.mock.calls);
    expect(logged).not.toContain("jane@example.com");
    expect(logged).not.toContain("pastoral note");
  });
});

import { describe, it, expect, vi, afterEach } from "vitest";

// The module imports the auth client at load time; nothing here calls it, but
// it must never be able to reach a real auth endpoint.
vi.mock("@/lib/auth-client", () => ({
  authClient: { getSession: vi.fn(), signIn: { social: vi.fn() } },
}));

import { sanitizeCallbackUrl } from "./sign-in";

/**
 * Direct unit tests for the /signin open-redirect guard (F3).
 *
 * The rendered-page tests in src/app/signin/page.test.tsx prove both sinks
 * (`location.href` and `signIn.social`'s `callbackURL`) receive the sanitized
 * value. These pin the function's rules on their own, including the
 * `new URL()` backstop, which no real input is known to reach once the string
 * checks have run — so it is exercised with a stubbed parser instead.
 *
 * The rules mirror better-auth's server-side `isSafeRelativeURL`
 * (better-auth/dist/auth/trusted-origins.mjs), which is not exported, so the
 * parity is by construction rather than asserted against it here.
 */
describe("sanitizeCallbackUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["an empty string", ""],
    ["a non-string smuggled past the type", 42 as unknown as string],
  ])("returns / for %s", (_label, raw) => {
    expect(sanitizeCallbackUrl(raw)).toBe("/");
  });

  it.each([
    "https://evil.example/",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    // WHATWG strips tab/LF/CR before parsing, after any string check runs.
    "/\t/evil.example",
    "/\n/evil.example",
    "/\r/evil.example",
    "/\t\\evil.example",
    "/\t\t/evil.example",
    "/ok\u0000",
    "/\u007f/evil.example",
    // C1 control range, which better-auth also refuses.
    "/\u0085/evil.example",
    "/a\\b",
    "/%2F/evil.example",
    "/%2f/evil.example",
    "/%5Cevil.example",
    "/%5cevil.example",
  ])("refuses %j", (raw) => {
    expect(sanitizeCallbackUrl(raw)).toBe("/");
  });

  it("refuses the value URLSearchParams decodes from callbackUrl=/%09/evil.example", () => {
    const raw = new URLSearchParams("callbackUrl=/%09/evil.example").get("callbackUrl");

    expect(raw).toBe("/\t/evil.example");
    expect(sanitizeCallbackUrl(raw)).toBe("/");
  });

  it.each([
    "/",
    "/dashboard",
    "/contactlookup?x=1",
    "/contactlookup/abc?tab=logs",
    "/reports?year=2026#top",
    // `//` and encoded separators are only dangerous in the path.
    "/a?x=//evil.com",
    "/a?next=%2F%2Fx",
    "/a#%5C",
    // A literal `%09` (three characters), not a decoded tab.
    "/%09/x",
  ])("passes %j through unchanged", (raw) => {
    expect(sanitizeCallbackUrl(raw)).toBe(raw);
  });

  it("returns /.//evil.com byte-for-byte, never the URL-normalized //evil.com", () => {
    // `new URL("/.//evil.com", base).pathname` is "//evil.com" — returning that
    // would itself be a protocol-relative redirect.
    expect(new URL("/.//evil.com", "https://x.invalid").pathname).toBe("//evil.com");
    expect(sanitizeCallbackUrl("/.//evil.com")).toBe("/.//evil.com");
  });

  describe("URL-parser backstop", () => {
    it("returns / if the parser resolves the value to another origin", () => {
      vi.stubGlobal(
        "URL",
        class {
          origin = "https://evil.example";
        }
      );

      expect(sanitizeCallbackUrl("/dashboard")).toBe("/");
    });

    it("returns / if the parser throws", () => {
      vi.stubGlobal(
        "URL",
        class {
          constructor() {
            throw new TypeError("Invalid URL");
          }
        }
      );

      expect(sanitizeCallbackUrl("/dashboard")).toBe("/");
    });
  });
});

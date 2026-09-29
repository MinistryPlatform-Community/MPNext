import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";

/**
 * Better Auth catch-all route tests (F7 allowlist).
 *
 * `src/app/api/auth/[...all]/route.ts` mounts ~30 better-auth endpoints, but
 * this app's browser client calls exactly three of them (see the table on
 * `allowedAuthRoutes` in route.ts). Everything else must 404 — deny-by-default
 * so a future better-auth version cannot silently reopen dead surface.
 *
 * These tests drive the REAL exported `GET`/`POST` against the REAL `auth`
 * instance (via real `toNextJsHandler(auth)`) with real `NextRequest` objects,
 * so a regression in the allowlist wrapper itself is caught — no mocking of
 * `@/lib/auth` or `better-auth/next-js`. Only `@/lib/providers/ministry-platform`
 * is mocked (MPHelper as a class, per .claude/references/testing.md), because
 * importing the real `@/lib/auth` module must never reach Ministry Platform.
 */

// `fetch` THROWS for every URL. Importing `@/lib/auth` and starting sign-in
// make no MP call (issue #101: the provider has explicit endpoints, and
// discovery is only fetched when a callback needs to verify an id_token), so
// the "ministry-platform" provider is registered without any stub, and nothing
// here can reach a real Ministry Platform (CLAUDE.md). Installed in
// `vi.hoisted()` so it is in place before `import "./route"` builds the auth
// instance.
const { mockGetTableRecords } = vi.hoisted(() => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = input instanceof Request ? input.url : String(input);
    throw new Error(`Blocked unexpected fetch in test: ${url}`);
  }) as typeof fetch;
  return {
    mockGetTableRecords: vi.fn(),
  };
});

vi.mock("@/lib/providers/ministry-platform", () => ({
  MPHelper: class {
    getTableRecords = mockGetTableRecords;
  },
}));

import { GET, POST, allowedAuthRoutes, allowedSignInSocialKeys } from "./route";
import { auth } from "@/lib/auth";

const ORIGIN = "http://localhost:3000";

function get(path: string) {
  return GET(new NextRequest(new URL(`/api/auth${path}`, ORIGIN)));
}

function post(path: string, body?: unknown) {
  return POST(
    new NextRequest(new URL(`/api/auth${path}`, ORIGIN), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  );
}

describe("auth catch-all route allowlist", () => {
  describe("allowedAuthRoutes", () => {
    it("pins the exact allowed set", () => {
      expect(allowedAuthRoutes).toEqual({
        GET: ["/get-session", "/callback/ministry-platform"],
        POST: ["/sign-in/social"],
      });
    });
  });

  describe("allowed endpoints reach better-auth", () => {
    it("GET /get-session is not 404 (control — with no cookie better-auth returns 200 with a null body)", async () => {
      const response = await get("/get-session");
      expect(response.status).not.toBe(404);
    });

    it("POST /sign-in/social is not 404 (reaches better-auth's real handler)", async () => {
      const response = await post("/sign-in/social", {
        provider: "ministry-platform",
      });
      expect(response.status).not.toBe(404);
    });
  });

  /**
   * Status alone cannot prove the wrapper stopped a request: better-auth's own
   * router 404s most unknown paths too, so a wrapper that let everything
   * through would still "pass" a status-only assertion. Every row here also
   * asserts `auth.handler` (which `toNextJsHandler` calls at request time) was
   * never reached.
   */
  describe("everything else 404s without reaching better-auth", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    function request(method: string, path: string) {
      // Built from a string, not `new URL(path, ORIGIN)`, so encoded and
      // `;`-bearing paths reach the route exactly as a client would send them.
      return new NextRequest(`${ORIGIN}/api/auth${path}`, { method });
    }

    function expectStopped(response: Response, handlerSpy: { mock: { calls: unknown[] } }) {
      expect(response.status).toBe(404);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(handlerSpy.mock.calls).toHaveLength(0);
    }

    it.each([
      ["GET", "/list-accounts"],
      ["POST", "/get-access-token"],
      ["POST", "/sign-out"],
      ["GET", "/error"],
      ["GET", "/ok"],
      ["POST", "/update-user"],
      // Wrong method: the callback is GET only here. better-auth also
      // registers POST for form_post providers, which MP does not use.
      ["POST", "/callback/ministry-platform"],
      // GET-allowlisted paths are not POST-allowlisted, and vice versa.
      ["POST", "/get-session"],
      ["GET", "/sign-in/social"],
      // The mount point itself.
      ["GET", ""],
      ["GET", "/"],
    ])("%s %s", async (method, path) => {
      const handlerSpy = vi.spyOn(auth, "handler");
      const handler = method === "GET" ? GET : POST;

      expectStopped(await handler(request(method, path)), handlerSpy);
    });

    /**
     * Path variants of the allowlisted entries. The wrapper matches the raw,
     * still-encoded pathname exactly (bar trailing slashes), so each of these
     * must be refused BEFORE better-auth sees it. The rows pin the mutations
     * that used to survive: prefix matching (`X`, `/extra`), running the path
     * through `decodeURIComponent` (`%2D`, `%2d`, `%73`, `%2F`), lower-casing
     * (the case rows), and treating `;` as a separator.
     */
    it.each([
      ["GET", "/get-sessionX"],
      ["GET", "/get-session/extra"],
      ["GET", "/get-session.json"],
      ["GET", "/get%2Dsession"],
      ["GET", "/get%2dsession"],
      ["GET", "/get-%73ession"],
      ["GET", "/Get-Session"],
      ["GET", "/GET-SESSION"],
      ["GET", "/get-session;"],
      ["GET", "/get-session;x=1"],
      ["GET", "/callback/ministry-platformX"],
      ["GET", "/callback/Ministry-Platform"],
      ["GET", "/callback%2Fministry-platform"],
      ["GET", "/callback/ministry%2Dplatform"],
      ["GET", "/callback/ministry-platform;x"],
      ["POST", "/sign-in/socialX"],
      ["POST", "/sign-in/social/extra"],
      ["POST", "/Sign-In/Social"],
      ["POST", "/sign-in%2Fsocial"],
      ["POST", "/sign%2Din/social"],
      ["POST", "/sign-in/social;x"],
    ])("%s %s (path variant)", async (method, path) => {
      const handlerSpy = vi.spyOn(auth, "handler");
      const handler = method === "GET" ? GET : POST;
      const req = request(method, path);
      // Guard against the URL parser normalizing the variant away, which
      // would make the row pass for the wrong reason.
      expect(req.nextUrl.pathname).toBe(`/api/auth${path}`);

      expectStopped(await handler(req), handlerSpy);
    });

    it("matches a pathname outside the /api/auth mount as-is (Next never routes one here)", async () => {
      const handlerSpy = vi.spyOn(auth, "handler");

      expectStopped(await GET(new NextRequest(`${ORIGIN}/other/get-session`)), handlerSpy);
    });

    /**
     * The route exports only GET and POST (pinned below). Next derives HEAD
     * from GET — so a HEAD request runs the same allowlist — and answers
     * OPTIONS itself with an `Allow` header, never reaching this module.
     */
    it.each(["/list-accounts", "/get%2Dsession", "/Get-Session"])(
      "HEAD %s is stopped by the GET allowlist",
      async (path) => {
        const handlerSpy = vi.spyOn(auth, "handler");

        expectStopped(await GET(request("HEAD", path)), handlerSpy);
      },
    );

    it("HEAD /get-session goes through the GET allowlist to better-auth", async () => {
      const handlerSpy = vi
        .spyOn(auth, "handler")
        .mockResolvedValue(new Response(null, { status: 204 }));

      const response = await GET(request("HEAD", "/get-session"));

      expect(response.status).toBe(204);
      expect(handlerSpy).toHaveBeenCalledTimes(1);
    });

    it("exports no HEAD, OPTIONS or other method handlers", async () => {
      const mod: Record<string, unknown> = await import("./route");
      for (const method of ["HEAD", "OPTIONS", "PUT", "PATCH", "DELETE"]) {
        expect(mod[method]).toBeUndefined();
      }
    });
  });

  /**
   * Every response from this route is about the session, so none may be
   * cached — whether it came from better-auth or from the wrapper's own 404.
   */
  describe("Cache-Control: no-store on every response", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("GET /get-session from the real handler", async () => {
      const response = await get("/get-session");
      expect(response.headers.get("cache-control")).toBe("no-store");
    });

    it("POST /sign-in/social from the real handler", async () => {
      const response = await post("/sign-in/social", { provider: "ministry-platform" });
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("no-store");
    });

    it("overrides a cacheable Cache-Control from better-auth", async () => {
      vi.spyOn(auth, "handler").mockResolvedValue(
        new Response("{}", {
          status: 200,
          headers: { "Cache-Control": "public, max-age=600" },
        }),
      );

      const response = await get("/get-session");

      expect(response.headers.get("cache-control")).toBe("no-store");
    });

    it("copies a response with immutable headers (a redirect), keeping status and Location", async () => {
      const redirect = Response.redirect("https://test-mp.example.com/after", 302);
      // Precondition: this is the shape the fallback exists for.
      expect(() => redirect.headers.set("x", "y")).toThrow(TypeError);
      vi.spyOn(auth, "handler").mockResolvedValue(redirect);

      const response = await get("/callback/ministry-platform");

      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toBe("https://test-mp.example.com/after");
      expect(response.headers.get("cache-control")).toBe("no-store");
    });

    it("keeps every Set-Cookie on the callback's 302", async () => {
      const headers = new Headers();
      headers.append("Set-Cookie", "a=1; Path=/; HttpOnly");
      headers.append("Set-Cookie", "b=2; Path=/; HttpOnly");
      headers.set("Location", "/contactlookup");
      vi.spyOn(auth, "handler").mockResolvedValue(
        new Response(null, { status: 302, headers }),
      );

      const response = await get("/callback/ministry-platform");

      expect(response.status).toBe(302);
      expect(response.headers.getSetCookie()).toEqual([
        "a=1; Path=/; HttpOnly",
        "b=2; Path=/; HttpOnly",
      ]);
      expect(response.headers.get("cache-control")).toBe("no-store");
    });

    it("on a 404 from the path allowlist", async () => {
      const response = await get("/list-accounts");
      expect(response.headers.get("cache-control")).toBe("no-store");
    });

    it("on a 404 from the /sign-in/social body filter", async () => {
      const response = await post("/sign-in/social", { provider: "google" });
      expect(response.status).toBe(404);
      expect(response.headers.get("cache-control")).toBe("no-store");
    });
  });

  /**
   * Body filter on the one allowlisted POST (defence in depth behind
   * `refuseIdTokenSignIn` in src/lib/auth.ts — see
   * `isAllowedSignInSocialBody` in route.ts). `toNextJsHandler` calls
   * `auth.handler` at request time, so spying on it tells us whether a request
   * reached better-auth at all.
   */
  describe("POST /sign-in/social body filter", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    function postSignIn(body: string, contentType: string | null) {
      const headers = new Headers();
      if (contentType !== null) headers.set("Content-Type", contentType);
      return POST(
        new NextRequest(new URL("/api/auth/sign-in/social", ORIGIN), {
          method: "POST",
          headers,
          body,
        }),
      );
    }

    const legit = { provider: "ministry-platform", callbackURL: "/contacts" };

    it("pins the allowed body keys to exactly what authClient.signIn.social sends", () => {
      expect(allowedSignInSocialKeys).toEqual(["provider", "callbackURL"]);
    });

    it("passes a legitimate { provider, callbackURL } body through, still readable by better-auth", async () => {
      // Echo the body the handler actually receives: proves the filter read a
      // clone and left the original stream intact.
      const handlerSpy = vi
        .spyOn(auth, "handler")
        .mockImplementation(async (req: Request) => Response.json(await req.json()));

      const response = await postSignIn(JSON.stringify(legit), "application/json");

      expect(handlerSpy).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(legit);
    });

    it("passes a legitimate body through to the REAL handler (authorize URL returned)", async () => {
      const response = await postSignIn(JSON.stringify(legit), "application/json");
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ redirect: true });
    });

    it("accepts { provider } alone (callbackURL is optional)", async () => {
      const handlerSpy = vi
        .spyOn(auth, "handler")
        .mockResolvedValue(new Response(null, { status: 204 }));

      const response = await postSignIn(
        JSON.stringify({ provider: "ministry-platform" }),
        "application/json",
      );

      expect(response.status).toBe(204);
      expect(handlerSpy).toHaveBeenCalledTimes(1);
    });

    // A leading ASCII space never reaches the filter: `Headers` strips HTTP
    // whitespace from both ends, so " application/json" arrives trimmed.
    it.each([
      "application/json; charset=utf-8",
      "Application/JSON",
      " application/json ;charset=UTF-8",
      "application/json\t;charset=utf-8",
    ])(
      "accepts Content-Type %j",
      async (contentType) => {
        const handlerSpy = vi
          .spyOn(auth, "handler")
          .mockResolvedValue(new Response(null, { status: 204 }));

        const response = await postSignIn(JSON.stringify(legit), contentType);

        expect(response.status).toBe(204);
        expect(handlerSpy).toHaveBeenCalledTimes(1);
      },
    );

    it.each([
      ["idToken (the token-substitution takeover)", { idToken: { token: "a.b.c", accessToken: "victim" } }],
      ["idToken: null (presence, not truthiness)", { idToken: null }],
      ["scopes", { scopes: ["extra_scope"] }],
      ["errorCallbackURL", { errorCallbackURL: "https://evil.example/x" }],
      ["newUserCallbackURL", { newUserCallbackURL: "https://evil.example/x" }],
      ["additionalParams", { additionalParams: { prompt: "none" } }],
      ["loginHint", { loginHint: "someone" }],
      ["additionalData", { additionalData: { a: 1 } }],
      ["requestSignUp", { requestSignUp: true }],
      ["disableRedirect", { disableRedirect: true }],
    ])("404s a body carrying %s, without reaching better-auth", async (_label, extra) => {
      const handlerSpy = vi.spyOn(auth, "handler");

      const response = await postSignIn(
        JSON.stringify({ ...legit, ...extra }),
        "application/json",
      );

      expect(response.status).toBe(404);
      expect(handlerSpy).not.toHaveBeenCalled();
    });

    it.each([
      ["a __proto__ key", '{"provider":"ministry-platform","__proto__":{"x":1}}'],
      ["a different provider", JSON.stringify({ provider: "google", callbackURL: "/" })],
      ["no provider", JSON.stringify({ callbackURL: "/" })],
      ["a JSON array", JSON.stringify([legit])],
      ["JSON null", "null"],
      ["a JSON string", JSON.stringify("ministry-platform")],
      ["a JSON number", "42"],
      ["non-JSON text", "provider=ministry-platform"],
      ["an empty body", ""],
    ])("404s %s, without reaching better-auth", async (_label, body) => {
      const handlerSpy = vi.spyOn(auth, "handler");

      const response = await postSignIn(body, "application/json");

      expect(response.status).toBe(404);
      expect(handlerSpy).not.toHaveBeenCalled();
    });

    /**
     * better-call uses its JSON parser only for a header that STARTS with
     * `application/json` (anchored, untrimmed regex) and otherwise picks a
     * parser by substring match, so a multi-valued Content-Type is parsed as
     * FORM data — keys this filter would never see. Only a raw header that is
     * `application/json` at position 0 (plus parameters) is accepted.
     */
    it.each([
      ["multi-valued", "text/html, application/json, application/x-www-form-urlencoded"],
      ["json first, then form", "application/json, application/x-www-form-urlencoded"],
      // Refused by the comma check alone. Not load-bearing: better-call's
      // anchored regex would still parse this as JSON, so there is no
      // differential — the comma rule is belt and braces.
      ["json with a parameter, then form", "application/json; charset=utf-8, application/x-www-form-urlencoded"],
      // U+00A0 is not HTTP whitespace, so `Headers` keeps it, and JS `trim()`
      // would strip it — a trimmed check would accept these while better-call
      // skips its JSON parser (text/stream parsing, or `formData()` → 500).
      ["leading-NBSP", " application/json"],
      ["leading-NBSP with a form parameter", " application/json; x=application/x-www-form-urlencoded"],
      ["trailing-NBSP", "application/json "],
      ["json followed by junk", "application/json x"],
      ["text/plain", "text/plain"],
      ["form-urlencoded", "application/x-www-form-urlencoded"],
      ["multipart", "multipart/form-data; boundary=x"],
      ["a +json suffix type", "application/vnd.api+json"],
      ["a json prefix lookalike", "application/jsonx"],
      ["missing", null],
    ])("404s a %s Content-Type, without reaching better-auth", async (_label, contentType) => {
      const handlerSpy = vi.spyOn(auth, "handler");

      const response = await postSignIn(JSON.stringify(legit), contentType);

      expect(response.status).toBe(404);
      expect(handlerSpy).not.toHaveBeenCalled();
    });

    it("keeps a leading NBSP in the header value (precondition for the NBSP cases above)", () => {
      // If `Headers` normalized U+00A0 away, the NBSP rows would pass for the
      // wrong reason. It strips only HTTP whitespace (space, tab, CR, LF).
      const headers = new Headers({ "Content-Type": " application/json" });
      expect(headers.get("content-type")).toBe(" application/json");
    });

    it("404s a repeated Content-Type header (Headers.get joins them with a comma)", async () => {
      const handlerSpy = vi.spyOn(auth, "handler");
      const headers = new Headers();
      headers.append("Content-Type", "application/json; charset=utf-8");
      headers.append("Content-Type", "application/x-www-form-urlencoded");

      const response = await POST(
        new NextRequest(new URL("/api/auth/sign-in/social", ORIGIN), {
          method: "POST",
          headers,
          body: JSON.stringify(legit),
        }),
      );

      expect(response.status).toBe(404);
      expect(handlerSpy).not.toHaveBeenCalled();
    });

    /**
     * Size DoS: a relative callbackURL of any length passes isSafeRelativeURL
     * and comes back as a Set-Cookie ~2x its size. The filter caps the declared
     * Content-Length, the bytes actually read, and callbackURL itself.
     */
    describe("size and type limits", () => {
      /** A stream that yields `chunks` of `chunkSize` bytes, counting pulls. */
      function chunkedStream(chunkSize: number, chunks: number, prefix = "") {
        const encoder = new TextEncoder();
        let sent = 0;
        const state = { pulled: 0 };
        const stream = new ReadableStream<Uint8Array>({
          pull(controller) {
            state.pulled += 1;
            if (sent === 0 && prefix) {
              controller.enqueue(encoder.encode(prefix));
            }
            if (sent >= chunks) {
              controller.close();
              return;
            }
            controller.enqueue(new Uint8Array(chunkSize).fill(0x61));
            sent += 1;
          },
        });
        return { stream, state };
      }

      function postStream(stream: ReadableStream<Uint8Array>, extraHeaders: Record<string, string> = {}) {
        return POST(
          new NextRequest(new URL("/api/auth/sign-in/social", ORIGIN), {
            method: "POST",
            headers: { "Content-Type": "application/json", ...extraHeaders },
            body: stream,
            // Required by undici for a streamed request body.
            duplex: "half",
          } as ConstructorParameters<typeof NextRequest>[1]),
        );
      }

      it("404s a request with no body at all (null stream)", async () => {
        const handlerSpy = vi.spyOn(auth, "handler");

        const response = await POST(
          new NextRequest(new URL("/api/auth/sign-in/social", ORIGIN), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }),
        );

        expect(response.status).toBe(404);
        expect(handlerSpy).not.toHaveBeenCalled();
      });

      it("404s a 5 MB callbackURL without reaching better-auth", async () => {
        const handlerSpy = vi.spyOn(auth, "handler");

        const response = await postSignIn(
          JSON.stringify({
            provider: "ministry-platform",
            callbackURL: "/" + "a".repeat(5 * 1024 * 1024),
          }),
          "application/json",
        );

        expect(response.status).toBe(404);
        expect(handlerSpy).not.toHaveBeenCalled();
      });

      it("404s a declared Content-Length of 1000000 before reading the body", async () => {
        const handlerSpy = vi.spyOn(auth, "handler");
        const cloneSpy = vi.spyOn(NextRequest.prototype, "clone");
        const headers = new Headers({
          "Content-Type": "application/json",
          "Content-Length": "1000000",
        });

        const response = await POST(
          new NextRequest(new URL("/api/auth/sign-in/social", ORIGIN), {
            method: "POST",
            headers,
            body: JSON.stringify(legit),
          }),
        );

        expect(response.status).toBe(404);
        expect(handlerSpy).not.toHaveBeenCalled();
        expect(cloneSpy).not.toHaveBeenCalled();
      });

      it.each(["abc", "-1", "1e3", "100, 100", ""])(
        "404s a malformed Content-Length %j",
        async (contentLength) => {
          const handlerSpy = vi.spyOn(auth, "handler");
          const headers = new Headers({
            "Content-Type": "application/json",
            "Content-Length": contentLength,
          });

          const response = await POST(
            new NextRequest(new URL("/api/auth/sign-in/social", ORIGIN), {
              method: "POST",
              headers,
              body: JSON.stringify(legit),
            }),
          );

          expect(response.status).toBe(404);
          expect(handlerSpy).not.toHaveBeenCalled();
        },
      );

      it("accepts a declared Content-Length that is within the cap", async () => {
        const handlerSpy = vi
          .spyOn(auth, "handler")
          .mockResolvedValue(new Response(null, { status: 204 }));
        const body = JSON.stringify(legit);
        const headers = new Headers({
          "Content-Type": "application/json",
          "Content-Length": String(new TextEncoder().encode(body).byteLength),
        });

        const response = await POST(
          new NextRequest(new URL("/api/auth/sign-in/social", ORIGIN), {
            method: "POST",
            headers,
            body,
          }),
        );

        expect(response.status).toBe(204);
        expect(handlerSpy).toHaveBeenCalledTimes(1);
      });

      it("refuses an oversized chunked body with no Content-Length, without draining it", async () => {
        const handlerSpy = vi.spyOn(auth, "handler");
        // 1,000 x 1 KiB chunks = ~1 MB if fully drained.
        const { stream, state } = chunkedStream(
          1024,
          1000,
          '{"provider":"ministry-platform","callbackURL":"/',
        );

        const response = await postStream(stream);

        expect(response.status).toBe(404);
        expect(handlerSpy).not.toHaveBeenCalled();
        // Stopped a few chunks past the 4 KiB cap, not after 1,000.
        expect(state.pulled).toBeLessThan(20);
      });

      it("accepts a small legitimate body sent as a multi-chunk stream", async () => {
        const handlerSpy = vi
          .spyOn(auth, "handler")
          .mockImplementation(async (req: Request) => Response.json(await req.json()));
        const encoder = new TextEncoder();
        const parts = ['{"provider":"ministry-', 'platform","callbackURL":"/contacts"}'];
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            for (const part of parts) controller.enqueue(encoder.encode(part));
            controller.close();
          },
        });

        const response = await postStream(stream);

        expect(handlerSpy).toHaveBeenCalledTimes(1);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual(legit);
      });

      it("accepts a callbackURL of exactly 2048 characters", async () => {
        const handlerSpy = vi
          .spyOn(auth, "handler")
          .mockResolvedValue(new Response(null, { status: 204 }));

        const response = await postSignIn(
          JSON.stringify({
            provider: "ministry-platform",
            callbackURL: "/" + "a".repeat(2047),
          }),
          "application/json",
        );

        expect(response.status).toBe(204);
        expect(handlerSpy).toHaveBeenCalledTimes(1);
      });

      it("404s a callbackURL of 2049 characters", async () => {
        const handlerSpy = vi.spyOn(auth, "handler");

        const response = await postSignIn(
          JSON.stringify({
            provider: "ministry-platform",
            callbackURL: "/" + "a".repeat(2048),
          }),
          "application/json",
        );

        expect(response.status).toBe(404);
        expect(handlerSpy).not.toHaveBeenCalled();
      });

      it.each([
        ["a number", 42],
        ["null", null],
        ["an array", ["/contacts"]],
        ["an object", { href: "/contacts" }],
        ["a boolean", true],
      ])("404s a callbackURL that is %s", async (_label, callbackURL) => {
        const handlerSpy = vi.spyOn(auth, "handler");

        const response = await postSignIn(
          JSON.stringify({ provider: "ministry-platform", callbackURL }),
          "application/json",
        );

        expect(response.status).toBe(404);
        expect(handlerSpy).not.toHaveBeenCalled();
      });

      /**
       * The filter decodes bytes itself now, so pin that it still parses the
       * way better-call's `request.json()` does (see "What was checked and
       * held" in the 2026-09-28 review index).
       */
      it.each([
        ["a leading UTF-8 BOM", "﻿" + JSON.stringify(legit)],
        ["duplicate keys (last wins, as in JSON.parse)", '{"provider":"google","provider":"ministry-platform","callbackURL":"/contacts"}'],
      ])("parses %s the same way better-auth does", async (_label, body) => {
        const handlerSpy = vi
          .spyOn(auth, "handler")
          .mockImplementation(async (req: Request) => Response.json(await req.json()));

        const response = await postSignIn(body, "application/json; charset=iso-8859-1");

        expect(handlerSpy).toHaveBeenCalledTimes(1);
        expect(await response.json()).toEqual(legit);
      });

      it("404s duplicate keys whose LAST provider is not ministry-platform", async () => {
        const handlerSpy = vi.spyOn(auth, "handler");

        const response = await postSignIn(
          '{"provider":"ministry-platform","provider":"google"}',
          "application/json",
        );

        expect(response.status).toBe(404);
        expect(handlerSpy).not.toHaveBeenCalled();
      });

      it("404s trailing garbage after the JSON object", async () => {
        const handlerSpy = vi.spyOn(auth, "handler");

        const response = await postSignIn(JSON.stringify(legit) + "x", "application/json");

        expect(response.status).toBe(404);
        expect(handlerSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe("trailing-slash and prefix tricks do not bypass exact matching", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it.each(["/get-session/", "/get-session//"])(
      "GET %s (trailing slashes) is treated as /get-session by our allowlist",
      async (path) => {
        // Our own matching strips trailing slashes, so this path is NOT
        // rejected by allowedAuthRoutes (unlike /get-sessionX below) — it is
        // let through to better-auth exactly as /get-session would be.
        // better-auth's own router does its own exact-path match with no
        // slash-stripping, so it 404s this request itself; that 404 comes from
        // better-auth, not from a gap in our allowlist. Real callers
        // (authClient) never add a trailing slash, so this is not a functional
        // concern. The spy pins the stripping, so changing it is deliberate.
        const handlerSpy = vi.spyOn(auth, "handler");

        const allowedResponse = await get("/get-session");
        const trailingSlashResponse = await get(path);

        expect(allowedResponse.status).not.toBe(404);
        expect(trailingSlashResponse.status).toBe(404);
        expect(handlerSpy).toHaveBeenCalledTimes(2);
      },
    );

    it("GET /get-sessionX does not match /get-session", async () => {
      const response = await get("/get-sessionX");
      expect(response.status).toBe(404);
    });

    it("GET /get-session/../list-accounts does not reach list-accounts", async () => {
      // NextRequest/URL normalizes ".." before pathname is ever read, so this
      // resolves to /api/auth/list-accounts — which is correctly NOT allowed.
      // The request must never resolve to /get-session instead.
      const request = new NextRequest(
        new URL("/api/auth/get-session/../list-accounts", ORIGIN),
      );
      expect(request.nextUrl.pathname).toBe("/api/auth/list-accounts");

      const response = await GET(request);
      expect(response.status).toBe(404);
    });

    it("GET //get-session (doubled leading slash) does not match", async () => {
      const request = new NextRequest(new URL("/api/auth//get-session", ORIGIN));
      const response = await GET(request);
      expect(response.status).toBe(404);
    });
  });

  it("adds no extra exports Next.js would treat as route config", async () => {
    const mod = await import("./route");
    expect(Object.keys(mod).sort()).toEqual([
      "GET",
      "POST",
      "allowedAuthRoutes",
      "allowedSignInSocialKeys",
    ]);
  });
});

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

// A minimal stub of MP's OIDC discovery document. genericOAuth's plugin
// `init` fetches this eagerly when `@/lib/auth` is constructed (at import
// time, before any test body runs), so the stub has to be installed inside
// `vi.hoisted()` — the only thing that runs before the `import "./route"`
// below actually executes and triggers that construction. Without it,
// discovery fails (no real network in tests, correctly per CLAUDE.md), the
// "ministry-platform" provider is never registered, and even an ALLOWED
// `POST /sign-in/social` would 404 for the wrong reason (no such provider),
// masking whether the allowlist wrapper itself delegates correctly.
const { mockGetTableRecords } = vi.hoisted(() => {
  const realFetch = globalThis.fetch;
  const stubbedFetch: typeof fetch = (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    if (url.endsWith("/oauth/.well-known/openid-configuration")) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            issuer: "https://test-mp.example.com",
            authorization_endpoint:
              "https://test-mp.example.com/oauth/connect/authorize",
            token_endpoint: "https://test-mp.example.com/oauth/connect/token",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    }
    return realFetch(input, init);
  };
  globalThis.fetch = stubbedFetch;
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

  describe("everything else 404s without reaching better-auth", () => {
    it("GET /list-accounts", async () => {
      const response = await get("/list-accounts");
      expect(response.status).toBe(404);
    });

    it("POST /get-access-token", async () => {
      const response = await post("/get-access-token");
      expect(response.status).toBe(404);
    });

    it("POST /sign-out", async () => {
      const response = await post("/sign-out");
      expect(response.status).toBe(404);
    });

    it("GET /error", async () => {
      const response = await get("/error");
      expect(response.status).toBe(404);
    });

    it("GET /ok", async () => {
      const response = await get("/ok");
      expect(response.status).toBe(404);
    });

    it("POST /update-user", async () => {
      const response = await post("/update-user", {});
      expect(response.status).toBe(404);
    });

    it("POST /callback/ministry-platform (wrong method — the callback is GET only here; better-auth also registers POST for form_post providers, which MP does not use)", async () => {
      const response = await post("/callback/ministry-platform");
      expect(response.status).toBe(404);
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

    it.each(["application/json; charset=utf-8", "Application/JSON", " application/json ;charset=UTF-8"])(
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
     * better-call picks its body parser by substring match, so a multi-valued
     * Content-Type is parsed as FORM data — keys this filter would never see.
     * Only an exact `application/json` media type is accepted.
     */
    it.each([
      ["multi-valued", "text/html, application/json, application/x-www-form-urlencoded"],
      ["json first, then form", "application/json, application/x-www-form-urlencoded"],
      // Only the comma check catches this one: split on ";" alone would read
      // the media type as exactly "application/json".
      ["json with a parameter, then form", "application/json; charset=utf-8, application/x-www-form-urlencoded"],
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
    it("GET /get-session/ (trailing slash) is treated as the same path by our allowlist", async () => {
      // Our own matching strips the trailing slash, so this path is NOT
      // rejected by allowedAuthRoutes (unlike /get-sessionX below) — it is let
      // through to better-auth exactly as /get-session would be. better-auth's
      // own router does its own exact-path match with no slash-stripping, so it
      // 404s this particular request itself; that 404 comes from better-auth,
      // not from a gap in our allowlist. Real callers (authClient) never add a
      // trailing slash, so this is not a functional concern.
      const allowedResponse = await get("/get-session");
      const trailingSlashResponse = await get("/get-session/");
      expect(allowedResponse.status).not.toBe(404);
      expect(trailingSlashResponse.status).toBe(404);
    });

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

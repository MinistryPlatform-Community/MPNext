import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest } from "next/server";

const { GET: betterAuthGET, POST: betterAuthPOST } = toNextJsHandler(auth);

/**
 * Deny-by-default allowlist of better-auth endpoints reachable over HTTP.
 *
 * better-auth 1.7.4 mounts ~30 endpoints under this catch-all (session
 * management, account linking, email/password, admin utilities, ...), but
 * this app's browser client calls exactly three of them:
 *
 * | Method | Path                          | Caller                                                          |
 * |--------|-------------------------------|------------------------------------------------------------------|
 * | GET    | /get-session                  | authClient.useSession() (src/contexts/*), authClient.getSession() (src/components/sign-in/sign-in.tsx) |
 * | POST   | /sign-in/social               | src/components/sign-in/sign-in.tsx                               |
 * | GET    | /callback/ministry-platform    | Ministry Platform's redirect after login                          |
 *
 * Everything else in `auth.api.*` runs in-process from server actions/components
 * and never touches this route, so it needs no entry here.
 *
 * `/sign-out` is deliberately absent: sign-out runs server-side via
 * `auth.api.signOut` in src/components/user-menu/actions.ts, so no HTTP
 * sign-out route is needed. Adding `authClient.signOut()` in the browser would
 * require adding `POST /sign-out` here first — the 404 makes that omission
 * loud instead of silent.
 *
 * `/error` is deliberately absent: better-auth's own OAuth-failure redirect
 * (its built-in error page) is replaced by `onAPIError.errorURL` in
 * src/lib/auth.ts, which sends failures to our own `/auth-error` page instead.
 *
 * This is the PRIMARY control (deny-by-default, closed to any endpoint added
 * by a future better-auth version until deliberately opened here).
 * `disabledAuthPaths` in src/lib/auth.ts remains as defense in depth.
 */
export const allowedAuthRoutes = {
  GET: ["/get-session", "/callback/ministry-platform"],
  POST: ["/sign-in/social"],
} as const;

/**
 * Path of the request relative to the auth route's own mount point
 * (`/api/auth`), with trailing slashes stripped. Exact string matching only —
 * no regex, no prefix matching — so `/get-session/../list-accounts` (which
 * `NextRequest`/`URL` normalizes to `/api/auth/list-accounts` before this ever
 * runs) and `/get-sessionX` are both handled correctly: the first resolves to
 * a real, but not-allowlisted, path; the second simply never equals an
 * allowlisted entry.
 */
function relativeAuthPath(request: NextRequest): string {
  const { pathname } = request.nextUrl;
  const withoutPrefix = pathname.startsWith("/api/auth")
    ? pathname.slice("/api/auth".length)
    : pathname;
  const withoutTrailingSlashes = withoutPrefix.replace(/\/+$/, "");
  return withoutTrailingSlashes === "" ? "/" : withoutTrailingSlashes;
}

const NOT_FOUND = () => new Response("Not Found", { status: 404 });

export async function GET(request: NextRequest) {
  const path = relativeAuthPath(request);
  if (!(allowedAuthRoutes.GET as readonly string[]).includes(path)) {
    return NOT_FOUND();
  }
  return betterAuthGET(request);
}

/**
 * The only body keys `POST /sign-in/social` may carry. The browser client sends
 * exactly these two — `authClient.signIn.social({ provider, callbackURL })` in
 * src/components/sign-in/sign-in.tsx, which better-auth's client proxy
 * (node_modules/better-auth/dist/client/proxy.mjs) forwards as the JSON body
 * verbatim, adding nothing.
 *
 * better-auth's body schema accepts far more: `idToken` (a direct sign-in
 * mode that enabled an account takeover — see `refuseIdTokenSignIn` in
 * src/lib/auth.ts), plus `scopes`, `loginHint`, `additionalParams`,
 * `errorCallbackURL`, `newUserCallbackURL`, `additionalData`, `requestSignUp`
 * and `disableRedirect`, each of which lets a caller reshape the authorize
 * request or the post-login redirects. None is used here, so all are closed.
 * Allowlisted, not denylisted: a key a future better-auth version adds is
 * refused until deliberately opened here.
 */
export const allowedSignInSocialKeys = ["provider", "callbackURL"] as const;

/**
 * Largest `POST /sign-in/social` body this route will read, in bytes. The real
 * client sends `{ provider, callbackURL }` — a few hundred bytes at most, and
 * under ~2.1 KB even at the `callbackURL` cap below. Without a cap, one
 * anonymous request with a multi-megabyte relative `callbackURL` passes
 * better-auth's `isSafeRelativeURL`, is copied into the OAuth state, and comes
 * back as a Set-Cookie roughly twice its size (memory/CPU denial of service) —
 * and this filter runs BEFORE better-auth's rate limiter.
 */
const MAX_SIGN_IN_SOCIAL_BODY_BYTES = 4096;

/** Longest `callbackURL` accepted (UTF-16 code units, i.e. `String.length`). */
const MAX_CALLBACK_URL_LENGTH = 2048;

/**
 * The only Content-Type `POST /sign-in/social` accepts, tested against the raw
 * header value (see `isAllowedSignInSocialBody` for why it is anchored and
 * untrimmed).
 */
const JSON_CONTENT_TYPE = /^application\/json[\t ]*(;|$)/i;

/**
 * Read a request body with a hard byte cap. Returns `null` (and stops reading)
 * as soon as more than `limit` bytes arrive, so a chunked body with no
 * Content-Length — or one that lies about it — is never buffered past the cap.
 */
async function readBodyWithLimit(
  body: ReadableStream<Uint8Array>,
  limit: number,
): Promise<Uint8Array | null> {
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      // Stop reading; do NOT `await reader.cancel()`. This is a `clone()`
      // (a tee branch), and a tee branch's cancel promise settles only once
      // BOTH branches are cancelled — the original never is on this path, so
      // awaiting it hangs the request. Releasing the lock is enough: a tee
      // pulls from its source only when a branch is read, and neither will be.
      reader.releaseLock();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

/**
 * Body filter for `POST /sign-in/social` (defence in depth behind
 * `refuseIdTokenSignIn`, which is the primary control and also covers
 * in-process `auth.api.signInSocial` calls this route never sees).
 *
 * The Content-Type check is what makes the body check sound. better-call
 * (node_modules/better-call/dist/utils.mjs, `getBody`) uses its JSON parser
 * only when the lower-cased, UNTRIMMED header matches the anchored regex
 * `/^application\/([a-z0-9.+-]*\+)?json/i`; anything else falls through to
 * SUBSTRING matches for form, multipart, text and octet-stream. A filter that
 * JSON-parsed a body better-call then parses some other way would inspect
 * different keys than better-auth acts on. So this filter tests the RAW header
 * against `JSON_CONTENT_TYPE` — `application/json` at position 0, then only
 * spaces/tabs before a `;` or the end (parameters like `; charset=utf-8`
 * allowed, case-insensitive). Anything that passes necessarily starts with
 * `application/json`, so better-call's anchored regex matches it too and its
 * JSON parser is the one that runs, on the same bytes this filter reads.
 *
 * The test is deliberately on the raw value, not a `trim()`med one: JS
 * `trim()` strips Unicode whitespace such as U+00A0 (NBSP), which HTTP does
 * not treat as whitespace and Node passes through, so a trimmed check would
 * accept ` application/json` — a value better-call does NOT parse as
 * JSON. (Leading/trailing ASCII spaces and tabs never reach this code:
 * `Headers` strips them.)
 *
 * Any `,` is also refused. That is belt and braces rather than load-bearing:
 * a value that passes the anchored test and contains a comma (e.g. a repeated
 * Content-Type header, which `Headers.get` joins with ", ") still starts with
 * `application/json`, so better-call would still parse it as JSON. It is
 * refused anyway because the real client never sends one.
 *
 * Size is capped twice: a declared Content-Length over
 * `MAX_SIGN_IN_SOCIAL_BODY_BYTES` is refused before anything is cloned or
 * read, and the clone is then read with the same hard cap (a chunked body
 * carries no Content-Length). The capped bytes are parsed exactly the way
 * better-call's `request.json()` parses them — the Fetch spec's "parse JSON
 * from bytes": UTF-8 decode with a leading BOM stripped, invalid sequences
 * replaced, the charset parameter ignored, then `JSON.parse` (last duplicate
 * key wins, `__proto__` becomes an own key). `new TextDecoder()` with its
 * defaults is that decode step, so the filter and better-auth still see the
 * same object.
 *
 * Reads a `clone()` so the original body stream is still intact for
 * better-auth. Every failure — oversized, unparseable JSON, a non-object, an
 * unknown key, a different provider, a non-string or overlong `callbackURL` —
 * gets the same 404 as a non-allowlisted path, so the filter reveals nothing
 * about which check tripped.
 */
async function isAllowedSignInSocialBody(request: NextRequest): Promise<boolean> {
  const contentType = request.headers.get("content-type");
  if (contentType === null || contentType.includes(",")) return false;
  if (!JSON_CONTENT_TYPE.test(contentType)) return false;
  const contentLength = request.headers.get("content-length");
  if (
    contentLength !== null &&
    (!/^\d+$/.test(contentLength) ||
      Number(contentLength) > MAX_SIGN_IN_SOCIAL_BODY_BYTES)
  ) {
    return false;
  }
  const stream = request.clone().body;
  if (stream === null) return false;
  let body: unknown;
  try {
    const bytes = await readBodyWithLimit(stream, MAX_SIGN_IN_SOCIAL_BODY_BYTES);
    if (bytes === null) return false;
    body = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return false;
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return false;
  }
  const allowedKeys: readonly string[] = allowedSignInSocialKeys;
  if (!Object.keys(body).every((key) => allowedKeys.includes(key))) {
    return false;
  }
  const { provider, callbackURL } = body as {
    provider?: unknown;
    callbackURL?: unknown;
  };
  if (
    "callbackURL" in body &&
    (typeof callbackURL !== "string" ||
      callbackURL.length > MAX_CALLBACK_URL_LENGTH)
  ) {
    return false;
  }
  return provider === "ministry-platform";
}

export async function POST(request: NextRequest) {
  const path = relativeAuthPath(request);
  if (!(allowedAuthRoutes.POST as readonly string[]).includes(path)) {
    return NOT_FOUND();
  }
  if (path === "/sign-in/social" && !(await isAllowedSignInSocialBody(request))) {
    return NOT_FOUND();
  }
  return betterAuthPOST(request);
}

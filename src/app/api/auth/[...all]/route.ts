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
 * | GET    | /get-session                  | authClient.useSession() (src/contexts/*), authClient.getSession() (src/app/signin/page.tsx) |
 * | POST   | /sign-in/social               | src/app/signin/page.tsx                                          |
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
 * Body filter for `POST /sign-in/social` (defence in depth behind
 * `refuseIdTokenSignIn`, which is the primary control and also covers
 * in-process `auth.api.signInSocial` calls this route never sees).
 *
 * The Content-Type check is what makes the body check sound. better-call picks
 * its body parser by SUBSTRING match (node_modules/better-call/dist/utils.mjs,
 * `getBody`): a header like `text/html, application/json,
 * application/x-www-form-urlencoded` is accepted and parsed as FORM data. A
 * filter that JSON-parsed that same body would fail to parse it or, worse,
 * inspect different keys than better-auth then acts on. So the media type must
 * be exactly `application/json` (parameters like `; charset=utf-8` allowed,
 * case-insensitive), and any `,` is refused outright — that also catches a
 * repeated Content-Type header, which `Headers.get` joins with ", ". Under
 * those conditions better-call's JSON regex is the parser that runs, on the
 * same bytes this filter reads.
 *
 * Reads a `clone()` so the original body stream is still intact for
 * better-auth. Every failure — unparseable JSON, a non-object, an unknown key,
 * a different provider — gets the same 404 as a non-allowlisted path, so the
 * filter reveals nothing about which check tripped.
 */
async function isAllowedSignInSocialBody(request: NextRequest): Promise<boolean> {
  const contentType = request.headers.get("content-type");
  if (contentType === null || contentType.includes(",")) return false;
  if (contentType.split(";")[0].trim().toLowerCase() !== "application/json") {
    return false;
  }
  let body: unknown;
  try {
    body = await request.clone().json();
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
  return (body as { provider?: unknown }).provider === "ministry-platform";
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

import { betterAuth, BetterAuthOptions } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import { customSession } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { isIP } from "node:net";
import { MPHelper } from "@/lib/providers/ministry-platform";
import { sanitizeGuid } from "@/lib/providers/ministry-platform/utils/filter-sanitize";
import { getAuthBaseUrl, getMpBaseUrl } from "@/lib/env";

/**
 * Custom fields added to the Better Auth `user` record.
 *
 * `userGuid` (the MP User_GUID / OAuth `sub`) MUST keep `input: true`. It is
 * populated server-side from the OAuth profile via `mapProfileToUser` below.
 * As of better-auth 1.6, `parseAdditionalUserInputFromProviderProfile` strips
 * any additional field declared with `input: false` BEFORE the user record is
 * created — so `input: false` silently drops `userGuid`, which breaks every MP
 * profile lookup (avatar, user menu, User_ID resolution). `input: true` is
 * safe ONLY because `/update-user` — the one endpoint that would copy a
 * caller-supplied `userGuid` onto the session user — is closed by
 * `disabledAuthPaths` below (and by the route allowlist). There is no
 * user-facing form that sets this field; re-opening that endpoint would turn
 * this into an identity takeover. `src/auth.test.ts` guards both halves.
 *
 * `userGuid` is `required: true`: better-auth's `parseInputData` rejects user
 * creation with `400 userGuid is required` if the mapped profile lacks it, so
 * a session can never be minted without an MP identity. `getUserInfo` below
 * already refuses profiles without a valid `sub`, so this is the second gate.
 *
 * `mpEmail` carries the user's real Ministry Platform email address. It is
 * nullable because MP does not require an email on a contact, and sign-in must
 * not depend on it — identity is `sub`. better-auth's own `email` column is
 * populated with a synthetic per-user value instead; see `mapProfileToUser`.
 */
export const userAdditionalFields = {
  userGuid: {
    type: "string" as const,
    required: true,
    input: true,
  },
  mpEmail: {
    type: "string" as const,
    required: false,
    input: true,
  },
};

/**
 * Domain for the synthetic per-user `email` handed to better-auth.
 *
 * better-auth's core user schema declares `email` as `required: true,
 * unique: true`, and its OAuth callback uses `findUserByEmail` as a fallback
 * identity lookup. Ministry Platform enforces no uniqueness on email addresses
 * — households routinely share one — so a real MP email must never become a
 * better-auth key. Deriving `email` from `sub` (the MP User_GUID, the actual
 * primary key) makes collisions impossible by construction. `.invalid` is the
 * RFC 2606 reserved TLD, so the value can never be mistaken for, or delivered
 * to, a real mailbox. The real address lives in `mpEmail`.
 */
export const SYNTHETIC_EMAIL_DOMAIN = "mp.invalid";

export function syntheticEmailForSub(sub: string): string {
  return `${sub.toLowerCase()}@${SYNTHETIC_EMAIL_DOMAIN}`;
}

/**
 * How long a resolved User_GUID → MP User_ID mapping is trusted before
 * `resolveMpUserId` asks `dp_Users` again.
 *
 * customSession runs on every getSession() call, so without a cache each
 * request would do a dp_Users lookup. The mapping itself is stable, but an
 * entry that never expires means the app never re-reads `dp_Users` for a user
 * after their first request on a process — so a deleted or re-pointed login
 * kept its attributed `User_ID` for the life of the process. A TTL bounds that
 * to 15 minutes at the cost of at most one MP call per user per 15 minutes per
 * process. A lookup that finds no row now yields `userId: null` (the
 * `mp.write.non_user` path) within one TTL instead of never. It does NOT end
 * the session — see "failures never block session creation" below.
 */
export const USER_ID_CACHE_TTL_MS = 15 * 60 * 1000;

/**
 * Negative-cache windows for `resolveMpUserId`.
 *
 * customSession runs on EVERY `/get-session` (including `useSession()`'s
 * window-focus refetches), so an uncached failure cost one MP query and one
 * log line per request: an MP outage was amplified by every open tab, and a
 * user with no `dp_Users` row re-queried MP on each call. A failure is now
 * remembered as `userId: null`:
 * - `USER_ID_FAILURE_CACHE_TTL_MS` (30 s) when the lookup THREW (MP down, a
 *   token or network error). Short, so attribution comes back soon after MP
 *   recovers.
 * - `USER_ID_NOT_FOUND_CACHE_TTL_MS` (5 min) when MP answered and there is no
 *   such login. That answer is authoritative and unlikely to change soon, but
 *   it stays well below `USER_ID_CACHE_TTL_MS`.
 * Either way the session itself is unaffected; the missing attribution
 * surfaces as `mp.write.non_user` at write time.
 */
export const USER_ID_FAILURE_CACHE_TTL_MS = 30 * 1000;
export const USER_ID_NOT_FOUND_CACHE_TTL_MS = 5 * 60 * 1000;

// Process-wide cache of User_GUID → { User_ID (null for a cached failure),
// expiry }. Entries are dropped lazily on the first read after expiry; growth
// is still bounded only by the number of distinct users, as before.
const userIdCache = new Map<string, { userId: number | null; expiresAt: number }>();

function cacheUserId(userGuid: string, userId: number | null, ttlMs: number) {
  userIdCache.set(userGuid, { userId, expiresAt: Date.now() + ttlMs });
}

async function resolveMpUserId(userGuid: string): Promise<number | null> {
  const cached = userIdCache.get(userGuid);
  if (cached !== undefined) {
    if (cached.expiresAt > Date.now()) return cached.userId;
    userIdCache.delete(userGuid);
  }
  try {
    const mp = new MPHelper();
    const [record] = await mp.getTableRecords<{ User_ID: number }>({
      table: "dp_Users",
      filter: `User_GUID = '${sanitizeGuid(userGuid)}'`,
      select: "User_ID",
      top: 1,
    });
    if (record?.User_ID) {
      cacheUserId(userGuid, record.User_ID, USER_ID_CACHE_TTL_MS);
      return record.User_ID;
    }
    cacheUserId(userGuid, null, USER_ID_NOT_FOUND_CACHE_TTL_MS);
    return null;
  } catch (err) {
    // Never block session creation on this — the NonUser Write warning at
    // write time will surface the missing attribution. Identifiers only, per
    // CLAUDE.md rule 12: never the GUID, and never `err.message` (an MP client
    // error can carry the request URL, whose `$filter` contains the GUID).
    console.error(
      JSON.stringify({
        event: "auth.session.user_id_unresolved",
        message: "MP User_ID lookup failed; session continues with userId null",
        reason: "lookup_failed",
        errName: errorName(err),
      }),
    );
    cacheUserId(userGuid, null, USER_ID_FAILURE_CACHE_TTL_MS);
    return null;
  }
}

/**
 * Session-row fields `enrichSessionUser` withholds from the `/get-session`
 * response (and from server-side `auth.api.getSession`). Nothing in `src/`
 * reads them, and each is more than the page needs:
 * - `token` — the raw session token. Useless without the cookie's HMAC today,
 *   but a bearer credential the day a `bearer` plugin is added, which would
 *   make the cookie's HttpOnly flag moot.
 * - `ipAddress`, `userAgent` — request metadata better-auth records at
 *   sign-in; not the page's business.
 * better-auth still keeps them on the in-memory row and in the (encrypted)
 * `session_data` cookie; this only stops them being handed to page JS.
 */
export const WITHHELD_SESSION_FIELDS = ["token", "ipAddress", "userAgent"] as const;

type WithheldSessionField = (typeof WITHHELD_SESSION_FIELDS)[number];

function withholdSessionFields<S extends object>(session: S): Omit<S, WithheldSessionField> {
  const copy = { ...session } as Record<string, unknown>;
  for (const field of WITHHELD_SESSION_FIELDS) delete copy[field];
  return copy as Omit<S, WithheldSessionField>;
}

/**
 * Builds the enriched session payload returned by `customSession` below.
 *
 * Extracted from the `customSession` callback so it can be unit tested: the
 * better-auth plugin closes over its callback and never exposes it, so the only
 * other way to exercise this logic would be to drive a full `getSession()`
 * request through the whole auth stack.
 *
 * Adds `userId` (the MP User_ID used for write attribution) to the user and
 * strips `WITHHELD_SESSION_FIELDS` from the session. It used to add
 * `firstName`/`lastName` split from `name` too; nothing read them, and a
 * profile missing a name part produced "undefined", so they were dropped.
 *
 * The MP profile is loaded separately — started server-side by
 * `ServerProviders` via getCurrentUserProfile() and read through UserProvider,
 * not carried in the session. The only server-side lookup here is User_ID, cached
 * in-memory for `USER_ID_CACHE_TTL_MS` per process, so it costs at most one MP
 * call per (user × container × 15 minutes); failures are negative-cached (see
 * `USER_ID_FAILURE_CACHE_TTL_MS`).
 */
export async function enrichSessionUser<U extends object, S extends object>(
  user: U,
  session: S,
) {
  const userGuid = (user as { userGuid?: string | null }).userGuid;
  const userId: number | null = userGuid
    ? await resolveMpUserId(userGuid)
    : null;
  return {
    user: {
      ...user,
      userId,
    },
    session: withholdSessionFields(session),
  };
}

/**
 * Built-in account-management endpoints better-auth mounts unconditionally,
 * which this app must NOT expose. `disabledPaths` is matched in the router's
 * `onRequest` — before rate limiting, plugins, and `sessionMiddleware` — so
 * these return 404 to authenticated and anonymous callers alike.
 *
 * The route allowlist in `src/app/api/auth/[...all]/route.ts`
 * (`allowedAuthRoutes`) is now the PRIMARY control: it is deny-by-default, so
 * any endpoint this list doesn't already know about — including one a future
 * better-auth version adds — is closed at the HTTP boundary before it ever
 * reaches `auth.handler`. `disabledPaths` here is defense in depth: it still
 * closes these specific paths for any caller that reaches `auth.handler`
 * directly, which is exactly what `src/auth.test.ts` does (it drives
 * `auth.handler` itself, bypassing the route entirely) — intentional, since
 * that suite exists to guard this config in isolation from Next.js routing.
 *
 * `/update-user` is the security-critical one. Its body schema is
 * `z.record(z.string(), z.any())`; it rejects only `email` and passes every
 * other key to `parseUserInput`, which copies any additional field declared
 * `input !== false` verbatim, with no validator, then re-mints the session
 * cookie from the result. Because `userGuid` MUST stay `input: true` (see
 * `userAdditionalFields` above), leaving this path open would let any
 * authenticated user POST `{ userGuid: "<someone else's MP User_GUID>" }` and
 * assume that user's identity: their MP roles and groups on every downstream
 * authorization check, and their `User_ID` on every MP write, so `dp_Audit_Log`
 * would attribute the caller's actions to the victim.
 *
 * `input: false` is NOT an alternative fix — it breaks sign-in (see the comment
 * on `userAdditionalFields`). As of better-auth 1.6 the `input` flag governs
 * both "may the OAuth provider profile populate this" and "may a user POST
 * this", and no value of it satisfies both. The protection therefore has to
 * live here, at the endpoint layer. A field-level `validator.input` would not
 * work either: it runs on the provider-profile path too, so it can constrain
 * the GUID's shape but cannot tell `mapProfileToUser` from an attacker sending
 * a well-formed GUID.
 *
 * The rest are closed because identity is Ministry Platform's — this app does
 * no self-service account management, and nothing in `src/` calls them.
 *
 * `src/auth.test.ts` asserts both halves: that `userGuid` stays writable, and
 * that these paths 404. Removing either one fails the build.
 */
export const disabledAuthPaths = [
  "/update-user",
  "/change-email",
  "/change-password",
  "/set-password",
  "/delete-user",
  "/delete-user/callback",
  // `/link-social` has its own id_token branch (a second route to the
  // token-substitution takeover `refuseIdTokenSignIn` closes on
  // `/sign-in/social`). It needs a session and is not in the route allowlist,
  // but this app never links accounts, so close it outright rather than rely
  // on the allowlist alone.
  "/link-social",
];

/**
 * Closes the id_token branch of `POST /sign-in/social` (the PRIMARY fix for
 * the token-substitution account takeover, 2026-09-28).
 *
 * better-auth's `/sign-in/social` has two modes. Without `idToken` it starts
 * the normal authorization-code redirect — the only mode this app uses. With
 * `idToken: { token, accessToken }` it signs the caller in directly: it
 * verifies the id_token (signature, iss, aud), then calls our `getUserInfo`
 * with the CALLER-SUPPLIED `accessToken` (node_modules/better-auth/dist/api/
 * routes/sign-in.mjs). Because `discoveryUrl` is set, genericOAuth builds an
 * id_token config for this provider, which switches that mode ON
 * (`supportsIdTokenSignIn`), and genericOAuth offers no option to turn it off.
 * Nothing in better-auth binds the verified id_token to the access token, so
 * an attacker's own valid id_token plus ANY other user's MP access token
 * minted a session as that other user. Reproduced end to end against a mock
 * OIDC server.
 *
 * `hooks.before` runs for every endpoint on both paths — HTTP requests and
 * in-process `auth.api.signInSocial` calls — so refusing here covers callers
 * the route filter in `src/app/api/auth/[...all]/route.ts` never sees. It
 * keys on the key's PRESENCE (`"idToken" in body`), not its truthiness, so
 * `idToken: null` / `idToken: {}` cannot slip past on a falsy value.
 *
 * 404 (NOT_FOUND), not 400, deliberately: from the outside this mode simply
 * does not exist here, matching the route's deny posture for non-allowlisted
 * endpoints and better-auth's own `ID_TOKEN_NOT_SUPPORTED` (also 404). The
 * distinct `code` keeps it identifiable in logs and tests.
 *
 * Defence in depth: the route filter rejects any body key but `provider` and
 * `callbackURL` before better-auth runs, and `getUserInfo` below refuses a
 * profile whose userinfo `sub` does not match the id_token `sub`. Keep all
 * three; `src/auth.id-token-sign-in.test.ts` proves each one independently.
 */
export const ID_TOKEN_SIGN_IN_DISABLED = "ID_TOKEN_SIGN_IN_DISABLED";

const refuseIdTokenSignIn = createAuthMiddleware(async (ctx) => {
  if (ctx.path !== "/sign-in/social") return;
  const body: unknown = ctx.body;
  if (typeof body === "object" && body !== null && "idToken" in body) {
    throw APIError.from("NOT_FOUND", {
      message: "id_token sign-in is disabled",
      code: ID_TOKEN_SIGN_IN_DISABLED,
    });
  }
});

/**
 * Reads the claims from a compact JWS WITHOUT verifying its signature.
 *
 * Deliberately unverified, and safe to be: `getUserInfo` uses these only for
 * a BINDING check between two tokens (`sub`) and for claim checks jose skips
 * (`exp` presence, `azp`), never as a trust decision on their own. By the time
 * `getUserInfo` runs, genericOAuth's wrapper has already verified the id_token
 * against MP's JWKS, issuer and audience (plugins/generic-oauth/index.mjs,
 * `getUserInfo`). That is GUARANTEED, not assumed, by
 * `requireIdTokenVerification: true` on the provider below: genericOAuth only
 * builds its id_token verifier when discovery yields both `issuer` and
 * `jwks_uri`, and without the option a partial discovery document left the
 * provider live with verification silently skipped. With it, such a provider
 * is skipped (sign-in 404s `PROVIDER_NOT_FOUND`, with an error log). A failed
 * discovery fetch leaves no authorization endpoint, so that provider is
 * skipped too (until `selfHealingAuth` rebuilds the instance and discovery
 * succeeds). `src/auth.oidc-hardening.test.ts` pins both.
 *
 * Hand-rolled rather than `jose`'s `decodeJwt`: `jose` is only a transitive
 * dependency (via better-auth), and importing it directly would break silently
 * the day better-auth stops depending on it.
 */
function readIdTokenClaims(
  idToken: string,
): { decoded: true; claims: Record<string, unknown> } | { decoded: false } {
  const parts = idToken.split(".");
  if (parts.length !== 3) return { decoded: false };
  try {
    const payload: unknown = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
      return { decoded: false };
    }
    return { decoded: true, claims: payload as Record<string, unknown> };
  } catch {
    return { decoded: false };
  }
}

/**
 * OIDC Core §3.1.3.7 claim checks that better-auth's verifier does not make.
 * `verifyIdToken` hands jose only `issuer` and `audience`, and jose checks
 * `exp` only when it is PRESENT, so a token with no `exp` passed; and nothing
 * checks `azp` when `aud` lists several audiences. Returns the refusal reason,
 * or null when the claims are acceptable. Runs on an already-verified token
 * (see `readIdTokenClaims`), so this narrows what a genuinely MP-signed token
 * may look like; it is not the signature check.
 */
function idTokenClaimFailure(
  claims: Record<string, unknown>,
  clientId: string,
): "missing_exp" | "expired" | "azp_mismatch" | null {
  const { exp, aud, azp } = claims;
  if (typeof exp !== "number" || !Number.isFinite(exp)) return "missing_exp";
  if (exp * 1000 <= Date.now()) return "expired";
  if (Array.isArray(aud) && azp !== clientId) return "azp_mismatch";
  return null;
}

/**
 * Logs why `getUserInfo` refused to bind the id_token to the userinfo profile.
 * Identifiers only, per CLAUDE.md rule 12: never token contents and never the
 * GUIDs themselves (same precedent as `auth.userinfo.invalid_sub`).
 */
function logSubBindingFailure(
  reason: "missing_id_token" | "undecodable_id_token" | "missing_sub" | "mismatch",
) {
  console.error(
    JSON.stringify({
      event: "auth.userinfo.sub_mismatch",
      message:
        "MP userinfo sub could not be bound to the id_token sub; refusing sign-in",
      reason,
    }),
  );
}

/** Same logging rules as `logSubBindingFailure`: the reason, never the claims. */
function logIdTokenClaimFailure(reason: "missing_exp" | "expired" | "azp_mismatch") {
  console.error(
    JSON.stringify({
      event: "auth.userinfo.id_token_claims_invalid",
      message: "MP id_token failed the app's claim checks; refusing sign-in",
      reason,
    }),
  );
}

/**
 * Logs why the userinfo request produced no usable profile. The HTTP status or
 * the error's NAME only: never the response body (member PII), the access
 * token, or `err.message` (which can echo the URL or body).
 */
function logUserinfoFetchFailure(
  detail:
    | { reason: "http_status"; status: number }
    | { reason: "request_failed" | "invalid_json"; errName: string }
    | { reason: "not_an_object" },
) {
  console.error(
    JSON.stringify({
      event: "auth.userinfo.fetch_failed",
      message: "MP userinfo request produced no usable profile; refusing sign-in",
      ...detail,
    }),
  );
}

/** `err.name` (e.g. "TimeoutError", "TypeError"), or the value's type. */
function errorName(err: unknown): string {
  // Duck-typed rather than `instanceof Error`: a DOMException (what an
  // `AbortSignal.timeout` abort rejects with) is not an Error in every realm.
  const name = (err as { name?: unknown } | null)?.name;
  return typeof name === "string" ? name : typeof err;
}

/**
 * Timeout for the userinfo request. It runs inside the OAuth callback, so a
 * hung MP would otherwise hold the callback open until the platform's own
 * request timeout. 10 s is well past MP's normal latency.
 */
export const USERINFO_TIMEOUT_MS = 10_000;

/**
 * The display name from whichever of `given_name` / `family_name` are
 * non-empty strings, falling back to `name`, then "". Never interpolates a
 * missing claim, which produced "undefined undefined".
 */
function profileDisplayName(profile: Record<string, unknown>): string {
  const part = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const joined = [part(profile.given_name), part(profile.family_name)]
    .filter(Boolean)
    .join(" ");
  return joined || part(profile.name);
}

/**
 * better-auth's built-in fallback secret (`DEFAULT_SECRET`,
 * node_modules/better-auth/dist/utils/constants.mjs — not exported, so it is
 * pinned here; `src/auth.secret-guard.test.ts` reads the library file to catch
 * drift). It is public, so a session signed with it can be forged by anyone.
 */
export const BETTER_AUTH_DEFAULT_SECRET = "better-auth-secret-12345678901234567890";
export const MIN_AUTH_SECRET_LENGTH = 32;

/** Mirrors better-auth's `toBoolean` (@better-auth/core env-impl), which `isTest()` uses on `TEST`. */
function isTruthyEnvFlag(value: string | undefined): boolean {
  return value ? value !== "false" : false;
}

/**
 * Refuses to boot on an auth configuration that would make sessions forgeable
 * or silently switch off better-auth's own safety checks. Throws; never logs
 * the secret.
 *
 * Why this exists instead of relying on better-auth's `validateSecret`
 * (node_modules/better-auth/dist/context/create-context.mjs):
 * - With no secret set, better-auth falls back to its PUBLIC default secret and
 *   only throws for it when `NODE_ENV === "production"`. On a dev/demo box
 *   (which talks to the production MP) it boots silently — the default string
 *   passes both its length and entropy checks, so not even a warning is logged.
 *   In stateless mode the signed cookie is the only authority, so a known
 *   secret lets anyone mint a session for any `userGuid`.
 * - A short secret only produces warnings.
 * - `isTest()` is `NODE_ENV === "test" || toBoolean(env.TEST)`. Any truthy
 *   `TEST` on a production process skips secret validation entirely and (were
 *   `advanced.disableOriginCheck` not pinned below) the Origin/callbackURL
 *   checks too.
 * - `BETTER_AUTH_SECRETS` (the versioned-secrets env var) silently takes
 *   precedence over the `secret` option, so a guard on `BETTER_AUTH_SECRET`
 *   would be checking a key that is not the one in use. This app does not use
 *   versioned secrets; refuse the variable rather than half-validate it.
 *
 * Exported and pure (takes the env as an argument) so it can be tested without
 * re-importing the module; the module-level call below is what enforces it.
 */
export function assertAuthEnvironment(
  env: Readonly<Record<string, string | undefined>>,
): void {
  const secret = env.BETTER_AUTH_SECRET || env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      "[auth] BETTER_AUTH_SECRET is not set (NEXTAUTH_SECRET is accepted as a fallback). Refusing to start: better-auth would sign sessions with its public default secret. Generate one with `openssl rand -base64 32`.",
    );
  }
  if (secret === BETTER_AUTH_DEFAULT_SECRET) {
    throw new Error(
      "[auth] BETTER_AUTH_SECRET is better-auth's public default secret. Refusing to start: anyone could forge a session. Generate one with `openssl rand -base64 32`.",
    );
  }
  if (secret.length < MIN_AUTH_SECRET_LENGTH) {
    throw new Error(
      `[auth] BETTER_AUTH_SECRET must be at least ${MIN_AUTH_SECRET_LENGTH} characters. Refusing to start. Generate one with \`openssl rand -base64 32\`.`,
    );
  }
  if (env.BETTER_AUTH_SECRETS) {
    throw new Error(
      "[auth] BETTER_AUTH_SECRETS is set, but this app signs with BETTER_AUTH_SECRET and does not support versioned secrets. Refusing to start: better-auth would silently prefer BETTER_AUTH_SECRETS over the validated secret. Unset it.",
    );
  }
  if (env.NODE_ENV === "production" && isTruthyEnvFlag(env.TEST)) {
    throw new Error(
      "[auth] TEST is set on a production process. Refusing to start: better-auth treats a truthy TEST as a test run and skips its secret validation. Unset TEST.",
    );
  }
}

// Enforced at module load in every environment (development, production, or
// NODE_ENV unset). Vitest is the only exemption, detected by the `VITEST` env
// var Vitest itself sets, so individual tests can stub the environment and
// build auth instances; `src/auth.secret-guard.test.ts` clears `VITEST` to
// prove this call really runs on import.
if (!process.env.VITEST) {
  assertAuthEnvironment(process.env);
}

// The two auth-critical URLs, validated once at module load (see
// src/lib/env.ts): https (loopback http outside production only), no
// credentials, query or fragment, no trailing slash, and BETTER_AUTH_URL an
// origin. Unlike the secret guard these run under Vitest too; `test-setup.ts`
// stubs valid values. An unset BETTER_AUTH_URL is refused rather than left to
// better-auth, which would otherwise derive the base URL — and so the OAuth
// redirect_uri and the trusted origins — from the request's Host header.
const mpBaseUrl = getMpBaseUrl();
const authBaseUrl = getAuthBaseUrl();

/**
 * Client-IP resolution for better-auth's rate limiter (`/sign-in*` is 3
 * requests per 10 s per IP in production). By default better-auth trusts only
 * a single, valid IP in `x-forwarded-for`; anything else — no header, an
 * appended chain, Azure's `ip:port` — drops every client into ONE shared
 * bucket (`no-trusted-ip|<path>`), so ~1 request every 3 s blocks sign-in for
 * everyone. Which header is trustworthy depends on the host, so it is
 * configuration, not code:
 *
 * - `AUTH_IP_ADDRESS_HEADERS` — comma-separated header names, tried in order
 *   (e.g. `cf-connecting-ip` behind Cloudflare). Only name a header your edge
 *   always OVERWRITES; a header clients can set themselves lets them rotate
 *   past the limit or lock a victim's IP out.
 * - `AUTH_TRUSTED_PROXIES` — comma-separated proxy IPs/CIDRs. The forwarded
 *   chain is walked right to left past these, and the first untrusted hop is
 *   the client (for proxies that append to `x-forwarded-for`).
 *
 * Invalid entries refuse startup: better-auth itself only warns and ignores a
 * bad trusted-proxy entry, which would silently fall back to the shared
 * bucket. Per-host guidance is in `.env.example` and `.claude/references/auth.md`.
 */
export function parseIpAddressOptions(
  env: Readonly<Record<string, string | undefined>>,
): { ipAddressHeaders?: string[]; trustedProxies?: string[] } {
  const list = (value: string | undefined) =>
    (value ?? "").split(",").map((entry) => entry.trim()).filter(Boolean);

  const ipAddressHeaders = list(env.AUTH_IP_ADDRESS_HEADERS).map((h) => h.toLowerCase());
  const badHeaders = ipAddressHeaders.filter((h) => !/^[a-z0-9-]+$/.test(h));
  if (badHeaders.length > 0) {
    throw new Error(
      `[auth] AUTH_IP_ADDRESS_HEADERS has invalid header names: ${badHeaders.join(", ")}. Use comma-separated names like "cf-connecting-ip".`,
    );
  }

  const trustedProxies = list(env.AUTH_TRUSTED_PROXIES);
  const badProxies = trustedProxies.filter((entry) => !isIpOrCidr(entry));
  if (badProxies.length > 0) {
    throw new Error(
      `[auth] AUTH_TRUSTED_PROXIES has entries that are not an IP address or CIDR range: ${badProxies.join(", ")}.`,
    );
  }

  return {
    ...(ipAddressHeaders.length > 0 && { ipAddressHeaders }),
    ...(trustedProxies.length > 0 && { trustedProxies }),
  };
}

function isIpOrCidr(entry: string): boolean {
  const slash = entry.indexOf("/");
  const family = isIP(slash === -1 ? entry : entry.slice(0, slash));
  if (family === 0) return false;
  if (slash === -1) return true;
  const prefix = entry.slice(slash + 1);
  return /^\d{1,3}$/.test(prefix) && Number(prefix) <= (family === 4 ? 32 : 128);
}

/**
 * Session lifetime. The app is stateless (no database, no `secondaryStorage`):
 * the signed `session_token` + encrypted `session_data` cookies are the session, backed
 * only by better-auth's per-process in-memory adapter. That rules out real
 * server-side revocation, so these settings instead put a HARD ceiling on how
 * long any session — including a copied or forged cookie pair — can live.
 * Verified against better-auth 1.7.4 source; `src/auth.session-lifetime.test.ts`
 * walks the clock through the real `auth` instance to pin it.
 *
 * - `expiresIn: 12h` — `session.expiresAt` is set once, at sign-in, to
 *   sign-in + 12h. Both `/get-session` paths refuse a session past it: the
 *   cookie-cache path checks the cached `session.expiresAt`
 *   (api/routes/session.mjs, `cachedSessionExpiresAt < now`) and the
 *   memory-adapter path checks the stored row. It also sets the
 *   `session_token` cookie's Max-Age. Default was 7 days.
 *
 * - `disableSessionRefresh: true` — without it the memory-adapter path slides
 *   `expiresAt` forward another `expiresIn` once per `updateAge` (1 day), so a
 *   long-running `next start` process kept a session alive indefinitely. With
 *   it, `expiresAt` never moves after sign-in.
 *
 * - `cookieCache.refreshCache: false` — MUST be explicit. With no database,
 *   better-auth defu-merges `refreshCache: true` UNDER this config
 *   (context/create-context.mjs), so leaving it out silently turns it on. With
 *   `true`, `/get-session` re-signs `session_data` from the cookie itself in
 *   the last 20% of `maxAge` with no store lookup at all, so a copied cookie
 *   pair survives the victim's sign-out until `expiresAt`. Both values honour
 *   the 12h ceiling (the re-mint copies `expiresAt` unchanged); `false` was
 *   chosen because it additionally bounds a cookie that is NOT backed by a
 *   live in-memory row — a pair copied before sign-out, or one forged from a
 *   leaked secret — to `maxAge` (1h) after it was minted. After that the
 *   request falls through to the in-memory adapter, which re-mints the cache
 *   only if the row still exists (sign-out deleted it on that process).
 *   Trade-off: on serverless, a request that lands on an instance without the
 *   row after the hour gets no session and goes back through MP sign-in —
 *   which is also an hourly re-check against MP that a disabled login fails.
 *
 * Emergency "sign everyone out": bump `cookieCache.version` and redeploy
 * (every existing `session_data` is refused; state/account cookies still
 * decrypt), or rotate BETTER_AUTH_SECRET (invalidates every signed cookie,
 * including a forged one). See .claude/references/auth.md § Session lifetime.
 */
export const SESSION_EXPIRES_IN_SECONDS = 12 * 60 * 60;
export const SESSION_COOKIE_CACHE_MAX_AGE_SECONDS = 60 * 60;

const options = {
  baseURL: authBaseUrl,
  secret: process.env.BETTER_AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  // Pinned explicitly so an env var cannot flip it: when this is left
  // undefined, better-auth sets `skipOriginCheck = isTest()`, i.e. a truthy
  // `TEST` env var would disable the Origin/callbackURL checks
  // (context/create-context.mjs). See `assertAuthEnvironment` above.
  advanced: {
    disableOriginCheck: false,
    // `Secure` + `__Secure-` cookies in production, stated rather than
    // inferred. better-auth derives this from the baseURL's scheme
    // (cookies/index.mjs), and `getAuthBaseUrl` requires https for every real
    // host, so this changes nothing today; it pins the behaviour if that
    // derivation ever changes. Left to the derivation for a loopback http
    // origin (dev, or a local/CI `next build` + `next start`), so
    // `http://localhost` keeps working (browsers accept `Secure` cookies on
    // localhost, but not every tool driving it does).
    ...(process.env.NODE_ENV === "production" &&
      authBaseUrl.startsWith("https:") && { useSecureCookies: true }),
    // See `parseIpAddressOptions` above.
    ipAddress: parseIpAddressOptions(process.env),
  },
  disabledPaths: disabledAuthPaths,
  // User-level hooks. The customSession and nextCookies plugins register their
  // own hooks on the plugin objects; these run alongside them, not instead.
  // See `refuseIdTokenSignIn` above.
  hooks: {
    before: refuseIdTokenSignIn,
  },
  // Own the OAuth-failure landing page instead of better-auth's built-in
  // `/api/auth/error` page (which we no longer expose — see
  // `allowedAuthRoutes` in src/app/api/auth/[...all]/route.ts). Every OAuth
  // callback failure (an invalid/expired state, a refused account link, a
  // missing email, an id_token that fails nonce/JWKS verification, ...) goes
  // through better-auth's `redirectOnError` (node_modules/better-auth/dist/
  // api/routes/callback.mjs, oauth2/errors.mjs), which appends `?error=<code>`
  // (and, when available, `&error_description=<text>`) to this URL via
  // `appendQueryParams` — verified to leave a root-relative URL like this one
  // untouched (no baseURL prefixing needed). `src/app/auth-error/page.tsx`
  // reads `error` and maps known codes to plain-English messages.
  onAPIError: {
    errorURL: "/auth-error",
  },
  // See SESSION_EXPIRES_IN_SECONDS above for why each of these is set.
  session: {
    expiresIn: SESSION_EXPIRES_IN_SECONDS,
    disableSessionRefresh: true,
    cookieCache: {
      enabled: true,
      maxAge: SESSION_COOKIE_CACHE_MAX_AGE_SECONDS,
      // Encrypted (A256CBC-HS512 JWE keyed from BETTER_AUTH_SECRET), not just
      // signed. With "jwt" the payload — name, real MP email, userGuid, IP,
      // user agent, the raw session token — was readable by anything that
      // sees Cookie headers: proxy/APM logs, HAR files, cookie-reading
      // extensions. "jwe" is better-auth's own stateless default, which the
      // explicit "jwt" used to override. Changing strategy invalidates every
      // existing `session_data` cookie once (users fall back to the in-memory
      // row, or sign in again). `src/auth.oidc-hardening.test.ts` guards it.
      strategy: "jwe" as const,
      refreshCache: false,
    },
  },
  account: {
    storeStateStrategy: "cookie" as const,
    // The user's own MP tokens are never used: all MP data access goes
    // through the client-credentials service account. better-auth defaults
    // this to `true` when there is no database, which put the user's MP
    // access/refresh/id tokens into the `account_data` cookie. Nothing the
    // route allowlist exposes reads that cookie, so keep the tokens out of
    // the browser entirely. See `stripUserOAuthTokens` below for the
    // in-memory copy.
    storeAccountCookie: false,
    // Identity here belongs to Ministry Platform, not better-auth. With a
    // single OAuth provider there is no legitimate case for linking a new
    // provider account onto an existing user by matching email — but
    // better-auth's default OAuth callback does exactly that (see
    // node_modules/better-auth/dist/oauth2/link-account.mjs): when no
    // account exists for the incoming (providerId, sub), it falls back to
    // findUserByEmail and, if that user is emailVerified and the incoming
    // profile claims emailVerified, silently links the new sub to the
    // EXISTING user's record — handing a second person who shares that
    // email the first person's userGuid/User_ID (MP household data commonly
    // shares emails across contacts). Disabling account linking makes that
    // callback refuse the merge ("account not linked") instead.
    // `src/auth.test.ts` guards this.
    accountLinking: {
      enabled: false,
    },
  },
  user: {
    additionalFields: userAdditionalFields,
  },
  // Don't keep the user's MP access/refresh tokens in the in-memory adapter
  // either (plaintext until restart; a heap dump would expose every signed-in
  // user's MP API rights). `getUserInfo` has already used the access token by
  // the time the account row is written. The id_token is kept: it is not an
  // API bearer and is what an RP-logout `id_token_hint` would need.
  databaseHooks: {
    account: {
      create: { before: async (account) => ({ data: stripUserOAuthTokens(account) }) },
      update: { before: async (account) => ({ data: stripUserOAuthTokens(account) }) },
    },
  },
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "ministry-platform",
          discoveryUrl: `${mpBaseUrl}/oauth/.well-known/openid-configuration`,
          // No issuer pinning here, deliberately. better-auth 1.7.0–1.7.2 keyed
          // accounts on (issuer, accountId) and refused to initialize a discovery
          // provider whose issuer it could not resolve, so this config carried an
          // explicit `accountIssuer`. 1.7.3 reverted both halves: accounts are
          // identified by (providerId, accountId) again as in 1.6 (#11153), and a
          // discovery failure no longer takes down the auth API (#10978). The
          // option was removed along with that revert, so setting it is now a
          // type error. Discovery still supplies the endpoints and the JWKS used
          // to verify ID tokens.
          //
          // Discovery runs ONCE per auth instance, with no retry. If that fetch
          // fails, genericOAuth logs "Discovery fetch failed" and skips the
          // provider, so sign-in fails CLOSED (`404 PROVIDER_NOT_FOUND`). (Before
          // 1.7.3 the provider stayed live with no id_token verification; that
          // fail-open mode is gone.) It no longer lasts until a restart:
          // `selfHealingAuth` below rebuilds the instance — re-running
          // discovery — on the next sign-in after a 30 s cooldown.
          //
          // Without this, a discovery document that returned the endpoints but
          // omitted `jwks_uri` or `issuer` left the provider live with id_token
          // verification silently OFF (genericOAuth builds its verifier only
          // when both are present). With it, that provider is skipped with an
          // error log instead. `readIdTokenClaims` relies on this guarantee;
          // `src/auth.oidc-hardening.test.ts` fails if it is removed.
          requireIdTokenVerification: true,
          clientId: process.env.OIDC_CLIENT_ID!,
          clientSecret: process.env.OIDC_CLIENT_SECRET!,
          scopes: [
            // No `offline_access`: the app never refreshes the user's token.
            "openid",
            "http://www.thinkministry.com/dataplatform/scopes/all",
          ],
          // REQUIRED, not a pending follow-up: Ministry Platform does not
          // support PKCE. better-auth 1.7 defaults `pkce` to true (OAuth 2.1),
          // which MP does not accept, so this must stay explicitly false. (MP's discovery document does list
          // `code_challenge_methods_supported`; that does not mean it works.)
          // The consequence is spelled out in the nonce comment below.
          pkce: false,
          // Ministry Platform does not echo the `nonce` back in the id_token,
          // so better-auth's nonce binding must be switched off or NO ONE CAN
          // SIGN IN.
          //
          // better-auth 1.7 turns nonce binding on automatically for any
          // provider whose discovery document yields an id_token config
          // (`requiresIdTokenNonce`), sends a `nonce` on the authorize request,
          // and then requires the claim to come back:
          // `nonceMatches()` returns false when the claim is absent
          // (`typeof claimNonce !== "string"`). MP omits it, so verification
          // failed every time with `unable_to_get_user_info` and the log line
          // "id_token failed verification against the discovery JWKS or
          // expected nonce". Verified 2026-09-12 by decoding a real MP
          // id_token: kid, alg, iss and aud all matched; only `nonce` was
          // missing.
          //
          // (It looked intermittent at the time because, before better-auth
          // 1.7.3, a FAILED boot-time discovery left the provider live with no
          // id_token config, which skipped verification and so let sign-in
          // succeed. In 1.7.4 a failed discovery skips the provider entirely —
          // sign-in 404s until `selfHealingAuth` rebuilds the instance — and
          // `requireIdTokenVerification` above refuses a partial one.)
          //
          // What this does NOT give up: the id_token signature is still checked
          // against MP's JWKS, and the issuer and audience are still checked.
          // What it gives up: binding the id_token to this particular
          // authorization request. ACCEPTED RISK (F8), stated plainly: with MP
          // omitting `nonce` and not supporting PKCE, NOTHING binds an
          // authorization code to the browser that started the flow. The
          // `state` cookie check does not help (an attacker who obtains a
          // victim's code starts their own flow, with their own valid state,
          // and injects the victim's code into it), and being a confidential
          // client does not help either (the app redeems the injected code
          // with its own secret) — authorization-code injection, RFC 9700
          // §4.5, reproduced against a mock OIDC provider. The remaining
          // defences keep codes out of an attacker's reach: a dedicated MP
          // OIDC client with exact redirect URIs, `Referrer-Policy`, and no
          // code-bearing URLs in logs.
          disableIdTokenNonceBinding: true,
          authorizationUrlParams: {
            realm: "realm",
          },
          getUserInfo: async (tokens) => {
            // Bind the access token to the (already verified) id_token: the
            // userinfo `sub` must equal the id_token `sub`. Defence in depth
            // behind `refuseIdTokenSignIn` — `/sign-in/social`'s id_token mode
            // calls this with a CALLER-SUPPLIED access token, so without this
            // check an attacker's id_token plus a victim's access token signed
            // in as the victim. Every refusal returns null, never throws (see
            // the `sub` comment below for why).
            //
            // A MISSING id_token fails closed too, deliberately. Every
            // legitimate caller supplies one: the code-flow callback requests
            // the `openid` scope, for which OIDC Core §3.1.3.3 requires an
            // id_token in the token response (MP sends one — the nonce comment
            // above records decoding a real one), and the id_token mode cannot
            // run without one. So an absent id_token means an unexpected code
            // path handing us an access token with nothing to bind it to; a
            // future better-auth path of that shape should be refused, not
            // trusted. The cost, if MP ever stopped sending id_tokens, is a
            // loud sign-in outage logged as `reason: "missing_id_token"`, not a
            // silent takeover. Checked before the userinfo fetch so a refused
            // request never spends an MP call.
            if (typeof tokens.idToken !== "string" || tokens.idToken === "") {
              logSubBindingFailure("missing_id_token");
              return null;
            }
            const idToken = readIdTokenClaims(tokens.idToken);
            if (!idToken.decoded) {
              logSubBindingFailure("undecodable_id_token");
              return null;
            }
            const idTokenSub = idToken.claims.sub;
            if (typeof idTokenSub !== "string" || idTokenSub === "") {
              logSubBindingFailure("missing_sub");
              return null;
            }
            // `exp` present and in the future; `azp` is us when `aud` is a
            // list. See `idTokenClaimFailure`.
            const claimFailure = idTokenClaimFailure(
              idToken.claims,
              process.env.OIDC_CLIENT_ID!,
            );
            if (claimFailure) {
              logIdTokenClaimFailure(claimFailure);
              return null;
            }

            // Fetch the OIDC profile to get the sub (User_GUID). Every failure
            // below returns null rather than throwing (see the `sub` comment
            // for why): a network error or timeout rejects `fetch`, and a
            // non-JSON 200 (a proxy's HTML error page) throws from `.json()`.
            // `redirect: "error"`: userinfo never legitimately redirects, and a
            // followed same-origin redirect would re-send the user's bearer
            // token to wherever it pointed.
            let profile: Record<string, unknown>;
            try {
              const response = await fetch(
                `${mpBaseUrl}/oauth/connect/userinfo`,
                {
                  headers: {
                    Authorization: `Bearer ${tokens.accessToken}`,
                  },
                  signal: AbortSignal.timeout(USERINFO_TIMEOUT_MS),
                  redirect: "error",
                },
              );
              if (!response.ok) {
                logUserinfoFetchFailure({ reason: "http_status", status: response.status });
                return null;
              }
              let body: unknown;
              try {
                body = await response.json();
              } catch (err) {
                logUserinfoFetchFailure({ reason: "invalid_json", errName: errorName(err) });
                return null;
              }
              if (typeof body !== "object" || body === null || Array.isArray(body)) {
                logUserinfoFetchFailure({ reason: "not_an_object" });
                return null;
              }
              profile = body as Record<string, unknown>;
            } catch (err) {
              logUserinfoFetchFailure({ reason: "request_failed", errName: errorName(err) });
              return null;
            }

            // `sub` is the MP User_GUID and the only identity this app trusts.
            // A profile without a valid one is unusable: better-auth would
            // resolve the account subject to "" and the session would carry no
            // `userGuid`, which is exactly the broken state `AuthWrapper` has
            // to route to /session-error. Refuse it here instead. Returning
            // null is better-auth's contract for "user info unusable": the
            // callback redirects to its error URL with
            // `unable_to_get_user_info` and no session is minted. (Throwing
            // is NOT equivalent — `provider.getUserInfo` is not wrapped in a
            // try/catch in the callback route, so a throw surfaces as an
            // unhandled error rather than a clean sign-in failure.)
            // `sanitizeGuid` doubles as the shape check, because `userGuid` is
            // interpolated into MP `$filter` strings downstream.
            let sub: string;
            try {
              sub = sanitizeGuid(String(profile.sub ?? ""));
            } catch {
              console.error(
                JSON.stringify({
                  event: "auth.userinfo.invalid_sub",
                  message:
                    "MP userinfo returned no usable sub (User_GUID); refusing sign-in",
                  hasSub: profile.sub !== undefined && profile.sub !== null,
                }),
              );
              return null;
            }

            // Case-insensitive: both are GUIDs, and GUID case carries no
            // meaning, so a casing difference between MP's two endpoints must
            // not lock a legitimate user out.
            if (idTokenSub.toLowerCase() !== sub.toLowerCase()) {
              logSubBindingFailure("mismatch");
              return null;
            }

            // `sub` (not `id`) is what better-auth 1.7 reads for the account
            // subject. MP's discovery document advertises
            // `id_token_signing_alg_values_supported`, so the provider is
            // treated as OIDC and the default `accountSubject` resolver reads
            // `profile.sub` from this raw profile. Returning only `id` (the
            // pre-1.7 shape) resolves the subject to "" and breaks account
            // identity. `src/auth.test.ts` guards this.
            //
            // `email` here is the REAL MP address, kept on the raw profile so
            // `mapProfileToUser` can move it into `mpEmail`. It does not reach
            // better-auth's `email` column — `mapProfileToUser` overrides that
            // with a synthetic value (see `syntheticEmailForSub`).
            //
            // `emailVerified` MUST reflect the provider's own claim, not be
            // hardcoded true. better-auth's OAuth callback uses this value
            // (together with the stored user's emailVerified) to decide
            // whether to implicitly link accounts by email — see the
            // `accountLinking` comment above. MP's userinfo response may not
            // send `email_verified` at all, so default to false rather than
            // assume it. `src/auth.test.ts` guards this.
            //
            // `name` is built only from claims that are actually strings (see
            // `profileDisplayName`); it is "" when MP sends none.
            return {
              sub,
              email: typeof profile.email === "string" ? profile.email : null,
              name: profileDisplayName(profile),
              image: undefined,
              emailVerified: profile.email_verified === true,
            };
          },
          // Maps the raw MP profile onto the local better-auth user record.
          //
          // - `userGuid`: the OAuth `sub` (MP User_GUID). better-auth generates
          //   its own internal `user.id`, so this separate field is what every
          //   MP lookup keys on. `getUserInfo` has already validated `sub`, so
          //   a missing one here is a programming error, not a provider
          //   condition — fail loudly rather than mint a session with an empty
          //   identity.
          // - `email`: SYNTHETIC, derived from `sub`. The generic-oauth wrapper
          //   builds the local user as `{ email: raw.email, ..., ...mapped }`,
          //   so this override is what lands in better-auth's unique `email`
          //   column. A real MP email is never a better-auth key.
          // - `mpEmail`: the real MP address, or null when MP has none. Nullable
          //   on purpose: MP does not require an email, and sign-in must not
          //   depend on one.
          //
          // As of 1.7 `mapProfileToUser` may not return `id` — provider
          // identity is owned by `accountSubject`. The return type allows
          // arbitrary extra keys, so no cast is needed.
          mapProfileToUser: (profile) => {
            const sub = typeof profile.sub === "string" ? profile.sub : "";
            if (!sub) {
              throw new Error(
                "mapProfileToUser: profile has no sub; getUserInfo must reject this before mapping",
              );
            }
            return {
              userGuid: sub,
              email: syntheticEmailForSub(sub),
              mpEmail: typeof profile.email === "string" && profile.email ? profile.email : null,
            };
          },
        },
      ],
    }),
  ],
} satisfies BetterAuthOptions;

/**
 * Blanks the user's MP access and refresh tokens (and their expiries) on an
 * account row before better-auth stores it. Exported for tests.
 */
export function stripUserOAuthTokens<T extends object>(account: T): T {
  return {
    ...account,
    accessToken: null,
    refreshToken: null,
    accessTokenExpiresAt: null,
    refreshTokenExpiresAt: null,
  };
}

function createAuth() {
  return betterAuth({
    ...options,
    plugins: [
      ...(options.plugins ?? []),
      customSession(
        async ({ user, session }) => enrichSessionUser(user, session),
        options,
      ),
      nextCookies(),
    ],
  });
}

/** globalThis key holding the process-wide auth instance. Exported for tests. */
export const SHARED_AUTH_KEY = Symbol.for("mpnext.auth");

/**
 * Returns the one instance for this process, creating it on first use.
 *
 * Next loads this module once PER BUNDLE LAYER — the `/api/auth` route
 * handler, server actions and server components each get their own copy
 * (verified 2026-09-29: 4 copies under `next dev`, 2 in a production build).
 * Each copy would build its own `betterAuth()` with its own in-memory adapter,
 * so the OAuth callback stored the account and session rows in one copy while
 * the sign-out server action ran in another, where they did not exist:
 * - sign-out could not delete the session row the route handler serves
 *   `/get-session` from, so a copied cookie pair outlived sign-out up to the
 *   12 h cap instead of the 1 h cookie cache;
 * - better-auth found no id_token, so the MP logout URL had no
 *   `id_token_hint` and MP stopped at a "log out?" prompt.
 * Caching on globalThis makes every layer share one instance and one store.
 * It is still per PROCESS: separate serverless instances share nothing.
 *
 * Vitest is exempt (it re-imports the module to rebuild the instance under a
 * different environment); `src/auth.shared-instance.test.ts` clears `VITEST`
 * to exercise the real path. Under `next dev`, edits to the auth options take
 * effect after a server restart, not on hot reload.
 */
export function sharedInstance<T>(
  key: symbol,
  create: () => T,
  env: Readonly<Record<string, string | undefined>> = process.env,
): T {
  if (env.VITEST) return create();
  const store = globalThis as unknown as Record<symbol, T | undefined>;
  return (store[key] ??= create());
}

/** The genericOAuth provider id this app signs in with. */
export const MP_PROVIDER_ID = "ministry-platform";

/**
 * Minimum time between two builds of the auth instance (the first build
 * counts). Bounds discovery traffic to one fetch per 30 s per process while MP
 * is down, however many users retry sign-in.
 */
export const DISCOVERY_REBUILD_COOLDOWN_MS = 30 * 1000;

/**
 * How long a sign-in request waits for an in-flight rebuild before going ahead
 * with the current (provider-less) instance. genericOAuth's discovery fetch has
 * no timeout of its own, so without this a hung MP would hold every sign-in
 * request open; the rebuild itself carries on in the background.
 */
export const DISCOVERY_REBUILD_WAIT_MS = 10 * 1000;

interface RebuildableAuth {
  handler: (request: Request) => Promise<Response>;
  $context: Promise<{ socialProviders: ReadonlyArray<{ id: string }> }>;
}

/**
 * Only these requests need the MP provider; everything else (`/get-session`,
 * `/sign-out`, ...) never triggers a rebuild, so an MP outage cannot slow page
 * loads down. Paths are under better-auth's default `/api/auth` basePath.
 */
function needsProvider(request: Request): boolean {
  // `Request.url` is always absolute, so this cannot throw.
  const path = new URL(request.url).pathname.replace(/\/+$/, "");
  return path === "/api/auth/sign-in/social" || path.startsWith("/api/auth/callback/");
}

async function hasProvider(instance: RebuildableAuth): Promise<boolean> {
  try {
    const ctx = await instance.$context;
    return ctx.socialProviders.some((provider) => provider.id === MP_PROVIDER_ID);
  } catch {
    return false;
  }
}

/** Identifiers only: never the discovery URL or the error message. */
function logDiscoveryRebuild(
  outcome: "recovered" | "provider_still_missing" | "create_failed",
  errName?: string,
) {
  const log = outcome === "recovered" ? console.warn : console.error;
  log(
    JSON.stringify({
      event: "auth.discovery.rebuild",
      message:
        outcome === "recovered"
          ? "Rebuilt the auth instance; the MP OIDC provider is available again"
          : "Rebuilt the auth instance; the MP OIDC provider is still unavailable",
      providerId: MP_PROVIDER_ID,
      outcome,
      ...(errName && { errName }),
    }),
  );
}

/**
 * Wraps `create` so a boot-time OIDC discovery failure heals without a
 * restart.
 *
 * genericOAuth fetches MP's discovery document ONCE, while the auth context
 * initializes, with no retry. If that fetch fails (or the document lacks
 * `issuer`/`jwks_uri` — see `requireIdTokenVerification`), the provider is
 * skipped and `/sign-in/social` returns `404 PROVIDER_NOT_FOUND` for the life
 * of the instance: one transient MP blip at cold start used to disable sign-in
 * until the process restarted. Fail-closed, but an outage.
 *
 * Now a sign-in or callback request that finds the provider missing builds a
 * fresh instance — which runs discovery again — and swaps it in if (and only
 * if) the new one has the provider:
 * - single-flight: concurrent requests share one rebuild;
 * - at most one build per `DISCOVERY_REBUILD_COOLDOWN_MS`, counting the first;
 *   inside the cooldown the request just gets the 404, as before;
 * - a request waits at most `DISCOVERY_REBUILD_WAIT_MS` for the rebuild;
 * - an instance that HAS the provider is never rebuilt, so a healthy
 *   instance's in-memory sessions and account rows (the `id_token_hint` for
 *   sign-out) are never thrown away. Swapping out a provider-less instance
 *   loses nothing: without the provider no OAuth callback could have stored a
 *   session in it (and `session_data` cookies are keyed from the secret, not
 *   the instance).
 *
 * Transparent to callers: the returned object delegates every property to the
 * CURRENT instance at access time (`auth.api.getSession(...)`,
 * `auth.$context`, ...), and its `handler` — what `toNextJsHandler` in the
 * `/api/auth` route calls per request — does the check first. So never cache
 * `auth.api` in a module-level variable; it would pin the first instance.
 * In-process `auth.api.signInSocial` calls do not trigger a rebuild (nothing
 * in `src/` makes one). `src/auth.discovery-rebuild.test.ts` pins all of this.
 */
export function selfHealingAuth<T extends RebuildableAuth>(
  create: () => T,
  {
    cooldownMs = DISCOVERY_REBUILD_COOLDOWN_MS,
    waitMs = DISCOVERY_REBUILD_WAIT_MS,
  }: { cooldownMs?: number; waitMs?: number } = {},
): T {
  let current = create();
  let builtAt = Date.now();
  let rebuilding: Promise<void> | null = null;

  async function rebuild(): Promise<void> {
    builtAt = Date.now();
    let candidate: T;
    try {
      candidate = create();
    } catch (err) {
      logDiscoveryRebuild("create_failed", errorName(err));
      return;
    }
    if (await hasProvider(candidate)) {
      current = candidate;
      logDiscoveryRebuild("recovered");
    } else {
      logDiscoveryRebuild("provider_still_missing");
    }
  }

  async function ensureProvider(): Promise<void> {
    if (await hasProvider(current)) return;
    if (!rebuilding) {
      if (Date.now() - builtAt < cooldownMs) return;
      rebuilding = rebuild().finally(() => {
        rebuilding = null;
      });
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    await Promise.race([
      rebuilding,
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, waitMs);
      }),
    ]);
    clearTimeout(timer);
  }

  const handler = async (request: Request): Promise<Response> => {
    if (needsProvider(request)) await ensureProvider();
    return current.handler(request);
  };

  // `handler`/`fetch` are real own properties of the target (so `vi.spyOn`
  // and friends can redefine them); every other property reads through to the
  // current instance.
  const own: Pick<RebuildableAuth, "handler"> & { fetch: RebuildableAuth["handler"] } = {
    handler,
    fetch: handler,
  };
  return new Proxy(own, {
    get(target, prop, receiver) {
      if (Object.hasOwn(target, prop)) return Reflect.get(target, prop, receiver);
      return Reflect.get(current, prop, current);
    },
    // `toNextJsHandler` checks `"handler" in auth` before calling it.
    has(target, prop) {
      return prop in target || prop in current;
    },
  }) as unknown as T;
}

export const auth = sharedInstance(SHARED_AUTH_KEY, () => selfHealingAuth(createAuth));

export type Session = typeof auth.$Infer.Session;

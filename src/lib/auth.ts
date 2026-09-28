import { betterAuth, BetterAuthOptions } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import { customSession } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { MPHelper } from "@/lib/providers/ministry-platform";
import { sanitizeGuid } from "@/lib/providers/ministry-platform/utils/filter-sanitize";

const mpBaseUrl = process.env.MINISTRY_PLATFORM_BASE_URL!;

/**
 * Custom fields added to the Better Auth `user` record.
 *
 * `userGuid` (the MP User_GUID / OAuth `sub`) MUST keep `input: true`. It is
 * populated server-side from the OAuth profile via `mapProfileToUser` below.
 * As of better-auth 1.6, `parseAdditionalUserInputFromProviderProfile` strips
 * any additional field declared with `input: false` BEFORE the user record is
 * created — so `input: false` silently drops `userGuid`, which breaks every MP
 * profile lookup (avatar, user menu, User_ID resolution). There is no
 * user-facing form that sets this field, so allowing input carries no practical
 * risk here. `src/auth.test.ts` guards this against future regressions.
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

// Process-wide cache of User_GUID → MP User_ID. customSession runs on every
// getSession() call, so without a cache each request would do a dp_Users
// lookup. Mapping is stable per user, so an unbounded Map is fine in practice.
const userIdCache = new Map<string, number>();

async function resolveMpUserId(userGuid: string): Promise<number | null> {
  const cached = userIdCache.get(userGuid);
  if (cached !== undefined) return cached;
  try {
    const mp = new MPHelper();
    const [record] = await mp.getTableRecords<{ User_ID: number }>({
      table: "dp_Users",
      filter: `User_GUID = '${sanitizeGuid(userGuid)}'`,
      select: "User_ID",
      top: 1,
    });
    if (record?.User_ID) {
      userIdCache.set(userGuid, record.User_ID);
      return record.User_ID;
    }
    return null;
  } catch (err) {
    // Never block session creation on this — the NonUser Write warning at
    // write time will surface the missing attribution.
    console.error("[customSession] resolveMpUserId failed", {
      userGuid,
      err: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/**
 * Builds the enriched session payload returned by `customSession` below.
 *
 * Extracted from the `customSession` callback so it can be unit tested: the
 * better-auth plugin closes over its callback and never exposes it, so the only
 * other way to exercise this logic would be to drive a full `getSession()`
 * request through the whole auth stack. Behavior is identical to the inline
 * version it replaced.
 *
 * Profile loading still happens client-side via UserProvider /
 * getCurrentUserProfile(). The only server-side lookup here is User_ID, cached
 * in-memory after the first resolution per process, so it costs at most one MP
 * call per (user × container).
 */
export async function enrichSessionUser<
  U extends { name?: string | null },
  S,
>(user: U, session: S) {
  const userGuid = (user as { userGuid?: string | null }).userGuid;
  const userId: number | null = userGuid
    ? await resolveMpUserId(userGuid)
    : null;
  return {
    user: {
      ...user,
      firstName: user.name?.split(" ")[0] || "",
      lastName: user.name?.split(" ").slice(1).join(" ") || "",
      userId,
    },
    session,
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
 * Reads the `sub` claim from a compact JWS WITHOUT verifying it.
 *
 * Deliberately unverified, and safe to be: this is only used by `getUserInfo`
 * as a BINDING check between two tokens, never as a trust decision on its own.
 * By the time `getUserInfo` runs, genericOAuth's wrapper has already verified
 * the id_token against MP's JWKS, issuer and audience (plugins/generic-oauth/
 * index.mjs, `getUserInfo`). If discovery failed at boot there is no id_token
 * config, the `/sign-in/social` id_token mode is unavailable altogether
 * (`supportsIdTokenSignIn`), and the only remaining caller is the code-flow
 * callback, whose id_token came straight from MP's token endpoint in exchange
 * for our client secret — the same provenance as the access token.
 *
 * Hand-rolled rather than `jose`'s `decodeJwt`: `jose` is only a transitive
 * dependency (via better-auth), and importing it directly would break silently
 * the day better-auth stops depending on it.
 */
function readIdTokenSub(idToken: string): { decoded: true; sub: unknown } | { decoded: false } {
  const parts = idToken.split(".");
  if (parts.length !== 3) return { decoded: false };
  try {
    const payload: unknown = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
      return { decoded: false };
    }
    return { decoded: true, sub: (payload as { sub?: unknown }).sub };
  } catch {
    return { decoded: false };
  }
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

const options = {
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXTAUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET || process.env.NEXTAUTH_SECRET,
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
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60, // 1 hour cache
      strategy: "jwt" as const,
    },
  },
  account: {
    storeStateStrategy: "cookie" as const,
    storeAccountCookie: true,
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
          clientId: process.env.OIDC_CLIENT_ID!,
          clientSecret: process.env.OIDC_CLIENT_SECRET!,
          scopes: [
            "openid",
            "offline_access",
            "http://www.thinkministry.com/dataplatform/scopes/all",
          ],
          // OAuth 2.1 makes PKCE the 1.7 default. MP's discovery document does
          // advertise `code_challenge_methods_supported: ["plain", "S256"]`,
          // so this can likely be flipped to `true` — but that is a separate,
          // separately-testable change from the 1.7 migration itself.
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
          // This looked intermittent, which sent the investigation sideways for
          // a while. The reason is inverted from the obvious one: sign-in
          // SUCCEEDED only when the boot-time discovery fetch had failed, since
          // that leaves the id_token config undefined and skips verification
          // altogether. A working discovery meant a broken sign-in.
          //
          // What this does NOT give up: the id_token signature is still checked
          // against MP's JWKS, and the issuer and audience are still checked.
          // What it does give up: binding the id_token to this particular
          // authorization request. The residual risk is id_token replay/
          // injection, mitigated by the OAuth `state` cookie check that still
          // runs, and by this being a confidential client that exchanges the
          // code with a client secret. Enabling PKCE (F8) would narrow it
          // further and is the natural follow-up.
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
            const idTokenClaim = readIdTokenSub(tokens.idToken);
            if (!idTokenClaim.decoded) {
              logSubBindingFailure("undecodable_id_token");
              return null;
            }
            const idTokenSub = idTokenClaim.sub;
            if (typeof idTokenSub !== "string" || idTokenSub === "") {
              logSubBindingFailure("missing_sub");
              return null;
            }

            // Fetch the OIDC profile to get the sub (User_GUID)
            const response = await fetch(
              `${mpBaseUrl}/oauth/connect/userinfo`,
              {
                headers: {
                  Authorization: `Bearer ${tokens.accessToken}`,
                },
              },
            );

            if (!response.ok) {
              console.error(
                "getUserInfo - Failed to fetch user info:",
                response.status,
              );
              return null;
            }

            const profile = await response.json();

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
            return {
              sub,
              email: typeof profile.email === "string" ? profile.email : null,
              name: `${profile.given_name} ${profile.family_name}`,
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

export const auth = betterAuth({
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

export type Session = typeof auth.$Infer.Session;

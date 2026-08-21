import { betterAuth, BetterAuthOptions } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import { customSession } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
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
 */
export const userAdditionalFields = {
  userGuid: {
    type: "string" as const,
    required: false,
    input: true,
  },
};

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
    console.error("[customSession] resolveMpUserId failed", { userGuid, err });
    return null;
  }
}

const options = {
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXTAUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET || process.env.NEXTAUTH_SECRET,
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
          // better-auth 1.7 keys accounts on (issuer, accountId) and REFUSES to
          // initialize a discovery provider whose issuer it cannot pin down —
          // a failed discovery fetch throws out of `betterAuth()` rather than
          // degrading silently as it did in 1.6. Declaring the issuer keeps
          // the account namespace stable (and the module importable without
          // network access, e.g. in tests/CI). MP's discovery document reports
          // exactly this value; discovery still supplies the endpoints and the
          // JWKS used to verify ID tokens.
          accountIssuer: `${mpBaseUrl}/oauth`,
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
          authorizationUrlParams: {
            realm: "realm",
          },
          getUserInfo: async (tokens) => {
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

            // `sub` (not `id`) is what better-auth 1.7 reads for the account
            // subject. MP's discovery document advertises
            // `id_token_signing_alg_values_supported`, so the provider is
            // treated as OIDC and the default `accountSubject` resolver reads
            // `profile.sub` from this raw profile. Returning only `id` (the
            // pre-1.7 shape) resolves the subject to "" and breaks account
            // identity. `src/auth.test.ts` guards this.
            return {
              sub: profile.sub,
              email: profile.email,
              name: `${profile.given_name} ${profile.family_name}`,
              image: undefined,
              emailVerified: true,
            };
          },
          // Map the OAuth sub claim (User_GUID) to our custom userGuid field.
          // Better Auth generates its own internal user.id, so we need a
          // separate field to store the MP User_GUID for API lookups.
          // As of 1.7 `mapProfileToUser` receives the raw profile returned by
          // `getUserInfo` above and may not return `id` — provider identity is
          // owned by `accountSubject`. The return type allows arbitrary extra
          // keys, so no cast is needed.
          mapProfileToUser: (profile) => {
            return {
              userGuid: String(profile.sub ?? ""),
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
      async ({ user, session }) => {
        // Profile loading still happens client-side via UserProvider /
        // getCurrentUserProfile(). The only server-side lookup we do here is
        // User_ID, cached in-memory after the first resolution per process,
        // so it costs at most one MP call per (user × container).
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
      },
      options,
    ),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;

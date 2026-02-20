import { betterAuth, BetterAuthOptions } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import { customSession } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";

const mpBaseUrl = process.env.MINISTRY_PLATFORM_BASE_URL!;

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
    additionalFields: {
      userGuid: {
        type: "string" as const,
        required: false,
        input: false,
      },
    },
  },
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "ministry-platform",
          discoveryUrl: `${mpBaseUrl}/oauth/.well-known/openid-configuration`,
          clientId: process.env.OIDC_CLIENT_ID!,
          clientSecret: process.env.OIDC_CLIENT_SECRET!,
          scopes: [
            "openid",
            "offline_access",
            "http://www.thinkministry.com/dataplatform/scopes/all",
          ],
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

            return {
              id: profile.sub,
              email: profile.email,
              name: `${profile.given_name} ${profile.family_name}`,
              image: undefined,
              emailVerified: true,
            };
          },
          // Map the OAuth sub claim (User_GUID) to our custom userGuid field.
          // Better Auth generates its own internal user.id, so we need a
          // separate field to store the MP User_GUID for API lookups.
          // The cast is needed because genericOAuth's type doesn't include additionalFields,
          // but the runtime code does pass extra fields through to createOAuthUser.
          mapProfileToUser: (profile) => {
            return {
              userGuid: profile.id,
            } as Record<string, unknown>;
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
        // No API calls here — profile loading is handled by UserProvider
        // on the client side via getCurrentUserProfile(). This keeps
        // getSession() fast and avoids hitting the MP API on every request.
        return {
          user: {
            ...user,
            firstName: user.name?.split(" ")[0] || "",
            lastName: user.name?.split(" ").slice(1).join(" ") || "",
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

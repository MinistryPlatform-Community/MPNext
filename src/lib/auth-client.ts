import { createAuthClient } from "better-auth/react";
import { customSessionClient } from "better-auth/client/plugins";
import type { auth } from "./auth";

// `genericOAuthClient()` was dropped in better-auth 1.7: generic OAuth
// providers are registered as first-class social providers, so they are reached
// through the standard `signIn.social({ provider })` client API.
export const authClient = createAuthClient({
  plugins: [
    customSessionClient<typeof auth>(),
  ],
});

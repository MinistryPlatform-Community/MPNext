import { createAuthClient } from "better-auth/react";
import { genericOAuthClient, customSessionClient } from "better-auth/client/plugins";
import type { auth } from "./auth";

export const authClient = createAuthClient({
  plugins: [
    genericOAuthClient(),
    customSessionClient<typeof auth>(),
  ],
});

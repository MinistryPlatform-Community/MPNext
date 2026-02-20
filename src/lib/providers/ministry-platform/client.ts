import { getClientCredentialsToken } from "./auth/client-credentials";
import { HttpClient } from "./utils/http-client";

// Token refresh interval - refresh 5 minutes before actual expiration for safety
const TOKEN_LIFE = 5 * 60 * 1000; // 5 minutes

export interface MinistryPlatformClientOptions {
    /** Pre-authenticated user access token (from OIDC session). When provided,
     *  the client uses this token directly instead of client_credentials flow. */
    accessToken?: string;
}

/**
 * MinistryPlatformClient - Core HTTP client with automatic authentication management
 *
 * Manages OAuth2 authentication and provides a configured HttpClient instance for all
 * Ministry Platform API operations. Supports two authentication modes:
 *
 * 1. **Client credentials** (default) — uses MINISTRY_PLATFORM_CLIENT_ID/SECRET to obtain
 *    a token via the client_credentials grant. All API calls run as the API Client User.
 *
 * 2. **User access token** — uses a pre-authenticated token from the user's OIDC session.
 *    API calls run as the logged-in user, respecting their MP permissions and producing
 *    accurate audit logs. Token refresh is handled by NextAuth (auth.ts), not this client.
 */
export class MinistryPlatformClient {
    private token: string = ""; // Current access token
    private expiresAt: Date = new Date(0); // Token expiration time (initialized to epoch to force refresh)
    private baseUrl: string; // Ministry Platform instance base URL
    private httpClient: HttpClient; // HTTP client instance with token injection
    private isUserToken: boolean = false; // Whether using a user access token (vs. client credentials)

    /**
     * Creates a new MinistryPlatformClient instance
     * @param options Optional configuration. Pass `accessToken` to use the user's OIDC token
     *               instead of client credentials.
     */
    constructor(options?: MinistryPlatformClientOptions) {
        // Get base URL from environment variable
        this.baseUrl = process.env.MINISTRY_PLATFORM_BASE_URL!;

        if (options?.accessToken) {
            // User token mode: use the pre-authenticated token directly.
            // Token refresh is managed by NextAuth's JWT callback, not by this client.
            this.token = options.accessToken;
            this.expiresAt = new Date(Date.now() + 60 * 60 * 1000); // Trust auth.ts to keep it fresh
            this.isUserToken = true;
        }

        // Create HTTP client with token getter function for automatic authentication
        this.httpClient = new HttpClient(this.baseUrl, () => this.token);
    }

    /**
     * Ensures the authentication token is valid and refreshes if necessary.
     * In user-token mode this is a no-op — NextAuth manages the token lifecycle.
     * @throws Error if token refresh fails (client credentials mode only)
     */
    public async ensureValidToken(): Promise<void> {
        // User tokens are managed by auth.ts JWT callback — nothing to do here
        if (this.isUserToken) return;

        console.log("Checking token validity...");
        console.log("Expires at: ", this.expiresAt);
        console.log("Current time: ", new Date());

        // Check if token is expired or about to expire
        if (this.expiresAt < new Date()) {
            console.log("Token expired, refreshing...");

            try {
                // Get new access token using client credentials flow
                const creds = await getClientCredentialsToken();
                this.token = creds.access_token;

                // Set expiration time with safety buffer (TOKEN_LIFE before actual expiration)
                this.expiresAt = new Date(Date.now() + TOKEN_LIFE);

                console.log("Token refreshed. Expires at: ", this.expiresAt);
            } catch (error) {
                console.error("Failed to refresh token:", error);
                throw error;
            }
        }
    }

    /**
     * Returns the configured HTTP client instance for making authenticated requests
     * @returns HttpClient instance with automatic token injection
     */
    public getHttpClient(): HttpClient {
        return this.httpClient;
    }
}
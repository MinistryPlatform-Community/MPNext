import { getClientCredentialsToken } from "./auth/client-credentials";
import { HttpClient } from "./utils/http-client";

// Refresh this far ahead of the token's real expiration, so a request that is
// already in flight never races the expiry boundary.
const TOKEN_SAFETY_MARGIN = 5 * 60 * 1000; // 5 minutes

// Used when the token response omits expires_in. MP client-credentials tokens
// are issued with a 1 hour lifetime.
const DEFAULT_TOKEN_LIFETIME_SECONDS = 3600;

// Floor on usable token life, so a pathologically short expires_in cannot drive
// a refresh storm (or, after subtracting the margin, go negative).
const MIN_TOKEN_LIFETIME = 30 * 1000; // 30 seconds

/**
 * MinistryPlatformClient - Core HTTP client with automatic authentication management
 * 
 * Manages OAuth2 client credentials authentication and provides a configured HttpClient
 * instance for all Ministry Platform API operations. Handles token lifecycle including
 * automatic refresh before expiration.
 */
export class MinistryPlatformClient {
    private token: string = ""; // Current access token
    private expiresAt: Date = new Date(0); // Token expiration time (initialized to epoch to force refresh)
    private baseUrl: string; // Ministry Platform instance base URL
    private httpClient: HttpClient; // HTTP client instance with token injection

    /**
     * Creates a new MinistryPlatformClient instance
     * Initializes the HTTP client and sets up token management
     */
    constructor() {
        // Get base URL from environment variable
        this.baseUrl = process.env.MINISTRY_PLATFORM_BASE_URL!;
        
        // Create HTTP client with token getter function for automatic authentication
        this.httpClient = new HttpClient(this.baseUrl, () => this.token);
    }

    /**
     * Ensures the authentication token is valid and refreshes if necessary
     * This method should be called before making any API requests to guarantee authentication
     * @throws Error if token refresh fails
     */
    public async ensureValidToken(): Promise<void> {
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
                
                // Expire the token TOKEN_SAFETY_MARGIN before the lifetime the
                // server reported, never sooner than MIN_TOKEN_LIFETIME from now.
                const seconds = Number(creds.expires_in);
                const lifetimeMs =
                    (Number.isFinite(seconds) && seconds > 0
                        ? seconds
                        : DEFAULT_TOKEN_LIFETIME_SECONDS) * 1000;
                this.expiresAt = new Date(
                    Date.now() + Math.max(lifetimeMs - TOKEN_SAFETY_MARGIN, MIN_TOKEN_LIFETIME)
                );
                
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

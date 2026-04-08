import { getClientCredentialsToken } from "./auth/client-credentials";
import { HttpClient } from "./utils/http-client";

// Token refresh interval - refresh 5 minutes before actual expiration for safety
const TOKEN_LIFE = 5 * 60 * 1000; // 5 minutes

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
        // Check if token is expired or about to expire
        if (this.expiresAt < new Date()) {
            try {
                // Get new access token using client credentials flow
                const creds = await getClientCredentialsToken();
                this.token = creds.access_token;

                // Set expiration time with safety buffer (TOKEN_LIFE before actual expiration)
                this.expiresAt = new Date(Date.now() + TOKEN_LIFE);
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
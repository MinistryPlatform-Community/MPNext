import { getMpBaseUrl } from "@/lib/env";
import { getClientCredentialsToken } from "./auth/client-credentials";
import { errorName, HttpClient } from "./utils/http-client";

// Refresh this far ahead of the token's real expiration, so a request that is
// already in flight never races the expiry boundary.
const TOKEN_SAFETY_MARGIN = 5 * 60 * 1000; // 5 minutes

// Used when the token response omits expires_in. MP client-credentials tokens
// are issued with a 1 hour lifetime.
const DEFAULT_TOKEN_LIFETIME_SECONDS = 3600;

// Floor on usable token life, so a pathologically short expires_in cannot drive
// a refresh storm (or, after subtracting the margin, go negative).
const MIN_TOKEN_LIFETIME = 30 * 1000; // 30 seconds

// Ceiling on the reported lifetime. An absurd expires_in (e.g. 1e13) would
// otherwise produce an Invalid Date that compares as never expired.
const MAX_TOKEN_LIFETIME_SECONDS = 3600;

// After a failed refresh, fail fast for a short, jittered window instead of
// letting every concurrent caller hit a token endpoint that is already down.
const NEGATIVE_CACHE_MIN_MS = 5 * 1000;
const NEGATIVE_CACHE_JITTER_MS = 25 * 1000;

/**
 * MinistryPlatformClient - Core HTTP client with automatic authentication management
 *
 * Manages OAuth2 client credentials authentication and provides a configured HttpClient
 * instance for all Ministry Platform API operations. Handles token lifecycle including
 * automatic refresh before expiration, one shared refresh for concurrent callers, and
 * invalidation when the API rejects the token with a 401.
 */
export class MinistryPlatformClient {
    private token: string = ""; // Current access token
    private expiresAt: Date = new Date(0); // Token expiration time (initialized to epoch to force refresh)
    private baseUrl: string; // Ministry Platform instance base URL
    private httpClient: HttpClient; // HTTP client instance with token injection
    private inflight: Promise<void> | null = null; // Refresh shared by concurrent callers
    private failedUntil = 0; // Epoch ms before which refreshes are not re-attempted

    /**
     * Creates a new MinistryPlatformClient instance
     * Initializes the HTTP client and sets up token management
     */
    constructor() {
        // Validated base URL (https, no credentials/query, no trailing slash);
        // throws on an unset or unusable MINISTRY_PLATFORM_BASE_URL
        this.baseUrl = getMpBaseUrl();

        // Create HTTP client with token getter function for automatic authentication,
        // and a 401 hook that drops the rejected token and fetches a fresh one
        this.httpClient = new HttpClient(
            this.baseUrl,
            () => this.token,
            (rejectedToken) => this.handleUnauthorized(rejectedToken)
        );
    }

    /**
     * Ensures the authentication token is valid and refreshes if necessary
     * This method should be called before making any API requests to guarantee authentication
     * @throws Error if token refresh fails
     */
    public async ensureValidToken(): Promise<void> {
        // Check if token is expired or about to expire
        if (this.expiresAt >= new Date()) {
            return;
        }
        if (!this.inflight) {
            if (Date.now() < this.failedUntil) {
                throw new Error("MP access token unavailable: recent refresh failed");
            }
            this.inflight = this.refreshToken().finally(() => {
                this.inflight = null;
            });
        }
        return this.inflight;
    }

    /**
     * Returns the configured HTTP client instance for making authenticated requests
     * @returns HttpClient instance with automatic token injection
     */
    public getHttpClient(): HttpClient {
        return this.httpClient;
    }

    private async refreshToken(): Promise<void> {
        try {
            // Get new access token using client credentials flow (the response is
            // validated there: non-empty access_token, bearer token_type)
            const creds = await getClientCredentialsToken();
            this.token = creds.access_token;

            // Expire the token TOKEN_SAFETY_MARGIN before the lifetime the
            // server reported (clamped to [MIN, MAX]), never sooner than
            // MIN_TOKEN_LIFETIME from now.
            const seconds = Number(creds.expires_in);
            const lifetimeMs =
                (Number.isFinite(seconds)
                    ?Math.min(Math.max(seconds, MIN_TOKEN_LIFETIME / 1000), MAX_TOKEN_LIFETIME_SECONDS)
                    : DEFAULT_TOKEN_LIFETIME_SECONDS) * 1000;
            this.expiresAt = new Date(
                Date.now() + Math.max(lifetimeMs - TOKEN_SAFETY_MARGIN, MIN_TOKEN_LIFETIME)
            );
            this.failedUntil = 0;
        } catch (error) {
            this.failedUntil =
                Date.now() + NEGATIVE_CACHE_MIN_MS + Math.floor(Math.random() * NEGATIVE_CACHE_JITTER_MS);
            // Name only: never the raw error, which could carry response content.
            console.error("Failed to refresh MP access token:", { error: errorName(error) });
            throw error;
        }
    }

    private async handleUnauthorized(rejectedToken: string): Promise<void> {
        // Only invalidate if nobody has replaced the token since it was sent,
        // so a burst of 401s for one stale token triggers a single refresh.
        if (this.token === rejectedToken) {
            this.expiresAt = new Date(0);
        }
        await this.ensureValidToken();
    }
}

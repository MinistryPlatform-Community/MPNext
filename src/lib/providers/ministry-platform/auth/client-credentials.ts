import { errorName, readJsonResponse } from "../utils/http-client";

/**
 * Shape of the OAuth2 client-credentials token response returned by the
 * Ministry Platform `/oauth/connect/token` endpoint.
 *
 * `expires_in` is the token's lifetime in seconds. It is optional here because
 * the endpoint's response is untrusted at the type level — callers must handle
 * it being absent or non-numeric.
 */
export interface ClientCredentialsToken {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

// Deadline for the token request. It gates every MP call, so a stalled token
// endpoint must fail fast rather than hold requests for undici's 300 s default.
export const TOKEN_TIMEOUT_MS = 10_000;

const ERROR_PREFIX = "Failed to get client credentials token";

export async function getClientCredentialsToken(): Promise<ClientCredentialsToken> {
  const mpBaseUrl = process.env.MINISTRY_PLATFORM_BASE_URL!;
  const mpOauthUrl = `${mpBaseUrl}/oauth`;

  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: process.env.MINISTRY_PLATFORM_CLIENT_ID!,
    client_secret: process.env.MINISTRY_PLATFORM_CLIENT_SECRET!,
    scope: "http://www.thinkministry.com/dataplatform/scopes/all",
  });

  let response: Response;
  try {
    response = await fetch(`${mpOauthUrl}/connect/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      // A 307/308 would re-send the form body — client_secret included — to
      // whatever origin it names. MP's token endpoint never redirects.
      redirect: "error",
      signal: AbortSignal.timeout(TOKEN_TIMEOUT_MS),
    });
  } catch (error) {
    // Name only (TypeError / TimeoutError): the raw error is not ours to log.
    throw new Error(`${ERROR_PREFIX}: ${errorName(error)}`);
  }

  if (!response.ok) {
    // Status first: statusText is empty over HTTP/2. Never the body.
    throw new Error(`${ERROR_PREFIX}: ${response.status} ${response.statusText}`.trimEnd());
  }

  const token = await readJsonResponse<Partial<ClientCredentialsToken> | undefined>(
    response,
    ERROR_PREFIX
  );

  // A 200 without a usable bearer token would otherwise be cached and sent as
  // "Authorization: Bearer undefined" until it expired.
  if (
    !token ||
    typeof token.access_token !== "string" ||
    token.access_token.trim() === "" ||
    typeof token.token_type !== "string" ||
    token.token_type.toLowerCase() !== "bearer"
  ) {
    throw new Error(`${ERROR_PREFIX}: invalid token response`);
  }

  return token as ClientCredentialsToken;
}

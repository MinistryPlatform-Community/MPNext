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

export async function getClientCredentialsToken(): Promise<ClientCredentialsToken> {
  const mpBaseUrl = process.env.MINISTRY_PLATFORM_BASE_URL!;
  const mpOauthUrl = `${mpBaseUrl}/oauth`;

  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: process.env.MINISTRY_PLATFORM_CLIENT_ID!,
    client_secret: process.env.MINISTRY_PLATFORM_CLIENT_SECRET!,
    scope: "http://www.thinkministry.com/dataplatform/scopes/all",
  });

  const response = await fetch(`${mpOauthUrl}/connect/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get client credentials token: ${response.statusText}`);
  }

  return (await response.json()) as ClientCredentialsToken;
}

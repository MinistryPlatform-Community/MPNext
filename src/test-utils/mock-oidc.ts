/**
 * Test-only mock of Ministry Platform's OIDC provider, for driving the REAL
 * `auth.handler` from src/lib/auth.ts through the full authorization-code flow
 * (discovery, JWKS, token, userinfo), with id_tokens genuinely RS256-signed by
 * a key the mock JWKS publishes.
 *
 * `installMockOidc()` replaces `globalThis.fetch` with a stub that THROWS for
 * any URL it does not serve, so nothing that uses it can reach a real Ministry
 * Platform. Run it before `@/lib/auth` is imported, i.e. inside `vi.hoisted`,
 * so no module ever captures the real `fetch`:
 *
 *   const oidc = await vi.hoisted(async () =>
 *     (await import('@/test-utils/mock-oidc')).installMockOidc());
 *
 * Use it from `// @vitest-environment node` suites: better-auth verifies the
 * id_token with `jose` over WebCrypto, which rejects jsdom-realm typed arrays.
 *
 * Not a test file itself; it is imported only by `src/auth.*.test.ts`.
 */
import { generateKeyPairSync, sign, type KeyObject } from 'node:crypto';
import { expect } from 'vitest';

export const MOCK_MP_BASE = 'https://test-mp.example.com';
export const MOCK_ISSUER = `${MOCK_MP_BASE}/oauth`;
export const MOCK_CLIENT_ID = 'test-client-id';
export const MOCK_SUB = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

/**
 * How an MP endpoint behaves: `ok`; `reject` (a network error, like a refused
 * connection); `http_500`; `hang` (accepts the request, never answers — it
 * settles only when the caller's `AbortSignal` fires).
 */
export type MockEndpointMode = 'ok' | 'reject' | 'http_500' | 'hang';

/** Everything a test may change between requests. `reset()` restores it. */
export interface MockOidcState {
  /** How the discovery endpoint behaves. */
  discovery: MockEndpointMode;
  /** How the JWKS endpoint behaves. */
  jwks: MockEndpointMode;
  /** When not `ok`, EVERY mock MP endpoint behaves this way (MP down). */
  mp: MockEndpointMode;
  /** Keys to drop from the discovery document. */
  omitDiscovery: string[];
  /** Claim overrides for the next id_tokens (an `undefined` value drops the claim). */
  claims: Record<string, unknown>;
  /** Sign the next id_tokens with a key the JWKS does NOT publish. */
  foreignKey: boolean;
  /** Fields merged over the userinfo response. */
  userinfo: Record<string, unknown>;
}

export interface RecordedCall {
  url: string;
  method: string;
  body: string;
}

export interface MockOidc {
  sub: string;
  issuer: string;
  state: MockOidcState;
  /** Every request the mock served, in order. */
  calls: RecordedCall[];
  /**
   * An RS256 id_token signed by the key the JWKS publishes (or the foreign key
   * when `state.foreignKey`), with the given claim overrides on top of
   * `state.claims` (an `undefined` value drops the claim).
   */
  signIdToken(claims?: Record<string, unknown>): string;
  reset(): void;
}

const b64 = (v: unknown) => Buffer.from(JSON.stringify(v)).toString('base64url');

const json = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

function freshState(): MockOidcState {
  return { discovery: 'ok', jwks: 'ok', mp: 'ok', omitDiscovery: [], claims: {}, foreignKey: false, userinfo: {} };
}

/** A non-`ok` mode's response: rejects, 500s, or waits for the caller's abort. */
function misbehave(mode: Exclude<MockEndpointMode, 'ok'>, signal: AbortSignal | null | undefined) {
  if (mode === 'reject') return Promise.reject(new TypeError('fetch failed'));
  if (mode === 'http_500') return Promise.resolve(new Response('error', { status: 500 }));
  return new Promise<Response>((_, reject) => {
    signal?.addEventListener('abort', () => reject(signal.reason), { once: true });
  });
}

export function installMockOidc(): MockOidc {
  const keyPair = () => generateKeyPairSync('rsa', { modulusLength: 2048 });
  const published = keyPair();
  const foreign = keyPair();
  const jwk = { ...published.publicKey.export({ format: 'jwk' }), kid: 'test-key-1', alg: 'RS256', use: 'sig' };

  const mock: MockOidc = {
    sub: MOCK_SUB,
    issuer: MOCK_ISSUER,
    state: freshState(),
    calls: [],
    signIdToken: (claims) => signIdToken(claims),
    reset() {
      mock.state = freshState();
      mock.calls.length = 0;
    },
  };

  function signIdToken(overrides: Record<string, unknown> = {}): string {
    const now = Math.floor(Date.now() / 1000);
    const claims = JSON.parse(
      JSON.stringify({
        iss: MOCK_ISSUER,
        aud: MOCK_CLIENT_ID,
        sub: MOCK_SUB,
        iat: now,
        exp: now + 300,
        ...mock.state.claims,
        ...overrides,
      }),
    ) as Record<string, unknown>;
    const input = `${b64({ alg: 'RS256', kid: 'test-key-1', typ: 'JWT' })}.${b64(claims)}`;
    const key: KeyObject = mock.state.foreignKey ? foreign.privateKey : published.privateKey;
    return `${input}.${sign('RSA-SHA256', Buffer.from(input), key).toString('base64url')}`;
  }

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    const { url, method } = request;
    mock.calls.push({ url, method, body: await request.clone().text() });

    const servesUrl = url.startsWith(`${MOCK_ISSUER}/`);
    if (servesUrl && mock.state.mp !== 'ok') return misbehave(mock.state.mp, request.signal);
    if (url === `${MOCK_ISSUER}/.well-known/openid-configuration`) {
      if (mock.state.discovery !== 'ok') return misbehave(mock.state.discovery, request.signal);
      const doc: Record<string, unknown> = {
        issuer: MOCK_ISSUER,
        authorization_endpoint: `${MOCK_ISSUER}/connect/authorize`,
        token_endpoint: `${MOCK_ISSUER}/connect/token`,
        userinfo_endpoint: `${MOCK_ISSUER}/connect/userinfo`,
        end_session_endpoint: `${MOCK_ISSUER}/connect/endsession`,
        jwks_uri: `${MOCK_ISSUER}/.well-known/openid-configuration/jwks`,
        id_token_signing_alg_values_supported: ['RS256'],
      };
      for (const key of mock.state.omitDiscovery) delete doc[key];
      return json(doc);
    }
    if (url === `${MOCK_ISSUER}/.well-known/openid-configuration/jwks`) {
      if (mock.state.jwks !== 'ok') return misbehave(mock.state.jwks, request.signal);
      return json({ keys: [jwk] });
    }
    if (url === `${MOCK_ISSUER}/connect/token` && method === 'POST') {
      return json({
        access_token: 'mock-access-token',
        id_token: signIdToken(),
        token_type: 'Bearer',
        expires_in: 3600,
      });
    }
    if (url === `${MOCK_ISSUER}/connect/userinfo`) {
      return json({
        sub: MOCK_SUB,
        given_name: 'Code',
        family_name: 'Flow',
        email: 'code-flow-member@example.test',
        ...mock.state.userinfo,
      });
    }
    throw new Error(`Blocked unexpected fetch in test: ${method} ${url}`);
  }) as typeof fetch;

  return mock;
}

/** A minimal browser cookie jar: applies Set-Cookie (including deletions). */
export class CookieJar {
  readonly cookies = new Map<string, string>();

  constructor(from?: CookieJar) {
    if (from) for (const [k, v] of from.cookies) this.cookies.set(k, v);
  }

  apply(response: Response): this {
    for (const line of response.headers.getSetCookie()) {
      const [pair, ...attrs] = line.split(';');
      const eq = pair.indexOf('=');
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      const expired = attrs.some((a) => /^\s*max-age=(0|-)/i.test(a));
      if (value === '' || expired) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
    return this;
  }

  /** The value of the one cookie whose name ends with `suffix`. */
  get(suffix: string): string | undefined {
    return [...this.cookies].find(([name]) => name.endsWith(suffix))?.[1];
  }

  /** A copy holding only the cookies whose names match. */
  only(pattern: RegExp): CookieJar {
    const copy = new CookieJar();
    for (const [k, v] of this.cookies) if (pattern.test(k)) copy.cookies.set(k, v);
    return copy;
  }

  header(): string {
    return [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; ');
  }
}

export interface AuthLike {
  handler: (request: Request) => Promise<Response>;
}

/** `POST /sign-in/social` as the sign-in page sends it. */
export function postSignInSocial(
  instance: AuthLike,
  origin: string,
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
): Promise<Response> {
  return instance.handler(
    new Request(`${origin}/api/auth/sign-in/social`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: origin, ...headers },
      body: JSON.stringify(body),
    }),
  );
}

/** Starts sign-in; returns the jar (state cookie) and the authorize URL. */
export async function startSignIn(instance: AuthLike, origin: string) {
  const response = await postSignInSocial(instance, origin, {
    provider: 'ministry-platform',
    callbackURL: '/',
  });
  expect(response.status).toBe(200);
  const jar = new CookieJar().apply(response);
  const { url } = (await response.json()) as { url: string };
  return { jar, authorizeUrl: new URL(url), response };
}

/** `GET /callback/ministry-platform` with the given query and cookies. */
export function callback(
  instance: AuthLike,
  origin: string,
  query: Record<string, string>,
  jar: CookieJar,
): Promise<Response> {
  return instance.handler(
    new Request(`${origin}/api/auth/callback/ministry-platform?${new URLSearchParams(query)}`, {
      headers: { Cookie: jar.header() },
    }),
  );
}

/** The full authorization-code flow; returns the callback response and the updated jar. */
export async function codeFlow(instance: AuthLike, origin: string) {
  const { jar, authorizeUrl } = await startSignIn(instance, origin);
  const state = String(authorizeUrl.searchParams.get('state'));
  const response = await callback(instance, origin, { code: 'test-code', state }, jar);
  expect(response.status).toBe(302);
  jar.apply(response);
  return { response, jar, location: String(response.headers.get('location')) };
}

/** `GET /get-session`; returns the parsed body (null when signed out). */
export async function getSession(
  instance: AuthLike,
  origin: string,
  jar: CookieJar,
): Promise<{ user: Record<string, unknown>; session: Record<string, unknown> } | null> {
  const response = await instance.handler(
    new Request(`${origin}/api/auth/get-session`, { headers: { Cookie: jar.header() } }),
  );
  expect(response.status).toBe(200);
  return (await response.json()) as { user: Record<string, unknown>; session: Record<string, unknown> } | null;
}

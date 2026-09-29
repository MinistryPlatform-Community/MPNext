// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { betterAuth } from 'better-auth';

/**
 * Rate-limit IP resolution through the REAL auth options (review item
 * security-auth-test-gaps #5). src/auth.ip-address.test.ts covers
 * `parseIpAddressOptions` and a bare better-auth instance; this suite proves
 * the app's own config wires `AUTH_IP_ADDRESS_HEADERS` / `AUTH_TRUSTED_PROXIES`
 * into better-auth's limiter on `POST /sign-in/social` (3 per 10 s per IP).
 *
 * Each test re-imports `@/lib/auth` under a stubbed env (Vitest builds a fresh
 * instance per import) and forces `rateLimit.enabled` (better-auth enables it
 * only in production). `fetch` THROWS for any URL the mock OIDC server does
 * not serve.
 */

await vi.hoisted(async () => (await import('@/test-utils/mock-oidc')).installMockOidc());

vi.mock('@/lib/providers/ministry-platform', () => ({
  MPHelper: class {
    getTableRecords = vi.fn().mockResolvedValue([]);
  },
}));

import { postSignInSocial } from '@/test-utils/mock-oidc';

const ORIGIN = 'http://localhost:3000';

const IP_KEYS = ['AUTH_IP_ADDRESS_HEADERS', 'AUTH_TRUSTED_PROXIES'] as const;

// Set and restored by hand: `vi.unstubAllEnvs()` would also drop the stubs
// src/test-setup.ts made (MINISTRY_PLATFORM_BASE_URL etc.).
async function limitedAuth(env: Partial<Record<(typeof IP_KEYS)[number], string>>) {
  for (const key of IP_KEYS) {
    if (env[key] === undefined) delete process.env[key];
    else process.env[key] = env[key];
  }
  vi.resetModules();
  const { auth } = await import('@/lib/auth');
  return betterAuth({ ...auth.options, rateLimit: { enabled: true } });
}

async function statuses(instance: { handler: (r: Request) => Promise<Response> }, headers: Array<Record<string, string>>) {
  const out: number[] = [];
  for (const h of headers) {
    out.push((await postSignInSocial(instance, ORIGIN, { provider: 'ministry-platform', callbackURL: '/' }, h)).status);
  }
  return out;
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

let savedEnv: Record<string, string | undefined>;

beforeEach(() => {
  savedEnv = Object.fromEntries(IP_KEYS.map((k) => [k, process.env[k]]));
});

afterEach(() => {
  for (const key of IP_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
  vi.restoreAllMocks();
});

describe('sign-in rate limiting with the app config', () => {
  it('negative control: unconfigured, clients behind a proxy chain share one bucket', async () => {
    const instance = await limitedAuth({});
    const chain = (client: string) => ({ 'x-forwarded-for': `${client}, 10.0.0.5` });

    expect(
      await statuses(instance, [chain('203.0.113.1'), chain('203.0.113.1'), chain('203.0.113.1'), chain('203.0.113.2')]),
    ).toEqual([200, 200, 200, 429]);
  });

  it('AUTH_IP_ADDRESS_HEADERS: one bucket per client, and a rotated x-forwarded-for does not escape it', async () => {
    const instance = await limitedAuth({ AUTH_IP_ADDRESS_HEADERS: 'cf-connecting-ip' });
    const from = (ip: string, xff: string) => ({ 'cf-connecting-ip': ip, 'x-forwarded-for': xff });

    expect(
      await statuses(instance, [
        from('203.0.113.10', '198.51.100.1'),
        from('203.0.113.10', '198.51.100.2'),
        from('203.0.113.10', '198.51.100.3'),
        from('203.0.113.10', '198.51.100.4'),
        from('203.0.113.11', '198.51.100.4'),
      ]),
    ).toEqual([200, 200, 200, 429, 200]);
  });

  it('AUTH_TRUSTED_PROXIES: the first untrusted hop is the client; a spoofed leftmost value is ignored', async () => {
    const instance = await limitedAuth({ AUTH_TRUSTED_PROXIES: '10.0.0.0/24' });
    const via = (spoofed: string, client: string) => ({ 'x-forwarded-for': `${spoofed}, ${client}, 10.0.0.5` });

    expect(
      await statuses(instance, [
        via('198.51.100.1', '203.0.113.20'),
        via('198.51.100.2', '203.0.113.20'),
        via('198.51.100.3', '203.0.113.20'),
        via('198.51.100.4', '203.0.113.20'),
        via('198.51.100.4', '203.0.113.21'),
      ]),
    ).toEqual([200, 200, 200, 429, 200]);
  });

  it('refuses to build the auth instance on an invalid entry (fails closed at startup)', async () => {
    await expect(limitedAuth({ AUTH_TRUSTED_PROXIES: 'proxy.internal' })).rejects.toThrow(/AUTH_TRUSTED_PROXIES/);
  });
});

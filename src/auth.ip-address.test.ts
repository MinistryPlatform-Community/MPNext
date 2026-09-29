// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { betterAuth } from 'better-auth';
import { getIP, getIPFromHeader } from '@better-auth/core/utils/ip';

/**
 * Guard for review item security-rate-limit-ip-resolution: which client IP
 * better-auth's rate limiter keys on is host-specific, so it is configured by
 * `AUTH_IP_ADDRESS_HEADERS` / `AUTH_TRUSTED_PROXIES` (see
 * `parseIpAddressOptions` in src/lib/auth.ts). Without it, clients whose IP
 * can't be resolved all share one bucket and three requests lock everyone out
 * of sign-in. No network: the rate-limit test uses a bare better-auth
 * instance with no providers.
 */

// Mock MP OIDC server (discovery with `issuer` + `jwks_uri`, a local JWKS);
// any other fetch throws.
await vi.hoisted(async () => (await import('@/test-utils/mock-oidc')).installMockOidc());

vi.mock('@/lib/providers/ministry-platform', () => ({
  MPHelper: class {
    getTableRecords = vi.fn().mockResolvedValue([]);
  },
}));

import { auth, parseIpAddressOptions } from '@/lib/auth';

const resolve = (headers: Record<string, string>, env: Record<string, string>) =>
  getIP(new Headers(headers), { advanced: { ipAddress: parseIpAddressOptions(env) } });

describe('parseIpAddressOptions', () => {
  it('returns nothing when unconfigured (better-auth default: single-value x-forwarded-for)', () => {
    expect(parseIpAddressOptions({})).toEqual({});
    expect(parseIpAddressOptions({ AUTH_IP_ADDRESS_HEADERS: ' , ', AUTH_TRUSTED_PROXIES: '' })).toEqual({});
  });

  it('parses, trims and lower-cases header names in order', () => {
    expect(
      parseIpAddressOptions({ AUTH_IP_ADDRESS_HEADERS: ' CF-Connecting-IP , x-forwarded-for ' }),
    ).toEqual({ ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for'] });
  });

  it('parses trusted proxies (IPv4, IPv6, CIDR)', () => {
    expect(
      parseIpAddressOptions({ AUTH_TRUSTED_PROXIES: '10.0.0.5, 10.1.0.0/16,2001:db8::/32, ::1' }),
    ).toEqual({ trustedProxies: ['10.0.0.5', '10.1.0.0/16', '2001:db8::/32', '::1'] });
  });

  it.each(['x forwarded for', 'x-ip;evil', 'x_real_ip'])('refuses an invalid header name: %s', (h) => {
    expect(() => parseIpAddressOptions({ AUTH_IP_ADDRESS_HEADERS: h })).toThrow(
      /AUTH_IP_ADDRESS_HEADERS has invalid header names/,
    );
  });

  it.each(['10.0.0.300', 'proxy.local', '10.0.0.0/33', '2001:db8::/129', '10.0.0.0/', '10.0.0.0/x', '10.0.0.0/0016'])(
    'refuses an invalid trusted proxy: %s',
    (p) => {
      expect(() => parseIpAddressOptions({ AUTH_TRUSTED_PROXIES: p })).toThrow(
        /AUTH_TRUSTED_PROXIES has entries that are not an IP address or CIDR range/,
      );
    },
  );

  it('is what the real auth instance uses', () => {
    expect(auth.options.advanced?.ipAddress).toEqual(parseIpAddressOptions(process.env));
  });
});

describe('resolved client IP per host header format', () => {
  it('Cloudflare: cf-connecting-ip wins over a spoofable x-forwarded-for', () => {
    const env = { AUTH_IP_ADDRESS_HEADERS: 'cf-connecting-ip' };
    expect(resolve({ 'cf-connecting-ip': '203.0.113.7', 'x-forwarded-for': '198.51.100.1' }, env)).toBe(
      '203.0.113.7',
    );
  });

  it('Azure App Service: x-client-ip resolves where x-forwarded-for carries ip:port', () => {
    const headers = { 'x-client-ip': '203.0.113.8', 'x-forwarded-for': '203.0.113.8:51234' };
    // Unconfigured, the ip:port value is not a valid IP (so it is unresolved).
    expect(getIPFromHeader(headers['x-forwarded-for'])).toBeNull();
    expect(resolve(headers, { AUTH_IP_ADDRESS_HEADERS: 'x-client-ip' })).toBe('203.0.113.8');
  });

  it('Vercel: x-real-ip resolves', () => {
    expect(resolve({ 'x-real-ip': '203.0.113.9' }, { AUTH_IP_ADDRESS_HEADERS: 'x-real-ip' })).toBe(
      '203.0.113.9',
    );
  });

  it('reverse proxy appending to x-forwarded-for: trusted proxies are skipped from the right', () => {
    const chain = '198.51.100.99, 203.0.113.10, 10.0.0.5';
    // Unconfigured, a multi-value chain is unresolved (shared bucket).
    expect(getIPFromHeader(chain)).toBeNull();
    // Configured: the spoofable leftmost value is ignored; the first untrusted hop is the client.
    expect(getIPFromHeader(chain, parseIpAddressOptions({ AUTH_TRUSTED_PROXIES: '10.0.0.0/24' }))).toBe(
      '203.0.113.10',
    );
  });

  it('tries headers in order and falls through to the next', () => {
    const env = { AUTH_IP_ADDRESS_HEADERS: 'cf-connecting-ip,x-real-ip' };
    expect(resolve({ 'x-real-ip': '203.0.113.11' }, env)).toBe('203.0.113.11');
  });
});

describe('rate limiting keys on the configured client IP', () => {
  const ORIGIN = 'http://localhost:3000';

  function buildInstance(env: Record<string, string>) {
    return betterAuth({
      secret: 'x'.repeat(40),
      baseURL: ORIGIN,
      rateLimit: { enabled: true },
      advanced: { ipAddress: parseIpAddressOptions(env) },
      logger: { disabled: true },
    });
  }

  const signIn = (instance: ReturnType<typeof buildInstance>, ip: string) =>
    instance.handler(
      new Request(`${ORIGIN}/api/auth/sign-in/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: ORIGIN, 'cf-connecting-ip': ip },
        body: JSON.stringify({ provider: 'none' }),
      }),
    );

  it('negative control: unconfigured, three requests from one client lock out a different client', async () => {
    const instance = buildInstance({});
    for (let i = 0; i < 3; i++) expect((await signIn(instance, '203.0.113.20')).status).not.toBe(429);
    expect((await signIn(instance, '203.0.113.21')).status).toBe(429);
  });

  it('configured: each client gets its own bucket', async () => {
    const instance = buildInstance({ AUTH_IP_ADDRESS_HEADERS: 'cf-connecting-ip' });
    for (let i = 0; i < 3; i++) expect((await signIn(instance, '203.0.113.30')).status).not.toBe(429);
    expect((await signIn(instance, '203.0.113.30')).status).toBe(429);
    expect((await signIn(instance, '203.0.113.31')).status).not.toBe(429);
  });
});

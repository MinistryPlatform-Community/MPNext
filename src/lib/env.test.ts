import { describe, it, expect } from 'vitest';
import { getAuthBaseUrl, getMpBaseUrl } from '@/lib/env';

const dev = (extra: Record<string, string | undefined>) => ({ NODE_ENV: 'development', ...extra });
const prod = (extra: Record<string, string | undefined>) => ({ NODE_ENV: 'production', ...extra });

describe('getMpBaseUrl', () => {
  const mp = (value: string | undefined, env = dev) => getMpBaseUrl(env({ MINISTRY_PLATFORM_BASE_URL: value }));

  it.each([
    ['https://mp.example.org', 'https://mp.example.org'],
    ['https://mp.example.org/', 'https://mp.example.org'],
    ['https://mp.example.org/ministryplatformapi', 'https://mp.example.org/ministryplatformapi'],
    ['https://mp.example.org/ministryplatformapi//', 'https://mp.example.org/ministryplatformapi'],
    ['  https://MP.Example.org:8443/api  ', 'https://mp.example.org:8443/api'],
  ])('normalizes %j to %j', (input, expected) => {
    expect(mp(input)).toBe(expected);
  });

  it.each([
    [undefined, 'is not set'],
    ['', 'is not set'],
    ['   ', 'is not set'],
    ['mp.example.org', 'is not a valid absolute URL'],
    ['http://mp.example.org', 'must use https://'],
    ['ftp://mp.example.org', 'must use https://'],
    ['https://u:p@mp.example.org', 'must not contain credentials'],
    ['https://u@mp.example.org', 'must not contain credentials'],
    ['https://mp.example.org?a', 'must not contain a query string or fragment'],
    ['https://mp.example.org?', 'must not contain a query string or fragment'],
    ['https://mp.example.org/api#frag', 'must not contain a query string or fragment'],
  ])('refuses %j (%s)', (input, message) => {
    expect(() => mp(input)).toThrow(`MINISTRY_PLATFORM_BASE_URL ${message}`);
  });

  it('never echoes the value in the error', () => {
    expect(() => mp('https://user:hunter2@mp.example.org')).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining('hunter2') }),
    );
    expect(() => mp('http://secret-host.example.org')).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining('secret-host') }),
    );
  });

  it.each(['http://localhost:5000', 'http://127.0.0.1:5000/api', 'http://[::1]:5000'])(
    'allows loopback http outside production: %s',
    (input) => {
      expect(mp(input)).toBe(input.replace(/\/$/, ''));
      expect(getMpBaseUrl({ MINISTRY_PLATFORM_BASE_URL: input })).toBe(input);
    },
  );

  it('refuses loopback http in production', () => {
    expect(() => mp('http://localhost:5000', prod)).toThrow(
      'MINISTRY_PLATFORM_BASE_URL must use https:// in production',
    );
  });

  it('reads process.env by default', () => {
    expect(getMpBaseUrl()).toBe('https://test-mp.example.com');
  });
});

describe('getAuthBaseUrl', () => {
  it.each([
    ['https://app.example.org', 'https://app.example.org'],
    ['https://app.example.org/', 'https://app.example.org'],
    ['https://APP.example.org:8443', 'https://app.example.org:8443'],
  ])('normalizes %j to %j', (input, expected) => {
    expect(getAuthBaseUrl(prod({ BETTER_AUTH_URL: input }))).toBe(expected);
  });

  it('falls back to NEXTAUTH_URL, and prefers BETTER_AUTH_URL', () => {
    expect(getAuthBaseUrl(prod({ NEXTAUTH_URL: 'https://legacy.example.org' }))).toBe('https://legacy.example.org');
    expect(getAuthBaseUrl(prod({ BETTER_AUTH_URL: ' ', NEXTAUTH_URL: 'https://legacy.example.org' }))).toBe(
      'https://legacy.example.org',
    );
    expect(
      getAuthBaseUrl(prod({ BETTER_AUTH_URL: 'https://app.example.org', NEXTAUTH_URL: 'https://legacy.example.org' })),
    ).toBe('https://app.example.org');
  });

  it('names NEXTAUTH_URL in the error when that is the value in use', () => {
    expect(() => getAuthBaseUrl(prod({ NEXTAUTH_URL: 'http://legacy.example.org' }))).toThrow(
      'NEXTAUTH_URL must use https://',
    );
  });

  it.each([
    [undefined, 'BETTER_AUTH_URL is not set'],
    ['', 'BETTER_AUTH_URL is not set'],
    ['app.example.org', 'BETTER_AUTH_URL is not a valid absolute URL'],
    ['http://app.example.org', 'BETTER_AUTH_URL must use https://'],
    ['https://u:p@app.example.org', 'BETTER_AUTH_URL must not contain credentials'],
    ['https://app.example.org?a', 'BETTER_AUTH_URL must not contain a query string or fragment'],
    ['https://app.example.org#x', 'BETTER_AUTH_URL must not contain a query string or fragment'],
    ['https://app.example.org/app', 'BETTER_AUTH_URL must be an origin only'],
    ['https://app.example.org/api/auth', 'BETTER_AUTH_URL must be an origin only'],
  ])('refuses %j', (input, message) => {
    expect(() => getAuthBaseUrl(dev({ BETTER_AUTH_URL: input }))).toThrow(message);
  });

  it('allows loopback http in every environment (local / CI next build), but no other http host', () => {
    expect(getAuthBaseUrl(dev({ BETTER_AUTH_URL: 'http://localhost:3000' }))).toBe('http://localhost:3000');
    expect(getAuthBaseUrl({ BETTER_AUTH_URL: 'http://127.0.0.1:3000/' })).toBe('http://127.0.0.1:3000');
    expect(getAuthBaseUrl(prod({ BETTER_AUTH_URL: 'http://localhost:3000' }))).toBe('http://localhost:3000');
    expect(getAuthBaseUrl(prod({ BETTER_AUTH_URL: 'http://[::1]:3000' }))).toBe('http://[::1]:3000');
    expect(() => getAuthBaseUrl(prod({ BETTER_AUTH_URL: 'http://app.example.org' }))).toThrow(
      'BETTER_AUTH_URL must use https:// (http:// is allowed only for localhost / 127.0.0.1).',
    );
    expect(() => getAuthBaseUrl(prod({ BETTER_AUTH_URL: 'http://localhost.example.org' }))).toThrow(
      'BETTER_AUTH_URL must use https://',
    );
  });

  it('reads process.env by default', () => {
    expect(getAuthBaseUrl()).toBe('http://localhost:3000');
  });
});

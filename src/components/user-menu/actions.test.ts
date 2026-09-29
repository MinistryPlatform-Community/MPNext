import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';

const { mockSignOut, mockRedirect } = vi.hoisted(() => ({
  mockSignOut: vi.fn(),
  mockRedirect: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      signOut: mockSignOut,
    },
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}));

import { handleSignOut } from './actions';

describe('handleSignOut', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.MINISTRY_PLATFORM_BASE_URL = 'https://mp.example.com';
    process.env.BETTER_AUTH_URL = 'https://myapp.example.com';
    process.env.OIDC_CLIENT_ID = 'TM.Widgets';
  });

  const redirectedTo = () => new URL(mockRedirect.mock.calls[0][0] as string);

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should call auth.api.signOut', async () => {
    mockSignOut.mockResolvedValueOnce(undefined);

    await handleSignOut();

    expect(mockSignOut).toHaveBeenCalledWith({
      headers: expect.any(Headers),
      body: { disableRedirect: true },
    });
  });

  it('should redirect to MP end session URL', async () => {
    mockSignOut.mockResolvedValueOnce(undefined);

    await handleSignOut();

    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining('https://mp.example.com/oauth/connect/endsession')
    );
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining('post_logout_redirect_uri=https%3A%2F%2Fmyapp.example.com')
    );
  });

  it('should throw when MINISTRY_PLATFORM_BASE_URL is missing', async () => {
    delete process.env.MINISTRY_PLATFORM_BASE_URL;
    mockSignOut.mockResolvedValueOnce(undefined);

    await expect(handleSignOut()).rejects.toThrow('MINISTRY_PLATFORM_BASE_URL is not configured');
  });

  it('should fall back to NEXTAUTH_URL when BETTER_AUTH_URL is unset', async () => {
    delete process.env.BETTER_AUTH_URL;
    process.env.NEXTAUTH_URL = 'https://legacy.example.com';
    mockSignOut.mockResolvedValueOnce(undefined);

    await handleSignOut();

    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining('post_logout_redirect_uri=https%3A%2F%2Flegacy.example.com')
    );
  });

  it('should refuse to redirect when neither auth URL is configured (no localhost fallback)', async () => {
    delete process.env.BETTER_AUTH_URL;
    delete process.env.NEXTAUTH_URL;
    mockSignOut.mockResolvedValueOnce(undefined);

    await expect(handleSignOut()).rejects.toThrow('BETTER_AUTH_URL is not configured');
    // The local session is still cleared before the configuration check.
    expect(mockSignOut).toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('should throw when OIDC_CLIENT_ID is missing', async () => {
    delete process.env.OIDC_CLIENT_ID;
    mockSignOut.mockResolvedValueOnce(undefined);

    await expect(handleSignOut()).rejects.toThrow('OIDC_CLIENT_ID is not configured');
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('always sends client_id and the exact configured post_logout_redirect_uri', async () => {
    mockSignOut.mockResolvedValueOnce({ success: true });

    await handleSignOut();

    const url = redirectedTo();
    expect(url.origin + url.pathname).toBe('https://mp.example.com/oauth/connect/endsession');
    expect(url.searchParams.get('client_id')).toBe('TM.Widgets');
    expect(url.searchParams.get('post_logout_redirect_uri')).toBe('https://myapp.example.com');
    expect(url.searchParams.has('id_token_hint')).toBe(false);
  });

  it('adds id_token_hint taken from the provider logout URL better-auth returns', async () => {
    mockSignOut.mockResolvedValueOnce({
      success: true,
      url: 'https://mp.example.com/oauth/connect/endsession?id_token_hint=the.id.token&post_logout_redirect_uri=https%3A%2F%2Fother.example.com%2F',
    });

    await handleSignOut();

    const url = redirectedTo();
    expect(url.searchParams.get('id_token_hint')).toBe('the.id.token');
    expect(url.searchParams.get('client_id')).toBe('TM.Widgets');
    // Our registered value wins, not better-auth's normalised one.
    expect(url.searchParams.get('post_logout_redirect_uri')).toBe('https://myapp.example.com');
  });

  it.each([
    ['a URL on another origin', 'https://evil.example.com/endsession?id_token_hint=x'],
    ['an unparseable URL', 'not a url'],
    ['a non-string url', 42],
    ['a URL with no id_token_hint', 'https://mp.example.com/oauth/connect/endsession?client_id=x'],
    ['an empty id_token_hint', 'https://mp.example.com/oauth/connect/endsession?id_token_hint='],
  ])('ignores %s from better-auth', async (_label, url) => {
    mockSignOut.mockResolvedValueOnce({ success: true, url });

    await handleSignOut();

    const redirected = redirectedTo();
    expect(redirected.searchParams.has('id_token_hint')).toBe(false);
    expect(redirected.searchParams.get('client_id')).toBe('TM.Widgets');
  });
});

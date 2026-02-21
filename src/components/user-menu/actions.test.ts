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
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should call auth.api.signOut', async () => {
    mockSignOut.mockResolvedValueOnce(undefined);

    await handleSignOut();

    expect(mockSignOut).toHaveBeenCalledWith({
      headers: expect.any(Headers),
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
});

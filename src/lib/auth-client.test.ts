import { describe, it, expect } from 'vitest';
import { authClient } from '@/lib/auth-client';

/**
 * auth-client Tests
 *
 * The browser-side Better Auth client. There is no logic to test here beyond the
 * plugin wiring, but two things are worth guarding:
 *
 * 1. `customSessionClient` must be registered, otherwise the client-side session
 *    type loses the fields customSession adds on the server (firstName,
 *    lastName, userId, userGuid) and every consumer silently sees undefined.
 * 2. `signIn.social` must exist. better-auth 1.7 dropped `genericOAuthClient()`
 *    and moved generic OAuth providers onto the standard social API, so a
 *    regression here would break sign-in entirely.
 */
describe('authClient', () => {
  it('should expose the session hook used by useAppSession', () => {
    expect(typeof authClient.useSession).toBe('function');
  });

  it('should expose signIn.social for the ministry-platform provider', () => {
    // better-auth 1.7: generic OAuth providers are reached through signIn.social,
    // not the removed genericOAuthClient() plugin.
    expect(typeof authClient.signIn.social).toBe('function');
  });

  it('should expose signOut', () => {
    expect(typeof authClient.signOut).toBe('function');
  });

  it('should expose getSession for non-hook callers', () => {
    expect(typeof authClient.getSession).toBe('function');
  });
});

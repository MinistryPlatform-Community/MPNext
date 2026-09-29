import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * TTL on the User_GUID → MP User_ID cache in src/lib/auth.ts (review item
 * security-session-no-absolute-lifetime-or-mp-revalidation). Before the TTL
 * the cache never expired, so `dp_Users` was never re-read for a user after
 * their first request on a process.
 */

const { mockGetTableRecords } = vi.hoisted(() => ({ mockGetTableRecords: vi.fn() }));

// Mock MP OIDC server (discovery with `issuer` + `jwks_uri`, a local JWKS);
// any other fetch throws.
await vi.hoisted(async () => (await import('@/test-utils/mock-oidc')).installMockOidc());

vi.mock('@/lib/providers/ministry-platform', () => ({
  MPHelper: class {
    getTableRecords = mockGetTableRecords;
  },
}));

import { enrichSessionUser, USER_ID_CACHE_TTL_MS } from '@/lib/auth';

const session = { id: 's', token: 't' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-09-28T08:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('userIdCache TTL', () => {
  it('is 15 minutes', () => {
    expect(USER_ID_CACHE_TTL_MS).toBe(15 * 60 * 1000);
  });

  it('serves the cached User_ID until the TTL, then re-reads dp_Users', async () => {
    const userGuid = 'ab12cd34-ef56-7890-abcd-ef1234503001';
    mockGetTableRecords.mockResolvedValue([{ User_ID: 11 }]);

    await enrichSessionUser({ name: 'A B', userGuid }, session);
    vi.setSystemTime(Date.now() + USER_ID_CACHE_TTL_MS - 1);
    await enrichSessionUser({ name: 'A B', userGuid }, session);
    expect(mockGetTableRecords).toHaveBeenCalledTimes(1);

    vi.setSystemTime(Date.now() + 1);
    const after = await enrichSessionUser({ name: 'A B', userGuid }, session);
    expect(mockGetTableRecords).toHaveBeenCalledTimes(2);
    expect(after.user.userId).toBe(11);
  });

  it('drops the attribution within one TTL once the dp_Users login is gone', async () => {
    const userGuid = 'ab12cd34-ef56-7890-abcd-ef1234503002';
    mockGetTableRecords.mockResolvedValueOnce([{ User_ID: 22 }]).mockResolvedValue([]);

    const before = await enrichSessionUser({ name: 'A B', userGuid }, session);
    expect(before.user.userId).toBe(22);

    vi.setSystemTime(Date.now() + USER_ID_CACHE_TTL_MS);
    const after = await enrichSessionUser({ name: 'A B', userGuid }, session);
    // Failures never block the session (see resolveMpUserId); the missing
    // attribution surfaces as `mp.write.non_user` at write time.
    expect(after.user.userId).toBeNull();
  });
});

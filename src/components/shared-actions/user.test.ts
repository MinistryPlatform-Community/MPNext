import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetUserProfile, mockGetSession } = vi.hoisted(() => ({
  mockGetUserProfile: vi.fn(),
  mockGetSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock('@/services/userService', () => ({
  UserService: {
    getInstance: vi.fn().mockResolvedValue({
      getUserProfile: mockGetUserProfile,
    }),
  },
}));

import { getCurrentUserProfile } from './user';

const mockAuthSession = {
  user: { id: 'internal-id', userGuid: 'guid-123' },
};

const mockProfile = {
  User_ID: 1,
  User_GUID: 'guid-123',
  Contact_ID: 100,
  First_Name: 'John',
  Nickname: 'Johnny',
  Last_Name: 'Doe',
  Email_Address: 'john@example.com',
  Mobile_Phone: null,
  Image_GUID: null,
  roles: ['Admin'],
  userGroups: ['Staff'],
};

describe('getCurrentUserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should require authentication', async () => {
    mockGetSession.mockResolvedValueOnce(null);

    await expect(getCurrentUserProfile()).rejects.toThrow('Authentication required');
    expect(mockGetUserProfile).not.toHaveBeenCalled();
  });

  it('should reject a session with no user id', async () => {
    mockGetSession.mockResolvedValueOnce({ user: { userGuid: 'guid-123' } });

    await expect(getCurrentUserProfile()).rejects.toThrow('Authentication required');
    expect(mockGetUserProfile).not.toHaveBeenCalled();
  });

  it('should reject an authenticated session that carries no userGuid', async () => {
    mockGetSession.mockResolvedValueOnce({ user: { id: 'internal-id' } });

    await expect(getCurrentUserProfile()).rejects.toThrow('User GUID not found in session');
    expect(mockGetUserProfile).not.toHaveBeenCalled();
  });

  it("should look up the profile using the session's own User_GUID", async () => {
    mockGetSession.mockResolvedValueOnce(mockAuthSession);
    mockGetUserProfile.mockResolvedValueOnce(mockProfile);

    const result = await getCurrentUserProfile();

    expect(mockGetUserProfile).toHaveBeenCalledWith('guid-123');
    expect(result).toEqual(mockProfile);
  });

  it('should ignore any caller-supplied GUID and use the session GUID', async () => {
    mockGetSession.mockResolvedValueOnce(mockAuthSession);
    mockGetUserProfile.mockResolvedValueOnce(mockProfile);

    // A hostile caller can still POST an argument at the compiled endpoint; the
    // action takes no parameters, so the victim's GUID must never be used.
    await (getCurrentUserProfile as unknown as (id: string) => Promise<unknown>)(
      'someone-elses-guid'
    );

    expect(mockGetUserProfile).toHaveBeenCalledWith('guid-123');
    expect(mockGetUserProfile).not.toHaveBeenCalledWith('someone-elses-guid');
  });

  it('should return undefined when MP has no matching user', async () => {
    mockGetSession.mockResolvedValueOnce(mockAuthSession);
    mockGetUserProfile.mockResolvedValueOnce(undefined);

    await expect(getCurrentUserProfile()).resolves.toBeUndefined();
  });

  it('should propagate errors', async () => {
    mockGetSession.mockResolvedValueOnce(mockAuthSession);
    mockGetUserProfile.mockRejectedValueOnce(new Error('Service error'));

    await expect(getCurrentUserProfile()).rejects.toThrow('Service error');
  });
});

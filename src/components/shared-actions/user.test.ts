import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetUserProfile, mockGetSession, mockHasSecurityRole } = vi.hoisted(() => ({
  mockGetUserProfile: vi.fn(),
  mockGetSession: vi.fn(),
  mockHasSecurityRole: vi.fn(),
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

vi.mock('@/services/authorizationService', () => ({
  AuthorizationService: {
    getInstance: () => ({
      hasSecurityRole: mockHasSecurityRole,
    }),
  },
}));

import { getCurrentUserProfile } from './user';

const mockAuthSession = {
  user: { id: 'internal-id', userGuid: 'guid-123' },
};

/**
 * What `UserService.getUserProfile` returns, plus fields it does not (and must
 * never be passed through if a future service change adds them back): the
 * action has to build its DTO key by key, not spread the row.
 */
const mockProfile = {
  User_ID: 1,
  User_GUID: 'guid-123',
  Contact_ID: 100,
  First_Name: 'John',
  Nickname: 'Johnny',
  Last_Name: 'Doe',
  Email_Address: 'john@example.com',
  Mobile_Phone: '555-0100',
  Image_GUID: 'img-guid-456',
  roles: ['Admin'],
  userGroups: ['Staff'],
};

/** The client-facing DTO the action must produce from `mockProfile`. */
const expectedDto = {
  First_Name: 'John',
  Nickname: 'Johnny',
  Last_Name: 'Doe',
  Email_Address: 'john@example.com',
  Image_GUID: 'img-guid-456',
  canAccessContactFeatures: true,
};

describe('getCurrentUserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: a role-holder. The profile load itself never depends on this —
    // any MP user may sign in and see the app shell.
    mockHasSecurityRole.mockResolvedValue({ permitted: true, userId: 1, reason: null });
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
    expect(result).toEqual(expectedDto);
  });

  /**
   * security-client-data-overexposure: whatever a server action returns is
   * readable by any script or extension on the page. Pin the exact key set so
   * an added field is a deliberate, reviewed change.
   */
  it('returns exactly the fields the client renders — no IDs, phone, roles or groups', async () => {
    mockGetSession.mockResolvedValueOnce(mockAuthSession);
    mockGetUserProfile.mockResolvedValueOnce(mockProfile);

    const result = await getCurrentUserProfile();

    expect(Object.keys(result ?? {}).sort()).toEqual([
      'Email_Address',
      'First_Name',
      'Image_GUID',
      'Last_Name',
      'Nickname',
      'canAccessContactFeatures',
    ]);
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

  /**
   * `canAccessContactFeatures` is what the sidebar and the dashboard tile read
   * to decide whether to render a link into the contact features. It is UX
   * only — every gated layer re-checks — but it must be computed SERVER-SIDE
   * from the same gate — the client has no role list to derive it from — or the
   * nav and the enforcement could drift apart.
   */
  describe('canAccessContactFeatures', () => {
    it('is true when the gate permits the user', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      mockGetUserProfile.mockResolvedValueOnce(mockProfile);
      mockHasSecurityRole.mockResolvedValueOnce({
        permitted: true,
        userId: 1,
        reason: null,
      });

      const result = await getCurrentUserProfile();

      expect(result?.canAccessContactFeatures).toBe(true);
      expect(mockHasSecurityRole).toHaveBeenCalledWith({
        table: 'Contacts',
        operation: 'read',
      });
    });

    it('is false for a signed-in user holding no security role', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      mockGetUserProfile.mockResolvedValueOnce(mockProfile);
      mockHasSecurityRole.mockResolvedValueOnce({
        permitted: false,
        userId: 1,
        reason: 'no_security_role',
      });

      const result = await getCurrentUserProfile();

      expect(result?.canAccessContactFeatures).toBe(false);
    });

    it('still returns the profile for a role-less user — they keep the app shell', async () => {
      // POLICY: any MP user may sign in. A role-less session must still load
      // its own profile, or the header avatar and the sign-out menu vanish.
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      mockGetUserProfile.mockResolvedValueOnce(mockProfile);
      mockHasSecurityRole.mockResolvedValueOnce({
        permitted: false,
        userId: 1,
        reason: 'no_security_role',
      });

      const result = await getCurrentUserProfile();

      expect(result).toEqual({ ...expectedDto, canAccessContactFeatures: false });
    });

    it('uses the non-throwing gate so a refusal never breaks the shell', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      mockGetUserProfile.mockResolvedValueOnce(mockProfile);
      mockHasSecurityRole.mockResolvedValueOnce({
        permitted: false,
        userId: null,
        reason: 'no_mp_user',
      });

      await expect(getCurrentUserProfile()).resolves.toMatchObject({
        canAccessContactFeatures: false,
      });
    });

    it('does not consult the gate when MP has no matching user', async () => {
      mockGetSession.mockResolvedValueOnce(mockAuthSession);
      mockGetUserProfile.mockResolvedValueOnce(undefined);

      await expect(getCurrentUserProfile()).resolves.toBeUndefined();
      expect(mockHasSecurityRole).not.toHaveBeenCalled();
    });
  });
});

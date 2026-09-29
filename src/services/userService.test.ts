import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetTableRecords, mockGetSession } = vi.hoisted(() => ({
  mockGetTableRecords: vi.fn(),
  mockGetSession: vi.fn(),
}));

vi.mock('@/lib/providers/ministry-platform', () => {
  return {
    MPHelper: class {
      getTableRecords = mockGetTableRecords;
    },
  };
});

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: mockGetSession } },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

import { UserService } from '@/services/userService';
import { UnauthorizedError } from '@/services/authorizationService';

/** A session for the MP user with the given User_GUID. */
function sessionFor(userGuid: string | undefined) {
  return { user: { id: 'internal-id', userGuid } };
}

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: the signed-in user is the one whose profile the tests read.
    mockGetSession.mockResolvedValue(sessionFor('a1b2c3d4-e5f6-7890-abcd-ef1234567890'));
    // Reset singleton instance between tests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (UserService as any).instance = undefined;
  });

  describe('getInstance', () => {
    it('should return a singleton instance', async () => {
      const instance1 = await UserService.getInstance();
      const instance2 = await UserService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getUserProfile', () => {
    const validGuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const otherValidGuid = 'b2c3d4e5-f678-9012-3456-7890abcdef12';

    it("should fetch the user's own dp_Users row in a single read", async () => {
      const mockProfile = {
        User_ID: 1,
        User_GUID: validGuid,
        First_Name: 'John',
        Nickname: 'Johnny',
        Last_Name: 'Doe',
        Email_Address: 'john@example.com',
        Image_GUID: 'img-guid-456',
      };
      mockGetTableRecords.mockResolvedValueOnce([mockProfile]);

      const service = await UserService.getInstance();
      const result = await service.getUserProfile(validGuid);

      expect(mockGetTableRecords).toHaveBeenCalledTimes(1);
      expect(mockGetTableRecords).toHaveBeenCalledWith({
        table: 'dp_Users',
        filter: `User_GUID = '${validGuid}'`,
        select: expect.stringContaining('User_ID'),
        top: 1,
      });
      expect(result).toEqual(mockProfile);
    });

    /**
     * security-client-data-overexposure (2026-09-29): roles, user groups and
     * the mobile phone were read here and shipped to the browser, where
     * nothing rendered them. `canAccessContactFeatures` comes from
     * AuthorizationService, which reads dp_User_Roles itself.
     */
    it('reads neither roles, user groups nor the mobile phone', async () => {
      mockGetTableRecords.mockResolvedValueOnce([{ User_ID: 1, User_GUID: validGuid }]);

      const service = await UserService.getInstance();
      await service.getUserProfile(validGuid);

      const tables = mockGetTableRecords.mock.calls.map(([arg]) => arg.table);
      expect(tables).toEqual(['dp_Users']);
      const select: string = mockGetTableRecords.mock.calls[0][0].select;
      expect(select).not.toMatch(/Mobile_Phone|Role|User_Group/);
    });

    it('should return undefined when user not found', async () => {
      mockGetTableRecords.mockResolvedValueOnce([]);

      const service = await UserService.getInstance();
      const result = await service.getUserProfile(validGuid);

      expect(result).toBeUndefined();
      expect(mockGetTableRecords).toHaveBeenCalledTimes(1);
    });

    it('should read the profile of whichever user is signed in', async () => {
      const mockProfile = {
        User_ID: 2,
        User_GUID: otherValidGuid,
        First_Name: 'Jane',
        Nickname: 'Jane',
        Last_Name: 'Smith',
        Email_Address: 'jane@example.com',
        Image_GUID: null,
      };
      mockGetSession.mockResolvedValueOnce(sessionFor(otherValidGuid));
      mockGetTableRecords.mockResolvedValueOnce([mockProfile]);

      const service = await UserService.getInstance();
      const result = await service.getUserProfile(otherValidGuid);

      expect(result).toEqual(mockProfile);
    });

    it('should propagate errors from MPHelper', async () => {
      mockGetTableRecords.mockRejectedValueOnce(new Error('API error'));

      const service = await UserService.getInstance();
      await expect(service.getUserProfile(validGuid)).rejects.toThrow('API error');
    });

    it('should throw on invalid GUID format', async () => {
      const service = await UserService.getInstance();
      await expect(service.getUserProfile('not-a-guid')).rejects.toThrow('Invalid GUID format');
    });
  });

  /**
   * 2026-09-28 review. With no session at all this used to return another
   * user's email, phone, roles and groups for any GUID (the phone, roles and
   * groups are no longer read at all). The method now reads
   * the session itself and serves only the caller's own profile, so it no
   * longer depends on every caller passing the session's GUID.
   */
  describe('getUserProfile authorization (own profile only)', () => {
    const ownGuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const someoneElse = 'b2c3d4e5-f678-9012-3456-7890abcdef12';

    it('refuses another user\'s GUID before any MP call', async () => {
      const service = await UserService.getInstance();

      await expect(service.getUserProfile(someoneElse)).rejects.toThrow(UnauthorizedError);
      await expect(service.getUserProfile(someoneElse)).rejects.toThrow(
        'may only be read by its own user'
      );
      expect(mockGetTableRecords).not.toHaveBeenCalled();
    });

    it.each([
      ['no session', null],
      ['a session with no user', { user: null }],
      ['a session with no userGuid', sessionFor(undefined)],
      ['a session with a non-string userGuid', { user: { id: 'internal-id', userGuid: [ownGuid] } }],
      ['a session with no internal user id', { user: { userGuid: ownGuid } }],
    ])('refuses %s before any MP call', async (_label, session) => {
      mockGetSession.mockResolvedValueOnce(session);

      const service = await UserService.getInstance();
      await expect(service.getUserProfile(ownGuid)).rejects.toThrow(
        'a signed-in session is required'
      );
      expect(mockGetTableRecords).not.toHaveBeenCalled();
    });

    it('matches the session GUID case-insensitively', async () => {
      mockGetTableRecords.mockResolvedValueOnce([]);

      const service = await UserService.getInstance();
      await expect(service.getUserProfile(ownGuid.toUpperCase())).resolves.toBeUndefined();
      expect(mockGetTableRecords).toHaveBeenCalledTimes(1);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from '@/services/userService';

const mockGetTableRecords = vi.fn();

vi.mock('@/lib/providers/ministry-platform', () => {
  return {
    MPHelper: class {
      getTableRecords = mockGetTableRecords;
    },
  };
});

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    it('should fetch user profile with roles and groups', async () => {
      const mockProfile = {
        User_ID: 1,
        User_GUID: validGuid,
        Contact_ID: 100,
        First_Name: 'John',
        Nickname: 'Johnny',
        Last_Name: 'Doe',
        Email_Address: 'john@example.com',
        Mobile_Phone: '555-1234',
        Image_GUID: 'img-guid-456',
      };
      mockGetTableRecords
        .mockResolvedValueOnce([mockProfile])
        .mockResolvedValueOnce([{ Role_Name: 'Admin' }, { Role_Name: 'Editor' }])
        .mockResolvedValueOnce([{ User_Group_Name: 'Staff' }]);

      const service = await UserService.getInstance();
      const result = await service.getUserProfile(validGuid);

      expect(mockGetTableRecords).toHaveBeenCalledTimes(3);
      expect(mockGetTableRecords).toHaveBeenCalledWith({
        table: 'dp_Users',
        filter: `User_GUID = '${validGuid}'`,
        select: expect.stringContaining('User_ID'),
        top: 1,
      });
      expect(mockGetTableRecords).toHaveBeenCalledWith({
        table: 'dp_User_Roles',
        filter: 'User_ID = 1',
        select: 'Role_ID_TABLE.Role_Name',
      });
      expect(mockGetTableRecords).toHaveBeenCalledWith({
        table: 'dp_User_User_Groups',
        filter: 'User_ID = 1',
        select: 'User_Group_ID_TABLE.User_Group_Name',
      });
      expect(result).toEqual({
        ...mockProfile,
        roles: ['Admin', 'Editor'],
        userGroups: ['Staff'],
      });
    });

    it('should return undefined when user not found', async () => {
      mockGetTableRecords.mockResolvedValueOnce([]);

      const service = await UserService.getInstance();
      const result = await service.getUserProfile(validGuid);

      expect(result).toBeUndefined();
      expect(mockGetTableRecords).toHaveBeenCalledTimes(1);
    });

    it('should return empty arrays when user has no roles or groups', async () => {
      const mockProfile = {
        User_ID: 2,
        User_GUID: otherValidGuid,
        Contact_ID: 200,
        First_Name: 'Jane',
        Nickname: 'Jane',
        Last_Name: 'Smith',
        Email_Address: 'jane@example.com',
        Mobile_Phone: null,
        Image_GUID: null,
      };
      mockGetTableRecords
        .mockResolvedValueOnce([mockProfile])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const service = await UserService.getInstance();
      const result = await service.getUserProfile(otherValidGuid);

      expect(result).toEqual({
        ...mockProfile,
        roles: [],
        userGroups: [],
      });
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

    // The User_ID here comes back from MP rather than from a caller, so this is
    // belt-and-braces: it keeps the "no filter string is built from an
    // unvalidated value" rule true for this file.
    it('should throw rather than filter on a malformed User_ID from MP', async () => {
      mockGetTableRecords.mockResolvedValueOnce([
        { User_ID: '1 OR 1=1', User_GUID: validGuid },
      ]);

      const service = await UserService.getInstance();
      await expect(service.getUserProfile(validGuid)).rejects.toThrow('Invalid User ID');
      // Only the dp_Users lookup ran; neither role query was issued.
      expect(mockGetTableRecords).toHaveBeenCalledTimes(1);
    });

    it('should throw when the MP row has no User_ID', async () => {
      mockGetTableRecords.mockResolvedValueOnce([{ User_GUID: validGuid }]);

      const service = await UserService.getInstance();
      await expect(service.getUserProfile(validGuid)).rejects.toThrow('Invalid User ID');
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetUserProfile } = vi.hoisted(() => ({
  mockGetUserProfile: vi.fn(),
}));

vi.mock('@/services/userService', () => ({
  UserService: {
    getInstance: vi.fn().mockResolvedValue({
      getUserProfile: mockGetUserProfile,
    }),
  },
}));

import { getCurrentUserProfile } from './user';

describe('getCurrentUserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call UserService with correct ID', async () => {
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
    };
    mockGetUserProfile.mockResolvedValueOnce(mockProfile);

    const result = await getCurrentUserProfile('guid-123');

    expect(mockGetUserProfile).toHaveBeenCalledWith('guid-123');
    expect(result).toEqual(mockProfile);
  });

  it('should propagate errors', async () => {
    mockGetUserProfile.mockRejectedValueOnce(new Error('Service error'));

    await expect(getCurrentUserProfile('guid-123')).rejects.toThrow('Service error');
  });
});

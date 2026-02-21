import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetSession, mockGetTableRecords, mockGetUserTools } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockGetTableRecords: vi.fn(),
  mockGetUserTools: vi.fn(),
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

vi.mock('@/lib/providers/ministry-platform', () => {
  return {
    MPHelper: class {
      getTableRecords = mockGetTableRecords;
    },
  };
});

vi.mock('@/services/toolService', () => ({
  ToolService: {
    getInstance: vi.fn().mockResolvedValue({
      getUserTools: mockGetUserTools,
    }),
  },
}));

import { getUserTools } from './actions';

describe('getUserTools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw when no session exists', async () => {
    mockGetSession.mockResolvedValueOnce(null);

    await expect(getUserTools()).rejects.toThrow('Unauthorized');
  });

  it('should throw when userGuid is missing from session', async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: 'internal-id' },
    });

    await expect(getUserTools()).rejects.toThrow('User GUID not found');
  });

  it('should throw when user not found in MP', async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: 'internal-id', userGuid: 'user-guid-123' },
    });
    mockGetTableRecords.mockResolvedValueOnce([]);

    await expect(getUserTools()).rejects.toThrow('User not found');
  });

  it('should return tool paths when authenticated', async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: 'internal-id', userGuid: 'user-guid-123' },
    });
    mockGetTableRecords.mockResolvedValueOnce([{ User_ID: 42 }]);
    mockGetUserTools.mockResolvedValueOnce(['/contacts', '/events']);

    const result = await getUserTools();

    expect(mockGetTableRecords).toHaveBeenCalledWith(
      expect.objectContaining({
        table: 'dp_Users',
        filter: "User_GUID = 'user-guid-123'",
      })
    );
    expect(mockGetUserTools).toHaveBeenCalledWith(1, 42);
    expect(result).toEqual(['/contacts', '/events']);
  });
});

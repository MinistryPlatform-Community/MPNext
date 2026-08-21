import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockContactSearch, mockGetSession } = vi.hoisted(() => ({
  mockContactSearch: vi.fn(),
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

vi.mock('@/services/contactService', () => ({
  ContactService: {
    getInstance: vi.fn().mockResolvedValue({
      contactSearch: mockContactSearch,
    }),
  },
}));

import { searchContacts } from './actions';

const mockAuthSession = {
  user: { id: 'internal-id', userGuid: 'user-guid-123' },
};

describe('searchContacts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(mockAuthSession);
  });

  it('should require authentication', async () => {
    mockGetSession.mockResolvedValue(null);

    await expect(searchContacts('John')).rejects.toThrow('Authentication required');
    expect(mockContactSearch).not.toHaveBeenCalled();
  });

  it('should reject a session with no user id', async () => {
    mockGetSession.mockResolvedValue({ user: { userGuid: 'user-guid-123' } });

    await expect(searchContacts('John')).rejects.toThrow('Authentication required');
    expect(mockContactSearch).not.toHaveBeenCalled();
  });

  it('should reject an unauthenticated caller before validating the search term', async () => {
    mockGetSession.mockResolvedValue(null);

    // The empty-term early return must not become an unauthenticated success path.
    await expect(searchContacts('')).rejects.toThrow('Authentication required');
    expect(mockContactSearch).not.toHaveBeenCalled();
  });

  it('should return results for valid search term', async () => {
    const mockResults = [
      { Contact_ID: 1, First_Name: 'John', Last_Name: 'Doe' },
    ];
    mockContactSearch.mockResolvedValueOnce(mockResults);

    const result = await searchContacts('John');

    expect(mockContactSearch).toHaveBeenCalledWith('John');
    expect(result).toEqual(mockResults);
  });

  it('should return empty array for empty search term', async () => {
    const result = await searchContacts('');
    expect(result).toEqual([]);
    expect(mockContactSearch).not.toHaveBeenCalled();
  });

  it('should return empty array for whitespace-only search term', async () => {
    const result = await searchContacts('   ');
    expect(result).toEqual([]);
    expect(mockContactSearch).not.toHaveBeenCalled();
  });

  it('should trim whitespace from search term', async () => {
    mockContactSearch.mockResolvedValueOnce([]);

    await searchContacts('  John  ');

    expect(mockContactSearch).toHaveBeenCalledWith('John');
  });

  it('should throw on service error', async () => {
    mockContactSearch.mockRejectedValueOnce(new Error('API error'));

    await expect(searchContacts('John')).rejects.toThrow('Failed to search contacts');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockContactSearch } = vi.hoisted(() => ({
  mockContactSearch: vi.fn(),
}));

vi.mock('@/services/contactService', () => ({
  ContactService: {
    getInstance: vi.fn().mockResolvedValue({
      contactSearch: mockContactSearch,
    }),
  },
}));

import { searchContacts } from './actions';

describe('searchContacts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

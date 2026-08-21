import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockGetMpTimezone, mockGetInstance } = vi.hoisted(() => {
  const getMpTimezone = vi.fn();
  return {
    mockGetMpTimezone: getMpTimezone,
    mockGetInstance: vi.fn(() => ({ getMpTimezone })),
  };
});

vi.mock('@/services/domainTimezoneService', () => ({
  DomainTimezoneService: {
    getInstance: mockGetInstance,
  },
}));

import { getMpTimezone } from '@/components/shared-actions/domain';

/**
 * getMpTimezone action Tests
 *
 * Thin server action over DomainTimezoneService. It exists so client components
 * can drive Intl.DateTimeFormat with the MP domain zone rather than the browser
 * zone - per CLAUDE.md, MP stores wall-clock values in the domain time zone, so
 * rendering them in the viewer's zone shifts every displayed timestamp.
 *
 * Worth pinning: the action resolves the singleton per call (not at module load)
 * and does not swallow failures into a silent fallback zone, which would render
 * wrong times rather than surfacing the problem.
 */
describe('getMpTimezone action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return the IANA zone resolved by DomainTimezoneService', async () => {
    mockGetMpTimezone.mockResolvedValueOnce('America/New_York');

    await expect(getMpTimezone()).resolves.toBe('America/New_York');

    expect(mockGetInstance).toHaveBeenCalledTimes(1);
    expect(mockGetMpTimezone).toHaveBeenCalledTimes(1);
  });

  it('should resolve the service on each call rather than caching a stale instance', async () => {
    mockGetMpTimezone.mockResolvedValue('America/Chicago');

    await getMpTimezone();
    await getMpTimezone();

    expect(mockGetInstance).toHaveBeenCalledTimes(2);
  });

  it('should propagate service failures instead of falling back to a default zone', async () => {
    mockGetMpTimezone.mockRejectedValueOnce(new Error('Failed to resolve MP time zone'));

    await expect(getMpTimezone()).rejects.toThrow('Failed to resolve MP time zone');
  });
});

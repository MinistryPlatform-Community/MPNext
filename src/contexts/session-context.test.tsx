import { describe, it, expect, vi } from 'vitest';

const { mockUseSession } = vi.hoisted(() => ({
  mockUseSession: vi.fn(),
}));

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: mockUseSession,
    $Infer: { Session: {} },
  },
}));

import { useAppSession } from './session-context';

describe('useAppSession', () => {
  it('should return session data from authClient.useSession', () => {
    const mockSessionData = {
      user: { id: 'test-id', email: 'test@example.com' },
      session: { token: 'test-token' },
    };
    mockUseSession.mockReturnValue({ data: mockSessionData });

    const result = useAppSession();
    expect(result).toEqual(mockSessionData);
  });

  it('should return null when no session exists', () => {
    mockUseSession.mockReturnValue({ data: null });

    const result = useAppSession();
    expect(result).toBeNull();
  });
});

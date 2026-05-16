import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, renderHook, screen, waitFor, act } from '@testing-library/react';
import { Component, ReactNode, Suspense } from 'react';

const { mockUseSession, mockGetCurrentUserProfile } = vi.hoisted(() => ({
  mockUseSession: vi.fn(),
  mockGetCurrentUserProfile: vi.fn(),
}));

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: mockUseSession,
  },
}));

vi.mock('@/components/shared-actions/user', () => ({
  getCurrentUserProfile: mockGetCurrentUserProfile,
}));

import { UserProvider, useUser } from './user-context';

function ProfileProbe({
  onRefresh,
}: {
  onRefresh?: (fn: () => void) => void;
}) {
  const { userProfile, refreshUserProfile } = useUser();
  if (onRefresh) onRefresh(refreshUserProfile);
  return (
    <span data-testid="name">{userProfile?.First_Name ?? 'none'}</span>
  );
}

class Boundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return <div data-testid="err">{this.state.error.message}</div>;
    }
    return this.props.children;
  }
}

async function renderWithProvider(ui: ReactNode) {
  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(
      <UserProvider>
        <Boundary>
          <Suspense fallback={<div>loading</div>}>{ui}</Suspense>
        </Boundary>
      </UserProvider>
    );
  });
  return result;
}

describe('UserContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useUser', () => {
    it('should throw when used outside UserProvider', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useUser());
      }).toThrow('useUser must be used within a UserProvider');

      spy.mockRestore();
    });
  });

  describe('UserProvider', () => {
    it('should load profile when session has userGuid', async () => {
      const mockProfile = {
        User_ID: 1,
        User_GUID: 'guid-123',
        First_Name: 'John',
        Last_Name: 'Doe',
      };

      mockUseSession.mockReturnValue({
        data: { user: { id: 'internal-id', userGuid: 'guid-123' } },
        isPending: false,
      });
      mockGetCurrentUserProfile.mockResolvedValueOnce(mockProfile);

      await renderWithProvider(<ProfileProbe />);

      await waitFor(() => {
        expect(screen.getByTestId('name')).toHaveTextContent('John');
      });
      expect(mockGetCurrentUserProfile).toHaveBeenCalledWith('guid-123');
    });

    it('should resolve to null profile when no session', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        isPending: false,
      });

      await renderWithProvider(<ProfileProbe />);

      await waitFor(() => {
        expect(screen.getByTestId('name')).toHaveTextContent('none');
      });
      expect(mockGetCurrentUserProfile).not.toHaveBeenCalled();
    });

    it('should not fetch profile when session has no userGuid', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'internal-id' } },
        isPending: false,
      });

      await renderWithProvider(<ProfileProbe />);

      await waitFor(() => {
        expect(screen.getByTestId('name')).toHaveTextContent('none');
      });
      expect(mockGetCurrentUserProfile).not.toHaveBeenCalled();
    });

    it('should propagate profile load error to ErrorBoundary', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'internal-id', userGuid: 'guid-123' } },
        isPending: false,
      });
      mockGetCurrentUserProfile.mockRejectedValueOnce(new Error('Network error'));

      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await renderWithProvider(<ProfileProbe />);

      await waitFor(() => {
        expect(screen.getByTestId('err')).toHaveTextContent('Network error');
      });

      spy.mockRestore();
    });

    it('should refresh profile when refreshUserProfile is called', async () => {
      const mockProfile = { User_ID: 1, User_GUID: 'guid-123', First_Name: 'John' };
      const updatedProfile = { User_ID: 1, User_GUID: 'guid-123', First_Name: 'Jane' };

      mockUseSession.mockReturnValue({
        data: { user: { id: 'internal-id', userGuid: 'guid-123' } },
        isPending: false,
      });
      mockGetCurrentUserProfile
        .mockResolvedValueOnce(mockProfile)
        .mockResolvedValueOnce(updatedProfile);

      const refreshRef: { current: (() => void) | null } = { current: null };

      await renderWithProvider(
        <ProfileProbe
          onRefresh={(fn) => {
            refreshRef.current = fn;
          }}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('name')).toHaveTextContent('John');
      });

      await act(async () => {
        refreshRef.current?.();
      });

      await waitFor(() => {
        expect(screen.getByTestId('name')).toHaveTextContent('Jane');
      });

      expect(mockGetCurrentUserProfile).toHaveBeenCalledTimes(2);
    });
  });
});

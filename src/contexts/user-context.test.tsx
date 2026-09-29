import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, renderHook, screen, waitFor, act } from '@testing-library/react';
import { Component, ReactNode, Suspense } from 'react';
import type { CurrentUserProfile } from '@/lib/dto';

/**
 * UserProvider / useUser tests.
 *
 * The profile promise is started on the server (ServerProviders) and handed in
 * as a prop, so the provider's own job is small: expose that promise, let
 * `useUser()` suspend on it, and swap in a client-side reload on
 * `refreshUserProfile()` — inside a transition, so already-rendered consumers
 * keep their content instead of falling back to Suspense (the header flicker
 * this design replaced).
 */

const { mockGetCurrentUserProfile } = vi.hoisted(() => ({
  mockGetCurrentUserProfile: vi.fn(),
}));

vi.mock('@/components/shared-actions/user', () => ({
  getCurrentUserProfile: mockGetCurrentUserProfile,
}));

import { UserProvider, useUser } from './user-context';

const profile = {
  First_Name: 'John',
  Last_Name: 'Doe',
} as CurrentUserProfile;

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

function tree(promise: Promise<CurrentUserProfile | null>, ui: ReactNode) {
  return (
    <UserProvider profilePromise={promise}>
      <Boundary>
        <Suspense fallback={<div data-testid="loading">loading</div>}>{ui}</Suspense>
      </Boundary>
    </UserProvider>
  );
}

async function renderWithProvider(promise: Promise<CurrentUserProfile | null>, ui: ReactNode) {
  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(tree(promise, ui));
  });
  return result;
}

/** A promise the test resolves by hand, to observe the pending state. */
function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
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
    it('should expose the profile from the server-started promise', async () => {
      await renderWithProvider(Promise.resolve(profile), <ProfileProbe />);

      await waitFor(() => {
        expect(screen.getByTestId('name')).toHaveTextContent('John');
      });
      // The server already started the load; the client must not repeat it.
      expect(mockGetCurrentUserProfile).not.toHaveBeenCalled();
    });

    it('should expose a null profile', async () => {
      await renderWithProvider(Promise.resolve(null), <ProfileProbe />);

      await waitFor(() => {
        expect(screen.getByTestId('name')).toHaveTextContent('none');
      });
    });

    it('should suspend consumers until the promise resolves', async () => {
      const pending = deferred<CurrentUserProfile | null>();
      await renderWithProvider(pending.promise, <ProfileProbe />);

      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.queryByTestId('name')).toBeNull();

      await act(async () => {
        pending.resolve(profile);
      });

      expect(screen.getByTestId('name')).toHaveTextContent('John');
    });

    it('should degrade a failed profile load to null instead of throwing to a boundary', async () => {
      // The header — the shell's only sign-out control — reads this promise
      // from ABOVE (web)/error.tsx. A rejection used to escape to the root
      // boundary and take the whole shell (and sign-out) with it.
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await renderWithProvider(
        Promise.reject(new Error('ConnectTimeoutError: pastoral note text')),
        <ProfileProbe />
      );

      await waitFor(() => {
        expect(screen.getByTestId('name')).toHaveTextContent('none');
      });
      expect(screen.queryByTestId('err')).toBeNull();
      // Logged by identifier and shape only — never the message.
      expect(spy).toHaveBeenCalledWith('user.profile.load_failed', { name: 'Error' });
      expect(JSON.stringify(spy.mock.calls)).not.toContain('pastoral');

      spy.mockRestore();
    });

    it('should log a non-Error rejection by its type', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await renderWithProvider(Promise.reject('boom'), <ProfileProbe />);

      await waitFor(() => {
        expect(screen.getByTestId('name')).toHaveTextContent('none');
      });
      expect(spy).toHaveBeenCalledWith('user.profile.load_failed', { name: 'string' });

      spy.mockRestore();
    });

    it('should follow a new promise from a server re-render', async () => {
      const result = await renderWithProvider(Promise.resolve(profile), <ProfileProbe />);
      await waitFor(() => {
        expect(screen.getByTestId('name')).toHaveTextContent('John');
      });

      await act(async () => {
        result.rerender(
          tree(Promise.resolve({ ...profile, First_Name: 'Jane' }), <ProfileProbe />)
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('name')).toHaveTextContent('Jane');
      });
    });
  });

  describe('refreshUserProfile', () => {
    it('should reload the profile via the server action', async () => {
      mockGetCurrentUserProfile.mockResolvedValueOnce({ ...profile, First_Name: 'Jane' });
      const refreshRef: { current: (() => void) | null } = { current: null };

      await renderWithProvider(
        Promise.resolve(profile),
        <ProfileProbe onRefresh={(fn) => (refreshRef.current = fn)} />
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
      expect(mockGetCurrentUserProfile).toHaveBeenCalledTimes(1);
      expect(mockGetCurrentUserProfile).toHaveBeenCalledWith();
    });

    it('should keep showing the current profile while the reload is in flight', async () => {
      // The regression this guards: a non-transition update swapped rendered
      // consumers (the whole header) for their Suspense fallback mid-reload.
      const reload = deferred<CurrentUserProfile | undefined>();
      mockGetCurrentUserProfile.mockReturnValueOnce(reload.promise);
      const refreshRef: { current: (() => void) | null } = { current: null };

      await renderWithProvider(
        Promise.resolve(profile),
        <ProfileProbe onRefresh={(fn) => (refreshRef.current = fn)} />
      );
      await waitFor(() => {
        expect(screen.getByTestId('name')).toHaveTextContent('John');
      });

      await act(async () => {
        refreshRef.current?.();
      });

      expect(screen.queryByTestId('loading')).toBeNull();
      expect(screen.getByTestId('name')).toHaveTextContent('John');

      await act(async () => {
        reload.resolve({ ...profile, First_Name: 'Jane' });
      });

      expect(screen.getByTestId('name')).toHaveTextContent('Jane');
    });

    it('should degrade a failed reload to null', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetCurrentUserProfile.mockRejectedValueOnce(new Error('MP down'));
      const refreshRef: { current: (() => void) | null } = { current: null };

      await renderWithProvider(
        Promise.resolve(profile),
        <ProfileProbe onRefresh={(fn) => (refreshRef.current = fn)} />
      );
      await waitFor(() => {
        expect(screen.getByTestId('name')).toHaveTextContent('John');
      });

      await act(async () => {
        refreshRef.current?.();
      });

      await waitFor(() => {
        expect(screen.getByTestId('name')).toHaveTextContent('none');
      });
      expect(screen.queryByTestId('err')).toBeNull();

      spy.mockRestore();
    });

    it('should normalize an undefined reloaded profile to null', async () => {
      mockGetCurrentUserProfile.mockResolvedValueOnce(undefined);
      const refreshRef: { current: (() => void) | null } = { current: null };

      await renderWithProvider(
        Promise.resolve(profile),
        <ProfileProbe onRefresh={(fn) => (refreshRef.current = fn)} />
      );
      await waitFor(() => {
        expect(screen.getByTestId('name')).toHaveTextContent('John');
      });

      await act(async () => {
        refreshRef.current?.();
      });

      await waitFor(() => {
        expect(screen.getByTestId('name')).toHaveTextContent('none');
      });
    });
  });
});

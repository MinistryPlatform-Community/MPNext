import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Proxy Tests
 *
 * Tests for the authentication proxy in src/proxy.ts
 * These tests verify route protection behavior including:
 * - Public path access (API routes, signin)
 * - Session cookie validation
 * - Redirect behavior for unauthenticated users
 * - Error handling during session checks
 * - Route matcher configuration
 */

const { mockGetSessionCookie } = vi.hoisted(() => ({
  mockGetSessionCookie: vi.fn(),
}));

vi.mock('better-auth/cookies', () => ({
  getSessionCookie: mockGetSessionCookie,
}));

// Mock NextResponse since next/server may not work in test env
const { mockNext, mockRedirect } = vi.hoisted(() => ({
  mockNext: vi.fn(() => ({ type: 'next' })),
  mockRedirect: vi.fn((url: URL) => ({ type: 'redirect', url })),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    next: mockNext,
    redirect: mockRedirect,
  },
  NextRequest: vi.fn(),
}));

import { proxy, config } from './proxy';

function createMockRequest(pathname: string, baseUrl = 'http://localhost:3000') {
  const url = new URL(pathname, baseUrl);
  return {
    nextUrl: url,
    url: url.toString(),
  } as unknown as NextRequest;
}

describe('proxy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Public Paths', () => {
    it('should allow /api paths without session check', async () => {
      const request = createMockRequest('/api/auth/session');

      await proxy(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockGetSessionCookie).not.toHaveBeenCalled();
    });

    it('should allow nested /api paths without session check', async () => {
      const request = createMockRequest('/api/some/nested/route');

      await proxy(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockGetSessionCookie).not.toHaveBeenCalled();
    });

    it('should allow /signin path without session check', async () => {
      const request = createMockRequest('/signin');

      await proxy(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockGetSessionCookie).not.toHaveBeenCalled();
    });
  });

  describe('Protected Paths', () => {
    it('should redirect to /signin when no session cookie', async () => {
      const request = createMockRequest('/home');
      mockGetSessionCookie.mockReturnValueOnce(null);

      await proxy(request);

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/signin' })
      );
    });

    it('should allow request when session cookie exists', async () => {
      const request = createMockRequest('/home');
      mockGetSessionCookie.mockReturnValueOnce('session-token-value');

      await proxy(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('should redirect to /signin on error during session check', async () => {
      const request = createMockRequest('/home');
      mockGetSessionCookie.mockImplementationOnce(() => {
        throw new Error('Cookie parsing error');
      });

      await proxy(request);

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/signin' })
      );
    });
  });

  describe('Route Matcher', () => {
    it('should export config with correct matcher pattern', () => {
      expect(config.matcher).toBeDefined();
      expect(config.matcher).toHaveLength(1);
    });

    it('should exclude _next/static, _next/image, favicon.ico, and assets paths', () => {
      const pattern = config.matcher[0];
      expect(pattern).toContain('_next/static');
      expect(pattern).toContain('_next/image');
      expect(pattern).toContain('favicon.ico');
      expect(pattern).toContain('assets/');
    });
  });
});

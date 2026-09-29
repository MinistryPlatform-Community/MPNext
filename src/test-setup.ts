import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables for tests
vi.stubEnv('MINISTRY_PLATFORM_BASE_URL', 'https://test-mp.example.com');
vi.stubEnv('OIDC_CLIENT_ID', 'test-client-id');
vi.stubEnv('OIDC_CLIENT_SECRET', 'test-client-secret');
// >= 32 chars: src/lib/auth.ts's assertAuthEnvironment refuses anything shorter.
vi.stubEnv('BETTER_AUTH_SECRET', 'test-secret-key-for-testing-0123456789abcdef');
vi.stubEnv('BETTER_AUTH_URL', 'http://localhost:3000');
vi.stubEnv('NODE_ENV', 'test');

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables for tests
vi.stubEnv('MINISTRY_PLATFORM_BASE_URL', 'https://test-mp.example.com');
vi.stubEnv('OIDC_CLIENT_ID', 'test-client-id');
vi.stubEnv('OIDC_CLIENT_SECRET', 'test-client-secret');
vi.stubEnv('NEXTAUTH_SECRET', 'test-secret-key-for-testing');
vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000');
vi.stubEnv('NODE_ENV', 'test');

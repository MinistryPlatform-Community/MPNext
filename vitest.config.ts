import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],

      // This explicit `include` is load-bearing. With no `include`, v8 reports
      // only on files some test actually imported, so every untested file drops
      // out of the denominator and the headline percentage is inflated — it read
      // 71.6% while true statement coverage was 32.7%. Naming the globs puts the
      // untested files back in the denominator. (Vitest 3's `coverage.all` flag
      // is gone in Vitest 4; `include` replaces it.)
      include: ['src/**/*.{ts,tsx}'],

      exclude: [
        'node_modules/',
        '.next/',
        'src/test-setup.ts',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        'src/lib/providers/ministry-platform/models/', // Auto-generated files
        'src/lib/providers/ministry-platform/scripts/', // Dev-only codegen, run manually

        // Thin shadcn/Radix wrappers — excluded from the denominator entirely.
        // Testing them asserts that Radix works. Feature components (*.tsx) are
        // NOT excluded: they stay visible in the report, just ungated.
        'src/components/ui/',
      ],

      // Ratchet for non-UI functional code: services, the MP provider, server
      // actions, contexts, and auth/proxy plumbing. Set just under the achieved
      // figures (98.8% stmts / 94.5% branch / 97.6% funcs / 99.0% lines) so an
      // ordinary refactor has room but a real regression fails the run.
      //
      // React components and app routes are deliberately NOT gated: they are
      // excluded from these globs rather than from the report, so `npm run
      // test:coverage` still shows their (currently 0%) numbers.
      thresholds: {
        'src/services/**': {
          statements: 95,
          branches: 90,
          functions: 95,
          lines: 95,
        },
        'src/lib/**/*.ts': {
          statements: 95,
          branches: 85,
          functions: 90,
          lines: 95,
        },
        'src/components/**/actions.ts': {
          statements: 95,
          branches: 85,
          functions: 95,
          lines: 95,
        },
        'src/contexts/**': {
          statements: 95,
          branches: 85,
          functions: 95,
          lines: 95,
        },
        'src/proxy.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

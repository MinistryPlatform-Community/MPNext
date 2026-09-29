import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  test: {
    // Two projects, one run. `npm test`, `npm run test:run` and
    // `npm run test:coverage` (and CI's `npx vitest run --coverage`) run both,
    // each exactly once:
    //
    //   src     — the app suite (jsdom + src/test-setup.ts). Inherits the
    //             plugins and `@` alias below via `extends: true`.
    //   scripts — the Node-only dev tooling suite (setup's .env.local writer,
    //             the CI prerender guard), configured in
    //             scripts/vitest.config.mts. It does NOT extend this config, so
    //             it gets neither jsdom nor src/test-setup.ts's stubbed env.
    //
    // Coverage is configured once, here, for the whole run — and its `include`
    // below is src/-only, so scripts/ never enters the denominator and the
    // src/ thresholds are unaffected. Run one project with `--project src` or
    // `--project scripts` (e.g. `npm run test:scripts`).
    projects: [
      {
        extends: true,
        test: {
          name: 'src',
          environment: 'jsdom',
          globals: true,
          setupFiles: ['./src/test-setup.ts'],
          include: ['src/**/*.{test,spec}.{ts,tsx}'],
          exclude: ['node_modules', '.next'],
        },
      },
      './scripts/vitest.config.mts',
    ],
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

      // Ratchet, set just under the achieved figures so an ordinary refactor has
      // room but a real regression fails the run. Every threshold key below is a
      // glob whose matching files are aggregated into one set; the bare
      // statements/branches/functions/lines keys at the bottom are the GLOBAL
      // gate, which Vitest applies to all files — including ones a glob already
      // matched — not just the leftovers.
      //
      // UI is now gated too. React components and app routes were ungated while
      // they sat at 0%; as of 2026-09-12 they are covered (app routes 100%,
      // components 98.9% stmts / 96.6% branch), so they get globs of their own.
      // Keep branch gates on small denominators loose: `src/app/**` has only 10
      // branches total, where a single uncovered one costs 10 points.
      thresholds: {
        'src/app/**': {
          statements: 95,
          branches: 90,
          functions: 95,
          lines: 95,
        },
        'src/components/**/*.tsx': {
          statements: 95,
          branches: 90,
          functions: 95,
          lines: 95,
        },
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

        // Global gate across everything in `include`. Achieved 2026-09-13:
        // 99.74% stmts / 97.21% branch / 99.31% funcs / 99.91% lines. This is
        // the backstop that catches a newly added, entirely untested file —
        // the per-glob gates above cannot, since a new file lands inside a glob
        // and is diluted by everything already covered there.
        statements: 98,
        branches: 95,
        functions: 97,
        lines: 98,
      },
    },
  },
  resolve: {
    alias: {
      // `__dirname` does not exist in an ESM `.mts` config — resolve the alias
      // from this file's own URL instead. `fileURLToPath` (rather than
      // `new URL(...).pathname`) is what keeps this correct on Windows, where
      // a raw pathname comes back as `/S:/MP/MPNext/src`.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // `server-only` throws unless resolved under the `react-server` export
      // condition, which Vitest does not set. Point it at the package's own
      // no-op build, exactly what Next resolves for server code.
      'server-only': fileURLToPath(new URL('./node_modules/server-only/empty.js', import.meta.url)),
    },
  },
});

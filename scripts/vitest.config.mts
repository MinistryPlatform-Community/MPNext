import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Tests for the dev tooling in scripts/ (setup's .env.local writer and the
// CI prerender guard). This is the `scripts` project of the root
// vitest.config.mts, so `npm run test:run` / `test:coverage` (and CI) already
// run it. It is a separate project on purpose: these are Node-only CLI helpers,
// and must not pick up the root `src` project's jsdom environment or its
// src/test-setup.ts env stubs. The root coverage `include` is src/-only, so
// nothing here counts toward the src/ coverage gates.
//
//   npm run test:scripts        # just this project
export default defineConfig({
  test: {
    name: 'scripts',
    root: fileURLToPath(new URL('.', import.meta.url)),
    environment: 'node',
    include: ['**/*.test.ts'],
  },
});

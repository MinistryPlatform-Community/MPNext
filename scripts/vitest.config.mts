import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Tests for the dev tooling in scripts/ (setup's .env.local writer). Kept out of
// the root vitest.config.mts on purpose: that config's `include` and coverage
// thresholds are scoped to src/, and these are Node-only CLI helpers. CI runs
// this config as its own step in .github/workflows/test.yml.
//
//   npx vitest run --config scripts/vitest.config.mts
export default defineConfig({
  test: {
    root: fileURLToPath(new URL('.', import.meta.url)),
    environment: 'node',
    include: ['**/*.test.ts'],
  },
});

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts", ".claude/worktrees/**"]),
  // F5 (2026-09-12): member PII and pastoral notes must never reach info-level
  // logs. `console.log`/`.debug`/`.info` are disallowed in application source;
  // `console.warn`/`.error` remain for structured/error logging. Generator
  // scripts (dev-only CLI tools) and test files are exempt. See
  // .claude/references/auth.md § Logging policy.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/lib/providers/ministry-platform/scripts/**",
      "**/*.test.{ts,tsx}",
    ],
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
]);

export default eslintConfig;

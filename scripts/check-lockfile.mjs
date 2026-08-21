#!/usr/bin/env node
/**
 * Lockfile drift guard.
 *
 * WHY THIS EXISTS
 *
 * `package-lock.json` is generated on Windows and consumed by CI on Linux. npm
 * resolves optional/bundled dependency subtrees per platform, so a lockfile
 * written on Windows can be missing entries that `npm ci` on Linux requires.
 * When that happens CI dies at the install step, before a single test runs, with
 * a cryptic `Missing: … from lock file`. It has happened twice:
 *
 *   2026-05-17  @emnapi/* subtree pruned      (npm dedupe on Windows)
 *   2026-08-21  ajv hoisted to top level      (64f18f0, broke main for ~45min)
 *
 * WHY IT IS NOT JUST `npm ci --dry-run`
 *
 * Measured 2026-08-21: against a known-broken lockfile, `npm ci --dry-run` exits
 * 0 on Windows and fails on Linux. Adding `--os=linux --cpu=x64` does NOT change
 * that — npm's lock/manifest sync check ignores those overrides. So the drift is
 * genuinely invisible to `npm ci` from a Windows machine, and a pre-commit hook
 * built on it would pass every time while still breaking CI.
 *
 * THE CHECK
 *
 * Instead of asking "does this lockfile install?", ask "is this lockfile already
 * what Linux resolution would produce?":
 *
 *   npm install --package-lock-only --os=linux --cpu=x64
 *
 * on a throwaway copy, then diff. Verified idempotent, so a correct lockfile
 * gives a zero diff, and any drift — this variant or the next one — shows up as
 * added/removed `node_modules/...` keys. `--package-lock-only` never touches
 * node_modules, so this is safe to run at any time, including mid-dev-server.
 *
 * USAGE
 *
 *   node scripts/check-lockfile.mjs          # verify (npm run deps:verify)
 *   node scripts/check-lockfile.mjs --fix    # rewrite canonically (npm run deps:relock)
 *
 * Exit 0 = clean, 1 = drift (or, in CI, could-not-verify).
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, copyFileSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LOCKFILE = join(REPO_ROOT, 'package-lock.json');
const MANIFEST = join(REPO_ROOT, 'package.json');

// The flags that make Windows resolve the way Linux CI does. Keep in sync with
// the `deps:relock` script and .claude/references/deps-known-issues.md.
const RELOCK_FLAGS = [
  'install',
  '--package-lock-only',
  '--os=linux',
  '--cpu=x64',
  '--ignore-scripts',
  '--no-audit',
  '--no-fund',
];

const fix = process.argv.includes('--fix');
const isCI = Boolean(process.env.CI);

/** Normalize line endings so a CRLF checkout does not read as drift. */
const normalize = (s) => s.replace(/\r\n/g, '\n');

/** Extract the `node_modules/...` keys so we can report what actually moved. */
function lockfileKeys(text) {
  try {
    return new Set(Object.keys(JSON.parse(text).packages ?? {}));
  } catch {
    return new Set();
  }
}

let scratch;
try {
  scratch = mkdtempSync(join(tmpdir(), 'mpnext-lockcheck-'));
  copyFileSync(MANIFEST, join(scratch, 'package.json'));
  copyFileSync(LOCKFILE, join(scratch, 'package-lock.json'));

  try {
    execFileSync('npm', RELOCK_FLAGS, {
      cwd: scratch,
      stdio: 'pipe',
      shell: process.platform === 'win32',
    });
  } catch (err) {
    // Almost always a registry/network problem. Do not block a local commit for
    // it — but never let it pass silently in CI, where the network is expected
    // and this check is authoritative.
    const detail = String(err.stderr || err.message || '').trim().split('\n').slice(-3).join('\n');
    if (isCI) {
      console.error('✗ lockfile check could not run in CI — treating as failure.\n');
      console.error(detail);
      process.exit(1);
    }
    console.warn('⚠ lockfile check skipped: could not reach the npm registry.');
    console.warn('  CI will still verify this. Details:\n  ' + detail.replace(/\n/g, '\n  '));
    process.exit(0);
  }

  const committed = normalize(readFileSync(LOCKFILE, 'utf8'));
  const canonical = normalize(readFileSync(join(scratch, 'package-lock.json'), 'utf8'));

  if (committed === canonical) {
    console.log('✓ package-lock.json matches Linux resolution — no drift.');
    process.exit(0);
  }

  if (fix) {
    // Write with the repo's existing newline style rather than forcing LF.
    const usesCRLF = readFileSync(LOCKFILE, 'utf8').includes('\r\n');
    writeFileSync(LOCKFILE, usesCRLF ? canonical.replace(/\n/g, '\r\n') : canonical);
    console.log('✓ package-lock.json rewritten to match Linux resolution.');
    console.log('  Review `git diff package-lock.json`, then commit it.');
    process.exit(0);
  }

  const before = lockfileKeys(committed);
  const after = lockfileKeys(canonical);
  const removed = [...after].filter((k) => !before.has(k)); // missing from the committed lock
  const added = [...before].filter((k) => !after.has(k)); // present but shouldn't be

  console.error('✗ package-lock.json does not match Linux resolution.');
  console.error('  `npm ci` on CI will likely fail at the install step.\n');

  if (removed.length) {
    console.error(`  Missing ${removed.length} entr${removed.length === 1 ? 'y' : 'ies'} that Linux needs:`);
    for (const k of removed.slice(0, 12)) console.error(`    + ${k}`);
    if (removed.length > 12) console.error(`    … and ${removed.length - 12} more`);
    console.error('');
  }
  if (added.length) {
    console.error(`  Has ${added.length} entr${added.length === 1 ? 'y' : 'ies'} Linux resolution does not produce:`);
    for (const k of added.slice(0, 12)) console.error(`    - ${k}`);
    if (added.length > 12) console.error(`    … and ${added.length - 12} more`);
    console.error('');
  }
  if (!removed.length && !added.length) {
    console.error('  Same package set, but metadata differs (e.g. dev vs devOptional flags).\n');
  }

  console.error('  Fix:  npm run deps:relock     (then commit package-lock.json)');
  console.error('  Never fix this with a bare `npm install` or `npm dedupe` on Windows —');
  console.error('  those are what cause it. See .claude/references/deps-known-issues.md.');
  process.exit(1);
} finally {
  if (scratch) rmSync(scratch, { recursive: true, force: true });
}

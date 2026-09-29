#!/usr/bin/env node
/**
 * Prerender guard — fails when `next build` prerendered (○) an app route that
 * must be rendered per request (ƒ).
 *
 * WHY THIS EXISTS
 *
 * The Content-Security-Policy is nonce-based and enforcing (see
 * src/lib/security-headers.ts and .claude/references/security-headers.md). The
 * proxy mints a fresh nonce per request, and Next stamps it onto its own
 * <script> tags only while rendering that request. A page prerendered at build
 * time was rendered with no request, so its HTML carries no nonce — the
 * enforced CSP then blocks every script on it and the page never hydrates.
 * Nothing but a build reveals that a route became static, and the build does
 * not fail on it; it just prints a ○ next to the route. This turns that ○ into
 * a red CI job.
 *
 * THE CHECK
 *
 * `.next/prerender-manifest.json` lists every route the build prerendered:
 * `routes` holds the concrete prerendered paths (including any produced from a
 * dynamic segment via generateStaticParams, whose `srcRoute` names the
 * segment), and `dynamicRoutes` holds the prerendered dynamic segments
 * themselves. Any key or srcRoute there that is not on ALLOWED_STATIC_ROUTES
 * fails the check.
 *
 * USAGE
 *
 *   npm run build && node scripts/check-prerender.mjs   # (npm run build:check-prerender)
 *   node scripts/check-prerender.mjs path/to/prerender-manifest.json
 *
 * Exit 0 = only allowlisted routes are static, 1 = a route was prerendered
 * unexpectedly, 2 = the manifest is missing or unreadable (run the build first).
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * The only routes allowed to be static (○). Adding to this list needs the same
 * justification as the entries below — a static page ships no nonce, so it
 * cannot run JavaScript under the enforced CSP.
 *
 * @type {ReadonlyMap<string, string>}
 */
export const ALLOWED_STATIC_ROUTES = new Map([
  // Next's built-in 404. Always prerendered; it cannot opt into dynamic
  // rendering. src/app/not-found.tsx (if any) must work without JavaScript.
  ['/_not-found', 'Next built-in 404 page; always prerendered'],
  // Next's built-in 500 page wrapping src/app/global-error.tsx. Always
  // prerendered in Next 16; global-error.tsx is written to recover without
  // JavaScript for exactly this reason (see aa696f8).
  ['/_global-error', 'Next built-in 500 page (global-error.tsx); always prerendered'],
]);

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const DEFAULT_MANIFEST_PATH = resolve(REPO_ROOT, '.next', 'prerender-manifest.json');

/**
 * Returns every prerendered route in `manifest` that is not allowlisted,
 * sorted and de-duplicated. A concrete path generated from a dynamic segment
 * is reported by the path itself and its `srcRoute`.
 *
 * @param {unknown} manifest parsed `.next/prerender-manifest.json`
 * @param {ReadonlyMap<string, string>} [allowed]
 * @returns {string[]}
 */
export function findUnexpectedStaticRoutes(manifest, allowed = ALLOWED_STATIC_ROUTES) {
  if (!manifest || typeof manifest !== 'object') {
    throw new TypeError('prerender manifest is not an object');
  }
  const { routes, dynamicRoutes } = /** @type {Record<string, unknown>} */ (manifest);
  if (!routes || typeof routes !== 'object') {
    throw new TypeError('prerender manifest has no "routes" object');
  }

  /** @type {Set<string>} */
  const found = new Set();
  for (const [path, entry] of Object.entries(routes)) {
    found.add(path);
    const srcRoute = entry && typeof entry === 'object' ? entry.srcRoute : undefined;
    if (typeof srcRoute === 'string') found.add(srcRoute);
  }
  if (dynamicRoutes && typeof dynamicRoutes === 'object') {
    for (const path of Object.keys(dynamicRoutes)) found.add(path);
  }

  return [...found].filter((path) => !allowed.has(path)).sort();
}

/**
 * CLI entry point. Returns the process exit code.
 *
 * @param {string} [manifestPath]
 * @param {{ log: (msg: string) => void, error: (msg: string) => void }} [out]
 * @returns {number}
 */
export function main(manifestPath = DEFAULT_MANIFEST_PATH, out = console) {
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (err) {
    out.error(
      `check-prerender: cannot read ${manifestPath} (${err instanceof Error ? err.message : String(err)}).\n` +
        'Run `npm run build` first.',
    );
    return 2;
  }

  let unexpected;
  try {
    unexpected = findUnexpectedStaticRoutes(manifest);
  } catch (err) {
    out.error(`check-prerender: ${manifestPath}: ${err instanceof Error ? err.message : String(err)}`);
    return 2;
  }

  if (unexpected.length > 0) {
    out.error(
      'check-prerender: these routes were prerendered as static (○) but must be dynamic (ƒ):\n' +
        unexpected.map((path) => `  ${path}`).join('\n') +
        '\n\nA prerendered page carries no CSP nonce, so the enforced Content-Security-Policy\n' +
        'blocks its scripts and it never hydrates. Make the route dynamic, e.g.\n' +
        '`export const dynamic = "force-dynamic"` (as src/app/signin/page.tsx does) or by\n' +
        'reading request data such as `await headers()` / `await connection()`.\n' +
        'See .claude/references/security-headers.md. Only extend ALLOWED_STATIC_ROUTES in\n' +
        'scripts/check-prerender.mjs for a route that genuinely works without JavaScript.',
    );
    return 1;
  }

  out.log(
    `check-prerender: OK — only allowlisted routes are static (${[...ALLOWED_STATIC_ROUTES.keys()].join(', ')}).`,
  );
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exit(main(process.argv[2] ? resolve(process.argv[2]) : undefined));
}

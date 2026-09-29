import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ALLOWED_STATIC_ROUTES,
  DEFAULT_MANIFEST_PATH,
  findUnexpectedStaticRoutes,
  main,
} from './check-prerender.mjs';

/** Shape of `.next/prerender-manifest.json` from a clean Next 16.3 build. */
function cleanManifest() {
  return {
    version: 4,
    routes: {
      '/_global-error': { srcRoute: '/_global-error', dataRoute: '/_global-error.rsc' },
      '/_not-found': { initialStatus: 404, srcRoute: '/_not-found', dataRoute: '/_not-found.rsc' },
    },
    dynamicRoutes: {},
    notFoundRoutes: [],
  };
}

describe('findUnexpectedStaticRoutes', () => {
  it('accepts a build where only the allowlisted routes are static', () => {
    expect(findUnexpectedStaticRoutes(cleanManifest())).toEqual([]);
  });

  it('allowlists exactly /_not-found and /_global-error', () => {
    expect([...ALLOWED_STATIC_ROUTES.keys()].sort()).toEqual(['/_global-error', '/_not-found']);
  });

  it('reports a prerendered app page', () => {
    const manifest = cleanManifest();
    Object.assign(manifest.routes, { '/about': { srcRoute: '/about' } });
    expect(findUnexpectedStaticRoutes(manifest)).toEqual(['/about']);
  });

  it('reports a route with no srcRoute', () => {
    const manifest = cleanManifest();
    Object.assign(manifest.routes, { '/robots.txt': { srcRoute: null } });
    expect(findUnexpectedStaticRoutes(manifest)).toEqual(['/robots.txt']);
  });

  it('reports paths generated from a dynamic segment and the segment itself', () => {
    const manifest = cleanManifest();
    Object.assign(manifest.routes, {
      '/contactlookup/abc': { srcRoute: '/contactlookup/[guid]' },
      '/contactlookup/def': { srcRoute: '/contactlookup/[guid]' },
    });
    Object.assign(manifest.dynamicRoutes, { '/contactlookup/[guid]': {} });
    expect(findUnexpectedStaticRoutes(manifest)).toEqual([
      '/contactlookup/[guid]',
      '/contactlookup/abc',
      '/contactlookup/def',
    ]);
  });

  it('tolerates a missing dynamicRoutes and non-object entries', () => {
    expect(findUnexpectedStaticRoutes({ routes: { '/_not-found': null, '/x': 1 } })).toEqual(['/x']);
  });

  it('honours a custom allowlist', () => {
    const manifest = cleanManifest();
    expect(findUnexpectedStaticRoutes(manifest, new Map([['/_not-found', 'x']]))).toEqual([
      '/_global-error',
    ]);
  });

  it('rejects something that is not a prerender manifest', () => {
    expect(() => findUnexpectedStaticRoutes(null)).toThrow(TypeError);
    expect(() => findUnexpectedStaticRoutes('x')).toThrow(TypeError);
    expect(() => findUnexpectedStaticRoutes({})).toThrow(/routes/);
  });
});

describe('main', () => {
  let dir: string;
  let logs: string[];
  let errors: string[];
  const out = { log: (m: string) => logs.push(m), error: (m: string) => errors.push(m) };

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-prerender-'));
    logs = [];
    errors = [];
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  function writeManifest(value: unknown): string {
    const file = path.join(dir, 'prerender-manifest.json');
    fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value));
    return file;
  }

  it('defaults to .next/prerender-manifest.json at the repo root', () => {
    expect(DEFAULT_MANIFEST_PATH).toBe(
      path.join(fileURLToPath(new URL('..', import.meta.url)), '.next', 'prerender-manifest.json'),
    );
  });

  it('exits 0 on a clean build', () => {
    expect(main(writeManifest(cleanManifest()), out)).toBe(0);
    expect(logs.join('\n')).toMatch(/OK/);
    expect(errors).toEqual([]);
  });

  it('exits 1 and names the offending route', () => {
    const manifest = cleanManifest();
    Object.assign(manifest.routes, { '/home': { srcRoute: '/home' } });
    expect(main(writeManifest(manifest), out)).toBe(1);
    expect(errors.join('\n')).toContain('  /home');
    expect(errors.join('\n')).not.toContain('/_not-found\n');
  });

  it('exits 2 when the manifest is missing', () => {
    expect(main(path.join(dir, 'nope.json'), out)).toBe(2);
    expect(errors.join('\n')).toMatch(/npm run build/);
  });

  it('exits 2 on malformed JSON or the wrong shape', () => {
    expect(main(writeManifest('{not json'), out)).toBe(2);
    expect(main(writeManifest({ version: 4 }), out)).toBe(2);
    expect(errors).toHaveLength(2);
  });
});

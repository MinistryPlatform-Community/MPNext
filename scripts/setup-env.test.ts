import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import nextEnv from '@next/env';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  applyEnvUpdates,
  authSecretProblem,
  decodeEnvContent,
  encodeEnvValue,
  ENV_FILE_MODE,
  EnvValueError,
  readEnvFile,
  restrictEnvFilePermissions,
  updateEnvFile,
  writeEnvFileSecure,
} from './setup-env';

/**
 * Loads `.env.local` content through Next's real loader (`@next/env`), the same
 * code path `next dev` / `next build` use. `processEnv` is called directly
 * because `loadEnvConfig` skips `.env.local` when NODE_ENV is "test".
 *
 * The loader prefers process.env over the file and writes what it loads back
 * into process.env, so every key it touches is removed again afterwards.
 */
function loadThroughNext(contents: string): Record<string, string | undefined> {
  const before = new Set(Object.keys(process.env));
  const silent = { info: () => {}, error: () => {} };
  try {
    const [, parsed] = nextEnv.processEnv(
      [{ path: '.env.local', contents, env: {} }],
      os.tmpdir(),
      silent,
      true
    );
    return { ...parsed };
  } finally {
    for (const key of Object.keys(process.env)) {
      if (!before.has(key)) delete process.env[key];
    }
  }
}

// Keys unique to this file, so process.env can never shadow the file's value.
const KEY = 'MPNEXT_SETUP_TEST_VALUE';

/** Values that must survive `encodeEnvValue` → Next's loader unchanged. */
const ROUND_TRIP_VALUES = [
  // The three from the security review (2026-09-28, security-setup-env-file-writing).
  "p4ss$'word#tail",
  "p@ss$'tail",
  'Xy9$Qz7Lm#Kp2Vw8Rt5Nb3',
  // `$` in every position and every expansion shape.
  '$HOME',
  '${HOME}',
  '${UNSET:-fallback}',
  'a$b$c$',
  '$$',
  '$&',
  '$`',
  "$'",
  // Backslashes, including before a `$`.
  'a\\b',
  'a\\\\b',
  'a\\$b',
  '\\$HOME',
  // Comments, whitespace, `=`.
  'has # hash',
  '#leading',
  '  padded  ',
  'Administrators,Pastoral Staff',
  'k=v=w',
  // Quote characters (forces single-quote / backtick form).
  'say "hi"',
  "it's",
  'it\'s "quoted"',
  'back`tick',
  '"',
  "'",
  // Literal backslash-n / backslash-r (must not become a newline).
  'C:\\new\\root',
  'a\\rb',
  // Real newlines and CRs (double-quote form only).
  'line1\nline2',
  'line1\r\nline2',
  'trailing newline\n',
  'slash then newline\\\nnext',
  // Unicode.
  'pässwörd-✓',
  // A generated secret (base64 alphabet).
  'q1W2e3R4t5Y6u7I8o9P0+/aSdFgHjKlZxCvBnM1234=',
];

describe('encodeEnvValue round-trips through Next\'s env loader (@next/env)', () => {
  it.each(ROUND_TRIP_VALUES)('%j loads back exactly', (value) => {
    const file = `OTHER=before\n${KEY}=${encodeEnvValue(value)}\nAFTER=after\n`;
    const loaded = loadThroughNext(file);
    expect(loaded[KEY]).toBe(value);
    // Neighbouring entries are untouched (nothing swallowed or duplicated).
    expect(loaded.OTHER).toBe('before');
    expect(loaded.AFTER).toBe('after');
  });

  it('writes the empty string as a bare KEY=', () => {
    expect(encodeEnvValue('')).toBe('');
    expect(loadThroughNext(`${KEY}=\n`)[KEY]).toBe('');
  });

  it('keeps every entry on one line', () => {
    for (const value of ROUND_TRIP_VALUES) {
      expect(encodeEnvValue(value)).not.toMatch(/[\r\n]/);
    }
  });

  it.each([
    ['a trailing backslash', 'ends\\'],
    ['a newline plus a double quote', 'a"\nb'],
    ['a newline plus a literal \\n', 'a\\n\nb'],
    ['all three quote characters', 'a"b\'c`d'],
  ])('refuses %s instead of writing something that loads differently', (_label, value) => {
    expect(() => encodeEnvValue(value)).toThrow(EnvValueError);
  });

  it('never puts the value in the error message', () => {
    const secret = 'sup3r-s3cret"\nvalue';
    try {
      encodeEnvValue(secret);
      expect.unreachable();
    } catch (error) {
      expect((error as Error).message).not.toContain('sup3r');
    }
  });
});

describe('decodeEnvContent matches Next\'s loader', () => {
  const FILES = [
    // What setup writes.
    ROUND_TRIP_VALUES.map((v, i) => `K${i}=${encodeEnvValue(v)}`).join('\n'),
    // Hand-written, legacy, unquoted content — including the review's
    // truncation cases, which must decode *as Next decodes them* (truncated).
    [
      'A=Xy9$Qz7Lm#Kp2Vw8Rt5Nb3',
      "B=p4ss$'word#tail",
      'C=plain value # comment',
      'D="double #kept"',
      "E='single $A'",
      'F=${A}-suffix',
      'G=${MISSING:-dflt}',
      'H=\\$escaped',
      'export I=exported',
      '# a comment line',
      'J = spaced',
      'K="multi\\nline"',
      'L=',
    ].join('\n'),
    'CRLF=one\r\nNEXT=two\r\n',
  ];

  it.each(FILES.map((f, i) => [i, f]))('file %i', (_i, content) => {
    const ours = Object.fromEntries(decodeEnvContent(content as string));
    expect(ours).toEqual(loadThroughNext(content as string));
  });

  it('reproduces the truncation the review found in unquoted values', () => {
    const decoded = decodeEnvContent('BETTER_AUTH_SECRET=Xy9$Qz7Lm#Kp2Vw8Rt5Nb3\n');
    expect(decoded.get('BETTER_AUTH_SECRET')).toBe('Xy9');
  });
});

describe('applyEnvUpdates', () => {
  const EXISTING = [
    'OIDC_CLIENT_ID=MPNext',
    'OIDC_CLIENT_SECRET=oidc-secret',
    'BETTER_AUTH_SECRET=',
    'MINISTRY_PLATFORM_CLIENT_SECRET=api-secret',
    '',
  ].join('\n');

  it.each([["p4ss$'word#tail"], ['p@ss$`tail'], ['x$&y']])(
    'does not expand replacement patterns in %j into the file',
    (value) => {
      const out = applyEnvUpdates(EXISTING, new Map([['BETTER_AUTH_SECRET', value]]));
      // Same number of lines: nothing copied in from before/after the match.
      expect(out.split('\n')).toHaveLength(EXISTING.split('\n').length);
      expect(out.match(/oidc-secret/g)).toHaveLength(1);
      expect(out.match(/api-secret/g)).toHaveLength(1);
      expect(loadThroughNext(out).BETTER_AUTH_SECRET).toBe(value);
      expect(loadThroughNext(out).OIDC_CLIENT_SECRET).toBe('oidc-secret');
    }
  );

  it('appends keys that are not present, adding a newline if needed', () => {
    const out = applyEnvUpdates('A=1', new Map([['B', 'two words']]));
    expect(out).toBe('A=1\nB="two words"\n');
  });

  it('replaces only the exact key, not a key it prefixes', () => {
    const out = applyEnvUpdates('MP_SECURITY_ROLES_X=keep\nMP_SECURITY_ROLES=\n', new Map([['MP_SECURITY_ROLES', '*']]));
    expect(out).toBe('MP_SECURITY_ROLES_X=keep\nMP_SECURITY_ROLES="*"\n');
  });

  it('refuses an unencodable value without partially applying the batch', () => {
    expect(() =>
      applyEnvUpdates(EXISTING, new Map([['OIDC_CLIENT_ID', 'fine'], ['OIDC_CLIENT_SECRET', 'bad\\']]))
    ).toThrow(/OIDC_CLIENT_SECRET/);
  });

  it('refuses an invalid key', () => {
    expect(() => applyEnvUpdates('', new Map([['BAD KEY', 'x']]))).toThrow(EnvValueError);
  });
});

describe('file writing', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mpnext-setup-env-'));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('updateEnvFile writes values that read back exactly', () => {
    const file = path.join(dir, '.env.local');
    fs.writeFileSync(file, 'OIDC_CLIENT_ID=MPNext\nBETTER_AUTH_SECRET=\n');
    updateEnvFile(file, new Map([['BETTER_AUTH_SECRET', 'Xy9$Qz7Lm#Kp2Vw8Rt5Nb3']]));
    expect(readEnvFile(file).get('BETTER_AUTH_SECRET')).toBe('Xy9$Qz7Lm#Kp2Vw8Rt5Nb3');
    expect(loadThroughNext(fs.readFileSync(file, 'utf-8')).BETTER_AUTH_SECRET).toBe(
      'Xy9$Qz7Lm#Kp2Vw8Rt5Nb3'
    );
  });

  it('updateEnvFile creates a missing file', () => {
    const file = path.join(dir, '.env.local');
    updateEnvFile(file, new Map([['A', 'b']]));
    expect(fs.readFileSync(file, 'utf-8')).toBe('A="b"\n');
  });

  it('readEnvFile returns an empty map for a missing file', () => {
    expect(readEnvFile(path.join(dir, 'nope')).size).toBe(0);
  });

  it.skipIf(process.platform === 'win32')('creates the file 0600', () => {
    const file = path.join(dir, '.env.local');
    writeEnvFileSecure(file, 'A=1\n');
    expect(fs.statSync(file).mode & 0o777).toBe(ENV_FILE_MODE);
  });

  it.skipIf(process.platform === 'win32')('tightens an existing world-readable file to 0600', () => {
    const file = path.join(dir, '.env.local');
    fs.writeFileSync(file, 'A=1\n', { mode: 0o644 });
    fs.chmodSync(file, 0o644);
    updateEnvFile(file, new Map([['B', '2']]));
    expect(fs.statSync(file).mode & 0o777).toBe(ENV_FILE_MODE);
  });

  it.skipIf(process.platform === 'win32')('restrictEnvFilePermissions tightens a file it did not write', () => {
    const file = path.join(dir, '.env.local');
    fs.writeFileSync(file, 'A=1\n');
    fs.chmodSync(file, 0o644);
    restrictEnvFilePermissions(file);
    expect(fs.statSync(file).mode & 0o777).toBe(ENV_FILE_MODE);
  });

  it('does not throw where chmod is unsupported (Windows) or the file is missing', () => {
    const file = path.join(dir, '.env.local');
    expect(() => writeEnvFileSecure(file, 'A=1\n')).not.toThrow();
    expect(fs.readFileSync(file, 'utf-8')).toBe('A=1\n');
    expect(() => restrictEnvFilePermissions(path.join(dir, 'missing'))).not.toThrow();
  });
});

describe('authSecretProblem', () => {
  it('accepts a 32+ character secret', () => {
    expect(authSecretProblem('a'.repeat(32))).toBeNull();
  });

  it('rejects unset, short, and the public default', () => {
    expect(authSecretProblem(undefined)).toMatch(/not set/);
    expect(authSecretProblem('')).toMatch(/not set/);
    expect(authSecretProblem('a'.repeat(31))).toMatch(/31 characters/);
    expect(authSecretProblem('better-auth-secret-12345678901234567890')).toMatch(/public default/);
  });

  it('judges the loaded value, so a truncated unquoted secret fails', () => {
    const loaded = decodeEnvContent('BETTER_AUTH_SECRET=Xy9$Qz7Lm#Kp2Vw8Rt5Nb3aaaaaaaaaaaaa\n');
    expect(authSecretProblem(loaded.get('BETTER_AUTH_SECRET'))).toMatch(/3 characters/);
  });

  it('never echoes the secret', () => {
    expect(authSecretProblem('short-secret')).not.toContain('short-secret');
  });

  it('stays in step with src/lib/auth.ts', () => {
    const auth = fs.readFileSync(fileURLToPath(new URL('../src/lib/auth.ts', import.meta.url)), 'utf-8');
    expect(auth).toContain('export const MIN_AUTH_SECRET_LENGTH = 32;');
    expect(auth).toContain('export const BETTER_AUTH_DEFAULT_SECRET = "better-auth-secret-12345678901234567890";');
  });
});

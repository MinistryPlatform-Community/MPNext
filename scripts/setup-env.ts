/**
 * `.env.local` reading and writing for `scripts/setup.ts`.
 *
 * Kept free of side effects (setup.ts runs `main()` on import) so it can be unit
 * tested — see `scripts/setup-env.test.ts`, which round-trips values through
 * Next's real env loader (`@next/env`).
 *
 * Why this is more than `KEY=value`:
 *
 * Next loads `.env*` files with a vendored dotenv `parse` followed by a
 * dotenv-expand pass (node_modules/@next/env/dist/index.js). Written unquoted, a
 * value is cut at ` #`/`#` (comment) and every `$NAME` is expanded, so a
 * hand-typed secret like `Xy9$Qz7Lm#Kp2Vw8Rt5Nb3` loads as `Xy9` — and
 * better-auth only *warns* on a short secret. The loader's rules, as they
 * matter here:
 *
 * - Quoted values (`"…"`, `'…'`, `` `…` ``) keep `#` and surrounding spaces.
 * - Only inside double quotes are `\n` / `\r` turned into newline / CR.
 * - No other backslash escape is decoded: `\\` and `\"` stay two characters.
 *   So a value cannot contain its own quote character, and a trailing `\`
 *   would turn the closing quote into `\"` and swallow the following lines.
 * - In every value, quoted or not, `$NAME` / `${NAME}` are expanded and then
 *   each `\$` becomes `$`. Escaping every `$` as `\$` therefore reproduces it
 *   exactly, and a literal backslash before a `$` survives too (`\` + `\$`).
 *
 * `encodeEnvValue` picks the first quoting that round-trips exactly and refuses
 * a value none of them can represent rather than writing something that loads
 * differently.
 */

import * as fs from 'node:fs';

/** Mirrors `MIN_AUTH_SECRET_LENGTH` in src/lib/auth.ts (not imported: that module has load-time side effects). */
export const MIN_AUTH_SECRET_LENGTH = 32;

/** Mirrors `BETTER_AUTH_DEFAULT_SECRET` in src/lib/auth.ts — better-auth's public fallback secret. */
export const BETTER_AUTH_DEFAULT_SECRET = 'better-auth-secret-12345678901234567890';

/** Owner read/write only: `.env.local` holds the OIDC and API client secrets. */
export const ENV_FILE_MODE = 0o600;

export class EnvValueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvValueError';
  }
}

/**
 * Returns the right-hand side of `KEY=<here>` such that Next's env loader reads
 * back exactly `value`. Throws `EnvValueError` for a value no quoting can carry.
 * Never includes the value in the error message (it is usually a secret).
 */
export function encodeEnvValue(value: string): string {
  if (value === '') return '';

  if (value.endsWith('\\')) {
    throw new EnvValueError(
      'Values ending in a backslash cannot be stored in .env.local (the loader would read the closing quote as escaped).'
    );
  }

  const dollarsEscaped = value.replace(/\$/g, '\\$');

  // Double quotes: the only form that can carry a newline (as `\n`). Unsafe if
  // the value has a `"`, or a literal `\n` / `\r` the loader would decode.
  if (!value.includes('"') && !/\\[nr]/.test(value)) {
    const body = dollarsEscaped.replace(/\r/g, '\\r').replace(/\n/g, '\\n');
    return `"${body}"`;
  }

  // Single quotes / backticks: no escape decoding at all, so nothing but `$`
  // needs escaping — but a raw newline would make the entry span lines.
  if (/[\r\n]/.test(value)) {
    throw new EnvValueError(
      'Values containing both a newline and a double quote (or a literal \\n) cannot be stored in .env.local.'
    );
  }
  if (!value.includes("'")) return `'${dollarsEscaped}'`;
  if (!value.includes('`')) return `\`${dollarsEscaped}\``;

  throw new EnvValueError(
    'Values containing all three quote characters (" \' `) cannot be stored in .env.local.'
  );
}

// ----------------------------------------------------------------------------
// Decoding — a faithful copy of @next/env's vendored dotenv `parse` + expand,
// so setup reads back what Next will load. `setup-env.test.ts` asserts the two
// agree. The one deliberate difference: `$NAME` is resolved from the file only,
// never from process.env (Next prefers process.env; setup wants the file).
// ----------------------------------------------------------------------------

const LINE =
  /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/gm;

function dotenvParse(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  const src = content.replace(/\r\n?/gm, '\n');
  let match: RegExpExecArray | null;
  LINE.lastIndex = 0;
  while ((match = LINE.exec(src)) != null) {
    const key = match[1];
    let value = (match[2] || '').trim();
    const quote = value[0];
    value = value.replace(/^(['"`])([\s\S]*)\1$/gm, '$2');
    if (quote === '"') {
      value = value.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
    }
    out[key] = value;
  }
  return out;
}

function searchLast(str: string, rgx: RegExp): number {
  const matches = Array.from(str.matchAll(rgx));
  return matches.length > 0 ? (matches[matches.length - 1].index ?? -1) : -1;
}

function interpolate(value: string, parsed: Record<string, string>): string {
  const lastUnescaped = searchLast(value, /(?!(?<=\\))\$/g);
  if (lastUnescaped === -1) return value;
  const rightMost = value.slice(lastUnescaped);
  const match = rightMost.match(/((?!(?<=\\))\${?([\w]+)(?::-([^}\\]*))?}?)/);
  if (match != null) {
    const [, template, key, defaultValue] = match;
    return interpolate(value.replace(template, parsed[key] || defaultValue || ''), parsed);
  }
  return value;
}

/** Parses `.env` content into the values Next would load from it. */
export function decodeEnvContent(content: string): Map<string, string> {
  const parsed = dotenvParse(content);
  for (const key of Object.keys(parsed)) {
    parsed[key] = interpolate(parsed[key], parsed).replace(/\\\$/g, '$');
  }
  return new Map(Object.entries(parsed));
}

export function readEnvFile(filePath: string): Map<string, string> {
  if (!fs.existsSync(filePath)) return new Map();
  return decodeEnvContent(fs.readFileSync(filePath, 'utf-8'));
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Returns `content` with each `KEY=` line replaced (or appended) with an encoded
 * value. Throws `EnvValueError` before changing anything if a value cannot be
 * encoded.
 */
export function applyEnvUpdates(content: string, updates: Map<string, string>): string {
  const lines = [...updates].map(([key, value]) => {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      throw new EnvValueError(`Invalid environment variable name: ${key}`);
    }
    try {
      return [key, `${key}=${encodeEnvValue(value)}`] as const;
    } catch (error) {
      if (error instanceof EnvValueError) {
        throw new EnvValueError(`${key}: ${error.message}`);
      }
      throw error;
    }
  });

  let result = content;
  for (const [key, newLine] of lines) {
    const regex = new RegExp(`^${escapeRegExp(key)}=.*$`, 'm');
    if (regex.test(result)) {
      // A replacer function, not a string: a string replacement would expand
      // `$'`, `` $` ``, `$&` in the value into other parts of the file.
      result = result.replace(regex, () => newLine);
    } else {
      if (result && !result.endsWith('\n')) result += '\n';
      result += `${newLine}\n`;
    }
  }
  return result;
}

/**
 * Writes `content` owner-read/write only. `mode` applies only when the file is
 * created, so an existing file is chmod-ed as well. On Windows chmod can only
 * toggle read-only and 0o600 keeps it writable, so this is a harmless no-op.
 */
export function writeEnvFileSecure(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content, { encoding: 'utf-8', mode: ENV_FILE_MODE });
  restrictEnvFilePermissions(filePath);
}

/** chmod 0600, best effort (see `writeEnvFileSecure`). No-op if the file is missing. */
export function restrictEnvFilePermissions(filePath: string): void {
  try {
    fs.chmodSync(filePath, ENV_FILE_MODE);
  } catch {
    // Best effort: missing file, a filesystem without POSIX modes, or a file we do not own.
  }
}

export function updateEnvFile(filePath: string, updates: Map<string, string>): void {
  const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
  writeEnvFileSecure(filePath, applyEnvUpdates(content, updates));
}

/**
 * Same rules as `assertAuthEnvironment` in src/lib/auth.ts. Returns a problem
 * description, or `null` when the secret is acceptable. Never echoes the secret.
 */
export function authSecretProblem(secret: string | undefined): string | null {
  if (!secret) return 'is not set';
  if (secret === BETTER_AUTH_DEFAULT_SECRET) return "is better-auth's public default secret";
  if (secret.length < MIN_AUTH_SECRET_LENGTH) {
    return `loads as ${secret.length} characters; at least ${MIN_AUTH_SECRET_LENGTH} are required`;
  }
  return null;
}

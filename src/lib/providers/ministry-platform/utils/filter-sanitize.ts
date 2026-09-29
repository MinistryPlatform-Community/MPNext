/**
 * Filter sanitization utilities for Ministry Platform REST API queries.
 *
 * The MP API accepts an OData-style $filter parameter that maps to SQL WHERE clauses.
 * All values interpolated into filter strings MUST be sanitized to prevent filter injection.
 */

/**
 * ASCII control characters (C0 range and DEL). None belongs in a search term or
 * an equality value, and a NUL or newline inside a filter string is at best an
 * accident and at worst an attempt to confuse something downstream of it.
 */
// eslint-disable-next-line no-control-regex -- matching control characters is the point
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;

/**
 * Non-ASCII look-alikes of the single quote: left/right single quotation marks,
 * the single high-reversed-9 quote, the modifier-letter apostrophe and the
 * fullwidth apostrophe. Doubling `'` escapes only U+0027; if anything between
 * here and SQL Server ever narrowed one of these to `'` (an implicit
 * NVARCHAR→VARCHAR conversion, say) it would arrive unescaped. Whether MP's
 * backend does that is unknown, so the sanitizers never pass one through as-is.
 */
const QUOTE_LOOKALIKE = /[‘’‛ʼ＇]/;
const QUOTE_LOOKALIKES = new RegExp(QUOTE_LOOKALIKE.source, "g");

/**
 * Runtime guard shared by the string sanitizers. TypeScript's `string` is
 * erased at runtime and server-action payloads are caller-shaped, so an array
 * or object must be refused here rather than stringified into the filter. The
 * error names the kind of value, never the value itself.
 */
function assertFilterString(value: unknown, what: string): asserts value is string {
  if (typeof value !== "string") {
    throw new Error(`Invalid ${what}: expected a string`);
  }
  if (CONTROL_CHARS.test(value)) {
    throw new Error(`Invalid ${what}: control characters are not allowed`);
  }
}

/**
 * Escapes a string value for safe interpolation inside a single-quoted filter value.
 * Doubles single quotes (SQL standard escaping) so that input like O'Brien
 * becomes O''Brien and cannot break out of the quoted context.
 *
 * Throws on a non-string, on any ASCII control character, and on a non-ASCII
 * single-quote look-alike (see {@link QUOTE_LOOKALIKE}) — an equality match
 * has no safe way to keep one, so it fails closed.
 *
 * Use for equality comparisons: `Column = '${sanitizeFilterValue(value)}'`.
 * For LIKE patterns, use {@link sanitizeLikeValue} instead.
 */
export function sanitizeFilterValue(value: string): string {
  assertFilterString(value, "filter value");
  if (QUOTE_LOOKALIKE.test(value)) {
    throw new Error("Invalid filter value: quote look-alike characters are not allowed");
  }
  return value.replace(/'/g, "''");
}

/**
 * Escapes a string value for safe interpolation inside a LIKE pattern, so the
 * value is matched literally.
 *
 * Escapes the backslash escape character itself, then the T-SQL LIKE
 * metacharacters `%`, `_` and `[` (the last opens a character class such as
 * `[0-9]` or `[^a]`; `]` and `^` mean nothing outside one, so they need no
 * escape), then doubles single quotes for string-literal escaping. Callers MUST
 * include `ESCAPE '\'` in the LIKE clause for the escapes to be honored, e.g.
 * `Column LIKE '%${sanitizeLikeValue(value)}%' ESCAPE '\\'`.
 *
 * Each non-ASCII single-quote look-alike (see {@link QUOTE_LOOKALIKE}) becomes
 * the single-character wildcard `_`. That can never be narrowed into a quote,
 * and it keeps a smart-quote search working: `O’Brien` matches both `O'Brien`
 * and `O’Brien`.
 *
 * Throws on a non-string or on any ASCII control character. Length limits are
 * the caller's job, since they depend on the feature (see `ContactService`).
 */
export function sanitizeLikeValue(value: string): string {
  assertFilterString(value, "search value");
  return value
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_")
    .replace(/\[/g, "\\[")
    .replace(/'/g, "''")
    // After the `_` escape above, so this wildcard is the only unescaped one.
    .replace(QUOTE_LOOKALIKES, "_");
}

/**
 * Validates a GUID/UUID string format and returns the sanitized value.
 * Accepts any UUID variant (v1–v5) — Ministry Platform GUIDs are not guaranteed
 * to be v4. Throws if the value is not a string or does not match the canonical
 * 8-4-4-4-12 hex format (a one-element array would otherwise stringify into a
 * passing value).
 */
export function sanitizeGuid(guid: string): string {
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (typeof guid !== "string" || !guidRegex.test(guid)) {
    throw new Error('Invalid GUID format');
  }
  return guid;
}

/**
 * Validates a numeric primary-key ID for safe interpolation into a filter string.
 * Accepts a `number`, or a string of digits only (e.g. a route param or an
 * un-coerced form field); everything else throws. The digits-only rule admits no
 * character that could alter the surrounding filter, and the safe-integer bound
 * keeps large values from stringifying into exponent notation (`1e+21`).
 *
 * Use for numeric comparisons: `Column = ${sanitizeNumericId(value, 'Contact ID')}`.
 * TypeScript's `number` annotation is erased at runtime, and server actions compile
 * to POST endpoints whose payload shape the caller controls, so a `number`-typed
 * parameter must still be validated here.
 *
 * @param value - The candidate ID, from any source
 * @param field - Field name used in the error message (never the offending value)
 * @returns The validated ID as a positive safe integer
 * @throws Error if the value is not a positive integer ID
 */
export function sanitizeNumericId(value: unknown, field = 'ID'): number {
  const n =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && /^[0-9]+$/.test(value)
        ? Number(value)
        : NaN;

  if (!Number.isSafeInteger(n) || n <= 0) {
    throw new Error(`Invalid ${field}`);
  }

  return n;
}

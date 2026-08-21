/**
 * Filter sanitization utilities for Ministry Platform REST API queries.
 *
 * The MP API accepts an OData-style $filter parameter that maps to SQL WHERE clauses.
 * All values interpolated into filter strings MUST be sanitized to prevent filter injection.
 */

/**
 * Escapes a string value for safe interpolation inside a single-quoted filter value.
 * Doubles single quotes (SQL standard escaping) so that input like O'Brien
 * becomes O''Brien and cannot break out of the quoted context.
 *
 * Use for equality comparisons: `Column = '${sanitizeFilterValue(value)}'`.
 * For LIKE patterns, use {@link sanitizeLikeValue} instead.
 */
export function sanitizeFilterValue(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * Escapes a string value for safe interpolation inside a LIKE pattern.
 * Escapes the SQL LIKE wildcards (`%`, `_`) and the backslash escape character
 * itself, then doubles single quotes for string-literal escaping. Callers MUST
 * include `ESCAPE '\'` in the LIKE clause for the escapes to be honored, e.g.
 * `Column LIKE '%${sanitizeLikeValue(value)}%' ESCAPE '\\'`.
 */
export function sanitizeLikeValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_")
    .replace(/'/g, "''");
}

/**
 * Validates a GUID/UUID string format and returns the sanitized value.
 * Accepts any UUID variant (v1–v5) — Ministry Platform GUIDs are not guaranteed
 * to be v4. Throws if the value does not match the canonical 8-4-4-4-12 hex format.
 */
export function sanitizeGuid(guid: string): string {
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!guidRegex.test(guid)) {
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

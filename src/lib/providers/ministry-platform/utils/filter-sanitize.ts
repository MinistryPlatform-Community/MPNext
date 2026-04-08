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
 */
export function sanitizeFilterValue(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * Validates a GUID/UUID string format and returns the sanitized value.
 * Throws if the value does not match the expected UUID v4 pattern.
 */
export function sanitizeGuid(guid: string): string {
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!guidRegex.test(guid)) {
    throw new Error('Invalid GUID format');
  }
  return guid;
}

/**
 * Input guards shared by the provider services.
 *
 * These services are thin passthroughs to an admin-level service account, so the
 * values they interpolate into request paths must be checked here, on their own,
 * whatever the caller (or any central HttpClient guard) already did. TypeScript
 * types are erased at runtime; a `string` table name can hold `../procs/...`.
 */

/**
 * A SQL-style identifier: letter or underscore, then letters, digits or
 * underscores. Covers every MP table and stored procedure name (`Contacts`,
 * `dp_Users`, `api_Custom_Get_Contacts`) and admits nothing that could change
 * the shape of a URL path (`.`, `/`, `\`, `?`, `#`, `%`).
 */
const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** SQL Server's `sysname` limit. */
const MAX_IDENTIFIER_LENGTH = 128;

/**
 * Validates a table or procedure name for use as a URL path segment.
 *
 * @param value - The candidate name, from any source
 * @param field - Used in the error message (never the offending value)
 * @returns The validated name
 * @throws Error if the value is not a plain identifier
 */
export function sanitizeIdentifier(value: unknown, field: string): string {
  if (
    typeof value !== 'string' ||
    value.length > MAX_IDENTIFIER_LENGTH ||
    !IDENTIFIER_PATTERN.test(value)
  ) {
    throw new Error(`Invalid ${field}`);
  }
  return value;
}

/**
 * What the services log for a caught error: its class name only.
 *
 * Error messages can carry response-body fragments (V8's JSON `SyntaxError`
 * quotes the body it failed to parse), request paths with capability IDs, or
 * member data. The name (`Error`, `TypeError`, `SyntaxError`, `TimeoutError`)
 * is enough to triage; the error itself is still re-thrown to the caller.
 *
 * Duck-typed rather than `instanceof Error` because a `DOMException` (what
 * `AbortSignal.timeout` rejects with) is not an `Error` in every realm. Only a
 * plain class-name-shaped `name` is logged; anything else falls back to typeof.
 */
export function errorName(error: unknown): string {
  const name =
    typeof error === 'object' && error !== null
      ? (error as { name?: unknown }).name
      : undefined;
  return typeof name === 'string' && /^[A-Za-z]{1,64}$/.test(name) ? name : typeof error;
}

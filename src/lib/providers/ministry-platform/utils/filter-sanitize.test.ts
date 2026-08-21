import { describe, it, expect } from 'vitest';
import { sanitizeFilterValue, sanitizeLikeValue, sanitizeGuid, sanitizeNumericId } from './filter-sanitize';

describe('sanitizeFilterValue', () => {
  it('should return plain strings unchanged', () => {
    expect(sanitizeFilterValue('John')).toBe('John');
  });

  it('should double single quotes for SQL escaping', () => {
    expect(sanitizeFilterValue("O'Brien")).toBe("O''Brien");
  });

  it('should handle multiple single quotes', () => {
    expect(sanitizeFilterValue("it's a 'test'")).toBe("it''s a ''test''");
  });

  it('should handle empty string', () => {
    expect(sanitizeFilterValue('')).toBe('');
  });

  it('should not alter strings without quotes', () => {
    expect(sanitizeFilterValue('Hello World 123')).toBe('Hello World 123');
  });
});

describe('sanitizeLikeValue', () => {
  it('should return plain strings unchanged', () => {
    expect(sanitizeLikeValue('John')).toBe('John');
  });

  it('should escape single quotes', () => {
    expect(sanitizeLikeValue("O'Brien")).toBe("O''Brien");
  });

  it('should escape percent wildcards', () => {
    expect(sanitizeLikeValue('100%')).toBe('100\\%');
  });

  it('should escape underscore wildcards', () => {
    expect(sanitizeLikeValue('a_b')).toBe('a\\_b');
  });

  it('should escape backslashes before other escapes', () => {
    expect(sanitizeLikeValue('a\\b')).toBe('a\\\\b');
  });

  it('should escape all special characters together', () => {
    expect(sanitizeLikeValue("100%_o'reilly\\")).toBe("100\\%\\_o''reilly\\\\");
  });

  it('should handle empty string', () => {
    expect(sanitizeLikeValue('')).toBe('');
  });
});

describe('sanitizeGuid', () => {
  it('should return a valid lowercase GUID unchanged', () => {
    const guid = '12345678-1234-1234-1234-123456789abc';
    expect(sanitizeGuid(guid)).toBe(guid);
  });

  it('should return a valid uppercase GUID unchanged', () => {
    const guid = '12345678-1234-1234-1234-123456789ABC';
    expect(sanitizeGuid(guid)).toBe(guid);
  });

  it('should accept mixed-case GUIDs', () => {
    const guid = 'aB3d5678-Ef01-2345-6789-AbCdEf012345';
    expect(sanitizeGuid(guid)).toBe(guid);
  });

  it('should throw on short strings', () => {
    expect(() => sanitizeGuid('guid-123')).toThrow('Invalid GUID format');
  });

  it('should throw on empty string', () => {
    expect(() => sanitizeGuid('')).toThrow('Invalid GUID format');
  });

  it('should throw on SQL injection attempt', () => {
    expect(() => sanitizeGuid("'; DROP TABLE Contacts; --")).toThrow('Invalid GUID format');
  });

  it('should throw on GUID with wrong separator count', () => {
    expect(() => sanitizeGuid('123456781234123412341234567890ab')).toThrow('Invalid GUID format');
  });

  it('should throw on GUID with invalid characters', () => {
    expect(() => sanitizeGuid('1234567g-1234-1234-1234-123456789abc')).toThrow('Invalid GUID format');
  });
});

describe('sanitizeNumericId', () => {
  it('should return a positive integer unchanged', () => {
    expect(sanitizeNumericId(42)).toBe(42);
  });

  it('should accept 1 as the lowest valid ID', () => {
    expect(sanitizeNumericId(1)).toBe(1);
  });

  it('should coerce a digits-only string', () => {
    expect(sanitizeNumericId('42')).toBe(42);
  });

  it('should accept the largest safe integer', () => {
    expect(sanitizeNumericId(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
  });

  // The reason this helper exists: a `number`-typed parameter can receive a
  // string at runtime, and an unsanitized value widens or rewrites the filter.
  it('should reject a boolean-OR injection payload', () => {
    expect(() => sanitizeNumericId('1 OR 1=1')).toThrow('Invalid ID');
  });

  it('should reject a statement-terminator injection payload', () => {
    expect(() => sanitizeNumericId('5; DROP')).toThrow('Invalid ID');
  });

  it('should reject a quoted injection payload', () => {
    expect(() => sanitizeNumericId("1' OR '1'='1")).toThrow('Invalid ID');
  });

  it('should reject a subquery injection payload', () => {
    expect(() => sanitizeNumericId('1 UNION SELECT Password FROM dp_Users')).toThrow('Invalid ID');
  });

  it('should reject a comment-terminated payload', () => {
    expect(() => sanitizeNumericId('1 --')).toThrow('Invalid ID');
  });

  it('should reject NaN', () => {
    expect(() => sanitizeNumericId(NaN)).toThrow('Invalid ID');
  });

  it('should reject Infinity', () => {
    expect(() => sanitizeNumericId(Infinity)).toThrow('Invalid ID');
  });

  it('should reject -Infinity', () => {
    expect(() => sanitizeNumericId(-Infinity)).toThrow('Invalid ID');
  });

  it('should reject non-integers', () => {
    expect(() => sanitizeNumericId(1.5)).toThrow('Invalid ID');
  });

  it('should reject negative numbers', () => {
    expect(() => sanitizeNumericId(-1)).toThrow('Invalid ID');
  });

  it('should reject zero', () => {
    expect(() => sanitizeNumericId(0)).toThrow('Invalid ID');
  });

  it('should reject null', () => {
    expect(() => sanitizeNumericId(null)).toThrow('Invalid ID');
  });

  it('should reject undefined', () => {
    expect(() => sanitizeNumericId(undefined)).toThrow('Invalid ID');
  });

  it('should reject whitespace-padded numerics', () => {
    expect(() => sanitizeNumericId('  7  ')).toThrow('Invalid ID');
  });

  it('should reject the empty string', () => {
    // Number('') is 0, so a bare Number() coercion would let this through the
    // integer check; the digits-only test is what stops it.
    expect(() => sanitizeNumericId('')).toThrow('Invalid ID');
  });

  it('should reject hex notation', () => {
    expect(() => sanitizeNumericId('0x10')).toThrow('Invalid ID');
  });

  it('should reject exponent notation', () => {
    expect(() => sanitizeNumericId('1e3')).toThrow('Invalid ID');
  });

  it('should reject a signed numeric string', () => {
    expect(() => sanitizeNumericId('+7')).toThrow('Invalid ID');
  });

  it('should reject a decimal string', () => {
    expect(() => sanitizeNumericId('7.0')).toThrow('Invalid ID');
  });

  it('should reject values above the safe-integer range', () => {
    // 1e21 stringifies to "1e+21", which would leak exponent notation into the filter.
    expect(() => sanitizeNumericId(1e21)).toThrow('Invalid ID');
  });

  it('should reject objects', () => {
    expect(() => sanitizeNumericId({ valueOf: () => 5 })).toThrow('Invalid ID');
  });

  it('should reject arrays', () => {
    expect(() => sanitizeNumericId([5])).toThrow('Invalid ID');
  });

  it('should reject booleans', () => {
    expect(() => sanitizeNumericId(true)).toThrow('Invalid ID');
  });

  it('should reject bigints', () => {
    expect(() => sanitizeNumericId(BigInt(5))).toThrow('Invalid ID');
  });

  it('should name the field in the error without echoing the value', () => {
    expect(() => sanitizeNumericId('1 OR 1=1', 'Contact Log ID')).toThrow('Invalid Contact Log ID');
    expect(() => sanitizeNumericId('1 OR 1=1', 'Contact Log ID')).not.toThrow('1 OR 1=1');
  });
});

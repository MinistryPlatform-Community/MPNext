import { describe, it, expect } from 'vitest';
import { sanitizeFilterValue, sanitizeGuid } from './filter-sanitize';

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

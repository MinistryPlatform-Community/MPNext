import { describe, it, expect } from 'vitest';
import { errorName, sanitizeIdentifier } from '@/lib/providers/ministry-platform/services/guards';

describe('sanitizeIdentifier', () => {
  it.each(['Contacts', 'Contact_Log', 'dp_Users', '_x', 'api_Custom_Get_Contacts2', 'a'.repeat(128)])(
    'should accept %j',
    (name) => {
      expect(sanitizeIdentifier(name, 'table name')).toBe(name);
    }
  );

  it.each([
    '..',
    '.',
    'a/b',
    'a\\b',
    'a?b',
    'a#b',
    'a%2e',
    'a b',
    'a-b',
    'a.b',
    '9a',
    '',
    'a'.repeat(129),
    'Contacts\n',
    'Ｃontacts', // full-width letter
  ])('should refuse %j with a fixed message', (name) => {
    expect(() => sanitizeIdentifier(name, 'table name')).toThrow(/^Invalid table name$/);
  });

  it.each([undefined, null, 1, {}, ['Contacts']])('should refuse the non-string %j', (value) => {
    expect(() => sanitizeIdentifier(value, 'procedure name')).toThrow('Invalid procedure name');
  });
});

describe('errorName', () => {
  it('should return the class name of an Error, never its message', () => {
    expect(errorName(new SyntaxError('"Jane Doe" is not valid JSON'))).toBe('SyntaxError');
    expect(errorName(new TypeError('fetch failed'))).toBe('TypeError');
  });

  it('should return a DOMException name such as TimeoutError', () => {
    expect(errorName(new DOMException('timed out', 'TimeoutError'))).toBe('TimeoutError');
  });

  it('should return the typeof a non-Error value', () => {
    expect(errorName('raw body')).toBe('string');
    expect(errorName(undefined)).toBe('undefined');
    expect(errorName(null)).toBe('object');
    expect(errorName({ message: 'x' })).toBe('object');
  });

  it('should not log a name that is not class-name shaped', () => {
    expect(errorName({ name: 'Jane Doe, 12 Main St' })).toBe('object');
    expect(errorName({ name: 42 })).toBe('object');
    expect(errorName({ name: 'x'.repeat(65) })).toBe('object');
  });
});

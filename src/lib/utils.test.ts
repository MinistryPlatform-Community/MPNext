import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

/**
 * cn() Tests
 *
 * The class-name merge helper used by every component in the app. It is a
 * one-liner, but the twMerge half is what makes `cn(base, override)` actually
 * override rather than emit both classes — worth pinning, since swapping it for
 * a plain clsx call would leave both classes in the DOM and let CSS source
 * order decide the winner.
 */
describe('cn', () => {
  it('should join multiple class strings', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('should let a later Tailwind class override an earlier conflicting one', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('should keep non-conflicting classes from the same family', () => {
    expect(cn('px-2', 'py-4')).toBe('px-2 py-4');
  });

  it('should drop falsy conditional values', () => {
    expect(cn('base', false && 'hidden', null, undefined, '')).toBe('base');
  });

  it('should include a class from a truthy condition', () => {
    const isActive = true;
    expect(cn('base', isActive && 'font-bold')).toBe('base font-bold');
  });

  it('should flatten arrays and objects the way clsx does', () => {
    expect(cn(['px-2', 'py-1'])).toBe('px-2 py-1');
    expect(cn({ 'text-sm': true, 'text-lg': false })).toBe('text-sm');
  });

  it('should return an empty string with no arguments', () => {
    expect(cn()).toBe('');
  });
});

import { describe, it, expect } from 'vitest';
import { sortVersions } from './testVersions';

describe('sortVersions', () => {
  it('sorts versions in descending order (latest first)', () => {
    const input = ['1.2.3', '2.0.0', '1.10.0', '1.2.10', '1.2.2'];
    const expected = ['2.0.0', '1.10.0', '1.2.10', '1.2.3', '1.2.2'];
    expect(sortVersions(input)).toEqual(expected);
  });

  it('handles versions with single digit and double digit numbers', () => {
    const input = ['1.2.3', '1.2.10', '1.2.2'];
    const expected = ['1.2.10', '1.2.3', '1.2.2'];
    expect(sortVersions(input)).toEqual(expected);
  });

  it('handles versions with different major, minor, and patch numbers', () => {
    const input = ['0.9.9', '1.0.0', '0.10.0', '0.9.10'];
    const expected = ['1.0.0', '0.10.0', '0.9.10', '0.9.9'];
    expect(sortVersions(input)).toEqual(expected);
  });

  it('does not mutate the original array', () => {
    const input = ['1.2.3', '2.0.0', '1.2.2'];
    const copy = [...input];
    sortVersions(input);
    expect(input).toEqual(copy);
  });

  it('falls back to string comparison for invalid version formats', () => {
    const input = ['1.2.3', 'foo', '2.0.0', '1.2', 'bar', '1.2.10'];
    // 'foo' and 'bar' should be sorted in reverse lex order, then valid versions sorted numerically
    const expected = ['foo', 'bar', '2.0.0', '1.2.10', '1.2.3', '1.2'];
    expect(sortVersions(input)).toEqual(expected);
  });

  it('handles all invalid version strings', () => {
    const input = ['foo', 'bar', 'baz'];
    // Should sort in reverse lex order
    const expected = ['foo', 'baz', 'bar'];
    expect(sortVersions(input)).toEqual(expected);
  });

  it('handles empty array', () => {
    expect(sortVersions([])).toEqual([]);
  });

  it('handles array with one version', () => {
    expect(sortVersions(['1.2.3'])).toEqual(['1.2.3']);
  });

  it('handles versions with non-numeric parts', () => {
    const input = ['1.2.3', '1.2.x', '1.2.10'];
    // '1.2.x' is invalid, so it should be sorted by string (reverse lex), then valid versions numerically
    const expected = ['1.2.x', '1.2.10', '1.2.3'];
    expect(sortVersions(input)).toEqual(expected);
  });
});

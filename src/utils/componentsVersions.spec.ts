import { describe, it, expect } from 'vitest';
import { getHighestVersion, sortVersions } from './componentsVersions.ts';

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
    const expected = ['foo', 'bar', '2.0.0', '1.2.10', '1.2.3', '1.2'];
    expect(sortVersions(input)).toEqual(expected);
  });

  it('handles all invalid version strings', () => {
    const input = ['foo', 'bar', 'baz'];
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
    const expected = ['1.2.x', '1.2.10', '1.2.3'];
    expect(sortVersions(input)).toEqual(expected);
  });
});

describe('getHighestVersion', () => {
  it('picks the highest major version', () => {
    expect(getHighestVersion(['v1.20.1-1', 'v2.0.2-1'])).toBe('v2.0.2-1');
  });

  it('picks the highest minor version when major is equal', () => {
    expect(getHighestVersion(['v1.2.0', 'v1.10.0'])).toBe('v1.10.0');
  });

  it('picks the highest patch version when major and minor are equal', () => {
    expect(getHighestVersion(['v1.2.3', 'v1.2.10'])).toBe('v1.2.10');
  });

  it('picks the highest build suffix when major, minor, patch are equal', () => {
    expect(getHighestVersion(['v2.0.2-1', 'v2.0.2-10'])).toBe('v2.0.2-10');
  });

  it('treats versions without a build suffix as build 0', () => {
    expect(getHighestVersion(['v1.2.0', 'v1.2.0-1'])).toBe('v1.2.0-1');
  });

  it('handles a mix of v-prefixed and unprefixed versions', () => {
    expect(getHighestVersion(['0.9.1', 'v1.3.0'])).toBe('v1.3.0');
  });

  it('returns the first element when any version does not match the expected shape', () => {
    const input = ['v1.2.0', 'latest', 'v2.0.0'];
    expect(getHighestVersion(input)).toBe('v1.2.0');
  });

  it('returns undefined for an empty array', () => {
    expect(getHighestVersion([])).toBeUndefined();
  });

  it('returns the only element for a single-element array', () => {
    expect(getHighestVersion(['v1.2.3'])).toBe('v1.2.3');
  });

  it('does not mutate the original array', () => {
    const input = ['v1.2.0', 'v2.0.0', 'v1.5.0'];
    const copy = [...input];
    getHighestVersion(input);
    expect(input).toEqual(copy);
  });
});

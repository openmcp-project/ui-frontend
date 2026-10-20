import { describe, expect, it } from 'vitest';
import { bucketCount, sanitizeKind, TRACKED_KINDS } from './yamlApplyHelpers';

describe('sanitizeKind', () => {
  it('returns known platform kinds unchanged', () => {
    expect(sanitizeKind('ControlPlane')).toBe('ControlPlane');
    expect(sanitizeKind('Project')).toBe('Project');
    expect(sanitizeKind('GitRepository')).toBe('GitRepository');
    expect(sanitizeKind('Secret')).toBe('Secret');
  });

  it('replaces unknown / custom CRD kinds with "custom"', () => {
    expect(sanitizeKind('AcmeInternalThing')).toBe('custom');
    expect(sanitizeKind('MyCompanyDatabase')).toBe('custom');
    expect(sanitizeKind('')).toBe('custom');
  });

  it('is case-sensitive (does not leak via casing variants)', () => {
    expect(sanitizeKind('controlplane')).toBe('custom');
    expect(sanitizeKind('project')).toBe('custom');
  });

  it('keeps every kind listed in TRACKED_KINDS', () => {
    for (const kind of TRACKED_KINDS) {
      expect(sanitizeKind(kind)).toBe(kind);
    }
  });
});

describe('bucketCount', () => {
  it('maps counts to the expected buckets', () => {
    expect(bucketCount(1)).toBe('1');
    expect(bucketCount(2)).toBe('2');
    expect(bucketCount(3)).toBe('3-5');
    expect(bucketCount(5)).toBe('3-5');
    expect(bucketCount(6)).toBe('6-10');
    expect(bucketCount(10)).toBe('6-10');
    expect(bucketCount(11)).toBe('10+');
    expect(bucketCount(100)).toBe('10+');
  });

  it('clamps zero and negatives into the "1" bucket', () => {
    expect(bucketCount(0)).toBe('1');
    expect(bucketCount(-3)).toBe('1');
  });
});

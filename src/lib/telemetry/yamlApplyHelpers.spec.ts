import { describe, expect, it } from 'vitest';
import { sanitizeKind, TRACKED_KINDS } from './yamlApplyHelpers';

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

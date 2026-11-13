import { describe, expect, it } from 'vitest';
import { getServiceLifecycle } from './serviceLifecycleIndicator.ts';

describe('getServiceLifecycle', () => {
  it('maps empty or missing phase to ready (a settled service often reports no phase)', () => {
    expect(getServiceLifecycle('')).toBe('ready');
    expect(getServiceLifecycle(null)).toBe('ready');
    expect(getServiceLifecycle(undefined)).toBe('ready');
  });

  it('maps Ready to ready', () => {
    expect(getServiceLifecycle('Ready')).toBe('ready');
  });

  it('maps Progressing to installing', () => {
    expect(getServiceLifecycle('Progressing')).toBe('installing');
  });

  it('maps unrecognized phase strings to unknown', () => {
    expect(getServiceLifecycle('Requested')).toBe('unknown');
    expect(getServiceLifecycle('Initializing')).toBe('unknown');
    expect(getServiceLifecycle('SomethingNew')).toBe('unknown');
  });

  it('maps Terminating to deleting', () => {
    expect(getServiceLifecycle('Terminating')).toBe('deleting');
  });

  it('maps a non-empty error message to error regardless of phase', () => {
    expect(getServiceLifecycle('Progressing', 'requested version is not available')).toBe('error');
    expect(getServiceLifecycle('Ready', 'something failed')).toBe('error');
    expect(getServiceLifecycle(null, 'something failed')).toBe('error');
  });

  it('ignores an empty error message and falls back to the phase state', () => {
    expect(getServiceLifecycle('Progressing', '')).toBe('installing');
    expect(getServiceLifecycle('Progressing', null)).toBe('installing');
    expect(getServiceLifecycle('Ready', undefined)).toBe('ready');
  });
});

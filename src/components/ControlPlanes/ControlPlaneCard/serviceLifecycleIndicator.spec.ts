import { describe, expect, it } from 'vitest';
import { getServiceLifecycle, SERVICE_LIFECYCLE_ICON } from './serviceLifecycleIndicator.ts';

describe('getServiceLifecycle', () => {
  it('returns null for Ready, empty, or missing phase (no indicator)', () => {
    expect(getServiceLifecycle('Ready')).toBeNull();
    expect(getServiceLifecycle('')).toBeNull();
    expect(getServiceLifecycle(null)).toBeNull();
    expect(getServiceLifecycle(undefined)).toBeNull();
  });

  it('treats every pre-Ready phase as installing', () => {
    expect(getServiceLifecycle('Requested')).toBe('installing');
    expect(getServiceLifecycle('Initializing')).toBe('installing');
    expect(getServiceLifecycle('Progressing')).toBe('installing');
    // Unknown/future phases lean towards "in progress" rather than silently hiding.
    expect(getServiceLifecycle('SomethingNew')).toBe('installing');
  });

  it('maps Terminating to deleting', () => {
    expect(getServiceLifecycle('Terminating')).toBe('deleting');
  });

  it('exposes a static icon per lifecycle state', () => {
    expect(SERVICE_LIFECYCLE_ICON.installing).toBe('synchronize');
    expect(SERVICE_LIFECYCLE_ICON.deleting).toBe('delete');
  });
});

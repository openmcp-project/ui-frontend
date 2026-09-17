import { describe, expect, it } from 'vitest';
import { getServiceLifecycle, SERVICE_LIFECYCLE_ICON } from './serviceLifecycleIndicator.ts';

describe('getServiceLifecycle', () => {
  it('maps empty or missing phase to unknown', () => {
    expect(getServiceLifecycle('')).toBe('unknown');
    expect(getServiceLifecycle(null)).toBe('unknown');
    expect(getServiceLifecycle(undefined)).toBe('unknown');
  });

  it('maps Ready to ready', () => {
    expect(getServiceLifecycle('Ready')).toBe('ready');
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
    expect(SERVICE_LIFECYCLE_ICON.ready).toBe('accept');
    expect(SERVICE_LIFECYCLE_ICON.unknown).toBe('question-mark');
  });
});

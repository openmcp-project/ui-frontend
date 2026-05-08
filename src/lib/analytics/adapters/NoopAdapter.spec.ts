import { describe, it, expect, beforeEach } from 'vitest';
import { NoopAdapter } from './NoopAdapter';

describe('NoopAdapter', () => {
  let adapter: NoopAdapter;

  beforeEach(() => {
    adapter = new NoopAdapter();
    adapter.initialize();
  });

  it('should always be ready', () => {
    expect(adapter.isReady()).toBe(true);
  });

  it('should track events without side effects', () => {
    expect(() => {
      adapter.trackEvent('Test Event', { prop: 'value' });
    }).not.toThrow();
  });

  it('should track page views without side effects', () => {
    expect(() => {
      adapter.trackPageView('Test Page', { page: 'test' });
    }).not.toThrow();
  });

  it('should start and end actions without side effects', () => {
    const actionId = adapter.startAction('Test Action');

    expect(actionId).toBe(1);
    expect(() => {
      adapter.endAction(actionId);
    }).not.toThrow();
  });

  it('should increment action IDs', () => {
    const id1 = adapter.startAction('Action 1');
    const id2 = adapter.startAction('Action 2');

    expect(id1).toBe(1);
    expect(id2).toBe(2);
  });

  it('should add properties without side effects', () => {
    expect(() => {
      adapter.addProperties({ test: 'value' });
    }).not.toThrow();
  });

  it('should track errors without side effects', () => {
    const error = new Error('Test error');

    expect(() => {
      adapter.trackError(error, { context: 'test' });
    }).not.toThrow();
  });

  it('should cleanup without side effects', () => {
    expect(() => {
      adapter.cleanup();
    }).not.toThrow();
  });
});

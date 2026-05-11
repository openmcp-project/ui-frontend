import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PlausibleAdapter } from './PlausibleAdapter';

describe('PlausibleAdapter', () => {
  let adapter: PlausibleAdapter;
  let mockPlausible: any;

  beforeEach(() => {
    // Mock window.plausible
    mockPlausible = vi.fn();
    (window as any).plausible = mockPlausible;
    adapter = new PlausibleAdapter(true);
  });

  afterEach(() => {
    delete (window as any).plausible;
    vi.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize successfully when plausible is available', async () => {
      await adapter.initialize();

      expect(adapter.isReady()).toBe(true);
    });

    it('should handle missing plausible gracefully', async () => {
      delete (window as any).plausible;
      adapter = new PlausibleAdapter(true);

      // Wait only 200ms instead of full 5 seconds
      void adapter.initialize();
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(adapter.isReady()).toBe(false);
    });
  });

  describe('trackEvent', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should call plausible with correct parameters', () => {
      adapter.trackEvent('Button Clicked', { button: 'create', page: 'dashboard' });

      expect(mockPlausible).toHaveBeenCalledWith('Button Clicked', {
        props: { button: 'create', page: 'dashboard' },
      });
    });

    it('should track events without properties', () => {
      adapter.trackEvent('Simple Event');

      expect(mockPlausible).toHaveBeenCalledWith('Simple Event');
    });

    it('should filter out undefined properties', () => {
      adapter.trackEvent('Test Event', { prop1: 'value', prop2: undefined });

      expect(mockPlausible).toHaveBeenCalledWith('Test Event', {
        props: { prop1: 'value' },
      });
    });
  });

  describe('trackPageView', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should send pageview event with page name', () => {
      adapter.trackPageView('Projects', { project: 'test' });

      expect(mockPlausible).toHaveBeenCalledWith('pageview', {
        props: { project: 'test', page: 'Projects' },
      });
    });
  });

  describe('startAction / endAction', () => {
    beforeEach(async () => {
      await adapter.initialize();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should track action duration on endAction', () => {
      const actionId = adapter.startAction('Create MCP');

      vi.advanceTimersByTime(1500); // 1.5 seconds

      adapter.endAction(actionId);

      expect(mockPlausible).toHaveBeenCalledWith('Create MCP Completed', {
        props: { duration_ms: 1500 },
      });
    });

    it('should handle multiple concurrent actions', () => {
      const action1 = adapter.startAction('Action 1');
      vi.advanceTimersByTime(100);
      const action2 = adapter.startAction('Action 2');
      vi.advanceTimersByTime(200);

      adapter.endAction(action1);
      expect(mockPlausible).toHaveBeenCalledWith('Action 1 Completed', {
        props: { duration_ms: 300 },
      });

      adapter.endAction(action2);
      expect(mockPlausible).toHaveBeenCalledWith('Action 2 Completed', {
        props: { duration_ms: 200 },
      });
    });
  });

  describe('addProperties', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should be a no-op (Plausible does not support context properties)', () => {
      adapter.addProperties({ project: 'test' });

      expect(mockPlausible).not.toHaveBeenCalled();
    });
  });

  describe('trackError', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should send Error event with error details', () => {
      const error = new Error('Test error');
      adapter.trackError(error, { action: 'create_mcp' });

      expect(mockPlausible).toHaveBeenCalledWith('Error', {
        props: {
          action: 'create_mcp',
          error_message: 'Test error',
          error_name: 'Error',
        },
      });
    });
  });

  describe('cleanup', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should clear pending actions', () => {
      adapter.startAction('Test');
      adapter.cleanup();

      expect(adapter.isReady()).toBe(false);
    });
  });
});

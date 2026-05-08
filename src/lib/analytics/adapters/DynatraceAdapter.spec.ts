import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DynatraceAdapter } from './DynatraceAdapter';

describe('DynatraceAdapter', () => {
  let adapter: DynatraceAdapter;
  let mockDtrum: any;

  beforeEach(() => {
    // Mock window.dtrum
    mockDtrum = {
      enterAction: vi.fn((name: string) => 123),
      leaveAction: vi.fn(),
      addActionProperties: vi.fn(),
      reportCustomEvent: vi.fn(),
      reportError: vi.fn(),
    };

    (window as any).dtrum = mockDtrum;
    adapter = new DynatraceAdapter(true);
  });

  afterEach(() => {
    delete (window as any).dtrum;
    vi.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize successfully when dtrum is available', async () => {
      await adapter.initialize();

      expect(adapter.isReady()).toBe(true);
    });

    it('should handle missing dtrum gracefully', async () => {
      delete (window as any).dtrum;
      adapter = new DynatraceAdapter(true);

      // Should timeout quickly since dtrum is not available
      // Use a shorter timeout for the test
      const initPromise = adapter.initialize();

      // Wait only 200ms instead of full 5 seconds
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(adapter.isReady()).toBe(false);
    });
  });

  describe('trackEvent', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should call reportCustomEvent with correct parameters', () => {
      adapter.trackEvent('Test Event', { prop1: 'value1', prop2: 123 });

      expect(mockDtrum.reportCustomEvent).toHaveBeenCalledWith('Test Event', {
        prop1: 'value1',
        prop2: 123,
      });
    });

    it('should filter out undefined properties', () => {
      adapter.trackEvent('Test Event', { prop1: 'value1', prop2: undefined });

      expect(mockDtrum.reportCustomEvent).toHaveBeenCalledWith('Test Event', {
        prop1: 'value1',
      });
    });

    it('should handle events without properties', () => {
      adapter.trackEvent('Simple Event');

      expect(mockDtrum.reportCustomEvent).toHaveBeenCalledWith('Simple Event', {});
    });

    it('should not track when not ready', () => {
      delete (window as any).dtrum;

      adapter.trackEvent('Test Event');

      expect(mockDtrum.reportCustomEvent).not.toHaveBeenCalled();
    });
  });

  describe('trackPageView', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should report page view as custom event', () => {
      adapter.trackPageView('Projects List', { project: 'test' });

      expect(mockDtrum.reportCustomEvent).toHaveBeenCalledWith('Page View: Projects List', {
        project: 'test',
      });
    });
  });

  describe('startAction / endAction', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should start and end action correctly', () => {
      const actionId = adapter.startAction('Create MCP', 'wizard');

      expect(mockDtrum.enterAction).toHaveBeenCalledWith('Create MCP', 'wizard');
      expect(actionId).toBe(123);

      adapter.endAction(actionId);

      expect(mockDtrum.leaveAction).toHaveBeenCalledWith(123);
    });

    it('should handle multiple concurrent actions', () => {
      mockDtrum.enterAction = vi.fn()
        .mockReturnValueOnce(100)
        .mockReturnValueOnce(200);

      const action1 = adapter.startAction('Action 1');
      const action2 = adapter.startAction('Action 2');

      expect(action1).toBe(100);
      expect(action2).toBe(200);

      adapter.endAction(action1);
      adapter.endAction(action2);

      expect(mockDtrum.leaveAction).toHaveBeenCalledWith(100);
      expect(mockDtrum.leaveAction).toHaveBeenCalledWith(200);
    });

    it('should return -1 when not ready', () => {
      delete (window as any).dtrum;

      const actionId = adapter.startAction('Test');

      expect(actionId).toBe(-1);
    });
  });

  describe('addProperties', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should add properties to all pending actions', () => {
      mockDtrum.enterAction = vi.fn()
        .mockReturnValueOnce(100)
        .mockReturnValueOnce(200);

      const action1 = adapter.startAction('Action 1');
      const action2 = adapter.startAction('Action 2');

      adapter.addProperties({ project: 'test-project', workspace: 'dev' });

      expect(mockDtrum.addActionProperties).toHaveBeenCalledWith(100, {
        project: 'test-project',
        workspace: 'dev',
      });
      expect(mockDtrum.addActionProperties).toHaveBeenCalledWith(200, {
        project: 'test-project',
        workspace: 'dev',
      });
    });

    it('should not add properties when no actions are pending', () => {
      adapter.addProperties({ test: 'value' });

      expect(mockDtrum.addActionProperties).not.toHaveBeenCalled();
    });
  });

  describe('trackError', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should report error to dtrum', () => {
      const error = new Error('Test error');
      adapter.trackError(error, { action: 'create_mcp' });

      expect(mockDtrum.reportError).toHaveBeenCalledWith(error);
      expect(mockDtrum.reportCustomEvent).toHaveBeenCalledWith('Error Occurred', {
        action: 'create_mcp',
        errorMessage: 'Test error',
        errorName: 'Error',
      });
    });

    it('should handle error without context', () => {
      const error = new Error('Simple error');
      adapter.trackError(error);

      expect(mockDtrum.reportError).toHaveBeenCalledWith(error);
      expect(mockDtrum.reportCustomEvent).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should clear pending actions and set ready to false', () => {
      adapter.startAction('Test');
      adapter.cleanup();

      expect(adapter.isReady()).toBe(false);
    });
  });
});

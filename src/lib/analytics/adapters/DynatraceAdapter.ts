import type { ActionId, AnalyticsAdapter, AnalyticsProperties } from '../core/types';

/**
 * Type definitions for Dynatrace RUM JavaScript API
 * https://docs.dynatrace.com/docs/platform-modules/digital-experience/web-applications/additional-configuration/rum-javascript-api
 */
interface DynatraceRUM {
  enterAction(
    name: string,
    type?: string,
    startTime?: number,
    sourceUrl?: string,
  ): number;
  leaveAction(actionId: number, stopTime?: number, startTime?: number): void;
  addActionProperties(
    actionId: number,
    properties: Record<string, string | number | boolean>,
    startTime?: number,
  ): void;
  reportCustomEvent(
    name: string,
    properties?: Record<string, string | number | boolean>,
  ): void;
  reportError(
    error: Error | string,
    parentActionId?: number,
  ): void;
  endSession(): void;
  identifyUser(userId: string): void;
}

declare global {
  interface Window {
    dtrum?: DynatraceRUM;
  }
}

/**
 * Dynatrace RUM adapter
 * Wraps the Dynatrace JavaScript API (window.dtrum)
 */
export class DynatraceAdapter implements AnalyticsAdapter {
  private ready = false;
  private debug: boolean;
  private pendingActions = new Map<number, string>();

  constructor(debug = false) {
    this.debug = debug;
  }

  async initialize(): Promise<void> {
    // Wait for dtrum to be available (injected by server)
    // Poll for up to 5 seconds
    const maxAttempts = 50;
    let attempts = 0;

    while (!window.dtrum && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    if (window.dtrum) {
      this.ready = true;
      if (this.debug) {
        console.log('[DynatraceAdapter] Initialized successfully');
      }
    } else {
      console.warn('[DynatraceAdapter] dtrum not available after timeout');
    }
  }

  isReady(): boolean {
    return this.ready && !!window.dtrum;
  }

  trackEvent(name: string, properties?: AnalyticsProperties): void {
    if (!this.isReady()) {
      if (this.debug) {
        console.log('[DynatraceAdapter] trackEvent called but not ready:', name);
      }
      return;
    }

    try {
      // Convert properties to Dynatrace-compatible format
      const dtProperties = this.convertProperties(properties);
      window.dtrum!.reportCustomEvent(name, dtProperties);

      if (this.debug) {
        console.log('[DynatraceAdapter] trackEvent:', name, dtProperties);
      }
    } catch (error) {
      console.error('[DynatraceAdapter] trackEvent failed:', error);
    }
  }

  trackPageView(name: string, properties?: AnalyticsProperties): void {
    if (!this.isReady()) {
      if (this.debug) {
        console.log('[DynatraceAdapter] trackPageView called but not ready:', name);
      }
      return;
    }

    try {
      // Dynatrace automatically tracks page views, but we can enhance with custom event
      const dtProperties = this.convertProperties(properties);
      window.dtrum!.reportCustomEvent(`Page View: ${name}`, dtProperties);

      if (this.debug) {
        console.log('[DynatraceAdapter] trackPageView:', name, dtProperties);
      }
    } catch (error) {
      console.error('[DynatraceAdapter] trackPageView failed:', error);
    }
  }

  startAction(name: string, type = 'Custom'): ActionId {
    if (!this.isReady()) {
      if (this.debug) {
        console.log('[DynatraceAdapter] startAction called but not ready:', name);
      }
      return -1;
    }

    try {
      const actionId = window.dtrum!.enterAction(name, type);
      this.pendingActions.set(actionId, name);

      if (this.debug) {
        console.log('[DynatraceAdapter] startAction:', name, 'ID:', actionId);
      }

      return actionId;
    } catch (error) {
      console.error('[DynatraceAdapter] startAction failed:', error);
      return -1;
    }
  }

  endAction(actionId: ActionId): void {
    if (!this.isReady() || typeof actionId !== 'number' || actionId === -1) {
      return;
    }

    try {
      window.dtrum!.leaveAction(actionId);
      const actionName = this.pendingActions.get(actionId);
      this.pendingActions.delete(actionId);

      if (this.debug) {
        console.log('[DynatraceAdapter] endAction:', actionName, 'ID:', actionId);
      }
    } catch (error) {
      console.error('[DynatraceAdapter] endAction failed:', error);
    }
  }

  addProperties(properties: AnalyticsProperties): void {
    if (!this.isReady()) {
      return;
    }

    try {
      // Add to all pending actions
      const dtProperties = this.convertProperties(properties);

      for (const actionId of this.pendingActions.keys()) {
        window.dtrum!.addActionProperties(actionId, dtProperties);
      }

      if (this.debug && this.pendingActions.size > 0) {
        console.log('[DynatraceAdapter] addProperties to', this.pendingActions.size, 'actions:', dtProperties);
      }
    } catch (error) {
      console.error('[DynatraceAdapter] addProperties failed:', error);
    }
  }

  trackError(error: Error, context?: AnalyticsProperties): void {
    if (!this.isReady()) {
      if (this.debug) {
        console.log('[DynatraceAdapter] trackError called but not ready:', error.message);
      }
      return;
    }

    try {
      // Report error to Dynatrace
      window.dtrum!.reportError(error);

      // Also send as custom event with context
      if (context) {
        const dtProperties = this.convertProperties({
          ...context,
          errorMessage: error.message,
          errorName: error.name,
        });
        window.dtrum!.reportCustomEvent('Error Occurred', dtProperties);
      }

      if (this.debug) {
        console.log('[DynatraceAdapter] trackError:', error.message, context);
      }
    } catch (err) {
      console.error('[DynatraceAdapter] trackError failed:', err);
    }
  }

  /**
   * Convert analytics properties to Dynatrace-compatible format
   * Filters out undefined values and ensures correct types
   */
  private convertProperties(
    properties?: AnalyticsProperties,
  ): Record<string, string | number | boolean> {
    if (!properties) {
      return {};
    }

    const result: Record<string, string | number | boolean> = {};

    for (const [key, value] of Object.entries(properties)) {
      if (value !== undefined) {
        result[key] = value;
      }
    }

    return result;
  }

  cleanup(): void {
    this.pendingActions.clear();
    this.ready = false;

    if (this.debug) {
      console.log('[DynatraceAdapter] Cleaned up');
    }
  }
}

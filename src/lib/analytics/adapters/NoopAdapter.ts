import type { ActionId, AnalyticsAdapter, AnalyticsProperties } from '../core/types';

/**
 * No-operation analytics adapter
 * Used for development, testing, or when analytics is disabled
 * Logs to console in debug mode but performs no actual tracking
 */
export class NoopAdapter implements AnalyticsAdapter {
  private debug = false;
  private actionCounter = 0;

  initialize(): void {
    // Check if we're in development mode
    this.debug = import.meta.env.DEV;

    if (this.debug) {
      console.log('[NoopAdapter] Initialized (no tracking will occur)');
    }
  }

  isReady(): boolean {
    return true;
  }

  trackEvent(name: string, properties?: AnalyticsProperties): void {
    if (this.debug) {
      console.log('[NoopAdapter] trackEvent:', name, properties);
    }
  }

  trackPageView(name: string, properties?: AnalyticsProperties): void {
    if (this.debug) {
      console.log('[NoopAdapter] trackPageView:', name, properties);
    }
  }

  startAction(name: string, type?: string): ActionId {
    const actionId = ++this.actionCounter;

    if (this.debug) {
      console.log('[NoopAdapter] startAction:', name, 'type:', type, 'ID:', actionId);
    }

    return actionId;
  }

  endAction(actionId: ActionId): void {
    if (this.debug) {
      console.log('[NoopAdapter] endAction: ID:', actionId);
    }
  }

  addProperties(properties: AnalyticsProperties): void {
    if (this.debug) {
      console.log('[NoopAdapter] addProperties:', properties);
    }
  }

  trackError(error: Error, context?: AnalyticsProperties): void {
    if (this.debug) {
      console.log('[NoopAdapter] trackError:', error.message, context);
    }
  }

  cleanup(): void {
    if (this.debug) {
      console.log('[NoopAdapter] cleanup');
    }
  }
}

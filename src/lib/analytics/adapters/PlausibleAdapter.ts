import type { ActionId, AnalyticsAdapter, AnalyticsProperties } from '../core/types';

/**
 * Plausible Analytics types
 * https://plausible.io/docs/custom-event-goals
 */
interface PlausibleEvent {
  (eventName: string, options?: { props?: Record<string, string | number | boolean> }): void;
}

declare global {
  interface Window {
    plausible?: PlausibleEvent;
  }
}

/**
 * Plausible Analytics adapter
 * Privacy-focused, GDPR-compliant analytics
 *
 * Features:
 * - No cookies
 * - No personal data collection
 * - Self-hostable
 * - Lightweight (<1KB)
 *
 * Setup:
 * Add Plausible script to index.html:
 * <script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
 *
 * Or self-hosted:
 * <script defer data-domain="yourdomain.com" src="https://your-plausible-instance.com/js/script.js"></script>
 */
export class PlausibleAdapter implements AnalyticsAdapter {
  private ready = false;
  private debug: boolean;
  private pendingActions = new Map<number, { name: string; startTime: number }>();
  private actionCounter = 0;

  constructor(debug = false) {
    this.debug = debug;
  }

  async initialize(config?: Record<string, any>): Promise<void> {
    // Wait for plausible to be available
    // Usually loaded via script tag in HTML
    const maxAttempts = 50;
    let attempts = 0;

    while (!window.plausible && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    if (window.plausible) {
      this.ready = true;
      if (this.debug) {
        console.log('[PlausibleAdapter] Initialized successfully');
      }
    } else {
      console.warn('[PlausibleAdapter] plausible() not available after timeout');
      console.warn('[PlausibleAdapter] Make sure Plausible script is loaded in HTML');
    }
  }

  isReady(): boolean {
    return this.ready && !!window.plausible;
  }

  trackEvent(name: string, properties?: AnalyticsProperties): void {
    if (!this.isReady()) {
      if (this.debug) {
        console.log('[PlausibleAdapter] trackEvent called but not ready:', name);
      }
      return;
    }

    try {
      const props = this.convertProperties(properties);

      if (Object.keys(props).length > 0) {
        window.plausible!(name, { props });
      } else {
        window.plausible!(name);
      }

      if (this.debug) {
        console.log('[PlausibleAdapter] trackEvent:', name, props);
      }
    } catch (error) {
      console.error('[PlausibleAdapter] trackEvent failed:', error);
    }
  }

  trackPageView(name: string, properties?: AnalyticsProperties): void {
    if (!this.isReady()) {
      if (this.debug) {
        console.log('[PlausibleAdapter] trackPageView called but not ready:', name);
      }
      return;
    }

    try {
      // Plausible automatically tracks pageviews
      // We send a custom event for manual page view tracking
      const props = this.convertProperties(properties);

      window.plausible!('pageview', { props: { ...props, page: name } });

      if (this.debug) {
        console.log('[PlausibleAdapter] trackPageView:', name, props);
      }
    } catch (error) {
      console.error('[PlausibleAdapter] trackPageView failed:', error);
    }
  }

  startAction(name: string, type?: string): ActionId {
    if (!this.isReady()) {
      if (this.debug) {
        console.log('[PlausibleAdapter] startAction called but not ready:', name);
      }
      return -1;
    }

    try {
      const actionId = ++this.actionCounter;
      this.pendingActions.set(actionId, {
        name,
        startTime: Date.now(),
      });

      if (this.debug) {
        console.log('[PlausibleAdapter] startAction:', name, 'type:', type, 'ID:', actionId);
      }

      return actionId;
    } catch (error) {
      console.error('[PlausibleAdapter] startAction failed:', error);
      return -1;
    }
  }

  endAction(actionId: ActionId): void {
    if (!this.isReady() || typeof actionId !== 'number' || actionId === -1) {
      return;
    }

    try {
      const action = this.pendingActions.get(actionId);
      if (!action) {
        return;
      }

      const duration = Date.now() - action.startTime;

      // Send action completion event with duration
      window.plausible!(`${action.name} Completed`, {
        props: {
          duration_ms: duration,
        },
      });

      this.pendingActions.delete(actionId);

      if (this.debug) {
        console.log('[PlausibleAdapter] endAction:', action.name, 'duration:', duration, 'ms');
      }
    } catch (error) {
      console.error('[PlausibleAdapter] endAction failed:', error);
    }
  }

  addProperties(properties: AnalyticsProperties): void {
    // Plausible doesn't have a concept of adding properties to current context
    // Properties are event-specific
    if (this.debug) {
      console.log('[PlausibleAdapter] addProperties (no-op in Plausible):', properties);
    }
  }

  trackError(error: Error, context?: AnalyticsProperties): void {
    if (!this.isReady()) {
      if (this.debug) {
        console.log('[PlausibleAdapter] trackError called but not ready:', error.message);
      }
      return;
    }

    try {
      const props = this.convertProperties({
        ...context,
        error_message: error.message,
        error_name: error.name,
      });

      window.plausible!('Error', { props });

      if (this.debug) {
        console.log('[PlausibleAdapter] trackError:', error.message, props);
      }
    } catch (err) {
      console.error('[PlausibleAdapter] trackError failed:', err);
    }
  }

  /**
   * Convert analytics properties to Plausible-compatible format
   * Plausible only accepts string, number, or boolean values
   * Filters out undefined values
   */
  private convertProperties(properties?: AnalyticsProperties): Record<string, string | number | boolean> {
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
      console.log('[PlausibleAdapter] Cleaned up');
    }
  }
}

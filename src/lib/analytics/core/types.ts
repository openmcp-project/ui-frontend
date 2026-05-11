/**
 * Core analytics types and interfaces
 * Vendor-agnostic abstraction layer for analytics tracking
 */

/**
 * Properties that can be attached to events and actions
 */
export type AnalyticsProperties = Record<string, string | number | boolean | undefined>;

/**
 * Action identifier - can be string or number depending on provider
 */
export type ActionId = string | number;

/**
 * Configuration for analytics provider
 */
export interface AnalyticsConfig {
  provider: 'dynatrace' | 'noop';
  enabled: boolean;
  debug?: boolean;
  autoTrack?: {
    clicks?: boolean;
    pageViews?: boolean;
    errors?: boolean;
  };
  config?: Record<string, unknown>;
}

/**
 * Main analytics adapter interface
 * All analytics providers must implement this interface
 */
export interface AnalyticsAdapter {
  /**
   * Initialize the adapter
   * Called once when the provider is loaded
   */
  initialize(config?: Record<string, unknown>): void | Promise<void>;

  /**
   * Track a discrete user event
   * @param name - Event name (e.g., "MCP Created", "Tab Changed")
   * @param properties - Optional metadata about the event
   * @example
   * trackEvent('MCP Created', { template: 'flux', workspace: 'dev' })
   */
  trackEvent(name: string, properties?: AnalyticsProperties): void;

  /**
   * Track a page view or route change
   * @param name - Page/route name
   * @param properties - Optional page metadata
   * @example
   * trackPageView('Control Plane Detail', { project: 'my-project' })
   */
  trackPageView(name: string, properties?: AnalyticsProperties): void;

  /**
   * Start tracking a multi-step user action
   * Use this for complex workflows like wizards
   * @param name - Action name
   * @param type - Optional action type/category
   * @returns Action identifier to pass to endAction()
   * @example
   * const id = startAction('Create MCP Wizard', 'wizard')
   */
  startAction(name: string, type?: string): ActionId;

  /**
   * End tracking of a previously started action
   * @param actionId - ID returned from startAction()
   */
  endAction(actionId: ActionId): void;

  /**
   * Add contextual properties to the current action/page
   * @param properties - Properties to attach
   * @example
   * addProperties({ project: 'my-project', workspace: 'dev' })
   */
  addProperties(properties: AnalyticsProperties): void;

  /**
   * Track an error
   * @param error - Error object
   * @param context - Optional error context
   * @example
   * trackError(new Error('API failed'), { endpoint: '/api/mcps' })
   */
  trackError(error: Error, context?: AnalyticsProperties): void;

  /**
   * Check if the adapter is ready/initialized
   */
  isReady(): boolean;

  /**
   * Clean up resources when unmounting
   */
  cleanup?(): void;
}

/**
 * Analytics context value provided to React components
 */
export interface AnalyticsContextValue extends AnalyticsAdapter {
  config: AnalyticsConfig;
}

/**
 * Data attributes for automatic tracking
 */
export interface TrackingAttributes {
  'data-track-event'?: string;
  'data-track-category'?: string;
  'data-track-action'?: string;
  'data-track-label'?: string;
  'data-track-value'?: number;
}

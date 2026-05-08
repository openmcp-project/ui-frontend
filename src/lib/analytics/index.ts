/**
 * Analytics abstraction layer
 * Vendor-agnostic analytics implementation supporting multiple providers
 */

// Core exports
export { AnalyticsProvider } from './core/AnalyticsProvider';
export { useAnalytics, useAnalyticsOptional } from './core/useAnalytics';

// Types
export type {
  AnalyticsAdapter,
  AnalyticsConfig,
  AnalyticsProperties,
  AnalyticsContextValue,
  ActionId,
  TrackingAttributes,
} from './core/types';

// Utilities
export { useAutoPageTracking } from './utils/autoTracking';
export {
  trackingProps,
  dtNameProp,
  fullTrackingProps,
  extractTrackingData,
  extractDtName,
} from './utils/trackingHelpers';

// Adapters (for direct instantiation if needed)
export { DynatraceAdapter } from './adapters/DynatraceAdapter';
export { NoopAdapter } from './adapters/NoopAdapter';
export { PlausibleAdapter } from './adapters/PlausibleAdapter';

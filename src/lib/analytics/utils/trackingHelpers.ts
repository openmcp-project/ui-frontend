import type { AnalyticsProperties } from '../core/types';

/**
 * Helper to extract tracking attributes from HTML elements
 * Reads data-track-* attributes and converts them to analytics properties
 */
export function extractTrackingData(element: HTMLElement): {
  eventName?: string;
  properties: AnalyticsProperties;
} {
  const eventName = element.getAttribute('data-track-event') || undefined;

  const properties: AnalyticsProperties = {};

  const category = element.getAttribute('data-track-category');
  if (category) properties.category = category;

  const action = element.getAttribute('data-track-action');
  if (action) properties.action = action;

  const label = element.getAttribute('data-track-label');
  if (label) properties.label = label;

  const value = element.getAttribute('data-track-value');
  if (value) properties.value = parseInt(value, 10);

  return { eventName, properties };
}

/**
 * Helper to extract dtname attribute for Dynatrace compatibility
 * Dynatrace uses data-dtname for automatic action naming
 */
export function extractDtName(element: HTMLElement): string | null {
  // Check for data-dtname attribute (Dynatrace standard)
  return element.getAttribute('data-dtname');
}

/**
 * React component helper to merge tracking attributes with props
 * Makes it easier to add tracking to components
 *
 * @example
 * <Button {...trackingProps('Create MCP', { category: 'Control Planes' })}>
 */
export function trackingProps(
  eventName: string,
  properties?: {
    category?: string;
    action?: string;
    label?: string;
    value?: number;
  },
) {
  const props: Record<string, string> = {
    'data-track-event': eventName,
  };

  if (properties?.category) {
    props['data-track-category'] = properties.category;
  }

  if (properties?.action) {
    props['data-track-action'] = properties.action;
  }

  if (properties?.label) {
    props['data-track-label'] = properties.label;
  }

  if (properties?.value !== undefined) {
    props['data-track-value'] = String(properties.value);
  }

  return props;
}

/**
 * Helper to add Dynatrace dtname attribute
 * Use this for Dynatrace-specific automatic action tracking
 *
 * @example
 * <Button {...dtNameProp('Create MCP')}>
 */
export function dtNameProp(name: string) {
  return {
    'data-dtname': name,
  };
}

/**
 * Combine both tracking systems
 * Useful when you want both custom event tracking and Dynatrace automatic tracking
 *
 * @example
 * <Button {...fullTrackingProps('Create MCP', { category: 'Control Planes' })}>
 */
export function fullTrackingProps(
  eventName: string,
  properties?: {
    category?: string;
    action?: string;
    label?: string;
    value?: number;
  },
) {
  return {
    ...trackingProps(eventName, properties),
    ...dtNameProp(eventName),
  };
}

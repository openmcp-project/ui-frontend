import { useCallback, useEffect } from 'react';
import { trackEvent } from '../utils/analytics';

type TrackingProperties = Record<string, string | number | boolean>;

/**
 * Hook for tracking events in components
 *
 * @example
 * const track = useDynatraceTracking();
 *
 * // Track wizard open on mount
 * useEffect(() => {
 *   track('MCP_Wizard_Opened', { projectName, workspaceName });
 * }, []);
 *
 * // Track button click
 * const handleClick = () => {
 *   track('MCP_Create_Button_Clicked');
 *   // ... rest of logic
 * };
 */
export const useDynatraceTracking = () => {
  return useCallback((eventName: string, properties?: TrackingProperties) => {
    trackEvent(eventName, properties);
  }, []);
};

/**
 * Hook to automatically track component mount
 *
 * @example
 * useDynatraceMount('MCP_Wizard_Opened', { projectName, workspaceName });
 */
export const useDynatraceMount = (eventName: string, properties?: TrackingProperties) => {
  useEffect(() => {
    trackEvent(eventName, properties);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
};

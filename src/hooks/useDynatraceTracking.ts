import { useCallback } from 'react';
import { trackEvent, trackEventStart, trackEventEnd } from '../utils/analytics';

type TrackingProperties = Record<string, string | number | boolean>;

export const useDynatraceTracking = () => {
  const handleTrackEvent = useCallback((eventName: string, properties?: TrackingProperties) => {
    trackEvent(eventName, properties);
  }, []);

  const handleTrackEventStart = useCallback((eventName: string, properties?: TrackingProperties) => {
    return trackEventStart(eventName, properties);
  }, []);

  const handleTrackEventEnd = useCallback((actionId: number | undefined, properties?: TrackingProperties) => {
    trackEventEnd(actionId, properties);
  }, []);

  return {
    trackEvent: handleTrackEvent,
    trackEventStart: handleTrackEventStart,
    trackEventEnd: handleTrackEventEnd,
  };
};

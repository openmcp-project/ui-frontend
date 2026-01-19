import { useCallback } from 'react';
import {
  trackEvent,
  trackEventStart,
  trackEventEnd,
  trackXhrStart,
  trackXhrEnd,
  trackXhrFailed,
  getUserSource,
} from '../utils/analytics';

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

  const handleTrackXhrStart = useCallback(
    (type: string, xmode?: 0 | 1 | 3, xhrUrl?: string, properties?: TrackingProperties) => {
      return trackXhrStart(type, xmode, xhrUrl, properties);
    },
    [],
  );

  const handleTrackXhrEnd = useCallback((actionId: number | undefined, stopTime?: number) => {
    trackXhrEnd(actionId, stopTime);
  }, []);

  const handleTrackXhrFailed = useCallback((responseCode: number, message: string, parentActionId?: number) => {
    return trackXhrFailed(responseCode, message, parentActionId);
  }, []);

  const handleGetUserSource = useCallback(() => {
    return getUserSource();
  }, []);

  return {
    trackEvent: handleTrackEvent,
    trackEventStart: handleTrackEventStart,
    trackEventEnd: handleTrackEventEnd,
    trackXhrStart: handleTrackXhrStart,
    trackXhrEnd: handleTrackXhrEnd,
    trackXhrFailed: handleTrackXhrFailed,
    getUserSource: handleGetUserSource,
  };
};

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useDynatraceTracking } from './useDynatraceTracking';

export const useRouteTracking = () => {
  const location = useLocation();
  const { trackEvent } = useDynatraceTracking();

  useEffect(() => {
    trackEvent('route_change', {
      route: location.pathname,
      search: location.search,
      hash: location.hash,
    });
  }, [location, trackEvent]);
};

import { Outlet } from 'react-router-dom';
import { useRouteTracking } from '../../hooks/useRouteTracking';

/**
 * Wrapper component that enables route tracking within Router context
 * This component must be used inside a Router component
 */
export function RouteTrackingWrapper() {
  useRouteTracking();

  return <Outlet />;
}

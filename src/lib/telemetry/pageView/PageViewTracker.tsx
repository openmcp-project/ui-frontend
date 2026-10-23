import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTelemetry as _useTelemetry } from '../telemetry.ts';
import { toVirtualPage, type VirtualPage } from './virtualPage.ts';

// Opening a control plane rewrites the URL twice (?view after mount, headlampPath after
// the first iframe poll); waiting skips these intermediate URLs so only the final one is tracked.
const SETTLE_DELAY_MS = 1500;

interface PageViewTrackerProps {
  useTelemetry?: typeof _useTelemetry;
}

/** Tracks a page view whenever the URL, stripped of resource names, changes. */
export function PageViewTracker({ useTelemetry = _useTelemetry }: PageViewTrackerProps) {
  const telemetry = useTelemetry();
  const { pathname, search } = useLocation();
  const page = toVirtualPage(pathname, search);
  const lastTrackedPage = useRef<VirtualPage | null>(null);

  useEffect(() => {
    if (page === lastTrackedPage.current) return;
    const timeoutId = setTimeout(() => {
      lastTrackedPage.current = page;
      telemetry.pageView(page);
    }, SETTLE_DELAY_MS);
    return () => clearTimeout(timeoutId);
  }, [page, telemetry]);

  return <Outlet />;
}

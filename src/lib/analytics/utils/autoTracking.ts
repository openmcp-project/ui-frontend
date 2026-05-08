import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalyticsOptional } from '../core/useAnalytics';

/**
 * React hook that automatically tracks page views on route changes
 * Uses React Router's useLocation to detect navigation
 *
 * @example
 * function App() {
 *   useAutoPageTracking();
 *   return <Routes>...</Routes>;
 * }
 */
export function useAutoPageTracking() {
  const location = useLocation();
  const analytics = useAnalyticsOptional();

  useEffect(() => {
    if (!analytics) return;

    // Extract meaningful page name from pathname
    const pageName = getPageName(location.pathname);

    analytics.trackPageView(pageName, {
      path: location.pathname,
      search: location.search,
      hash: location.hash,
    });
  }, [location, analytics]);
}

/**
 * Convert pathname to human-readable page name
 * @param pathname - URL pathname
 * @returns Human-readable page name
 * @example
 * /mcp/projects/my-project -> Projects Detail
 * /mcp/projects/my-project/workspaces/dev -> Workspaces Detail
 */
function getPageName(pathname: string): string {
  // Remove leading/trailing slashes and split
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return 'Home';

  // Map common routes to readable names
  const routeMap: Record<string, string> = {
    projects: 'Projects',
    workspaces: 'Workspaces',
    mcps: 'Control Planes',
    mcpsv2: 'Control Planes V2',
    'managed-resources': 'Managed Resources',
  };

  // Build page name from segments
  const pageParts: string[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    if (routeMap[segment]) {
      pageParts.push(routeMap[segment]);

      // If next segment is not a known route, it's a detail page
      if (i + 1 < segments.length && !routeMap[segments[i + 1]]) {
        pageParts.push('Detail');
        break;
      }
    }
  }

  return pageParts.join(' ') || 'Unknown Page';
}

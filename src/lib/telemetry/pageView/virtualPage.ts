import { matchPath } from 'react-router-dom';
import { Routes, SearchParams } from '../../../Routes.ts';
import type { ViewMode } from '../../../context/ViewModeContext.tsx';

const HEADLAMP_SEGMENT = '/headlamp';
export const UNKNOWN_PAGE = '/other';
const HEADLAMP_VIEW: ViewMode = 'open-source';
// Headlamp routes carry namespaces and resource names from the second segment on
// (e.g. /pods/<namespace>/<name>), so only the first segment is safe to report.
const HEADLAMP_SAFE_DEPTH = 1;
const HEADLAMP_PROXY_PREFIX = /^\/api\/headlamp\/c\/[^/]+/;

const headlampHostRoutes: string[] = [Routes.Mcp, Routes.McpV2];

/** Route pattern (e.g. /projects/:projectName) instead of actual names; from toVirtualPage or SIGN_IN_PAGE. */
export type VirtualPage = string & { readonly __brand: 'VirtualPage' };

export const SIGN_IN_PAGE = '/sign-in' as VirtualPage;

/** Maps an app location to its route pattern, extended by the Headlamp section when Headlamp is active. */
export function toVirtualPage(pathname: string, search: string): VirtualPage {
  return resolve(pathname, search) as VirtualPage;
}

function resolve(pathname: string, search: string): string {
  const route = Object.values(Routes).find((pattern) => matchPath(pattern, pathname));
  if (!route) return UNKNOWN_PAGE;

  // headlampPath is never cleared on return to legacy, so ?view gates whether it is current.
  const params = new URLSearchParams(search);
  if (headlampHostRoutes.includes(route) && params.get(SearchParams.View) === HEADLAMP_VIEW) {
    return route + HEADLAMP_SEGMENT + toHeadlampSection(params.get(SearchParams.HeadlampPath) ?? '');
  }

  return route;
}

function toHeadlampSection(headlampPath: string): string {
  const segments = headlampPath
    .replace(HEADLAMP_PROXY_PREFIX, '')
    .split(/[?#]/)[0]
    .split('/')
    .filter(Boolean)
    .slice(0, HEADLAMP_SAFE_DEPTH);
  return segments.length > 0 ? `/${segments.join('/')}` : '';
}

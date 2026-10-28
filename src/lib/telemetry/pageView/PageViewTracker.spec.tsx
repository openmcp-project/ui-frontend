import { act, render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PageViewTracker } from './PageViewTracker';
import { Routes } from '../../../Routes';
import type { Telemetry } from '../types';

const MCP_V2 = '/projects/webapp-playground/workspaces/development/controlplane/playground-mcp-01';
const SETTLE_MS = 1500;

describe('PageViewTracker', () => {
  const pageView = vi.fn();
  const fakeTelemetry: Telemetry = {
    track: vi.fn(),
    pageView,
    report: vi.fn(),
    breadcrumb: vi.fn(),
    identify: vi.fn(),
  };
  const useFakeTelemetry = () => fakeTelemetry;

  const renderAt = (initialEntry: string) => {
    const router = createMemoryRouter(
      [
        {
          element: <PageViewTracker useTelemetry={useFakeTelemetry} />,
          children: [Routes.Projects, Routes.Project, Routes.McpV2].map((path) => ({ path, element: null })),
        },
        { path: '/mcp/*', element: null },
      ],
      { initialEntries: [initialEntry] },
    );
    render(<RouterProvider router={router} />);
    return (to: string) => act(() => router.navigate(to, { replace: true }));
  };

  const settle = () => act(() => vi.advanceTimersByTime(SETTLE_MS));

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    pageView.mockReset();
  });

  it('tracks the route pattern once the URL has settled', async () => {
    renderAt('/projects/webapp-playground');
    expect(pageView).not.toHaveBeenCalled();

    await settle();

    expect(pageView).toHaveBeenCalledExactlyOnceWith(Routes.Project);
  });

  it('skips interim URLs while entering Headlamp', async () => {
    const navigate = renderAt(MCP_V2);
    await navigate(`${MCP_V2}?view=open-source`);
    await navigate(`${MCP_V2}?view=open-source&headlampPath=%2Fcrossplane%2Foverview`);

    await settle();

    expect(pageView).toHaveBeenCalledExactlyOnceWith(`${Routes.McpV2}/headlamp/crossplane`);
  });

  it('does not track again when headlampPath changes within the same section', async () => {
    const navigate = renderAt(`${MCP_V2}?view=open-source&headlampPath=%2Fcrossplane%2Foverview`);
    await settle();

    await navigate(`${MCP_V2}?view=open-source&headlampPath=%2Fcrossplane%2Fcrds`);
    await settle();

    expect(pageView).toHaveBeenCalledOnce();
  });

  it('tracks the legacy page when leaving Headlamp despite a stale headlampPath', async () => {
    const navigate = renderAt(`${MCP_V2}?view=open-source&headlampPath=%2Fflux%2Foverview`);
    await settle();

    await navigate(`${MCP_V2}?headlampPath=%2Fflux%2Foverview`);
    await settle();

    expect(pageView.mock.calls).toEqual([[`${Routes.McpV2}/headlamp/flux`], [Routes.McpV2]]);
  });

  it('does not track redirect-only routes outside the layout', async () => {
    renderAt('/mcp/projects/webapp-playground');

    await settle();

    expect(pageView).not.toHaveBeenCalled();
  });
});

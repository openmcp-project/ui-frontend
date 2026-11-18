import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { SWRConfig } from 'swr';
import { afterEach, describe, expect, it, Mock, vi } from 'vitest';
import { ApiConfigProvider } from '../../../components/Shared/k8s';
import { APIError } from '../../../lib/api/error.ts';
import { fetchApiServerJson } from '../../../lib/api/fetch.ts';
import { ListClusterRoles } from '../../../lib/api/types/k8s/listClusterRoles.ts';
import { useClusterRoles } from './useClusterRoles.ts';

vi.mock('../../../lib/api/fetch.ts');

const MCP_CONFIG = {
  projectName: 'p',
  workspaceName: 'w',
  controlPlaneName: 'cp',
  isV2: true,
};

const makeWrapper =
  (mcpConfig: typeof MCP_CONFIG | undefined) =>
  ({ children }: { children: React.ReactNode }) => (
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <ApiConfigProvider apiConfig={{ mcpConfig }}>{children}</ApiConfigProvider>
    </SWRConfig>
  );

const roles = [
  { metadata: { name: 'cluster-admin' }, aggregated: false },
  { metadata: { name: 'crossplane-view' }, aggregated: false },
  { metadata: { name: 'view' }, aggregated: true },
  { metadata: { name: 'system:controller' }, aggregated: false },
];

describe('useClusterRoles', () => {
  afterEach(() => vi.clearAllMocks());

  it('does not fire a request when no control plane is targeted (mcpConfig undefined)', async () => {
    const fetchMock = fetchApiServerJson as unknown as Mock;
    const { result } = renderHook(() => useClusterRoles(), { wrapper: makeWrapper(undefined) });
    expect(result.current.state).toBe('unknown');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns ready with system: names excluded from selectable but present in all', async () => {
    const fetchMock = fetchApiServerJson as unknown as Mock;
    fetchMock.mockResolvedValue(roles);
    const { result } = renderHook(() => useClusterRoles(), { wrapper: makeWrapper(MCP_CONFIG) });

    await waitFor(() => expect(result.current.state).toBe('ready'));
    expect(result.current.all).toEqual(['cluster-admin', 'crossplane-view', 'view', 'system:controller']);
    expect(result.current.selectable).toEqual(['cluster-admin', 'crossplane-view', 'view']);
    expect(result.current.aggregated).toEqual(['view']);
    expect(fetchMock).toHaveBeenCalledWith(
      ListClusterRoles.path,
      expect.anything(),
      ListClusterRoles.jq,
      undefined,
      undefined,
    );
  });

  it('maps a 403 to error, checking nothing', async () => {
    const fetchMock = fetchApiServerJson as unknown as Mock;
    fetchMock.mockRejectedValue(new APIError('forbidden', 403));
    const { result } = renderHook(() => useClusterRoles(), { wrapper: makeWrapper(MCP_CONFIG) });

    await waitFor(() => expect(result.current.state).toBe('error'));
    expect(result.current.all).toEqual([]);
    expect(result.current.selectable).toEqual([]);
  });

  it('maps any other failure to error', async () => {
    const fetchMock = fetchApiServerJson as unknown as Mock;
    fetchMock.mockRejectedValue(new APIError('boom', 500));
    const { result } = renderHook(() => useClusterRoles(), { wrapper: makeWrapper(MCP_CONFIG) });

    await waitFor(() => expect(result.current.state).toBe('error'));
  });
});

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, Mock } from 'vitest';
import { SWRConfig } from 'swr';
import React from 'react';
import { useApiResource, useProvidersConfigResource } from './useApiResource.ts';
import { fetchApiServerJson } from './fetch.ts';
import { ApiConfigProvider } from '../../components/Shared/k8s';
import { CRDRequest, CRDRequestAuthCheck } from './types/crossplane/CRDList.ts';

vi.mock('./fetch.ts');

const PROVIDERCONFIGS_PATH = '/apis/aws.crossplane.io/v1beta1/providerconfigs';

const crdResponse = {
  items: [
    {
      metadata: {
        name: 'providerconfigs.aws.crossplane.io',
        creationTimestamp: '',
        ownerReferences: [{ kind: 'Provider', name: 'provider-aws' }],
      },
      status: { conditions: [] },
      spec: { names: { kind: 'ProviderConfig' }, versions: [{ name: 'v1beta1' }], group: 'aws.crossplane.io' },
    },
  ],
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
    <ApiConfigProvider apiConfig={{ mcpConfig: undefined }}>{children}</ApiConfigProvider>
  </SWRConfig>
);

describe('useProvidersConfigResource', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches each providerconfigs endpoint exactly once (no duplicate pre-fetch pass)', async () => {
    const fetchMock = fetchApiServerJson as unknown as Mock;
    fetchMock.mockImplementation(async (path: string) => {
      if (path === CRDRequest.path) {
        return crdResponse;
      }
      if (path === PROVIDERCONFIGS_PATH) {
        return {};
      }
      throw new Error(`unexpected path: ${path}`);
    });

    const { result } = renderHook(() => useProvidersConfigResource(), { wrapper });

    await waitFor(() => expect(result.current.data).toHaveLength(1));

    const providerConfigsCalls = fetchMock.mock.calls.filter((call) => call[0] === PROVIDERCONFIGS_PATH);
    expect(providerConfigsCalls).toHaveLength(1);
  });

  it('does not share a cache entry with a same-path request that uses a different jq', async () => {
    // CRDRequestAuthCheck hits the SAME path as CRDRequest but with a jq that
    // returns a shape without `items`. The two must stay on separate SWR keys,
    // otherwise the auth-check response leaks into useProvidersConfigResource
    // and `data.items` is undefined (crash in the Graph).
    const fetchMock = fetchApiServerJson as unknown as Mock;
    fetchMock.mockImplementation(async (path: string, _config: unknown, jq?: string) => {
      if (path === CRDRequest.path) {
        return jq === CRDRequestAuthCheck.jq ? { kind: 'CustomResourceDefinitionList' } : crdResponse;
      }
      if (path === PROVIDERCONFIGS_PATH) {
        return {};
      }
      throw new Error(`unexpected path: ${path}`);
    });

    const { result } = renderHook(
      () => ({
        auth: useApiResource(CRDRequestAuthCheck, { errorRetryCount: 0 }),
        providers: useProvidersConfigResource(),
      }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.providers.data).toHaveLength(1));
  });
});

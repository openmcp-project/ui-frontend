import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { SWRConfig, useSWRConfig } from 'swr';
import { ApiConfigContext } from '../../../components/Shared/k8s/index.ts';
import { APIError } from '../../../lib/api/error.ts';
import { fetchApiServerJson } from '../../../lib/api/fetch.ts';
import { useMcpAuthorizationCheckV2 } from './useMcpAuthorizationCheck.ts';

vi.mock('../../../lib/api/fetch.ts');
const fetchMock = vi.mocked(fetchApiServerJson);
const baseConfig = { projectName: 'p', workspaceName: 'w', controlPlaneName: 'cp', isV2: true };

function setup() {
  const cache = new Map();
  let idp = 'first';
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SWRConfig value={{ provider: () => cache }}>
      <ApiConfigContext.Provider value={{ mcpConfig: { ...baseConfig, idp } }}>{children}</ApiConfigContext.Provider>
    </SWRConfig>
  );
  return {
    wrapper,
    setIdp: (next: string) => {
      idp = next;
    },
  };
}

describe('v2 page authorization', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it.each([
    {},
    { status: {} },
    { status: { evaluationError: 'failed' } },
    { status: { allowed: false, evaluationError: 'failed' } },
  ])('keeps malformed/errored results unknown: %j', async (response) => {
    fetchMock.mockResolvedValue(response);
    const { result } = renderHook(useMcpAuthorizationCheckV2, setup());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.state).toBe('unknown');
    expect(result.current.isUnauthorized).toBe(false);
  });

  it.each([true, false])('a successful review is not a global deny even with allowed=%s', async (allowed) => {
    fetchMock.mockResolvedValue({ status: { allowed } });
    const { result } = renderHook(useMcpAuthorizationCheckV2, setup());
    await waitFor(() => expect(result.current.state).toBe('allowed'));
    expect(result.current.isUnauthorized).toBe(false);
    expect(fetchMock.mock.calls[0][0]).toContain('selfsubjectaccessreviews');
  });

  it.each([401, 500])('does not turn HTTP %s into a deny', async (status) => {
    fetchMock.mockRejectedValue(new APIError('failed', status));
    const { result } = renderHook(useMcpAuthorizationCheckV2, setup());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.state).toBe('unknown');
  });

  it('blocks only a 403 on the review request, then recovers on a successful recheck', async () => {
    fetchMock.mockRejectedValue(new APIError('forbidden', 403));
    const { result } = renderHook(() => ({ check: useMcpAuthorizationCheckV2(), ...useSWRConfig() }), setup());
    await waitFor(() => expect(result.current.check.state).toBe('denied'));
    fetchMock.mockResolvedValue({ status: { allowed: true } });
    await act(async () => {
      await result.current.mutate(['mcp-access-review', { ...baseConfig, idp: 'first' }]);
    });
    await waitFor(() => expect(result.current.check.state).toBe('allowed'));
  });

  it('does not carry the previous IdP deny into a new pending check', async () => {
    fetchMock.mockRejectedValueOnce(new APIError('forbidden', 403));
    fetchMock.mockImplementation(() => new Promise(() => {}));
    const context = setup();
    const { result, rerender } = renderHook(useMcpAuthorizationCheckV2, context);
    await waitFor(() => expect(result.current.state).toBe('denied'));
    context.setIdp('second');
    rerender();
    expect(result.current.state).toBe('unknown');
    expect(result.current.isUnauthorized).toBe(false);
  });
});

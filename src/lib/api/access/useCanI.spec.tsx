import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { useCanI, useMarkAccessDenied, canIKey, type AccessAttributes } from './useCanI.ts';
import { fetchApiServerJson } from '../fetch.ts';

vi.mock('../fetch.ts');

// A wrapper with an isolated SWR cache so entries never leak across tests.
function createWrapper() {
  return ({ children }: { children: ReactNode }) => (
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{children}</SWRConfig>
  );
}

const attrs: AccessAttributes = {
  verb: 'list',
  group: 'core.open-control-plane.io',
  resource: 'controlplanes',
  namespace: 'project-a--ws-b',
};

describe('useCanI', () => {
  let fetchMock: Mock;

  beforeEach(() => {
    fetchMock = vi.mocked(fetchApiServerJson);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('maps allowed: true to "allowed"', async () => {
    fetchMock.mockResolvedValue({ status: { allowed: true } });
    const { result } = renderHook(() => useCanI(attrs), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.state).toBe('allowed'));
  });

  it('maps allowed: false with no evaluationError to "denied"', async () => {
    fetchMock.mockResolvedValue({ status: { allowed: false } });
    const { result } = renderHook(() => useCanI(attrs), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.state).toBe('denied'));
  });

  it('maps an evaluationError to "unknown"', async () => {
    fetchMock.mockResolvedValue({ status: { allowed: false, evaluationError: 'something went wrong' } });
    const { result } = renderHook(() => useCanI(attrs), { wrapper: createWrapper() });
    // Wait for the request to settle, then assert it stays unknown.
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await waitFor(() => expect(result.current.isChecking).toBe(false));
    expect(result.current.state).toBe('unknown');
  });

  it('maps a network error to "unknown"', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    const { result } = renderHook(() => useCanI(attrs), { wrapper: createWrapper() });
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await waitFor(() => expect(result.current.isChecking).toBe(false));
    expect(result.current.state).toBe('unknown');
  });

  it('short-circuits to "allowed" on hint: "allowed" without a request', () => {
    const { result } = renderHook(() => useCanI(attrs, { hint: 'allowed' }), { wrapper: createWrapper() });
    expect(result.current.state).toBe('allowed');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('ignores a hint of "denied" and still asks the cluster', async () => {
    fetchMock.mockResolvedValue({ status: { allowed: true } });
    const { result } = renderHook(() => useCanI(attrs, { hint: 'denied' }), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.state).toBe('allowed'));
    expect(fetchMock).toHaveBeenCalled();
  });

  it('skips when attrs is null', () => {
    const { result } = renderHook(() => useCanI(null), { wrapper: createWrapper() });
    expect(result.current.state).toBe('unknown');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('skips when enabled is false', () => {
    const { result } = renderHook(() => useCanI(attrs, { enabled: false }), { wrapper: createWrapper() });
    expect(result.current.state).toBe('unknown');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not share a cache entry for different attributes', async () => {
    fetchMock.mockImplementation((_path, _config, _jq, _method, body: string) => {
      const parsed = JSON.parse(body);
      const resource = parsed.spec.resourceAttributes.resource;
      return Promise.resolve({ status: { allowed: resource === 'controlplanes' } });
    });

    const wrapper = createWrapper();
    const { result: a } = renderHook(() => useCanI(attrs), { wrapper });
    const { result: b } = renderHook(() => useCanI({ ...attrs, resource: 'workspaces', group: 'core.openmcp.cloud' }), {
      wrapper,
    });

    await waitFor(() => expect(a.current.state).toBe('allowed'));
    await waitFor(() => expect(b.current.state).toBe('denied'));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('markAccessDenied flips a cached entry to "denied"', async () => {
    fetchMock.mockResolvedValue({ status: { allowed: true } });
    const wrapper = createWrapper();

    const { result } = renderHook(
      () => {
        const access = useCanI(attrs);
        const markDenied = useMarkAccessDenied();
        return { access, markDenied };
      },
      { wrapper },
    );

    await waitFor(() => expect(result.current.access.state).toBe('allowed'));

    result.current.markDenied(canIKey(attrs, 'onboarding', undefined));

    await waitFor(() => expect(result.current.access.state).toBe('denied'));
  });
});

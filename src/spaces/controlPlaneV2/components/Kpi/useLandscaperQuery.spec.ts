import { NetworkStatus } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLandscaperQuery } from './useLandscaperQuery';

vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn(),
}));

const reportMock = vi.fn();
vi.mock('../../../../lib/telemetry/telemetry.ts', () => ({
  useTelemetry: () => ({ track: vi.fn(), report: reportMock, breadcrumb: vi.fn(), identify: vi.fn() }),
}));

const useQueryMock = vi.mocked(useQuery);

const baseQueryResult = {
  loading: false,
  networkStatus: NetworkStatus.ready,
  error: undefined,
  data: undefined,
} as ReturnType<typeof useQuery>;

function makeQueryResult(raw: unknown) {
  return {
    ...baseQueryResult,
    data: {
      landscaper_services_open_control_plane_io: {
        v1alpha2: {
          Landscaper: raw,
        },
      },
    },
  } as ReturnType<typeof useQuery>;
}

const validLandscaper = {
  metadata: { name: 'my-cp', namespace: 'project-foo--ws-bar' },
  spec: { version: '0.83.0' },
  status: { phase: 'Ready', conditions: [] },
};

describe('useLandscaperQuery', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    useQueryMock.mockReturnValue(baseQueryResult);
    reportMock.mockReset();
  });

  it('skips the query when name is undefined', () => {
    renderHook(() => useLandscaperQuery(undefined, 'project-foo--ws-bar'));

    expect(useQueryMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ skip: true }));
  });

  it('skips the query when namespace is undefined', () => {
    renderHook(() => useLandscaperQuery('my-cp', undefined));

    expect(useQueryMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ skip: true }));
  });

  it('runs the query with correct variables when both name and namespace are provided', () => {
    renderHook(() => useLandscaperQuery('my-cp', 'project-foo--ws-bar'));

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        variables: { name: 'my-cp', namespace: 'project-foo--ws-bar' },
        skip: false,
        notifyOnNetworkStatusChange: true,
      }),
    );
  });

  it('returns null landscaperData when query has no data', () => {
    const { result } = renderHook(() => useLandscaperQuery('my-cp', 'project-foo--ws-bar'));

    expect(result.current.landscaperData).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('returns isInstalled=true and version when Landscaper resource is present', () => {
    useQueryMock.mockReturnValue(makeQueryResult(validLandscaper));

    const { result } = renderHook(() => useLandscaperQuery('my-cp', 'project-foo--ws-bar'));

    expect(result.current.landscaperData?.isInstalled).toBe(true);
    expect(result.current.landscaperData?.version).toBe('0.83.0');
  });

  it('returns null landscaperData when Landscaper resource is absent (not installed)', () => {
    useQueryMock.mockReturnValue(makeQueryResult(null));

    const { result } = renderHook(() => useLandscaperQuery('my-cp', 'project-foo--ws-bar'));

    expect(result.current.landscaperData).toBeNull();
  });

  it('returns null version when spec.version is absent', () => {
    useQueryMock.mockReturnValue(makeQueryResult({ ...validLandscaper, spec: {} }));

    const { result } = renderHook(() => useLandscaperQuery('my-cp', 'project-foo--ws-bar'));

    expect(result.current.landscaperData?.version).toBeNull();
  });

  it('sets isLoading to true while loading', () => {
    useQueryMock.mockReturnValue({
      ...baseQueryResult,
      loading: true,
      networkStatus: NetworkStatus.loading,
    } as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useLandscaperQuery('my-cp', 'project-foo--ws-bar'));

    expect(result.current.isLoading).toBe(true);
  });

  it('forwards the Apollo error from the query result', () => {
    const apolloError = new Error('Network error');
    useQueryMock.mockReturnValue({
      ...baseQueryResult,
      error: apolloError,
    } as unknown as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useLandscaperQuery('my-cp', 'project-foo--ws-bar'));

    expect(result.current.error).toBe(apolloError);
    expect(result.current.landscaperData).toBeNull();
  });

  it('reports a schema mismatch to telemetry and returns null', () => {
    // metadata.name is required by LandscaperSchema — omitting metadata triggers a validation failure
    useQueryMock.mockReturnValue(makeQueryResult({ spec: { version: '0.5.0' } }));

    const { result } = renderHook(() => useLandscaperQuery('my-cp', 'project-foo--ws-bar'));

    expect(result.current.landscaperData).toBeNull();
    expect(reportMock).toHaveBeenCalledTimes(1);
  });
});

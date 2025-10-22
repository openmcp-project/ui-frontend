import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useKpiFlux } from './useKpiFlux';
import { useApiResource } from '../../../../lib/api/useApiResource';
import { assertIsProgress } from './Kpi';
import { APIError } from '../../../../lib/api/error';

vi.mock('../../../../lib/api/useApiResource', () => ({
  useApiResource: vi.fn(),
}));

describe('useKpiFlux', () => {
  const mockedUseApiResource = vi.mocked(useApiResource);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('counts managed items correctly', () => {
    const data = [
      {
        items: [
          {
            metadata: {
              labels: {
                'kustomize.toolkit.fluxcd.io/name': 'FLUX-A',
              },
            },
          },
          {
            metadata: {
              labels: {
                other: 'x',
              },
            },
          },
        ],
      },
      {
        items: [
          {
            // no labels
          },
          {
            metadata: {
              labels: {
                'kustomize.toolkit.fluxcd.io/name': 'FLUX-B',
              },
            },
          },
        ],
      },
      {
        // undefined item
      },
    ];

    mockedUseApiResource.mockReturnValue({
      data,
      error: undefined,
      isLoading: false,
      isValidating: false,
    });

    const { result } = renderHook(() => useKpiFlux());

    expect(result.current.kpiType).toBe('progress');
    assertIsProgress(result.current);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.progressValue).toBe((100 * 2) / 4);
  });

  it('handles empty data array', () => {
    mockedUseApiResource.mockReturnValue({
      isLoading: false,
      error: undefined,
      data: [],
      isValidating: false,
    });

    const { result } = renderHook(() => useKpiFlux());

    expect(result.current.kpiType).toBe('progress');
    assertIsProgress(result.current);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.progressValue).toBe(0);
  });

  it('handles when all items are managed', () => {
    const data = [
      {
        items: [
          { metadata: { labels: { 'kustomize.toolkit.fluxcd.io/name': 'app-a' } } },
          { metadata: { labels: { 'kustomize.toolkit.fluxcd.io/name': 'app-b' } } },
        ],
      },
    ];

    mockedUseApiResource.mockReturnValue({
      data,
      error: undefined,
      isLoading: false,
      isValidating: false,
    });

    const { result } = renderHook(() => useKpiFlux());

    expect(result.current.kpiType).toBe('progress');
    assertIsProgress(result.current);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.progressValue).toBe(100);
  });

  it('handles when no items are managed', () => {
    const data = [
      {
        items: [{ metadata: { labels: { a: 'x' } } }, { metadata: { labels: { b: 'y' } } }],
      },
    ];

    mockedUseApiResource.mockReturnValue({
      data,
      error: undefined,
      isLoading: false,
      isValidating: false,
    });

    const { result } = renderHook(() => useKpiFlux());

    expect(result.current.kpiType).toBe('progress');
    assertIsProgress(result.current);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.progressValue).toBe(0);
  });

  it('propagates loading state', () => {
    mockedUseApiResource.mockReturnValue({
      isLoading: true,
      error: undefined,
      data: undefined,
      isValidating: false,
    });

    const { result } = renderHook(() => useKpiFlux());

    expect(result.current.kpiType).toBe('progress');
    assertIsProgress(result.current);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeUndefined();
    expect(result.current.progressValue).toBe(0);
  });

  it('propagates error state', () => {
    const error = new APIError('fetch failed', 500);

    mockedUseApiResource.mockReturnValue({
      isLoading: false,
      error,
      data: undefined,
      isValidating: false,
    });

    const { result } = renderHook(() => useKpiFlux());

    expect(result.current.kpiType).toBe('progress');
    assertIsProgress(result.current);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(error);
    expect(result.current.progressValue).toBe(0);
  });
});

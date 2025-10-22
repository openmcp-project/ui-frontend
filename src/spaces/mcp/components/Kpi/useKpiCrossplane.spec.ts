import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useKpiCrossplane } from './useKpiCrossplane';
import { useApiResource } from '../../../../lib/api/useApiResource';
import { assertIsProgress } from './Kpi';
import { APIError } from '../../../../lib/api/error';

vi.mock('../../../../lib/api/useApiResource', () => ({
  useApiResource: vi.fn(),
}));

describe('useKpiCrossplane', () => {
  const mockedUseApiResource = vi.mocked(useApiResource);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('counts healthy items correctly', () => {
    const data = [
      {
        items: [
          {
            status: {
              conditions: [
                { type: 'Synced', status: 'True' },
                { type: 'Ready', status: 'True' },
              ],
            },
          },
          {
            status: {
              conditions: [
                { type: 'Synced', status: 'False' },
                { type: 'Ready', status: 'True' },
              ],
            },
          },
        ],
      },
      {
        items: [
          {
            status: {
              conditions: [
                { type: 'Synced', status: 'True' },
                { type: 'Ready', status: 'False' },
              ],
            },
          },
          {
            status: {
              conditions: [
                { type: 'Synced', status: 'True' },
                { type: 'Ready', status: 'True' },
              ],
            },
          },
          {
            status: {
              conditions: [
                { type: 'Synced', status: 'False' },
                { type: 'Ready', status: 'False' },
              ],
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

    const { result } = renderHook(() => useKpiCrossplane());

    expect(result.current.kpiType).toBe('progress');
    assertIsProgress(result.current);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.progressValue).toBe((100 * 2) / 5);
  });

  it('handles empty data array', () => {
    mockedUseApiResource.mockReturnValue({
      isLoading: false,
      error: undefined,
      data: [],
      isValidating: false,
    });

    const { result } = renderHook(() => useKpiCrossplane());

    expect(result.current.kpiType).toBe('progress');
    assertIsProgress(result.current);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.progressValue).toBe(0);
  });

  it('handles when all items are healthy', () => {
    const data = [
      {
        items: [
          {
            status: {
              conditions: [
                { type: 'Synced', status: 'True' },
                { type: 'Ready', status: 'True' },
              ],
            },
          },
          {
            status: {
              conditions: [
                { type: 'Synced', status: 'True' },
                { type: 'Ready', status: 'True' },
              ],
            },
          },
        ],
      },
    ];

    mockedUseApiResource.mockReturnValue({
      data,
      error: undefined,
      isLoading: false,
      isValidating: false,
    });

    const { result } = renderHook(() => useKpiCrossplane());

    expect(result.current.kpiType).toBe('progress');
    assertIsProgress(result.current);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.progressValue).toBe(100);
  });

  it('handles when no items are healthy', () => {
    const data = [
      {
        items: [
          // Ready true, Synced false
          {
            status: {
              conditions: [
                { type: 'Ready', status: 'True' },
                { type: 'Synced', status: 'False' },
              ],
            },
          },
          // Ready false, Synced true
          {
            status: {
              conditions: [
                { type: 'Ready', status: 'False' },
                { type: 'Synced', status: 'True' },
              ],
            },
          },
          // Only Ready true present
          { status: { conditions: [{ type: 'Ready', status: 'True' }] } },
          // Only Synced true present
          { status: { conditions: [{ type: 'Synced', status: 'True' }] } },
          // No conditions
          { status: {} },
          // Conditions other types
          { status: { conditions: [{ type: 'SomethingElse', status: 'True' }] } },
        ],
      },
    ];

    mockedUseApiResource.mockReturnValue({
      data,
      error: undefined,
      isLoading: false,
      isValidating: false,
    });

    const { result } = renderHook(() => useKpiCrossplane());

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

    const { result } = renderHook(() => useKpiCrossplane());

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

    const { result } = renderHook(() => useKpiCrossplane());

    expect(result.current.kpiType).toBe('progress');
    assertIsProgress(result.current);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(error);
    expect(result.current.progressValue).toBe(0);
  });
});

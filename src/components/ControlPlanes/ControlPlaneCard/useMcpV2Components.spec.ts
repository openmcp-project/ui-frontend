import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCrossplaneQuery } from '../../../spaces/controlPlaneV2/components/Kpi/useCrossplaneQuery';
import { useFluxQuery } from '../../../spaces/controlPlaneV2/components/Kpi/useFluxQuery';
import { useLandscaperQuery } from '../../../spaces/controlPlaneV2/components/Kpi/useLandscaperQuery';
import { useEsoQuery } from '../../../spaces/controlPlaneV2/components/Kpi/useEsoQuery';
import { useMcpV2Components } from './useMcpV2Components';

// Vitest hoists vi.mock() calls above imports automatically
vi.mock('../../../spaces/controlPlaneV2/components/Kpi/useCrossplaneQuery', () => ({
  useCrossplaneQuery: vi.fn(),
}));
vi.mock('../../../spaces/controlPlaneV2/components/Kpi/useFluxQuery', () => ({
  useFluxQuery: vi.fn(),
}));
vi.mock('../../../spaces/controlPlaneV2/components/Kpi/useLandscaperQuery', () => ({
  useLandscaperQuery: vi.fn(),
}));
vi.mock('../../../spaces/controlPlaneV2/components/Kpi/useEsoQuery', () => ({
  useEsoQuery: vi.fn(),
}));

const setIdle = () => {
  vi.mocked(useCrossplaneQuery).mockReturnValue({ crossplaneData: null, isLoading: false, error: undefined });
  vi.mocked(useFluxQuery).mockReturnValue({ fluxData: null, isLoading: false, error: undefined });
  vi.mocked(useLandscaperQuery).mockReturnValue({ landscaperData: null, isLoading: false, error: undefined });
  vi.mocked(useEsoQuery).mockReturnValue({ esoData: null, isLoading: false, error: undefined });
};

describe('useMcpV2Components', () => {
  it('returns null components + isLoading=true while any query is loading', async () => {
    vi.mocked(useCrossplaneQuery).mockReturnValue({ crossplaneData: null, isLoading: true, error: undefined });
    vi.mocked(useFluxQuery).mockReturnValue({ fluxData: null, isLoading: false, error: undefined });
    vi.mocked(useLandscaperQuery).mockReturnValue({ landscaperData: null, isLoading: false, error: undefined });
    vi.mocked(useEsoQuery).mockReturnValue({ esoData: null, isLoading: false, error: undefined });

    const { result } = renderHook(() => useMcpV2Components('cp', 'ns'));
    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
      expect(result.current.components).toBeNull();
    });
  });

  it('returns empty components when nothing is installed', async () => {
    setIdle();
    const { result } = renderHook(() => useMcpV2Components('cp', 'ns'));
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.components).toEqual({});
    });
  });

  it('populates crossplane + flux when installed', async () => {
    vi.mocked(useCrossplaneQuery).mockReturnValue({
      crossplaneData: { isInstalled: true, version: '1.14.0', providers: [] },
      isLoading: false,
      error: undefined,
    });
    vi.mocked(useFluxQuery).mockReturnValue({
      fluxData: { isInstalled: true, version: '2.3.0' },
      isLoading: false,
      error: undefined,
    });
    vi.mocked(useLandscaperQuery).mockReturnValue({ landscaperData: null, isLoading: false, error: undefined });
    vi.mocked(useEsoQuery).mockReturnValue({ esoData: null, isLoading: false, error: undefined });

    const { result } = renderHook(() => useMcpV2Components('cp', 'ns'));
    await waitFor(() => {
      expect(result.current.components?.crossplane?.version).toBe('1.14.0');
      expect(result.current.components?.flux?.version).toBe('2.3.0');
      expect(result.current.components?.landscaper).toBeUndefined();
      expect(result.current.components?.externalSecretsOperator).toBeUndefined();
    });
  });

  it('passes empty strings to queries when skip=true', () => {
    setIdle();
    renderHook(() => useMcpV2Components('cp', 'ns', true));
    expect(vi.mocked(useCrossplaneQuery)).toHaveBeenCalledWith('', '');
    expect(vi.mocked(useFluxQuery)).toHaveBeenCalledWith('', '');
  });
});

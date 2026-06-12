import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useQuery } from '@apollo/client/react';
import { useProjectMembers } from './useProjectMembers';
import { DISPLAY_NAME_ANNOTATION } from '../../../lib/api/types/shared/keyNames';

vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn(),
}));

const useQueryMock = vi.mocked(useQuery);

function makeQueryResult(overrides: object = {}) {
  return { data: undefined, loading: false, error: undefined, ...overrides } as ReturnType<typeof useQuery>;
}

describe('useProjectMembers', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    useQueryMock.mockReturnValue(makeQueryResult());
  });

  it('returns displayName from annotation when present', async () => {
    useQueryMock.mockReturnValue(
      makeQueryResult({
        data: {
          core_openmcp_cloud: {
            v1alpha1: {
              Project: {
                metadata: { annotations: { [DISPLAY_NAME_ANNOTATION]: 'My Project' } },
              },
            },
          },
        },
      }),
    );

    const { result } = renderHook(() => useProjectMembers('my-project'));

    await waitFor(() => {
      expect(result.current.displayName).toBe('My Project');
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('returns undefined displayName when annotation is absent', async () => {
    useQueryMock.mockReturnValue(
      makeQueryResult({
        data: {
          core_openmcp_cloud: {
            v1alpha1: {
              Project: { metadata: { annotations: {} } },
            },
          },
        },
      }),
    );

    const { result } = renderHook(() => useProjectMembers('my-project'));

    await waitFor(() => {
      expect(result.current.displayName).toBeUndefined();
    });
  });

  it('returns undefined displayName when annotation is empty string', async () => {
    useQueryMock.mockReturnValue(
      makeQueryResult({
        data: {
          core_openmcp_cloud: {
            v1alpha1: {
              Project: {
                metadata: { annotations: { [DISPLAY_NAME_ANNOTATION]: '' } },
              },
            },
          },
        },
      }),
    );

    const { result } = renderHook(() => useProjectMembers('my-project'));

    await waitFor(() => {
      expect(result.current.displayName).toBeUndefined();
    });
  });

  it('returns isLoading true while query is in flight', () => {
    useQueryMock.mockReturnValue(makeQueryResult({ loading: true }));

    const { result } = renderHook(() => useProjectMembers('my-project'));
    expect(result.current.isLoading).toBe(true);
  });
});

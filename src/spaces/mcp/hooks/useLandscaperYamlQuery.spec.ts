import { useQuery } from '@apollo/client/react';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useLandscaperYamlQuery } from './useLandscaperYamlQuery';

vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn(),
}));

const useQueryMock = vi.mocked(useQuery);

const baseQueryResult = {
  loading: false,
  error: undefined,
  data: undefined,
} as ReturnType<typeof useQuery>;

describe('useLandscaperYamlQuery', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    useQueryMock.mockReturnValue(baseQueryResult);
  });

  it('skips the query when name/namespace is missing (forwarded to useYamlQuery)', () => {
    renderHook(() => useLandscaperYamlQuery('', 'project-foo--ws-bar'));

    expect(useQueryMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ skip: true }));
  });

  it('extracts LandscaperYaml from its own response shape', () => {
    useQueryMock.mockReturnValue({
      ...baseQueryResult,
      data: {
        landscaper_services_open_control_plane_io: {
          v1alpha2: { LandscaperYaml: 'apiVersion: v1\nkind: Landscaper\n' },
        },
      },
    } as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useLandscaperYamlQuery('my-cp', 'project-foo--ws-bar'));

    expect(result.current.yaml).toBe('apiVersion: v1\nkind: Landscaper\n');
  });
});

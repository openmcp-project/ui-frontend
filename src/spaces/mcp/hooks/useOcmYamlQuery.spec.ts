import { useQuery } from '@apollo/client/react';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useOcmYamlQuery } from './useOcmYamlQuery';

vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn(),
}));

const useQueryMock = vi.mocked(useQuery);

const baseQueryResult = {
  loading: false,
  error: undefined,
  data: undefined,
} as ReturnType<typeof useQuery>;

describe('useOcmYamlQuery', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    useQueryMock.mockReturnValue(baseQueryResult);
  });

  it('skips the query when name/namespace is missing (forwarded to useYamlQuery)', () => {
    renderHook(() => useOcmYamlQuery('', 'project-foo--ws-bar'));

    expect(useQueryMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ skip: true }));
  });

  it('extracts OCMYaml from its own response shape', () => {
    useQueryMock.mockReturnValue({
      ...baseQueryResult,
      data: {
        ocm_services_open_control_plane_io: {
          v1alpha1: { OCMYaml: 'apiVersion: v1\nkind: OCM\n' },
        },
      },
    } as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useOcmYamlQuery('my-cp', 'project-foo--ws-bar'));

    expect(result.current.yaml).toBe('apiVersion: v1\nkind: OCM\n');
  });
});

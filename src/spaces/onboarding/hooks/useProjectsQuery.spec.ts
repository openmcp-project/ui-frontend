import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, type Mock } from 'vitest';
import { useMutation } from '@apollo/client/react';
import { useProjectsQuery } from './useProjectsQuery';

vi.mock('@apollo/client/react', () => ({
  useMutation: vi.fn(),
}));

const useMutationMock = vi.mocked(useMutation);

describe('useProjectsQuery', () => {
  let mutateMock: Mock;

  beforeEach(() => {
    mutateMock = vi.fn();
    useMutationMock.mockReset();
    useMutationMock.mockReturnValue([
      mutateMock,
      {
        loading: false,
        error: null,
      },
    ] as unknown as ReturnType<typeof useMutation>);
  });

  it('executes mutation on mount with required payload', async () => {
    mutateMock.mockResolvedValue({ data: {} });

    renderHook(() => useProjectsQuery());

    await waitFor(() => expect(mutateMock).toHaveBeenCalledTimes(1));
    expect(mutateMock).toHaveBeenCalledWith({
      variables: {
        object: {
          apiVersion: 'authorization.k8s.io/v1',
          kind: 'SelfSubjectRulesReview',
          metadata: {
            name: 'projects-access-check',
          },
          spec: {
            namespace: '*',
          },
        },
      },
    });
  });

  it('maps project names from resourceRules and deduplicates values', async () => {
    mutateMock.mockResolvedValue({
      data: {
        authorization_k8s_io: {
          v1: {
            createSelfSubjectRulesReview: {
              status: {
                resourceRules: [
                  {
                    apiGroups: ['core.openmcp.cloud'],
                    resources: ['projects'],
                    verbs: ['get'],
                    resourceNames: ['project-a', 'project-b'],
                  },
                  {
                    apiGroups: ['*'],
                    resources: ['projects'],
                    verbs: ['*'],
                    resourceNames: ['project-b', 'project-c'],
                  },
                  {
                    apiGroups: ['core.openmcp.cloud'],
                    resources: ['workspaces'],
                    verbs: ['get'],
                    resourceNames: ['should-be-ignored'],
                  },
                ],
              },
            },
          },
        },
      },
    });

    const { result } = renderHook(() => useProjectsQuery());

    await waitFor(() => {
      expect(result.current.data).toEqual(['project-a', 'project-b', 'project-c']);
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('refetch triggers mutation again', async () => {
    mutateMock.mockResolvedValue({ data: {} });

    const { result } = renderHook(() => useProjectsQuery());

    await waitFor(() => expect(mutateMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.refetch();
    });

    expect(mutateMock).toHaveBeenCalledTimes(2);
  });

  it('handles mutation errors and exposes local error state', async () => {
    mutateMock.mockRejectedValue(new Error('Failed to fetch projects from API'));

    const { result } = renderHook(() => useProjectsQuery());

    await waitFor(() => {
      expect(result.current.error?.message).toBe('Failed to fetch projects from API');
    });

    await act(async () => {
      await expect(result.current.refetch()).resolves.toEqual([]);
    });

    expect(result.current.error?.message).toBe('Failed to fetch projects from API');
  });
});

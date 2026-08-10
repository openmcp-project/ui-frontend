import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useQuery } from '@apollo/client/react';
import { useProjectMembers } from './useProjectMembers';
import {
  CHARGING_TARGET_LABEL,
  CHARGING_TARGET_TYPE_LABEL,
  CREATED_BY_ANNOTATION,
  DISPLAY_NAME_ANNOTATION,
} from '../../../lib/api/types/shared/keyNames';

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

  it('returns createdBy from the core.openmcp.cloud/created-by annotation', async () => {
    useQueryMock.mockReturnValue(
      makeQueryResult({
        data: {
          core_openmcp_cloud: {
            v1alpha1: {
              Project: {
                metadata: { annotations: { [CREATED_BY_ANNOTATION]: 'jane.doe@example.com' } },
              },
            },
          },
        },
      }),
    );

    const { result } = renderHook(() => useProjectMembers('my-project'));

    await waitFor(() => {
      expect(result.current.createdBy).toBe('jane.doe@example.com');
    });
  });

  it('returns undefined createdBy when annotation is absent', async () => {
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
      expect(result.current.createdBy).toBeUndefined();
    });
  });

  it('returns chargingTarget from the openmcp.cloud.sap/charging-target label', async () => {
    useQueryMock.mockReturnValue(
      makeQueryResult({
        data: {
          core_openmcp_cloud: {
            v1alpha1: {
              Project: {
                metadata: {
                  annotations: {},
                  labels: { [CHARGING_TARGET_LABEL]: 'CC-12345' },
                },
              },
            },
          },
        },
      }),
    );

    const { result } = renderHook(() => useProjectMembers('my-project'));

    await waitFor(() => {
      expect(result.current.chargingTarget).toBe('CC-12345');
    });
  });

  it('returns undefined chargingTarget when label is absent', async () => {
    useQueryMock.mockReturnValue(
      makeQueryResult({
        data: {
          core_openmcp_cloud: {
            v1alpha1: {
              Project: { metadata: { annotations: {}, labels: {} } },
            },
          },
        },
      }),
    );

    const { result } = renderHook(() => useProjectMembers('my-project'));

    await waitFor(() => {
      expect(result.current.chargingTarget).toBeUndefined();
    });
  });

  it('returns chargingTargetType from the openmcp.cloud.sap/charging-target-type label', async () => {
    useQueryMock.mockReturnValue(
      makeQueryResult({
        data: {
          core_openmcp_cloud: {
            v1alpha1: {
              Project: {
                metadata: {
                  annotations: {},
                  labels: { [CHARGING_TARGET_TYPE_LABEL]: 'cost-center' },
                },
              },
            },
          },
        },
      }),
    );

    const { result } = renderHook(() => useProjectMembers('my-project'));

    await waitFor(() => {
      expect(result.current.chargingTargetType).toBe('cost-center');
    });
  });

  it('returns undefined chargingTargetType when label is absent', async () => {
    useQueryMock.mockReturnValue(
      makeQueryResult({
        data: {
          core_openmcp_cloud: {
            v1alpha1: {
              Project: { metadata: { annotations: {}, labels: {} } },
            },
          },
        },
      }),
    );

    const { result } = renderHook(() => useProjectMembers('my-project'));

    await waitFor(() => {
      expect(result.current.chargingTargetType).toBeUndefined();
    });
  });

  it('returns undefined for createdBy, chargingTarget, and chargingTargetType when metadata has no annotations or labels', async () => {
    useQueryMock.mockReturnValue(
      makeQueryResult({
        data: {
          core_openmcp_cloud: {
            v1alpha1: {
              Project: { metadata: {} },
            },
          },
        },
      }),
    );

    const { result } = renderHook(() => useProjectMembers('my-project'));

    await waitFor(() => {
      expect(result.current.createdBy).toBeUndefined();
      expect(result.current.chargingTarget).toBeUndefined();
      expect(result.current.chargingTargetType).toBeUndefined();
    });
  });
});

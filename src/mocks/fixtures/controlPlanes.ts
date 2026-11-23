import type { GetMcPsListQuery, GetMcPsNamesQuery, GetMcPv2Query } from '../../types/__generated__/graphql/graphql';

function v2Cp(uid: string, name: string, namespace: string, phase = 'Ready') {
  return {
    metadata: {
      uid,
      name,
      namespace,
      creationTimestamp: '2026-01-01T00:00:00Z',
      annotations: {},
      deletionTimestamp: null,
    },
    status: {
      phase,
      conditions: [{ type: 'Ready', status: phase === 'Ready' ? 'True' : 'False' }],
      access: null,
    },
    spec: {
      iam: {
        oidc: {
          defaultProvider: { roleBindings: [] },
          extraProviders: [],
        },
      },
    },
  };
}

/**
 * Returns the V2 control-plane list for a given workspace namespace.
 *
 * - `demo`    workspace: `my-cp` (Ready) + `dev-cp` (Ready)
 * - `staging` workspace: `staging-cp` (Ready) + `ci-cp` (Provisioning)
 * - any other: `my-cp` (Ready)
 */
export function createMcpsList(workspaceNamespace: string): GetMcPsListQuery {
  const isStaging = workspaceNamespace.endsWith('--ws-staging');

  const items = isStaging
    ? [
        v2Cp(`${workspaceNamespace}-staging-cp-uid`, 'staging-cp', workspaceNamespace),
        v2Cp(`${workspaceNamespace}-ci-cp-uid`, 'ci-cp', workspaceNamespace, 'Provisioning'),
      ]
    : [
        v2Cp(`${workspaceNamespace}-my-cp-uid`, 'my-cp', workspaceNamespace),
        v2Cp(`${workspaceNamespace}-dev-cp-uid`, 'dev-cp', workspaceNamespace),
      ];

  return {
    core_openmcp_cloud: { v1alpha1: { ManagedControlPlanes: { items: [] } } },
    core_open_control_plane_io: { v2alpha1: { ControlPlanes: { items } } },
  };
}

/** Minimal name-only variant used for search filtering on collapsed workspaces. */
export function createMcpsNames(workspaceNamespace: string): GetMcPsNamesQuery {
  const isStaging = workspaceNamespace.endsWith('--ws-staging');

  const items = isStaging
    ? [
        { metadata: { name: 'staging-cp', namespace: workspaceNamespace, annotations: {} } },
        { metadata: { name: 'ci-cp', namespace: workspaceNamespace, annotations: {} } },
      ]
    : [
        { metadata: { name: 'my-cp', namespace: workspaceNamespace, annotations: {} } },
        { metadata: { name: 'dev-cp', namespace: workspaceNamespace, annotations: {} } },
      ];

  return {
    core_openmcp_cloud: { v1alpha1: { ManagedControlPlanes: { items: [] } } },
    core_open_control_plane_io: { v2alpha1: { ControlPlanes: { items } } },
  };
}

/** Detail payload for the V2 control-plane page (`GetMCPv2`). */
export const mcpV2Detail: GetMcPv2Query = {
  core_open_control_plane_io: {
    v2alpha1: {
      ControlPlane: {
        kind: 'ControlPlane',
        metadata: {
          uid: 'cp-my-cp-uid',
          name: 'my-cp',
          namespace: 'project-foo--ws-demo',
          annotations: {},
          creationTimestamp: '2026-01-01T00:00:00Z',
          deletionTimestamp: null,
        },
        spec: {
          iam: {
            oidc: {
              defaultProvider: { roleBindings: [] },
              extraProviders: [],
            },
            tokens: [],
          },
        },
        status: {
          phase: 'Ready',
          access: null,
          observedGeneration: 1,
          conditions: [
            {
              type: 'Ready',
              status: 'True',
              reason: 'AllReady',
              message: 'Control plane ready',
              lastTransitionTime: '2026-01-01T00:00:00Z',
            },
          ],
        },
      },
    },
  },
};

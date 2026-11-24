import type {
  ControlPlaneYamlQuery,
  CreateManagedControlPlaneMutation,
  CreateManagedControlPlaneV2Mutation,
  DeleteManagedControlPlaneMutation,
  DeleteManagedControlPlaneV2Mutation,
  GetKubeconfigQuery,
  GetManagedControlPlaneForEditQuery,
  GetMcPsListQuery,
  GetMcPsNamesQuery,
  GetMcPv2Query,
  McpYamlQuery,
  UpdateManagedControlPlaneMutation,
  UpdateManagedControlPlaneV2Mutation,
} from '../../types/__generated__/graphql/graphql';

function v2Cp(uid: string, name: string, namespace: string, phase = 'Ready') {
  return {
    __typename: 'CoreOpenControlPlaneIoV2alpha1ControlPlane',
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

  // __typename required so Apollo's type policies activate and prevent shallow-merge
  // from clobbering sibling queries (GetWorkspaces, GetProjectMembers) in the shared
  // core_openmcp_cloud.v1alpha1 cache slot.
  return {
    core_openmcp_cloud: {
      __typename: 'CoreOpenmcpCloudQuery',
      v1alpha1: { __typename: 'CoreOpenmcpCloudV1alpha1Query', ManagedControlPlanes: { items: [] } },
    },
    core_open_control_plane_io: {
      __typename: 'CoreOpenControlPlaneIoQuery',
      v2alpha1: { __typename: 'CoreOpenControlPlaneIoV2alpha1Query', ControlPlanes: { items } },
    },
  } as unknown as GetMcPsListQuery;
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
    core_openmcp_cloud: {
      __typename: 'CoreOpenmcpCloudQuery',
      v1alpha1: { __typename: 'CoreOpenmcpCloudV1alpha1Query', ManagedControlPlanes: { items: [] } },
    },
    core_open_control_plane_io: {
      __typename: 'CoreOpenControlPlaneIoQuery',
      v2alpha1: { __typename: 'CoreOpenControlPlaneIoV2alpha1Query', ControlPlanes: { items } },
    },
  } as unknown as GetMcPsNamesQuery;
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

export function createManagedControlPlaneResult(
  name: string,
  namespace: string,
): CreateManagedControlPlaneMutation {
  return {
    core_openmcp_cloud: {
      v1alpha1: {
        createManagedControlPlane: { metadata: { uid: `cp-${name}-uid`, name, namespace } },
      },
    },
  };
}

export function updateManagedControlPlaneResult(
  name: string,
  namespace: string,
): UpdateManagedControlPlaneMutation {
  return {
    core_openmcp_cloud: {
      v1alpha1: {
        updateManagedControlPlane: { metadata: { uid: `cp-${name}-uid`, name, namespace } },
      },
    },
  };
}

export const deleteManagedControlPlaneResult: DeleteManagedControlPlaneMutation = {
  core_openmcp_cloud: { v1alpha1: { deleteManagedControlPlane: true } },
};

export function getManagedControlPlaneForEdit(
  name: string,
  namespace: string,
): GetManagedControlPlaneForEditQuery {
  return {
    core_openmcp_cloud: {
      __typename: 'CoreOpenmcpCloudQuery',
      v1alpha1: {
        __typename: 'CoreOpenmcpCloudV1alpha1Query',
        ManagedControlPlane: {
          metadata: { uid: `cp-${name}-uid`, name, namespace, labels: {}, annotations: {} },
          spec: {
            authorization: { roleBindings: [] },
            components: {
              apiServer: { type: 'GardenerShootApiServer' },
              crossplane: { version: '1.17.0', providers: [] },
              flux: { version: '2.3.0' },
              externalSecretsOperator: null,
              btpServiceOperator: null,
              kyverno: null,
              landscaper: null,
            },
          },
        },
      },
    },
  } as unknown as GetManagedControlPlaneForEditQuery;
}

export function mcpYaml(name: string, namespace: string): McpYamlQuery {
  const yaml = [
    'apiVersion: core.openmcp.cloud/v1alpha1',
    'kind: ManagedControlPlane',
    'metadata:',
    `  name: ${name}`,
    `  namespace: ${namespace}`,
    'spec:',
    '  components:',
    '    crossplane:',
    '      version: 1.17.0',
  ].join('\n');
  return {
    core_openmcp_cloud: { v1alpha1: { ManagedControlPlaneYaml: yaml } },
  };
}

export function controlPlaneYaml(name: string, namespace: string): ControlPlaneYamlQuery {
  const yaml = [
    'apiVersion: core.open-control-plane.io/v2alpha1',
    'kind: ControlPlane',
    'metadata:',
    `  name: ${name}`,
    `  namespace: ${namespace}`,
    'spec: {}',
  ].join('\n');
  return {
    core_open_control_plane_io: { v2alpha1: { ControlPlaneYaml: yaml } },
  };
}

export const kubeconfigData: GetKubeconfigQuery = {
  v1: {
    Secret: {
      data: {
        value: btoa(
          [
            'apiVersion: v1',
            'kind: Config',
            'clusters: []',
            'contexts: []',
            'users: []',
            'current-context: ""',
          ].join('\n'),
        ),
      },
    },
  },
};

export function createControlPlaneV2Result(
  name: string,
  namespace: string,
): CreateManagedControlPlaneV2Mutation {
  return {
    core_open_control_plane_io: {
      v2alpha1: {
        createControlPlane: {
          metadata: { uid: `cp-${name}-uid`, name, namespace },
          status: { phase: 'Provisioning' },
        },
      },
    },
  };
}

export function updateControlPlaneV2Result(
  name: string,
  namespace: string,
): UpdateManagedControlPlaneV2Mutation {
  return {
    core_open_control_plane_io: {
      v2alpha1: {
        updateControlPlane: {
          metadata: { uid: `cp-${name}-uid`, name, namespace },
          status: { phase: 'Ready' },
        },
      },
    },
  };
}

export const deleteControlPlaneV2Result: DeleteManagedControlPlaneV2Mutation = {
  core_open_control_plane_io: { v2alpha1: { deleteControlPlane: true } },
};

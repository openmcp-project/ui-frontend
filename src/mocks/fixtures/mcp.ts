import type {
  CreateCrossplaneMutation,
  CreateExternalSecretsOperatorMutation,
  CreateFluxMutation,
  CreateKroMutation,
  CreateLandscaperMutation,
  CreateManagedControlPlaneV2Mutation,
  CreateMetricsOperatorMutation,
  CreateOcmMutation,
  DeleteCrossplaneMutation,
  DeleteExternalSecretsOperatorMutation,
  DeleteFluxMutation,
  DeleteKroMutation,
  DeleteLandscaperMutation,
  DeleteManagedControlPlaneMutation,
  DeleteManagedControlPlaneV2Mutation,
  DeleteMetricsOperatorMutation,
  DeleteOcmMutation,
  GetCrossplaneYamlQuery,
  GetEsoYamlQuery,
  GetFluxYamlQuery,
  GetKroYamlQuery,
  GetKubeconfigQuery,
  GetLandscaperYamlQuery,
  GetManagedControlPlaneForEditQuery,
  GetManagedControlPlaneQuery,
  GetManagedServicesQuery,
  GetMetricsOperatorYamlQuery,
  GetOcmYamlQuery,
  UpdateCrossplaneMutation,
  UpdateExternalSecretsOperatorMutation,
  UpdateFluxMutation,
  UpdateKroMutation,
  UpdateLandscaperMutation,
  UpdateManagedControlPlaneV2Mutation,
  UpdateMetricsOperatorMutation,
  UpdateOcmMutation,
} from '../../types/__generated__/graphql/graphql';

export function getManagedControlPlane(name: string, namespace: string): GetManagedControlPlaneQuery {
  return {
    core_openmcp_cloud: {
      __typename: 'CoreOpenmcpCloudQuery',
      v1alpha1: {
        __typename: 'CoreOpenmcpCloudV1alpha1Query',
        ManagedControlPlane: {
          metadata: {
            uid: `cp-${name}-uid`,
            name,
            namespace,
            creationTimestamp: '2026-01-01T00:00:00Z',
            annotations: {},
          },
          spec: {
            components: {
              crossplane: null,
              flux: null,
              landscaper: null,
              kyverno: null,
              externalSecretsOperator: null,
              btpServiceOperator: null,
            },
            authorization: { roleBindings: [] },
          },
          status: {
            status: 'Ready',
            conditions: [
              {
                type: 'Ready',
                status: 'True',
                reason: 'AllReady',
                message: 'Control plane ready',
                lastTransitionTime: '2026-01-01T00:00:00Z',
              },
            ],
            components: { authentication: { access: null } },
          },
        },
      },
    },
  } as unknown as GetManagedControlPlaneQuery;
}

export function getManagedControlPlaneForEdit(name: string, namespace: string): GetManagedControlPlaneForEditQuery {
  return {
    core_openmcp_cloud: {
      __typename: 'CoreOpenmcpCloudQuery',
      v1alpha1: {
        __typename: 'CoreOpenmcpCloudV1alpha1Query',
        ManagedControlPlane: {
          metadata: {
            uid: `cp-${name}-uid`,
            name,
            namespace,
            labels: {},
            annotations: {},
          },
          spec: {
            authorization: { roleBindings: [] },
            components: {
              apiServer: null,
              crossplane: null,
              flux: null,
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

export const managedServices: GetManagedServicesQuery = {
  open_control_plane_io: {
    v1: {
      ManagedService: {
        apiVersion: 'open-control-plane.io/v1',
        kind: 'ManagedService',
        metadata: { name: 'catalog', namespace: null },
        spec: {
          services: [
            {
              name: 'crossplane',
              kind: 'Crossplane',
              apiVersion: 'crossplane-services.open-control-plane.io/v1alpha1',
              versions: [{ version: '1.17.0' }, { version: '1.16.0' }],
            },
            {
              name: 'flux',
              kind: 'Flux',
              apiVersion: 'flux-services.open-control-plane.io/v1alpha1',
              versions: [{ version: '2.3.0' }, { version: '2.2.0' }],
            },
            {
              name: 'landscaper',
              kind: 'Landscaper',
              apiVersion: 'landscaper-services.open-control-plane.io/v1alpha2',
              versions: [{ version: '0.21.0' }],
            },
            {
              name: 'external-secrets-operator',
              kind: 'ExternalSecretsOperator',
              apiVersion: 'external-secrets-services.open-control-plane.io/v1alpha1',
              versions: [{ version: '0.9.0' }],
            },
            {
              name: 'ocm',
              kind: 'OCM',
              apiVersion: 'ocm-services.open-control-plane.io/v1alpha1',
              versions: [{ version: '1.0.0' }],
            },
            {
              name: 'kro',
              kind: 'Kro',
              apiVersion: 'kro-services.open-control-plane.io/v1alpha1',
              versions: [{ version: '0.2.0' }],
            },
            {
              name: 'metrics-operator',
              kind: 'MetricsOperator',
              apiVersion: 'metrics-services.open-control-plane.io/v1alpha1',
              versions: [{ version: '0.1.0' }],
            },
          ],
          crossplaneProviders: [
            {
              name: 'provider-kubernetes',
              versions: [{ version: '0.14.0' }, { version: '0.13.0' }],
            },
            {
              name: 'provider-helm',
              versions: [{ version: '0.19.0' }],
            },
          ],
        },
      },
    },
  },
};

export const kubeconfig: GetKubeconfigQuery = {
  v1: {
    Secret: {
      data: {
        value: btoa(
          [
            'apiVersion: v1',
            'kind: Config',
            'clusters:',
            '- name: mock-cluster',
            '  cluster:',
            '    server: https://mock-api.example.com',
            'contexts:',
            '- name: mock-context',
            '  context:',
            '    cluster: mock-cluster',
            '    user: mock-user',
            'current-context: mock-context',
            'users:',
            '- name: mock-user',
            '  user:',
            '    token: mock-token',
          ].join('\n'),
        ),
      },
    },
  },
};

export const deleteManagedControlPlaneResult: DeleteManagedControlPlaneMutation = {
  core_openmcp_cloud: { v1alpha1: { deleteManagedControlPlane: true } },
};

export function createControlPlaneV2Result(name: string, namespace: string): CreateManagedControlPlaneV2Mutation {
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

export const deleteControlPlaneV2Result: DeleteManagedControlPlaneV2Mutation = {
  core_open_control_plane_io: { v2alpha1: { deleteControlPlane: true } },
};

export function updateControlPlaneV2Result(name: string, namespace: string): UpdateManagedControlPlaneV2Mutation {
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

// ── Service component mutations ──────────────────────────────────────────────

export function createCrossplaneResult(name: string, namespace: string): CreateCrossplaneMutation {
  return { crossplane_services_open_control_plane_io: { v1alpha1: { createCrossplane: { metadata: { name, namespace } } } } };
}
export function updateCrossplaneResult(name: string, namespace: string): UpdateCrossplaneMutation {
  return { crossplane_services_open_control_plane_io: { v1alpha1: { updateCrossplane: { metadata: { name, namespace } } } } };
}
export const deleteCrossplaneResult: DeleteCrossplaneMutation = {
  crossplane_services_open_control_plane_io: { v1alpha1: { deleteCrossplane: true } },
};

export function createFluxResult(name: string, namespace: string): CreateFluxMutation {
  return { flux_services_open_control_plane_io: { v1alpha1: { createFlux: { metadata: { name, namespace } } } } };
}
export function updateFluxResult(name: string, namespace: string): UpdateFluxMutation {
  return { flux_services_open_control_plane_io: { v1alpha1: { updateFlux: { metadata: { name, namespace } } } } };
}
export const deleteFluxResult: DeleteFluxMutation = {
  flux_services_open_control_plane_io: { v1alpha1: { deleteFlux: true } },
};

export function createLandscaperResult(name: string, namespace: string): CreateLandscaperMutation {
  return { landscaper_services_open_control_plane_io: { v1alpha2: { createLandscaper: { metadata: { name, namespace } } } } };
}
export function updateLandscaperResult(name: string, namespace: string): UpdateLandscaperMutation {
  return { landscaper_services_open_control_plane_io: { v1alpha2: { updateLandscaper: { metadata: { name, namespace } } } } };
}
export const deleteLandscaperResult: DeleteLandscaperMutation = {
  landscaper_services_open_control_plane_io: { v1alpha2: { deleteLandscaper: true } },
};

export function createEsoResult(name: string, namespace: string): CreateExternalSecretsOperatorMutation {
  return { external_secrets_services_open_control_plane_io: { v1alpha1: { createExternalSecretsOperator: { metadata: { name, namespace } } } } };
}
export function updateEsoResult(name: string, namespace: string): UpdateExternalSecretsOperatorMutation {
  return { external_secrets_services_open_control_plane_io: { v1alpha1: { updateExternalSecretsOperator: { metadata: { name, namespace } } } } };
}
export const deleteEsoResult: DeleteExternalSecretsOperatorMutation = {
  external_secrets_services_open_control_plane_io: { v1alpha1: { deleteExternalSecretsOperator: true } },
};

export function createOcmResult(name: string, namespace: string): CreateOcmMutation {
  return { ocm_services_open_control_plane_io: { v1alpha1: { createOCM: { metadata: { name, namespace } } } } };
}
export function updateOcmResult(name: string, namespace: string): UpdateOcmMutation {
  return { ocm_services_open_control_plane_io: { v1alpha1: { updateOCM: { metadata: { name, namespace } } } } };
}
export const deleteOcmResult: DeleteOcmMutation = {
  ocm_services_open_control_plane_io: { v1alpha1: { deleteOCM: true } },
};

export function createKroResult(name: string, namespace: string): CreateKroMutation {
  return { kro_services_open_control_plane_io: { v1alpha1: { createKro: { metadata: { name, namespace } } } } };
}
export function updateKroResult(name: string, namespace: string): UpdateKroMutation {
  return { kro_services_open_control_plane_io: { v1alpha1: { updateKro: { metadata: { name, namespace } } } } };
}
export const deleteKroResult: DeleteKroMutation = {
  kro_services_open_control_plane_io: { v1alpha1: { deleteKro: true } },
};

export function createMetricsOperatorResult(name: string, namespace: string): CreateMetricsOperatorMutation {
  return { metrics_services_open_control_plane_io: { v1alpha1: { createMetricsOperator: { metadata: { name, namespace } } } } };
}
export function updateMetricsOperatorResult(name: string, namespace: string): UpdateMetricsOperatorMutation {
  return { metrics_services_open_control_plane_io: { v1alpha1: { updateMetricsOperator: { metadata: { name, namespace } } } } };
}
export const deleteMetricsOperatorResult: DeleteMetricsOperatorMutation = {
  metrics_services_open_control_plane_io: { v1alpha1: { deleteMetricsOperator: true } },
};

// ── Service component YAML queries ───────────────────────────────────────────

function serviceYaml(kind: string, name: string, namespace: string, apiVersion: string): string {
  return [
    `apiVersion: ${apiVersion}`,
    `kind: ${kind}`,
    'metadata:',
    `  name: ${name}`,
    `  namespace: ${namespace}`,
    'spec: {}',
  ].join('\n');
}

export function crossplaneYaml(name: string, namespace: string): GetCrossplaneYamlQuery {
  return {
    crossplane_services_open_control_plane_io: {
      v1alpha1: { CrossplaneYaml: serviceYaml('Crossplane', name, namespace, 'crossplane-services.open-control-plane.io/v1alpha1') },
    },
  };
}

export function fluxYaml(name: string, namespace: string): GetFluxYamlQuery {
  return {
    flux_services_open_control_plane_io: {
      v1alpha1: { FluxYaml: serviceYaml('Flux', name, namespace, 'flux-services.open-control-plane.io/v1alpha1') },
    },
  };
}

export function landscaperYaml(name: string, namespace: string): GetLandscaperYamlQuery {
  return {
    landscaper_services_open_control_plane_io: {
      v1alpha2: { LandscaperYaml: serviceYaml('Landscaper', name, namespace, 'landscaper-services.open-control-plane.io/v1alpha2') },
    },
  };
}

export function esoYaml(name: string, namespace: string): GetEsoYamlQuery {
  return {
    external_secrets_services_open_control_plane_io: {
      v1alpha1: { ExternalSecretsOperatorYaml: serviceYaml('ExternalSecretsOperator', name, namespace, 'external-secrets-services.open-control-plane.io/v1alpha1') },
    },
  };
}

export function ocmYaml(name: string, namespace: string): GetOcmYamlQuery {
  return {
    ocm_services_open_control_plane_io: {
      v1alpha1: { OCMYaml: serviceYaml('OCM', name, namespace, 'ocm-services.open-control-plane.io/v1alpha1') },
    },
  };
}

export function kroYaml(name: string, namespace: string): GetKroYamlQuery {
  return {
    kro_services_open_control_plane_io: {
      v1alpha1: { KroYaml: serviceYaml('Kro', name, namespace, 'kro-services.open-control-plane.io/v1alpha1') },
    },
  };
}

export function metricsOperatorYaml(name: string, namespace: string): GetMetricsOperatorYamlQuery {
  return {
    metrics_services_open_control_plane_io: {
      v1alpha1: { MetricsOperatorYaml: serviceYaml('MetricsOperator', name, namespace, 'metrics-services.open-control-plane.io/v1alpha1') },
    },
  };
}

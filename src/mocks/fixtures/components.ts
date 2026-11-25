import type {
  GetCrossplaneQuery,
  GetExternalSecretsOperatorQuery,
  GetFluxQuery,
  GetKroQuery,
  GetLandscaperQuery,
  GetManagedComponentsQuery,
  GetMcpV2ComponentsListQuery,
  GetMetricsOperatorQuery,
  GetOcmQuery,
} from '../../types/__generated__/graphql/graphql';

// First slice: return each single KPI resource as an empty object (all selected
// subfields null). The V2 page renders its component tiles without crashing; fill
// these in with real spec/status later when a tile needs concrete data.

export const crossplane: GetCrossplaneQuery = {
  crossplane_services_open_control_plane_io: {
    v1alpha1: { Crossplane: { kind: null, metadata: null, spec: null, status: null } },
  },
};

export const flux: GetFluxQuery = {
  flux_services_open_control_plane_io: {
    v1alpha1: { Flux: { metadata: null, spec: null, status: null } },
  },
};

export const eso: GetExternalSecretsOperatorQuery = {
  external_secrets_services_open_control_plane_io: {
    v1alpha1: { ExternalSecretsOperator: { metadata: null, spec: null, status: null } },
  },
};

export const landscaper: GetLandscaperQuery = {
  landscaper_services_open_control_plane_io: {
    v1alpha2: { Landscaper: { metadata: null, spec: null, status: null } },
  },
};

export const ocm: GetOcmQuery = {
  ocm_services_open_control_plane_io: {
    v1alpha1: { OCM: { metadata: null, spec: null, status: null } },
  },
};

export const kro: GetKroQuery = {
  kro_services_open_control_plane_io: {
    v1alpha1: { Kro: { metadata: null, spec: null, status: null } },
  },
};

export const metricsOperator: GetMetricsOperatorQuery = {
  metrics_services_open_control_plane_io: {
    v1alpha1: { MetricsOperator: { metadata: null, spec: null, status: null } },
  },
};

export const mcpV2Components: GetMcpV2ComponentsListQuery = {
  crossplane_services_open_control_plane_io: { v1alpha1: { Crossplanes: { items: [] } } },
  flux_services_open_control_plane_io: { v1alpha1: { Fluxes: { items: [] } } },
  landscaper_services_open_control_plane_io: { v1alpha2: { Landscapers: { items: [] } } },
  external_secrets_services_open_control_plane_io: { v1alpha1: { ExternalSecretsOperators: { items: [] } } },
  ocm_services_open_control_plane_io: { v1alpha1: { OCMs: { items: [] } } },
  kro_services_open_control_plane_io: { v1alpha1: { Kroes: { items: [] } } },
};

// Available managed components returned by the GraphQL gateway — used by the
// Create/Edit CP wizard to populate the services selection step.
export const managedComponents = {
  core_openmcp_cloud: {
    __typename: 'CoreOpenmcpCloudQuery',
    v1alpha1: {
      __typename: 'CoreOpenmcpCloudV1alpha1Query',
      ManagedComponents: {
        items: [
          { metadata: { name: 'crossplane' }, status: { versions: ['1.17.0', '1.16.0'] } },
          { metadata: { name: 'flux' }, status: { versions: ['2.3.0', '2.2.0'] } },
          { metadata: { name: 'landscaper' }, status: { versions: ['0.21.0'] } },
          { metadata: { name: 'external-secrets-operator' }, status: { versions: ['0.9.0'] } },
          { metadata: { name: 'ocm' }, status: { versions: ['1.0.0'] } },
          { metadata: { name: 'kro' }, status: { versions: ['0.2.0'] } },
          { metadata: { name: 'metrics-operator' }, status: { versions: ['0.1.0'] } },
        ],
      },
    },
  },
} as unknown as GetManagedComponentsQuery;

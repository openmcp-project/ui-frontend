import type {
  GetCrossplaneQuery,
  GetExternalSecretsOperatorQuery,
  GetFluxQuery,
  GetKroQuery,
  GetLandscaperQuery,
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

import { useQuery } from '@apollo/client/react';
import { gql, TypedDocumentNode } from '@apollo/client';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { useEffect, useMemo } from 'react';
import { telemetry } from '../lib/telemetry/telemetry.ts';
import {
  CrossplaneProvider,
  ManagedService,
  ManagedServiceCatalog,
  ManagedServiceVersion,
} from '../lib/api/types/crate/managedService.ts';

export type { CrossplaneProvider, ManagedService, ManagedServiceVersion };

// TODO(ntnn): switch to the generated graphql() tag once the ManagedService CRD is in the gateway schema.
interface GetManagedServiceCatalogData {
  open_control_plane_io: {
    v1: {
      ManagedService: { spec: Partial<ManagedServiceCatalog> | null } | null;
    } | null;
  } | null;
}

const GetManagedServiceCatalogQuery: TypedDocumentNode<GetManagedServiceCatalogData, { name: string }> = gql`
  query GetManagedServiceCatalog($name: String!) {
    open_control_plane_io {
      v1 {
        ManagedService(name: $name) {
          spec {
            services {
              name
              kind
              apiVersion
              versions {
                version
              }
            }
            crossplaneProviders {
              name
              versions {
                version
              }
            }
          }
        }
      }
    }
  }
`;

export interface UseManagedServicesQueryResult {
  services: ManagedService[];
  crossplaneProviders: CrossplaneProvider[];
  isLoading: boolean;
  error: unknown | null;
}

// Default served whenever the ManagedService catalog cannot be fetched from the crate cluster.
const MOCK_CATALOG: ManagedServiceCatalog = {
  services: [
    {
      name: 'crossplane',
      kind: 'Crossplane',
      apiVersion: 'crossplane.services.open-control-plane.io/v1alpha1',
      versions: [{ version: 'v2.0.2-1' }, { version: 'v1.20.1-1' }],
    },
    {
      name: 'landscaper',
      kind: 'Landscaper',
      apiVersion: 'landscaper.services.open-control-plane.io/v1alpha2',
      versions: [{ version: 'v1.2.0' }, { version: 'v1.0.5' }],
    },
    {
      name: 'external-secrets-operator',
      kind: 'ExternalSecretsOperator',
      apiVersion: 'external-secrets.services.open-control-plane.io/v1alpha1',
      versions: [{ version: 'v1.3.2' }],
    },
    {
      name: 'flux',
      kind: 'Flux',
      apiVersion: 'flux.services.open-control-plane.io/v1alpha1',
      versions: [{ version: 'v2.18.2' }],
    },
    {
      name: 'ocm',
      kind: 'OCM',
      apiVersion: 'ocm.services.open-control-plane.io/v1alpha1',
      versions: [{ version: 'v0.3.0' }],
    },
    {
      name: 'kro',
      kind: 'KRO',
      apiVersion: 'kro.services.open-control-plane.io/v1alpha1',
      versions: [{ version: 'v0.3.0' }],
    },
    {
      name: 'metrics-operator',
      kind: 'MetricsOperator',
      apiVersion: 'metrics.services.open-control-plane.io/v1alpha1',
      versions: [{ version: 'v0.1.0' }],
    },
    {
      name: 'velero',
      kind: 'Velero',
      apiVersion: 'velero.services.open-control-plane.io/v1alpha1',
      versions: [{ version: 'v1.18.0' }],
    },
  ],
  crossplaneProviders: [
    { name: 'provider-argocd', versions: [{ version: 'v0.9.1' }] },
    { name: 'provider-btp', versions: [{ version: 'v1.3.0' }] },
    { name: 'provider-cloudfoundry', versions: [{ version: 'v0.3.2' }] },
    { name: 'provider-gardener-auth', versions: [{ version: 'v0.0.6' }] },
    { name: 'provider-helm', versions: [{ version: 'v1.0.1' }] },
    { name: 'provider-ias', versions: [{ version: 'v0.3.0' }] },
    { name: 'provider-kubernetes', versions: [{ version: 'v0.15.0' }] },
    { name: 'provider-opentofu', versions: [{ version: 'v0.2.7' }] },
    { name: 'provider-terraform', versions: [{ version: 'v0.16.0' }] },
    { name: 'provider-vault', versions: [{ version: 'v2.2.1' }] },
  ],
};

const EMPTY_CATALOG: ManagedServiceCatalog = { services: [], crossplaneProviders: [] };

// GraphQL validation error meaning the ManagedService type is absent from the gateway schema.
const isSchemaAbsenceError = (error: unknown): boolean =>
  CombinedGraphQLErrors.is(error) && error.errors.some((e) => e.message.includes('Cannot query field'));

export function useManagedServicesQuery(): UseManagedServicesQueryResult {
  const { data, error, loading } = useQuery(GetManagedServiceCatalogQuery, {
    variables: { name: 'catalog' },
  });

  const spec = data?.open_control_plane_io?.v1?.ManagedService?.spec;

  // TODO(ntnn): The fallback to the mock data is intentional. Currently the ManagedService API is not implemented.
  // This allows filling the wizard with the served components on experimental deployments.
  // Only when the type or CR is absent, transient errors surface as error with an empty catalog.
  const catalogAbsent = (!loading && !error && !spec) || isSchemaAbsenceError(error);

  const catalog = useMemo<ManagedServiceCatalog>(() => {
    if (spec) {
      return {
        services: spec.services ?? [],
        crossplaneProviders: spec.crossplaneProviders ?? [],
      };
    }
    return catalogAbsent ? MOCK_CATALOG : EMPTY_CATALOG;
  }, [spec, catalogAbsent]);

  useEffect(() => {
    if (catalogAbsent) {
      telemetry().breadcrumb('ManagedService catalog absent, serving mock catalog');
    }
  }, [catalogAbsent]);

  return {
    services: catalog.services,
    crossplaneProviders: catalog.crossplaneProviders,
    isLoading: loading,
    error: catalogAbsent ? null : (error ?? null),
  };
}

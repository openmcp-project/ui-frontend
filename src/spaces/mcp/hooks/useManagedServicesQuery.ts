import { useQuery } from '@apollo/client/react';

import { graphql } from '../../../types/__generated__/graphql/index.ts';
import type { GetManagedServicesQuery } from '../../../types/__generated__/graphql/graphql.ts';

export const GET_MANAGED_SERVICES_QUERY = graphql(`
  query GetManagedServices {
    open_control_plane_io {
      v1 {
        ManagedService(name: "catalog") {
          apiVersion
          kind
          metadata {
            name
            namespace
          }
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
`);

type _RawManagedServiceData = NonNullable<
  NonNullable<GetManagedServicesQuery['open_control_plane_io']>['v1']
>['ManagedService'];

export type ManagedService = {
  name: string;
  kind: string;
  apiVersion: string;
  versions: { version: string }[];
};

export type CrossplaneProvider = {
  name: string;
  versions: { version: string }[];
};

export interface UseManagedServicesQueryResult {
  managedServicesData: _RawManagedServiceData | null;
  services: ManagedService[];
  crossplaneProviders: CrossplaneProvider[];
  isLoading: boolean;
  error: unknown | null;
}

function notNull<T>(value: T | null | undefined): value is T {
  return value != null;
}

function mapVersions(versions: ({ version: string | null } | null)[] | null | undefined): { version: string }[] {
  return (versions ?? []).filter(notNull).map((v) => ({ version: v.version ?? '' }));
}

export function useManagedServicesQuery(): UseManagedServicesQueryResult {
  const { data, loading, error } = useQuery(GET_MANAGED_SERVICES_QUERY);

  const raw = data?.open_control_plane_io?.v1?.ManagedService;

  const services: ManagedService[] = (raw?.spec?.services ?? []).filter(notNull).map((s) => ({
    name: s.name ?? '',
    kind: s.kind ?? '',
    apiVersion: s.apiVersion ?? '',
    versions: mapVersions(s.versions),
  }));

  const crossplaneProviders: CrossplaneProvider[] = (raw?.spec?.crossplaneProviders ?? [])
    .filter(notNull)
    .map((p) => ({ name: p.name ?? '', versions: mapVersions(p.versions) }));

  return {
    managedServicesData: raw ?? null,
    services,
    crossplaneProviders,
    isLoading: loading,
    error: error ?? null,
  };
}

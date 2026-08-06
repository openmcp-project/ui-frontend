import { useMemo } from 'react';

export interface ManagedServiceVersion {
  version: string;
}

export interface ManagedService {
  name: string;
  kind: string;
  apiVersion: string;
  versions: ManagedServiceVersion[];
}

export interface CrossplaneProvider {
  name: string;
  versions: ManagedServiceVersion[];
}

export interface ManagedServiceStatus {
  services: ManagedService[];
  crossplaneProviders: CrossplaneProvider[];
}

export interface ManagedServiceResource {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
  };
  spec: Record<string, never>;
  status: ManagedServiceStatus;
}

export interface UseManagedServicesQueryResult {
  managedServicesData: ManagedServiceResource | null;
  services: ManagedService[];
  crossplaneProviders: CrossplaneProvider[];
  isLoading: boolean;
  error: unknown | null;
}
// TODO: This mock data should be replaced with Custom Resource Definition (CRD) data fetched from the backend
const MOCK_MANAGED_SERVICE: ManagedServiceResource = {
  apiVersion: 'sap.openmcp.io/v1',
  kind: 'ManagedService',
  metadata: {
    name: 'catalog',
    namespace: 'default',
  },
  spec: {},
  status: {
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
  },
};

export function useManagedServicesQuery(): UseManagedServicesQueryResult {
  const managedServicesData = useMemo(() => MOCK_MANAGED_SERVICE, []);

  return {
    managedServicesData,
    services: managedServicesData.status.services,
    crossplaneProviders: managedServicesData.status.crossplaneProviders,
    isLoading: false,
    error: null,
  };
}

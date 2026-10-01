import { useApiResource } from '../../../lib/api/useApiResource';
import {
  CrossplaneProvider,
  ManagedService,
  ManagedServiceRequest,
  ManagedServiceResource,
} from '../../../lib/api/types/open-control-plane/managedServices';

export type { ManagedService, ManagedServiceResource, CrossplaneProvider };

export interface UseManagedServicesQueryResult {
  managedServicesData: ManagedServiceResource | null;
  services: ManagedService[];
  crossplaneProviders: CrossplaneProvider[];
  isLoading: boolean;
  error: unknown | null;
}

export function useManagedServicesQuery(): UseManagedServicesQueryResult {
  const { data, error, isLoading } = useApiResource(ManagedServiceRequest);

  console.log('data');
  console.log(data);

  return {
    managedServicesData: data ?? null,
    services: data?.spec.services ?? [],
    crossplaneProviders: data?.spec.crossplaneProviders ?? [],
    isLoading,
    error: error ?? null,
  };
}

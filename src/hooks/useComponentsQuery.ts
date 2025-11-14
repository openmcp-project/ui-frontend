import { useApiResource } from '../lib/api/useApiResource.ts';
import { APIError } from '../lib/api/error.ts';
import { ListManagedComponents, ManagedComponentList } from '../lib/api/types/crate/listManagedComponents.ts';

export interface GetComponentsHookResult {
  components: ManagedComponentList | undefined;
  error: APIError | undefined;
  isLoading: boolean;
}
export function useComponentsQuery(): GetComponentsHookResult {
  const { data: components, error, isLoading } = useApiResource(ListManagedComponents(), undefined, null);

  return { components, error, isLoading };
}

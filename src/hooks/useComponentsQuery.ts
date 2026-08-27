import { useQuery } from '@apollo/client/react';
import { graphql } from '../types/__generated__/graphql';
import type { ManagedComponentList } from '../lib/api/types/crate/listManagedComponents';

const GetManagedComponentsQuery = graphql(`
  query GetManagedComponents {
    core_openmcp_cloud {
      v1alpha1 {
        ManagedComponents {
          items {
            metadata {
              name
            }
            status {
              versions
            }
          }
        }
      }
    }
  }
`);

export interface GetComponentsHookResult {
  components: ManagedComponentList | undefined;
  error: unknown;
  isLoading: boolean;
}

export function useComponentsQuery(): GetComponentsHookResult {
  const { data, error, loading } = useQuery(GetManagedComponentsQuery);

  const rawList = data?.core_openmcp_cloud?.v1alpha1?.ManagedComponents;
  const components = rawList ? (rawList as unknown as ManagedComponentList) : undefined;

  return {
    components,
    error,
    isLoading: loading,
  };
}

import type { OperationVariables, TypedDocumentNode } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

export interface YamlQueryVariables extends OperationVariables {
  name: string;
  namespace?: string | null;
}

export function useYamlQuery<TData, TVariables extends YamlQueryVariables>(
  document: TypedDocumentNode<TData, TVariables>,
  selectYaml: (data: TData) => string | null | undefined,
  name: string,
  namespace: string,
  skip = false,
) {
  const { data, loading, error, refetch } = useQuery(document, {
    variables: { name, namespace } as TVariables,
    skip: skip || !name || !namespace,
    fetchPolicy: 'network-only',
    pollInterval: 30_000,
  });

  return {
    yaml: data ? (selectYaml(data) ?? null) : null,
    isLoading: loading,
    error,
    refetch,
  };
}

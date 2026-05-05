import { useQuery } from '@apollo/client/react';
import { useMemo, useState } from 'react';
import { graphql } from '../../types/__generated__/graphql';

const GET_NAMESPACES_QUERY = graphql(`
  query GetNamespacesForConfigMaps {
    v1 {
      Namespaces {
        items {
          metadata {
            name
          }
        }
      }
    }
  }
`);

const GET_CONFIGMAPS_QUERY = graphql(`
  query GetConfigMaps($namespace: String) {
    v1 {
      ConfigMaps(namespace: $namespace) {
        items {
          apiVersion
          kind
          data
          metadata {
            name
            namespace
            creationTimestamp
            annotations
            labels
            finalizers
            generation
            resourceVersion
            uid
          }
        }
      }
    }
  }
`);

type Ui5SelectChangeEvent = {
  detail?: {
    selectedOption?: {
      textContent?: string | null;
    } | null;
  };
};

export function useConfigMapsQuery() {
  const [userSelectedNamespace, setUserSelectedNamespace] = useState<string | null>(null);

  const { data: namespacesData } = useQuery(GET_NAMESPACES_QUERY);

  const namespaces = useMemo(
    () =>
      (namespacesData?.v1?.Namespaces?.items ?? [])
        .map((ns) => ns.metadata?.name ?? '')
        .filter(Boolean)
        .sort(),
    [namespacesData],
  );

  const defaultNamespace = useMemo(
    () => (namespaces.includes('default') ? 'default' : (namespaces[0] ?? '')),
    [namespaces],
  );

  const selectedNamespace =
    userSelectedNamespace !== null && namespaces.includes(userSelectedNamespace)
      ? userSelectedNamespace
      : defaultNamespace;

  const onNamespaceChange = (event: unknown) => {
    const e = event as Ui5SelectChangeEvent;
    const next = e.detail?.selectedOption?.textContent?.trim() ?? '';
    if (next) setUserSelectedNamespace(next);
  };

  const {
    data: configMapsData,
    loading: isLoading,
    error,
  } = useQuery(GET_CONFIGMAPS_QUERY, {
    variables: { namespace: selectedNamespace },
    skip: !selectedNamespace,
  });

  const configMaps = configMapsData?.v1?.ConfigMaps?.items ?? [];

  return { configMaps, namespaces, selectedNamespace, onNamespaceChange, isLoading, error };
}

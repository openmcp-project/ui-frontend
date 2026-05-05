import { useQuery } from '@apollo/client/react';
import { useMemo, useState } from 'react';
import { graphql } from '../../types/__generated__/graphql';

const GET_NAMESPACES_QUERY = graphql(`
  query GetNamespacesForSecrets {
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

const GET_SECRETS_QUERY = graphql(`
  query GetSecrets($namespace: String) {
    v1 {
      Secrets(namespace: $namespace) {
        items {
          apiVersion
          kind
          type
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

export function useSecretsQuery() {
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
    data: secretsData,
    loading: isLoading,
    error,
  } = useQuery(GET_SECRETS_QUERY, {
    variables: { namespace: selectedNamespace },
    skip: !selectedNamespace,
  });

  const secrets = secretsData?.v1?.Secrets?.items ?? [];

  return { secrets, namespaces, selectedNamespace, onNamespaceChange, isLoading, error };
}

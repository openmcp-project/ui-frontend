import { useEffect, useMemo, useState } from 'react';
import { useApiResource as _useApiResource } from '../lib/api/useApiResource.ts';
import { ListNamespaces } from '../lib/api/types/k8s/listNamespaces.ts';

type Ui5SelectChangeEvent = {
  detail?: {
    selectedOption?: {
      textContent?: string | null;
    } | null;
  };
};

export const useNamespaceSelect = ({
  useApiResource = _useApiResource,
}: {
  useApiResource?: typeof _useApiResource;
} = {}) => {
  const { data: namespacesData } = useApiResource(ListNamespaces);

  const namespaces = useMemo(() => (namespacesData ?? []).map((ns) => ns.metadata.name).sort(), [namespacesData]);

  const [selectedNamespace, setSelectedNamespace] = useState<string>('');

  useEffect(() => {
    if (!namespaces.length) {
      setSelectedNamespace('');
      return;
    }
    setSelectedNamespace(namespaces.includes('default') ? 'default' : namespaces[0]);
  }, [namespaces]);

  const onNamespaceChange = (event: unknown) => {
    const e = event as Ui5SelectChangeEvent;
    const next = e.detail?.selectedOption?.textContent?.trim() ?? '';
    if (next) setSelectedNamespace(next);
  };

  return { namespaces, selectedNamespace, onNamespaceChange };
};

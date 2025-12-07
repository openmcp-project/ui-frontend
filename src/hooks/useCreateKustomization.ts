import { useState, useContext, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../context/ToastContext';
import { fetchApiServerJson } from '../lib/api/fetch';
import { ApiConfigContext } from '../components/Shared/k8s/index';
import { useRevalidateApiResource } from '../lib/api/useApiResource';
import { FluxKustomization } from '../lib/api/types/flux/listKustomization';
import { CreateKustomizationType } from '../lib/api/types/flux/createKustomization';

export interface CreateKustomizationParams {
  namespace: string;
  name: string;
  interval: string;
  sourceRefName: string;
  path: string;
  prune: boolean;
  targetNamespace?: string;
  substitutions?: { key: string; value: string }[];
}

export const useCreateKustomization = (defaultNamespace: string = 'default') => {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  const toast = useToast();
  const apiConfig = useContext(ApiConfigContext);
  const revalidate = useRevalidateApiResource(FluxKustomization);

  const createKustomization = useCallback(
    async (data: CreateKustomizationParams) => {
      setIsLoading(true);
      try {
        const targetNamespace = data.namespace || defaultNamespace;

        const substitutionsMap: Record<string, string> = {};
        data.substitutions?.forEach((sub) => {
          if (sub.key && sub.value) {
            substitutionsMap[sub.key] = sub.value;
          }
        });

        // metadata.namespace: where the Kustomization object itself lives (control plane namespace)
        // spec.targetNamespace: where the rendered resources will be applied (workload namespace)
        const payload: CreateKustomizationType = {
          apiVersion: 'kustomize.toolkit.fluxcd.io/v1',
          kind: 'Kustomization',
          metadata: {
            name: data.name,
            namespace: targetNamespace,
          },
          spec: {
            interval: data.interval,
            sourceRef: {
              kind: 'GitRepository',
              name: data.sourceRefName,
            },
            path: data.path,
            prune: data.prune,
            targetNamespace: data.targetNamespace || undefined,
            postBuild:
              Object.keys(substitutionsMap).length > 0
                ? {
                    substitute: substitutionsMap,
                  }
                : undefined,
          },
        };

        const path = `/apis/kustomize.toolkit.fluxcd.io/v1/namespaces/${targetNamespace}/kustomizations`;

        await fetchApiServerJson(path, apiConfig, undefined, 'POST', JSON.stringify(payload));
        await revalidate();

        toast.show(t('CreateKustomizationDialog.kustomizationCreated'));
      } catch (error) {
        toast.show(
          t('CreateKustomizationDialog.kustomizationCreationFailed', {
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        );
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [apiConfig, revalidate, t, toast, defaultNamespace],
  );

  return { createKustomization, isLoading };
};

import { useState, useContext, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../context/ToastContext';
import { fetchApiServerJson } from '../../../lib/api/fetch';
import { ApiConfigContext } from '../../../components/Shared/k8s/index';

export interface CreateAppInstallationParams {
  name: string;
  namespace: string;
  instanceRefName: string;
  org: string;
}

export function useCreateAppInstallation() {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  const toast = useToast();
  const apiConfig = useContext(ApiConfigContext);

  const createAppInstallation = useCallback(
    async ({ name, namespace, instanceRefName, org }: CreateAppInstallationParams) => {
      setIsLoading(true);
      try {
        const payload = {
          apiVersion: 'github.gitops.open-control-plane.io/v1alpha1',
          kind: 'AppInstallation',
          metadata: { name, namespace },
          spec: {
            instanceRef: { name: instanceRefName },
            org,
          },
        };
        const path = `/apis/github.gitops.open-control-plane.io/v1alpha1/namespaces/${namespace}/appinstallations`;
        await fetchApiServerJson(path, apiConfig, undefined, 'POST', JSON.stringify(payload));
        toast.show(t('ConnectGitHubDialog.connectedToast'));
      } catch (error) {
        toast.show(
          t('ConnectGitHubDialog.errorToast', {
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        );
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [apiConfig, toast, t],
  );

  return { createAppInstallation, isLoading };
}

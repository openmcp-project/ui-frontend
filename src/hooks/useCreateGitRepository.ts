import { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../context/ToastContext';
import { fetchApiServerJson } from '../lib/api/fetch';
import { ApiConfigContext } from '../components/Shared/k8s/index';

export interface CreateGitRepositoryParams {
  name: string;
  interval: string;
  url: string;
  branch: string;
  secretRef?: string;
}

export const useCreateGitRepository = (namespace: string = 'default') => {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  const toast = useToast();
  const apiConfig = useContext(ApiConfigContext);

  const createGitRepository = async (data: CreateGitRepositoryParams) => {
    setIsLoading(true);
    try {
      const payload = {
        apiVersion: 'source.toolkit.fluxcd.io/v1',
        kind: 'GitRepository',
        metadata: {
          name: data.name,
          namespace,
        },
        spec: {
          interval: data.interval,
          url: data.url,
          ref: { branch: data.branch },
          ...(data.secretRef ? { secretRef: { name: data.secretRef } } : {}),
        },
      };

      const path = `/apis/source.toolkit.fluxcd.io/v1/namespaces/${namespace}/gitrepositories`;

      await fetchApiServerJson(path, apiConfig, undefined, 'POST', JSON.stringify(payload));

      toast.show(t('CreateGitRepositoryDialog.gitRepositoryCreated'));
    } catch (error) {
      toast.show(
        t('CreateGitRepositoryDialog.gitRepositoryCreationFailed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { createGitRepository, isLoading };
};

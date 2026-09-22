import { useCallback, useContext } from 'react';
import { useApolloClient, useMutation } from '@apollo/client/react';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { graphql } from '../types/__generated__/graphql';
import { ApiConfigContext } from '../components/Shared/k8s/index.ts';
import { fetchApiServerJson } from '../lib/api/fetch.ts';

const DeleteManagedControlPlaneMutation = graphql(`
  mutation DeleteManagedControlPlane($name: String!, $namespace: String!, $dryRun: Boolean) {
    core_openmcp_cloud {
      v1alpha1 {
        deleteManagedControlPlane(name: $name, namespace: $namespace, dryRun: $dryRun)
      }
    }
  }
`);

const deletionConfirmationPatchBody = JSON.stringify({
  metadata: { annotations: { 'confirmation.openmcp.cloud/deletion': 'true' } },
});

export function useDeleteManagedControlPlane(namespace: string, name: string) {
  const apolloClient = useApolloClient();
  const [deleteManagedControlPlaneMutation] = useMutation(DeleteManagedControlPlaneMutation);
  const { t } = useTranslation();
  const toast = useToast();
  const apiConfig = useContext(ApiConfigContext);

  const deleteManagedControlPlane = useCallback(async (): Promise<void> => {
    try {
      await fetchApiServerJson(
        `/apis/core.openmcp.cloud/v1alpha1/namespaces/${namespace}/managedcontrolplanes/${name}`,
        apiConfig,
        undefined,
        'PATCH',
        deletionConfirmationPatchBody,
      );
      await deleteManagedControlPlaneMutation({ variables: { name, namespace } });
      void apolloClient.refetchQueries({ include: ['GetMCPsList'] });
      toast.show(t('ControlPlaneCard.deleteConfirmationDialog'));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.show(message);
      throw error;
    }
  }, [apiConfig, apolloClient, deleteManagedControlPlaneMutation, name, namespace, t, toast]);

  return {
    deleteManagedControlPlane,
  };
}

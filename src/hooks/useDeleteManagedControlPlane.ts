import { useCallback } from 'react';
import { useApolloClient, useMutation } from '@apollo/client/react';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { graphql } from '../types/__generated__/graphql';

// Sets the deletion-confirmation annotation via server-side apply. Mirrors the previous REST
// PATCH (`confirmation.openmcp.cloud/deletion: "true"`) — sending only metadata merges the
// annotation without a read-modify-write round-trip.
const SetDeletionConfirmationMutation = graphql(`
  mutation SetManagedControlPlaneDeletionConfirmation($yaml: String!) {
    applyYaml(yaml: $yaml)
  }
`);

const DeleteManagedControlPlaneMutation = graphql(`
  mutation DeleteManagedControlPlane($name: String!, $namespace: String!, $dryRun: Boolean) {
    core_openmcp_cloud {
      v1alpha1 {
        deleteManagedControlPlane(name: $name, namespace: $namespace, dryRun: $dryRun)
      }
    }
  }
`);

function deletionConfirmationYaml(namespace: string, name: string): string {
  return [
    'apiVersion: core.openmcp.cloud/v1alpha1',
    'kind: ManagedControlPlane',
    'metadata:',
    `  name: ${name}`,
    `  namespace: ${namespace}`,
    '  annotations:',
    '    confirmation.openmcp.cloud/deletion: "true"',
  ].join('\n');
}

export function useDeleteManagedControlPlane(namespace: string, name: string) {
  const apolloClient = useApolloClient();
  const [setDeletionConfirmation] = useMutation(SetDeletionConfirmationMutation);
  const [deleteManagedControlPlaneMutation] = useMutation(DeleteManagedControlPlaneMutation);
  const { t } = useTranslation();
  const toast = useToast();

  const deleteManagedControlPlane = useCallback(async (): Promise<void> => {
    try {
      await setDeletionConfirmation({ variables: { yaml: deletionConfirmationYaml(namespace, name) } });
      await deleteManagedControlPlaneMutation({ variables: { name, namespace } });
      void apolloClient.refetchQueries({ include: ['GetMCPsList'] });
      toast.show(t('ControlPlaneCard.deleteConfirmationDialog'));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.show(message);
      throw error;
    }
  }, [apolloClient, deleteManagedControlPlaneMutation, name, namespace, setDeletionConfirmation, t, toast]);

  return {
    deleteManagedControlPlane,
  };
}

import { useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { useToast } from '../../../context/ToastContext.tsx';
import { useTranslation } from 'react-i18next';
import { DeleteManagedControlPlaneV2Mutation } from './useDeleteControlPlaneV2Mutation.ts';
import { useAccessDeniedFeedback } from '../../../lib/api/access/useAccessDeniedFeedback.ts';

export function useDeleteControlPlaneV2GraphQL(namespace: string, name: string) {
  const { t } = useTranslation();
  const toast = useToast();
  const recordDenied = useAccessDeniedFeedback();
  const [deleteMutation] = useMutation(DeleteManagedControlPlaneV2Mutation, {
    refetchQueries: ['GetMCPsList'],
  });

  const deleteManagedControlPlaneV2 = useCallback(async (): Promise<void> => {
    try {
      await deleteMutation({
        variables: { name, namespace },
      });
      toast.show(t('ControlPlaneCard.deleteConfirmationDialog'));
    } catch (error) {
      recordDenied(error, {
        verb: 'delete',
        group: 'core.open-control-plane.io',
        resource: 'controlplanes',
        namespace,
        name,
      });
      const message = error instanceof Error ? error.message : String(error);
      toast.show(message);
      throw error;
    }
  }, [deleteMutation, name, namespace, toast, t, recordDenied]);

  return { deleteManagedControlPlaneV2 };
}

import { useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { useToast } from '../../../context/ToastContext.tsx';
import { useTranslation } from 'react-i18next';
import { DeleteManagedControlPlaneV2Mutation } from './useDeleteControlPlaneMutation.ts';

export function useDeleteNewControlPlane(namespace: string, name: string) {
  const { t } = useTranslation();
  const toast = useToast();
  const [deleteMutation] = useMutation(DeleteManagedControlPlaneV2Mutation);

  const deleteManagedControlPlaneV2 = useCallback(async (): Promise<void> => {
    try {
      await deleteMutation({
        variables: { name, namespace },
      });
      toast.show(t('ControlPlaneCard.deleteConfirmationDialog'));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.show(message);
    }
  }, [deleteMutation, name, namespace, toast, t]);

  return { deleteManagedControlPlaneV2 };
}

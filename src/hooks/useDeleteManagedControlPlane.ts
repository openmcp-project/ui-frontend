import { useCallback } from 'react';
import { useApiResourceMutation } from '../lib/api/useApiResource';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import {
  DeleteMCPResource,
  DeleteMCPType,
  PatchMCPResourceForDeletion,
  PatchMCPResourceForDeletionBody,
} from '../lib/api/types/crate/deleteMCP.ts';

export function useDeleteManagedControlPlane(namespace: string, name: string) {
  const { trigger: patchTrigger } = useApiResourceMutation<DeleteMCPType>(PatchMCPResourceForDeletion(namespace, name));
  const { trigger: deleteTrigger } = useApiResourceMutation<DeleteMCPType>(DeleteMCPResource(namespace, name));
  const { t } = useTranslation();
  const toast = useToast();

  const deleteManagedControlPlane = useCallback(async (): Promise<void> => {
    await patchTrigger(PatchMCPResourceForDeletionBody);
    await deleteTrigger();
    toast.show(t('ControlPlaneCard.deleteConfirmationDialog'));
  }, [patchTrigger, deleteTrigger, toast, t]);

  return {
    deleteManagedControlPlane,
  };
}

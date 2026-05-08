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
import { useAnalyticsOptional } from '../lib/analytics';

export function useDeleteManagedControlPlane(namespace: string, name: string) {
  const { trigger: patchTrigger } = useApiResourceMutation<DeleteMCPType>(PatchMCPResourceForDeletion(namespace, name));
  const { trigger: deleteTrigger } = useApiResourceMutation<DeleteMCPType>(DeleteMCPResource(namespace, name));
  const { t } = useTranslation();
  const toast = useToast();
  const analytics = useAnalyticsOptional();

  const deleteManagedControlPlane = useCallback(async (): Promise<void> => {
    try {
      await patchTrigger(PatchMCPResourceForDeletionBody);
      await deleteTrigger();

      analytics?.trackEvent('MCP Deleted', {
        controlPlane: name,
        namespace,
      });

      toast.show(t('ControlPlaneCard.deleteConfirmationDialog'));
    } catch (error) {
      analytics?.trackError(error as Error, {
        action: 'delete_mcp',
        controlPlane: name,
        namespace,
      });
      throw error;
    }
  }, [patchTrigger, deleteTrigger, toast, t, analytics, name, namespace]);

  return {
    deleteManagedControlPlane,
  };
}

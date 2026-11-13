import { useCallback, useEffect, useRef } from 'react';
import { useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../context/ToastContext.tsx';
import { FORCE_DELETE_ANNOTATION } from '../../../lib/api/types/shared/keyNames.ts';
import { DeleteManagedControlPlaneV2Mutation } from './useDeleteControlPlaneV2Mutation.ts';
import { UpdateManagedControlPlaneV2Mutation } from './useUpdateControlPlaneV2Mutation.ts';

/**
 * Exceptional "force delete" path for a V2 ControlPlane. In contrast to the regular deletion
 * ({@link useDeleteControlPlaneV2GraphQL}), this first sets the `open-control-plane.io/force-delete`
 * annotation so the operator removes finalizers from blocking service instances, then triggers the
 * deletion. This can leak external resources managed by those instances and must only be used when
 * the regular deletion is stuck — hence it sits behind an extra confirmation in the UI.
 *
 * The annotation is set via a metadata-only `updateControlPlane` call (no spec), relying on the
 * gateway's server-side merge so that existing spec and annotations are preserved. Existing
 * annotations are carried through explicitly to be safe.
 */
export function useForceDeleteControlPlaneV2GraphQL(
  namespace: string,
  name: string,
  existingAnnotations?: Record<string, string>,
) {
  const { t } = useTranslation();
  const toast = useToast();
  const existingAnnotationsRef = useRef(existingAnnotations);
  useEffect(() => {
    existingAnnotationsRef.current = existingAnnotations;
  }, [existingAnnotations]);
  const [updateMutation] = useMutation(UpdateManagedControlPlaneV2Mutation);
  const [deleteMutation] = useMutation(DeleteManagedControlPlaneV2Mutation, {
    refetchQueries: ['GetMCPsList'],
  });

  const forceDeleteManagedControlPlaneV2 = useCallback(async (): Promise<void> => {
    try {
      await updateMutation({
        variables: {
          name,
          namespace,
          object: {
            apiVersion: 'core.open-control-plane.io/v2alpha1',
            kind: 'ControlPlane',
            metadata: {
              name,
              namespace,
              annotations: {
                ...(existingAnnotationsRef.current ?? {}),
                [FORCE_DELETE_ANNOTATION]: 'true',
              },
            },
          },
        },
      });

      await deleteMutation({
        variables: { name, namespace },
      });

      toast.show(t('ControlPlaneCard.forceDeleteConfirmationDialog'));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.show(message);
      throw error;
    }
  }, [updateMutation, deleteMutation, name, namespace, toast, t]);

  return { forceDeleteManagedControlPlaneV2 };
}

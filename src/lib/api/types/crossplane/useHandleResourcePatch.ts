import { useContext } from 'react';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiConfigContext } from '../../../../components/Shared/k8s';
import { useToast } from '../../../../context/ToastContext.tsx';
import { useResourcePluralNames } from '../../../../hooks/useResourcePluralNames';
import { ErrorDialogHandle } from '../../../../components/Shared/ErrorMessageBox.tsx';
import { fetchApiServerJson } from '../../fetch.ts';
import { APIError } from '../../error.ts';

export type PatchableResourceRef = {
  kind: string;
  apiVersion?: string;
  metadata: {
    name: string;
    namespace?: string;
  };
};

export const useHandleResourcePatch = (errorDialogRef?: RefObject<ErrorDialogHandle | null>) => {
  const { t } = useTranslation();
  const toast = useToast();
  const apiConfig = useContext(ApiConfigContext);
  const { getPluralKind } = useResourcePluralNames();

  return async (item: PatchableResourceRef, parsed: unknown): Promise<boolean> => {
    const resourceName = item?.metadata?.name ?? '';
    const apiVersion = item?.apiVersion ?? '';
    const pluralKind = getPluralKind(item.kind);
    const namespace = item?.metadata?.namespace;

    toast.show(t('ManagedResources.patchStarted', { resourceName }));

    try {
      const basePath = `/apis/${apiVersion}`;
      const path = namespace
        ? `${basePath}/namespaces/${namespace}/${pluralKind}/${resourceName}`
        : `${basePath}/${pluralKind}/${resourceName}`;

      await fetchApiServerJson(path, apiConfig, undefined, 'PATCH', JSON.stringify(parsed));
      toast.show(t('ManagedResources.patchSuccess', { resourceName }));
      return true;
    } catch (e) {
      toast.show(t('ManagedResources.patchError', { resourceName }));
      if (e instanceof APIError && errorDialogRef?.current) {
        errorDialogRef.current.showErrorDialog(`${e.message}: ${JSON.stringify(e.info)}`);
      }
      console.error('Failed to patch resource', e);
      return false;
    }
  };
};

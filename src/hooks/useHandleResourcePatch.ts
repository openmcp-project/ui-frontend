import { useContext } from 'react';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiConfigContext } from '../components/Shared/k8s/index.ts';
import { useToast } from '../context/ToastContext.tsx';
import { useResourcePluralNames } from './useResourcePluralNames.ts';
import { ErrorDialogHandle } from '../components/Shared/ErrorMessageBox.tsx';
import { fetchApiServerJson } from '../lib/api/fetch.ts';
import { APIError } from '../lib/api/error.ts';
import { useAccessDeniedFeedback } from '../lib/api/access/useAccessDeniedFeedback.ts';
import { resourceAccessAttributes } from '../lib/api/access/resourceAccessAttributes.ts';

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
  const recordDenied = useAccessDeniedFeedback();

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
      recordDenied(e, resourceAccessAttributes(item, pluralKind, 'patch'), 'mcp');
      toast.show(t('ManagedResources.patchError', { resourceName }));
      if (e instanceof APIError && errorDialogRef?.current) {
        errorDialogRef.current.showErrorDialog(`${e.message}: ${JSON.stringify(e.info)}`);
      }
      return false;
    }
  };
};

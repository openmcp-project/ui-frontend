import { ManagedResourceItem } from '../../../shared/types.ts';
import type { ApiConfig } from '../apiConfig.ts';
import type { TFunction } from 'i18next';
import type { RefObject } from 'react';
import { ErrorDialogHandle } from '../../../../components/Shared/ErrorMessageBox.tsx';
import { fetchApiServerJson } from '../../fetch.ts';
import { APIError } from '../../error.ts';

export const handleResourcePatch = async (args: {
  item: ManagedResourceItem;
  parsed: unknown;
  getPluralKind: (kind: string) => string;
  apiConfig: ApiConfig;
  t: TFunction;
  toast: { show: (message: string, duration?: number) => void };
  errorDialogRef?: RefObject<ErrorDialogHandle | null>;
}): Promise<boolean> => {
  const { item, parsed, getPluralKind, apiConfig, t, toast, errorDialogRef } = args;

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

import { useApiResource } from '../../../../lib/api/useApiResource';
import { ManagedResourcesRequest } from '../../../../lib/api/types/crossplane/listManagedResources';
import { resourcesInterval } from '../../../../lib/shared/constants';
import { KpiProps } from './Kpi';
import { useTranslation } from 'react-i18next';

export function useKpiFlux(): KpiProps {
  const { t } = useTranslation();
  const { data, error, isLoading } = useApiResource(ManagedResourcesRequest, {
    refreshInterval: resourcesInterval,
  });

  const managedResources =
    data
      ?.filter((managedResource) => managedResource.items)
      .flatMap((managedResource) =>
        managedResource.items?.map((item) => {
          return {
            isManaged: Boolean(item.metadata?.labels?.['kustomize.toolkit.fluxcd.io/name']),
          };
        }),
      ) ?? [];

  const totalCount = managedResources.length;
  const managedCount = managedResources.filter((mr) => mr.isManaged).length;

  return {
    kpiType: 'progress',
    isLoading,
    error,
    progressValue: managedCount !== 0 ? (100 * managedCount) / totalCount : 0,
    progressLabel: isLoading
      ? t('componentCardFlux.progress')
      : t('componentCardFlux.progressCount', { count: managedCount, total: totalCount }),
  };
}

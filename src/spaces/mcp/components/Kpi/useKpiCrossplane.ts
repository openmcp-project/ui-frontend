import { useApiResource } from '../../../../lib/api/useApiResource.ts';
import { ManagedResourcesRequest } from '../../../../lib/api/types/crossplane/listManagedResources.ts';
import { resourcesInterval } from '../../../../lib/shared/constants.ts';
import { KpiProps } from './Kpi.tsx';
import { useTranslation } from 'react-i18next';

export function useKpiCrossplane(): KpiProps {
  const { t } = useTranslation();
  const { data, error, isLoading } = useApiResource(ManagedResourcesRequest, {
    refreshInterval: resourcesInterval,
  });

  const managedResources =
    data
      ?.filter((managedResource) => managedResource.items)
      .flatMap((managedResource) =>
        managedResource.items?.map((item) => {
          const conditionSynced = item.status?.conditions?.find((condition) => condition.type === 'Synced');
          const conditionReady = item.status?.conditions?.find((condition) => condition.type === 'Ready');

          return {
            synced: conditionSynced?.status === 'True',
            ready: conditionReady?.status === 'True',
          };
        }),
      ) ?? [];

  const totalCount = managedResources.length;
  const healthyCount = managedResources.filter((mr) => mr.ready && mr.synced).length;

  return {
    kpiType: 'progress',
    isLoading,
    error,
    progressValue: healthyCount !== 0 ? (100 * healthyCount) / totalCount : 0,
    progressLabel: isLoading
      ? t('componentCardCrossplane.progress')
      : t('componentCardCrossplane.progressCount', { count: healthyCount, total: totalCount }),
  };
}

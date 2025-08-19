import { useTranslation } from 'react-i18next';
import {
  AnalyticalTable,
  AnalyticalTableColumnDefinition,
  AnalyticalTableScaleWidthMode,
  Title,
} from '@ui5/webcomponents-react';
import { useApiResource } from '../../lib/api/useApiResource';
import { ManagedResourcesRequest } from '../../lib/api/types/crossplane/listManagedResources';
import { formatDateAsTimeAgo } from '../../utils/i18n/timeAgo';
import IllustratedError from '../Shared/IllustratedError';
import '@ui5/webcomponents-icons/dist/sys-enter-2';
import '@ui5/webcomponents-icons/dist/sys-cancel-2';
import { resourcesInterval } from '../../lib/shared/constants';

import { YamlViewButton } from '../Yaml/YamlViewButton.tsx';
import { useMemo } from 'react';
import StatusFilter from '../Shared/StatusFilter/StatusFilter.tsx';
import { ResourceStatusCell } from '../Shared/ResourceStatusCell.tsx';

interface CellData<T> {
  cell: {
    value: T | null; // null for grouping rows
    row: {
      original?: ResourceRow; // missing for grouping rows
    };
  };
}

type ResourceRow = {
  kind: string;
  name: string;
  created: string;
  synced: boolean;
  syncedTransitionTime: string;
  ready: boolean;
  readyTransitionTime: string;
  item: unknown;
  conditionReadyMessage: string;
  conditionSyncedMessage: string;
};

export function ManagedResources() {
  const { t } = useTranslation();

  const {
    data: managedResources,
    error,
    isLoading,
  } = useApiResource(ManagedResourcesRequest, {
    refreshInterval: resourcesInterval, // Resources are quite expensive to fetch, so we refresh every 30 seconds
  });

  const columns: AnalyticalTableColumnDefinition[] = useMemo(
    () => [
      {
        Header: t('ManagedResources.tableHeaderKind'),
        accessor: 'kind',
        show: false,
        display: false, 
      },
      {
        Header: t('ManagedResources.tableHeaderName'),
        accessor: 'name',
      },
      {
        Header: t('ManagedResources.tableHeaderCreated'),
        accessor: 'created',
      },
      {
        Header: t('ManagedResources.tableHeaderSynced'),
        accessor: 'synced',
        hAlign: 'Center',
        width: 125,
        Filter: ({ column }) => <StatusFilter column={column} />,
        Cell: (cellData: CellData<ResourceRow['synced']>) =>
          cellData.cell.row.original?.synced != null ? (
            <ResourceStatusCell
              isOk={cellData.cell.row.original?.synced}
              transitionTime={cellData.cell.row.original?.syncedTransitionTime}
              positiveText={t('common.synced')}
              negativeText={t('errors.syncError')}
              message={cellData.cell.row.original?.conditionSyncedMessage}
            />
          ) : null,
      },
      {
        Header: t('ManagedResources.tableHeaderReady'),
        accessor: 'ready',
        hAlign: 'Center',
        width: 125,
        Filter: ({ column }) => <StatusFilter column={column} />,
        Cell: (cellData: CellData<ResourceRow['ready']>) =>
          cellData.cell.row.original?.ready != null ? (
            <ResourceStatusCell
              isOk={cellData.cell.row.original?.ready}
              transitionTime={cellData.cell.row.original?.readyTransitionTime}
              positiveText={t('common.ready')}
              negativeText={'Not ready'}
              message={cellData.cell.row.original?.conditionReadyMessage}
            />
          ) : null,
      },
      {
        Header: t('yaml.YAML'),
        hAlign: 'Center',
        width: 75,
        accessor: 'yaml',
        disableFilters: true,
        Cell: (cellData: CellData<ResourceRow>) =>
          cellData.cell.row.original?.item ? (
            <YamlViewButton resourceObject={cellData.cell.row.original?.item} />
          ) : undefined,
      },
    ],
    [t],
  );

  const rows: ResourceRow[] =
    managedResources
      ?.filter((managedResource) => managedResource.items)
      .flatMap((managedResource) =>
        managedResource.items?.map((item) => {
          const conditionSynced = item.status?.conditions?.find((condition) => condition.type === 'Synced');
          const conditionReady = item.status?.conditions?.find((condition) => condition.type === 'Ready');

          return {
            kind: item.kind,
            name: item.metadata.name,
            created: formatDateAsTimeAgo(item.metadata.creationTimestamp),
            synced: conditionSynced?.status === 'True',
            syncedTransitionTime: conditionSynced?.lastTransitionTime ?? '',
            ready: conditionReady?.status === 'True',
            readyTransitionTime: conditionReady?.lastTransitionTime ?? '',
            item: item,
            conditionSyncedMessage: conditionSynced?.message ?? conditionSynced?.reason ?? '',
            conditionReadyMessage: conditionReady?.message ?? conditionReady?.reason ?? '',
          };
        }),
      ) ?? [];

  return (
    <>
      <Title level="H4">{t('ManagedResources.header')}</Title>

      {error && <IllustratedError details={error.message} />}

      {!error && (
        <AnalyticalTable
          columns={columns}
          data={rows}
          minRows={1}
          groupBy={['kind']}
          scaleWidthMode={AnalyticalTableScaleWidthMode.Smart}
          loading={isLoading}
          filterable
          // Prevent the table from resetting when the data changes
          retainColumnWidth
          reactTableOptions={{
            autoResetHiddenColumns: false,
            autoResetPage: false,
            autoResetExpanded: false,
            autoResetGroupBy: false,
            autoResetSelectedRows: false,
            autoResetSortBy: false,
            autoResetFilters: false,
            autoResetRowState: false,
            autoResetResize: false,
          }}
        />
      )}
    </>
  );
}

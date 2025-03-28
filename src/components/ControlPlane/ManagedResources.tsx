import { useTranslation } from 'react-i18next';
import {
  AnalyticalTable,
  AnalyticalTableColumnDefinition,
  AnalyticalTableScaleWidthMode,
  Icon,
  Title,
} from '@ui5/webcomponents-react';
import useResource from '../../lib/api/useApiResource';
import { ManagedResourcesRequest } from '../../lib/api/types/crossplane/listManagedResources';
import { timeAgo } from '../../utils/i18n/timeAgo';
import IllustratedError from '../Shared/IllustratedError';
import '@ui5/webcomponents-icons/dist/sys-enter-2';
import '@ui5/webcomponents-icons/dist/sys-cancel-2';
import { resourcesInterval } from '../../lib/shared/constants';
import { StatusCellProps } from '../../lib/shared/interfaces';

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
};

export function ManagedResources() {
  const { t } = useTranslation();

  const {
    data: managedResources,
    error,
    isLoading,
  } = useResource(ManagedResourcesRequest, {
    refreshInterval: resourcesInterval, // Resources are quite expensive to fetch, so we refresh every 30 seconds
  });

  const columns: AnalyticalTableColumnDefinition[] = [
    {
      Header: t('ManagedResources.tableHeaderKind'),
      accessor: 'kind',
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
      Cell: (cellData: CellData<ResourceRow['synced']>) =>
        cellData.cell.row.original?.synced != null ? (
          <ResourceStatusCell
            value={cellData.cell.row.original?.synced}
            transitionTime={cellData.cell.row.original?.syncedTransitionTime}
          />
        ) : null,
    },
    {
      Header: t('ManagedResources.tableHeaderReady'),
      accessor: 'ready',
      Cell: (cellData: CellData<ResourceRow['ready']>) =>
        cellData.cell.row.original?.ready != null ? (
          <ResourceStatusCell
            value={cellData.cell.row.original?.ready}
            transitionTime={cellData.cell.row.original?.readyTransitionTime}
          />
        ) : null,
    },
  ];

  const rows: ResourceRow[] =
    managedResources
      ?.filter((managedResource) => managedResource.items)
      .flatMap((managedResource) =>
        managedResource.items?.map((item) => {
          const conditionSynced = item.status.conditions?.find(
            (condition) => condition.type === 'Synced',
          );
          const conditionReady = item.status.conditions?.find(
            (condition) => condition.type === 'Ready',
          );

          return {
            kind: item.kind,
            name: item.metadata.name,
            created: timeAgo.format(new Date(item.metadata.creationTimestamp)),
            synced: conditionSynced?.status === 'True',
            syncedTransitionTime: conditionSynced?.lastTransitionTime ?? '',
            ready: conditionReady?.status === 'True',
            readyTransitionTime: conditionReady?.lastTransitionTime ?? '',
          };
        }),
      ) ?? [];

  return (
    <>
      <Title level="H4">{t('ManagedResources.headerManagedResources')}</Title>

      {error && <IllustratedError error={error} />}

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

function ResourceStatusCell({ value, transitionTime }: StatusCellProps) {
  return (
    <Icon
      design={value ? 'Positive' : 'Negative'}
      name={value ? 'sys-enter-2' : 'sys-cancel-2'}
      showTooltip={true}
      accessibleName={timeAgo.format(new Date(transitionTime))}
    />
  );
}

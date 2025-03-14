import { useTranslation } from 'react-i18next';
import { AnalyticalTable, AnalyticalTableColumnDefinition, AnalyticalTableScaleWidthMode, Icon, Title } from '@ui5/webcomponents-react';
import useResource from '../../lib/api/useApiResource';
import { ManagedResourcesRequest } from '../../lib/api/types/crossplane/listManagedResources';
import { timeAgo } from '../../utils/i18n/timeAgo';
import IllustratedError from '../Shared/IllustratedError';
import '@ui5/webcomponents-icons/dist/sys-enter-2';
import '@ui5/webcomponents-icons/dist/sys-cancel-2';

interface CellData<T> {
  cell: {
    value: T | null; // null for grouping rows
  };
}

type ResourceRow = {
  kind: string
  name: string
  created: string;
  synced: boolean;
  ready: boolean;
}

export function ManagedResources() {
  const { t } = useTranslation();

  let {data: managedResources, error, isLoading} = useResource(ManagedResourcesRequest, {
    refreshInterval: 30000  // Resources are quite expensive to fetch, so we refresh every 30 seconds
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
      Cell: (cellData: CellData<ResourceRow['synced']>) => <ResourceStatusCell cellData={cellData}/>
    },
    {
      Header: t('ManagedResources.tableHeaderReady'),
      accessor: 'ready',
      Cell: (cellData: CellData<ResourceRow['ready']>) => <ResourceStatusCell cellData={cellData}/>
    },
  ];

  const rows: ResourceRow[] = managedResources?.flatMap((managedResource) =>
    managedResource.items?.map((item) => ({
      kind: item.kind,
      name: item.metadata.name,
      created: timeAgo.format(new Date(item.metadata.creationTimestamp)),
      synced: item.status.conditions?.some((condition) => condition.type === 'Synced') ?? false,
      ready: item.status.conditions?.some((condition) => condition.type === 'Ready') ?? false,
    }))
  ) ?? [];


  return (
    <>
      <Title level='H4'>{t('ManagedResources.headerManagedResources')}</Title>

      {error && <IllustratedError error={error}/>}

      {!error &&
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
            autoResetResize: false
          }}
        />
      }
    </>
  )
}


interface ResourceStatusCellProps {
  cellData: CellData<boolean>;
}

function ResourceStatusCell({ cellData }: ResourceStatusCellProps) {
  const { t } = useTranslation();

  if (cellData.cell.value === null) {
    return null;
  }

  return <Icon
    design={cellData.cell.value ? 'Positive' : 'Negative'}
    accessibleName={cellData.cell.value ? t('ManagedResources.iconAriaYes') : t('ManagedResources.iconAriaNo')}
    name={cellData.cell.value ? 'sys-enter-2' : 'sys-cancel-2'}
  />
}

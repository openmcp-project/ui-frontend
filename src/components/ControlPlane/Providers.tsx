
import { useTranslation } from 'react-i18next';
import { AnalyticalTable, AnalyticalTableColumnDefinition, AnalyticalTableScaleWidthMode, Icon, Title } from '@ui5/webcomponents-react';
import useResource from '../../lib/api/useApiResource';
import IllustratedError from '../Shared/IllustratedError';
import '@ui5/webcomponents-icons/dist/sys-enter-2';
import '@ui5/webcomponents-icons/dist/sys-cancel-2';
import { ProvidersListRequest } from '../../lib/api/types/crossplane/listProviders';
import { resourcesInterval } from '../../lib/shared/constants';
import { timeAgo } from '../../utils/i18n/timeAgo';
import { StatusCellProps } from '../../lib/shared/interfaces';

interface CellData<T> {
  cell: {
    value: T | null; // null for grouping rows
    row: {
      original?: providersRow; // missing for grouping rows
    }
  };
}

type providersRow = {
  name: string
  version: string;
  healthy: boolean;
  healthyTransitionTime: string;
  installed: boolean;
  installedTransitionTime: string;
  created: string;
}

export function Providers() {
  const { t } = useTranslation();

  let {data: providers, error, isLoading} = useResource(ProvidersListRequest, {
    refreshInterval: resourcesInterval
  });

  const columns: AnalyticalTableColumnDefinition[] = [
    {
      Header: t('Providers.tableHeaderName'),
      accessor: 'name',
    },
    {
      Header: t('Providers.tableHeaderVersion'),
      accessor: 'version',
    },
    {
      Header: t('Providers.tableHeaderInstalled'),
      accessor: 'installed',
      Cell: (cellData: CellData<providersRow['installed']>) => cellData.cell.row.original?.installed != null ? <ResourceStatusCell value={cellData.cell.row.original?.installed} transitionTime={cellData.cell.row.original?.installedTransitionTime} /> : null
    },
    {
      Header: t('Providers.tableHeaderHealthy'),
      accessor: 'healthy',
      Cell: (cellData: CellData<providersRow['healthy']>) => cellData.cell.row.original?.installed != null ? <ResourceStatusCell value={cellData.cell.row.original?.healthy} transitionTime={cellData.cell.row.original?.healthyTransitionTime} /> : null
    },
    {
      Header: t('Providers.tableHeaderCreated'),
      accessor: 'created',
    },
  ];

  const rows: providersRow[] =
    providers?.items?.map((item) => {
      const installed = item.status.conditions?.find((condition) => condition.type === 'Installed');
      const healhty = item.status.conditions?.find((condition) => condition.type === 'Healthy');

      return {
        name: item.metadata.name,
        created: timeAgo.format(new Date(item.metadata.creationTimestamp)),
        installed: installed?.status === "True",
        installedTransitionTime: installed?.lastTransitionTime ?? "",
        healthy: healhty?.status === "True",
        healthyTransitionTime: healhty?.lastTransitionTime ?? "",
        version: item.spec.package.match(/\d+(\.\d+)+/g),
      }
    })
  ?? [];

  return (
    <>
      <Title level='H4'>{t('Providers.headerProviders')}</Title>

      {error && <IllustratedError error={error}/>}

      {!error &&
        <AnalyticalTable
          columns={columns}
          data={rows}
          minRows={1}
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

function ResourceStatusCell({ value, transitionTime }: StatusCellProps) {
  return <Icon
    design={value ? 'Positive' : 'Negative'}
    name={value ? 'sys-enter-2' : 'sys-cancel-2'}
    showTooltip={true}
    accessibleName={timeAgo.format(new Date(transitionTime))}
  />
}

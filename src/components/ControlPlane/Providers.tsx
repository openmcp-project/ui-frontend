import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AnalyticalTable,
  AnalyticalTableColumnDefinition,
  AnalyticalTableScaleWidthMode,
  Title,
} from '@ui5/webcomponents-react';

import { useApiResource } from '../../lib/api/useApiResource';
import IllustratedError from '../Shared/IllustratedError';
import { ProvidersListRequest } from '../../lib/api/types/crossplane/listProviders';
import { resourcesInterval } from '../../lib/shared/constants';
import { timeAgo } from '../../utils/i18n/timeAgo';

import { YamlViewButton } from '../Yaml/YamlViewButton.tsx';

import '@ui5/webcomponents-icons/dist/sys-enter-2';
import '@ui5/webcomponents-icons/dist/sys-cancel-2';
import StatusFilter from '../Shared/StatusFilter/StatusFilter.tsx';
import { ResourceStatusCellWithButton } from '../Shared/ResourceStatusCellWithButton.tsx';

interface CellData<T> {
  cell: {
    value: T | null;
    row: {
      original?: ProvidersRow;
    };
  };
}

type ProvidersRow = {
  name: string;
  version: string;
  healthy: string;
  healthyTransitionTime: string;
  healthyMessage: string;
  installed: string;
  installedTransitionTime: string;
  installedMessage: string;
  created: string;
  item: unknown;
};

export function Providers() {
  const { t } = useTranslation();

  const {
    data: providers,
    error,
    isLoading,
  } = useApiResource(ProvidersListRequest, {
    refreshInterval: resourcesInterval,
  });

  const columns: AnalyticalTableColumnDefinition[] = useMemo(
    () => [
      {
        Header: t('Providers.tableHeaderName'),
        accessor: 'name',
      },
      {
        Header: t('Providers.tableHeaderVersion'),
        accessor: 'version',
      },
      {
        Header: t('Providers.tableHeaderCreated'),
        accessor: 'created',
      },
      {
        Header: t('Providers.tableHeaderInstalled'),
        accessor: 'installed',
        hAlign: 'Center',
        width: 125,
        Filter: ({ column }) => <StatusFilter column={column} />,
        filter: 'equals',
        Cell: (cellData: CellData<ProvidersRow['installed']>) =>
          cellData.cell.row.original?.installed != null ? (
            <ResourceStatusCellWithButton
              value={cellData.cell.row.original?.installed === 'true'}
              transitionTime={cellData.cell.row.original?.installedTransitionTime}
              positiveText={'Installed'}
              negativeText={'Install error'}
              message={cellData.cell.row.original?.installedMessage}
            />
          ) : null,
      },
      {
        Header: t('Providers.tableHeaderHealthy'),
        accessor: 'healthy',
        hAlign: 'Center',
        width: 125,
        Filter: ({ column }) => <StatusFilter column={column} />,
        filter: 'equals',
        Cell: (cellData: CellData<ProvidersRow['healthy']>) =>
          cellData.cell.row.original?.installed != null ? (
            <ResourceStatusCellWithButton
              value={cellData.cell.row.original?.healthy === 'true'}
              transitionTime={cellData.cell.row.original?.healthyTransitionTime}
              positiveText={'Healthy'}
              negativeText={'Not healthy'}
              message={cellData.cell.row.original?.healthyMessage}
            />
          ) : null,
      },
      {
        Header: t('yaml.YAML'),
        hAlign: 'Center',
        width: 75,
        accessor: 'yaml',
        disableFilters: true,
        Cell: (cellData: CellData<ProvidersRow>) => (
          <YamlViewButton resourceObject={cellData.cell.row.original?.item} />
        ),
      },
    ],
    [t],
  );

  const rows: ProvidersRow[] =
    providers?.items?.map((item) => {
      const installed = item.status?.conditions?.find((condition) => condition.type === 'Installed');
      const healthy = item.status?.conditions?.find((condition) => condition.type === 'Healthy');
      return {
        name: item.metadata.name,
        created: timeAgo.format(new Date(item.metadata.creationTimestamp)),
        installed: installed?.status === 'True' ? 'true' : 'false',
        installedTransitionTime: installed?.lastTransitionTime ?? '',
        healthy: healthy?.status === 'True' ? 'true' : 'false',
        healthyTransitionTime: healthy?.lastTransitionTime ?? '',
        version: item.spec.package.match(/\d+(\.\d+)+/g)?.toString() ?? '',
        item: item,
        healthyMessage: healthy?.message ?? healthy?.reason ?? '',
        installedMessage: installed?.message ?? installed?.reason ?? '',
      };
    }) ?? [];

  return (
    <>
      <Title level="H4">{t('Providers.headerProviders')}</Title>

      {error && <IllustratedError details={error.message} />}

      {!error && (
        <AnalyticalTable
          columns={columns}
          data={rows}
          minRows={1}
          scaleWidthMode={AnalyticalTableScaleWidthMode.Smart}
          loading={isLoading}
          filterable
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

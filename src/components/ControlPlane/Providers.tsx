import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AnalyticalTable,
  AnalyticalTableColumnDefinition,
  AnalyticalTableScaleWidthMode,
  Panel,
  Title,
  Toolbar,
  ToolbarSpacer,
} from '@ui5/webcomponents-react';

import { useApiResource } from '../../lib/api/useApiResource';
import IllustratedError from '../Shared/IllustratedError';
import { ProvidersListRequest } from '../../lib/api/types/crossplane/listProviders';
import { resourcesInterval } from '../../lib/shared/constants';
import { formatDateAsTimeAgo } from '../../utils/i18n/timeAgo';

import { YamlViewButton } from '../Yaml/YamlViewButton.tsx';

import '@ui5/webcomponents-icons/dist/sys-enter-2';
import '@ui5/webcomponents-icons/dist/sys-cancel-2';
import StatusFilter from '../Shared/StatusFilter/StatusFilter.tsx';
import { ResourceStatusCell } from '../Shared/ResourceStatusCell.tsx';
import { Resource } from '../../utils/removeManagedFieldsAndFilterData.ts';

interface CellData<T> {
  cell: {
    value: T | undefined;
    row: {
      original: Record<string, unknown>;
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
        Cell: (cellData: CellData<string>) =>
          cellData.cell.row.original?.installed != null ? (
            <ResourceStatusCell
              isOk={cellData.cell.row.original?.installed === 'true'}
              transitionTime={cellData.cell.row.original?.installedTransitionTime as string}
              positiveText={t('common.installed')}
              negativeText={t('errors.installError')}
              message={cellData.cell.row.original?.installedMessage as string}
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
        Cell: (cellData: CellData<string>) =>
          cellData.cell.row.original?.installed != null ? (
            <ResourceStatusCell
              isOk={cellData.cell.row.original?.healthy === 'true'}
              transitionTime={cellData.cell.row.original?.healthyTransitionTime as string}
              positiveText={t('common.healthy')}
              negativeText={t('errors.notHealthy')}
              message={cellData.cell.row.original?.healthyMessage as string}
            />
          ) : null,
      },
      {
        Header: t('yaml.YAML'),
        hAlign: 'Center',
        width: 75,
        accessor: 'yaml',
        disableFilters: true,
        Cell: (cellData: CellData<string>) => (
          <YamlViewButton variant="resource" resource={cellData.cell.row.original?.item as Resource} />
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
        created: formatDateAsTimeAgo(item.metadata.creationTimestamp),
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
      {error && <IllustratedError details={error.message} />}

      {!error && (
        <Panel
          fixed
          header={
            <Toolbar>
              <Title>{t('common.resourcesCount', { count: rows.length })}</Title>
              <ToolbarSpacer />
            </Toolbar>
          }
        >
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
        </Panel>
      )}
    </>
  );
}

import { useTranslation } from 'react-i18next';
import {
  AnalyticalTable,
  AnalyticalTableColumnDefinition,
  AnalyticalTableScaleWidthMode,
  Title,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/sys-enter-2';
import '@ui5/webcomponents-icons/dist/sys-cancel-2';
import { useProvidersConfigResource } from '../../lib/api/useApiResource';
import { formatDateAsTimeAgo } from '../../utils/i18n/timeAgo';

import { YamlViewButton } from '../Yaml/YamlViewButton.tsx';

import { useMemo } from 'react';
import { Resource } from '../../utils/removeManagedFieldsAndFilterData.ts';

type Rows = {
  parent: string;
  name: string;
  usage: string;
  created: string;
  resource: unknown;
};

interface CellData<T> {
  cell: {
    value: T | null; // null for grouping rows
    row: {
      original?: Rows; // missing for grouping rows
    };
  };
}

export function ProvidersConfig() {
  const { t } = useTranslation();
  const rows: Rows[] = [];

  const { data: providerConfigsList, isLoading } = useProvidersConfigResource({
    refreshInterval: 60000, // Resources are quite expensive to fetch, so we refresh every 60 seconds
  });

  if (providerConfigsList) {
    providerConfigsList.forEach((provider) => {
      provider.items.forEach((config) => {
        rows.push({
          parent: provider.provider,
          name: config.metadata.name,
          usage: config?.status?.users ?? '0',
          created: formatDateAsTimeAgo(config.metadata.creationTimestamp),
          resource: config,
        });
      });
    });
  }

  const columns: AnalyticalTableColumnDefinition[] = useMemo(
    () => [
      {
        Header: t('ProvidersConfig.tableHeaderProvider'),
        accessor: 'parent',
      },
      {
        Header: t('ProvidersConfig.tableHeaderName'),
        accessor: 'name',
      },
      {
        Header: t('ProvidersConfig.tableHeaderUsage'),
        accessor: 'usage',
      },
      {
        Header: t('ProvidersConfig.tableHeaderCreated'),
        accessor: 'created',
      },
      {
        Header: t('yaml.YAML'),
        hAlign: 'Center',
        width: 75,
        accessor: 'yaml',
        disableFilters: true,
        Cell: (cellData: CellData<Rows>) =>
          cellData.cell.row.original?.resource ? (
            <YamlViewButton variant="resource" resource={cellData.cell.row.original?.resource as Resource} />
          ) : undefined,
      },
    ],
    [t],
  );

  return (
    <>
      <Title level="H4">{t('ProvidersConfig.headerProviderConfigs')}</Title>
      <AnalyticalTable
        columns={columns}
        data={rows ?? []}
        minRows={1}
        groupBy={['parent']}
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
    </>
  );
}

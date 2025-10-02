import ConfiguredAnalyticstable from '../Shared/ConfiguredAnalyticsTable.tsx';
import { AnalyticalTableColumnDefinition, Panel, Title, Toolbar, ToolbarSpacer } from '@ui5/webcomponents-react';
import IllustratedError from '../Shared/IllustratedError.tsx';
import { useApiResource } from '../../lib/api/useApiResource';
import { FluxKustomization } from '../../lib/api/types/flux/listKustomization';
import { useTranslation } from 'react-i18next';
import { formatDateAsTimeAgo } from '../../utils/i18n/timeAgo.ts';

import { YamlViewButton } from '../Yaml/YamlViewButton.tsx';
import { useMemo } from 'react';
import StatusFilter from '../Shared/StatusFilter/StatusFilter.tsx';
import { ResourceStatusCell } from '../Shared/ResourceStatusCell.tsx';
import { Resource } from '../../utils/removeManagedFieldsAndFilterData.ts';

export function Kustomizations() {
  const { data, error, isLoading } = useApiResource(FluxKustomization); //404 if component not enabled
  const { t } = useTranslation();

  interface CellData<T> {
    cell: {
      value: T | null; // null for grouping rows
      row: {
        original?: FluxRow; // missing for grouping rows
      };
    };
  }

  type FluxRow = {
    name: string;
    created: string;
    isReady: boolean;
    statusUpdateTime?: string;
    item: unknown;
    readyMessage: string;
  };

  const columns: AnalyticalTableColumnDefinition[] = useMemo(
    () => [
      {
        Header: t('FluxList.tableNameHeader'),
        accessor: 'name',
        minWidth: 250,
      },
      {
        Header: t('FluxList.tableCreatedHeader'),
        accessor: 'created',
      },
      {
        Header: t('FluxList.tableStatusHeader'),
        accessor: 'status',
        width: 125,
        hAlign: 'Center',
        Filter: ({ column }) => <StatusFilter column={column} />,
        Cell: (cellData: CellData<FluxRow['isReady']>) =>
          cellData.cell.row.original?.isReady != null ? (
            <ResourceStatusCell
              positiveText={t('common.ready')}
              negativeText={t('common.error')}
              isOk={cellData.cell.row.original?.isReady}
              transitionTime={
                cellData.cell.row.original?.statusUpdateTime ? cellData.cell.row.original?.statusUpdateTime : ''
              }
              message={cellData.cell.row.original?.readyMessage}
            />
          ) : null,
      },

      {
        Header: t('yaml.YAML'),
        hAlign: 'Center',
        width: 75,
        accessor: 'yaml',
        disableFilters: true,
        Cell: (cellData: CellData<FluxRow>) => (
          <YamlViewButton variant="resource" resource={cellData.cell.row.original?.item as Resource} />
        ),
      },
    ],
    [t],
  );

  if (error) {
    return (
      <IllustratedError
        details={error?.message || t('FluxList.undefinedError')}
        title={t('FluxList.noFluxError')}
        compact={true}
      />
    );
  }

  const rows: FluxRow[] =
    data?.items?.map((item) => {
      const readyObject = item.status?.conditions?.find((x) => x.type === 'Ready');
      return {
        name: item.metadata.name,
        isReady: readyObject?.status === 'True',
        statusUpdateTime: readyObject?.lastTransitionTime,
        created: formatDateAsTimeAgo(item.metadata.creationTimestamp),
        item: item,
        readyMessage: readyObject?.message ?? readyObject?.reason ?? '',
      };
    }) ?? [];

  return (
    <Panel
      fixed
      header={
        <Toolbar>
          <Title>{t('common.resourcesCount', { count: rows.length })}</Title>
          <YamlViewButton variant="resource" resource={data as unknown as Resource} />
          <ToolbarSpacer />
        </Toolbar>
      }
    >
      <ConfiguredAnalyticstable columns={columns} isLoading={isLoading} data={rows} />
    </Panel>
  );
}

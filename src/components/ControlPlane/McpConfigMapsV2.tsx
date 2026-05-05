import {
  AnalyticalTableColumnDefinition,
  Option,
  Panel,
  Select,
  Title,
  Toolbar,
  ToolbarSpacer,
} from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import { formatDateAsTimeAgo } from '../../utils/i18n/timeAgo.ts';
import { isForbiddenError } from '../../utils/isForbiddenError.ts';
import type { Resource } from '../../utils/removeManagedFieldsAndFilterData.ts';
import ConfiguredAnalyticstable from '../Shared/ConfiguredAnalyticsTable.tsx';
import IllustratedError from '../Shared/IllustratedError.tsx';
import { YamlViewButton } from '../Yaml/YamlViewButton.tsx';
import { useConfigMapsQuery } from './useConfigMapsQuery.ts';

type ConfigMapRow = {
  name: string;
  namespace?: string;
  created?: string;
  item: Resource;
};

export function McpConfigMapsV2() {
  const { t } = useTranslation();
  const { configMaps, namespaces, selectedNamespace, onNamespaceChange, isLoading, error } = useConfigMapsQuery();

  const isForbidden = isForbiddenError(error);

  const rows: ConfigMapRow[] = !isForbidden
    ? configMaps.map((cm) => ({
        name: cm.metadata?.name ?? '',
        namespace: cm.metadata?.namespace ?? undefined,
        created: cm.metadata?.creationTimestamp ? formatDateAsTimeAgo(cm.metadata.creationTimestamp) : '',
        item: cm as unknown as Resource,
      }))
    : [];

  const columns: AnalyticalTableColumnDefinition[] = [
    { Header: t('common.name'), accessor: 'name', minWidth: 200 },
    { Header: t('common.namespace'), accessor: 'namespace' },
    { Header: t('common.created'), accessor: 'created' },
    {
      Header: t('common.file'),
      accessor: 'file',
      hAlign: 'Center',
      width: 75,
      disableFilters: true,
      Cell: ({ row }) => {
        const item = (row.original as ConfigMapRow)?.item;
        return item ? <YamlViewButton variant="resource" resource={item} /> : null;
      },
    },
  ];

  return (
    <Panel
      fixed
      header={
        <Toolbar>
          <Title>{t('common.itemsCount', { count: rows.length })}</Title>
          <ToolbarSpacer />
          <Select onChange={onNamespaceChange}>
            {namespaces.map((ns) => (
              <Option key={ns} selected={ns === selectedNamespace}>
                {ns}
              </Option>
            ))}
          </Select>
        </Toolbar>
      }
    >
      <ConfiguredAnalyticstable columns={columns} isLoading={isLoading} data={rows} />
      {!isForbidden && error && <IllustratedError compact={true} details={error.message} title={t('errors.error')} />}
    </Panel>
  );
}

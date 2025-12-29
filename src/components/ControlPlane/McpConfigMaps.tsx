import ConfiguredAnalyticstable from '../Shared/ConfiguredAnalyticsTable.tsx';
import {
  AnalyticalTableColumnDefinition,
  Panel,
  Title,
  Toolbar,
  ToolbarSpacer,
  Select,
  Option,
} from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import { useApiResource as _useApiResource } from '../../lib/api/useApiResource.ts';
import { ConfigMapsResource, type ConfigMapListItem } from '../../lib/api/types/k8s/listConfigMaps.ts';
import { YamlViewButton } from '../Yaml/YamlViewButton.tsx';
import type { Resource } from '../../utils/removeManagedFieldsAndFilterData.ts';
import { isForbiddenError } from '../../utils/isForbiddenError.ts';
import { useNamespaceSelect } from '../../hooks/useNamespaceSelect.ts';

type ConfigMapRow = {
  name: string;
  namespace?: string;
  created?: string;
  item: ConfigMapListItem;
};

type ConfigMapItemWithMetadata = {
  metadata: {
    name: string;
    namespace?: string;
    creationTimestamp?: string;
  };
};

export function McpConfigMaps({
  useApiResource = _useApiResource,
}: {
  useApiResource?: typeof _useApiResource;
} = {}) {
  const { t } = useTranslation();

  const { namespaces, selectedNamespace, onNamespaceChange } = useNamespaceSelect({ useApiResource });

  const { data: configMapsData, error, isLoading } = useApiResource(ConfigMapsResource(selectedNamespace));
  const isForbidden = isForbiddenError(error);

  const rows = !isForbidden
    ? ((configMapsData ?? []) as ConfigMapListItem[]).map((cm) => {
        const item = cm as unknown as Partial<ConfigMapItemWithMetadata>;
        return {
          name: item.metadata?.name ?? '',
          namespace: item.metadata?.namespace,
          created: item.metadata?.creationTimestamp,
          item: cm,
        };
      })
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
        return item ? <YamlViewButton variant="resource" resource={item as unknown as Resource} /> : null;
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
      {!isForbidden && error && <span>{error.message}</span>}
    </Panel>
  );
}

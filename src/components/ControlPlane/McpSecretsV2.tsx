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
import { useSecretsQuery } from './useSecretsQuery.ts';

type SecretRow = {
  name: string;
  namespace?: string;
  type?: string;
  created?: string;
  item: Resource;
};

export function McpSecretsV2() {
  const { t } = useTranslation();
  const { secrets, namespaces, selectedNamespace, onNamespaceChange, isLoading, error } = useSecretsQuery();

  const isForbidden = isForbiddenError(error);

  const rows: SecretRow[] = !isForbidden
    ? secrets.map((secret) => ({
        name: secret.metadata?.name ?? '',
        namespace: secret.metadata?.namespace ?? undefined,
        type: secret.type ?? undefined,
        created: secret.metadata?.creationTimestamp ? formatDateAsTimeAgo(secret.metadata.creationTimestamp) : '',
        item: secret as unknown as Resource,
      }))
    : [];

  const columns: AnalyticalTableColumnDefinition[] = [
    { Header: t('common.name'), accessor: 'name', minWidth: 200 },
    { Header: t('common.namespace'), accessor: 'namespace' },
    { Header: t('McpPage.secretTypeHeader'), accessor: 'type' },
    { Header: t('common.created'), accessor: 'created' },
    {
      Header: t('common.file'),
      accessor: 'file',
      hAlign: 'Center',
      width: 75,
      disableFilters: true,
      Cell: ({ row }) => {
        const item = (row.original as SecretRow)?.item;
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

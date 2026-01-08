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
import { SecretsResource, type SecretListItem } from '../../lib/api/types/k8s/listSecrets.ts';
import type { Resource as ApiResource } from '../../lib/api/types/resource.ts';
import { YamlViewButton } from '../Yaml/YamlViewButton.tsx';
import type { Resource } from '../../utils/removeManagedFieldsAndFilterData.ts';
import { isForbiddenError } from '../../utils/isForbiddenError.ts';
import { useNamespaceSelect } from '../../hooks/useNamespaceSelect.ts';
import IllustratedError from '../Shared/IllustratedError.tsx';

type SecretRow = {
  name: string;
  namespace?: string;
  type?: string;
  created?: string;
  item: SecretListItem;
};

export function McpSecrets({
  useApiResource = _useApiResource,
}: {
  useApiResource?: typeof _useApiResource;
} = {}) {
  const { t } = useTranslation();

  const { namespaces, selectedNamespace, onNamespaceChange } = useNamespaceSelect({ useApiResource });

  const noopSecretsResource: ApiResource<SecretListItem[]> = {
    path: '/__noop__/k8s/secrets',
    jq: '[]',
  };

  const secretsResource = selectedNamespace ? SecretsResource(selectedNamespace) : noopSecretsResource;

  const { data, error, isLoading } = useApiResource(secretsResource);

  const isForbidden = isForbiddenError(error);

  const rows: SecretRow[] = !isForbidden
    ? (data ?? []).map((secret) => ({
        name: secret.metadata.name,
        namespace: secret.metadata.namespace,
        type: secret.type,
        created: secret.metadata.creationTimestamp,
        item: secret,
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
      {!isForbidden && error && <IllustratedError compact={true} details={error.message} title={t('errors.error')} />}
    </Panel>
  );
}

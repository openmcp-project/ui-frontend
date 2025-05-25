import { useTranslation } from 'react-i18next';
import {
  AnalyticalTable,
  AnalyticalTableColumnDefinition,
  AnalyticalTableScaleWidthMode,
  Title,
  MultiComboBox,
  MultiComboBoxItem,
} from '@ui5/webcomponents-react';
import useResource from '../../lib/api/useApiResource';
import { ListNamespaces } from '../../lib/api/types/k8s/listNamespaces';
import { useEffect, useState, useContext } from 'react';
import { resourcesInterval } from '../../lib/shared/constants';
import { InstalationsRequest } from '../../lib/api/types/landscaper/listInstallations';
import { ExecutionsRequest } from '../../lib/api/types/landscaper/listExecutions';
import { DeployItemsRequest } from '../../lib/api/types/landscaper/listDeployItems';
import { ApiConfigContext } from '../../components/Shared/k8s';
import { fetchApiServerJson } from '../../lib/api/fetch';

export function Landscapers() {
  const { t } = useTranslation();
  const apiConfig = useContext(ApiConfigContext);

  const { data: namespaces } = useResource(ListNamespaces, {
    refreshInterval: resourcesInterval,
  });

  const [selectedNamespaces, setSelectedNamespaces] = useState<string[]>([]);
  const [installations, setInstallations] = useState<any[]>([]);
  const [executions, setExecutions] = useState<any[]>([]);
  const [deployItems, setDeployItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSelectionChange = (e: CustomEvent) => {
    const selectedItems = Array.from(e.detail.items || []);
    const selectedValues = selectedItems.map((item: any) => item.text);
    setSelectedNamespaces(selectedValues);
  };

  useEffect(() => {
    const fetchAllResources = async () => {
      if (selectedNamespaces.length === 0) {
        setInstallations([]);
        setExecutions([]);
        setDeployItems([]);
        return;
      }

      setLoading(true);

      try {
        // === INSTALLATIONS ===
        const installationPaths = selectedNamespaces
          .map((ns) => InstalationsRequest(ns).path)
          .filter((p): p is string => p !== null && p !== undefined);

        const installationResponses = await Promise.all(
          installationPaths.map((path) => fetchApiServerJson(path, apiConfig)),
        );

        const installationsData = installationResponses.flatMap(
          (res) => res.items || [],
        );
        setInstallations(installationsData);

        // === EXECUTIONS ===
        const executionPaths = selectedNamespaces
          .map((ns) => ExecutionsRequest(ns).path)
          .filter((p): p is string => p !== null && p !== undefined);

        const executionResponses = await Promise.all(
          executionPaths.map((path) => fetchApiServerJson(path, apiConfig)),
        );

        const executionsData = executionResponses.flatMap(
          (res) => res.items || [],
        );
        setExecutions(executionsData);

        // === DEPLOY ITEMS ===
        const deployPaths = selectedNamespaces
          .map((ns) => DeployItemsRequest(ns).path)
          .filter((p): p is string => p !== null && p !== undefined);

        const deployResponses = await Promise.all(
          deployPaths.map((path) => fetchApiServerJson(path, apiConfig)),
        );

        const deployItemsData = deployResponses.flatMap((res) => res.items || []);
        setDeployItems(deployItemsData);
      } catch (error) {
        console.error(error);
        setInstallations([]);
        setExecutions([]);
        setDeployItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllResources();
  }, [selectedNamespaces, apiConfig]);

  const columns: AnalyticalTableColumnDefinition[] = [
    {
      Header: t('Namespace'),
      accessor: 'metadata.namespace',
    },
    {
      Header: t('Name'),
      accessor: 'metadata.name',
    },
    {
      Header: t('Phase'),
      accessor: 'status.phase',
    },
    {
      Header: t('Created At'),
      accessor: 'metadata.creationTimestamp',
    },
  ];

  const renderRowSubComponent = (row: any) => {
    const installation = row.original;

    const relatedExecutions = executions.filter((execution) =>
      execution.metadata.ownerReferences?.some(
        (ref) => ref.uid === installation.metadata.uid,
      ),
    );

    const relatedDeployItems = deployItems.filter((deploy) =>
      deploy.metadata.ownerReferences?.some(
        (ref) => ref.uid === installation.metadata.uid,
      ),
    );

    return (
      <div style={{ padding: '10px', backgroundColor: '#f4f4f4' }}>
        <h5>{t('Executions')}</h5>
        {relatedExecutions.length > 0 ? (
          <ul>
            {relatedExecutions.map((execution: any) => (
              <li key={execution.metadata.uid}>
                {execution.metadata.name} – {execution.status.phase}
              </li>
            ))}
          </ul>
        ) : (
          <p>{t('No executions found')}</p>
        )}

        <h5 style={{ marginTop: '1rem' }}>{t('Deploy Items')}</h5>
        {relatedDeployItems.length > 0 ? (
          <ul>
            {relatedDeployItems.map((deploy: any) => (
              <li key={deploy.metadata.uid}>
                {deploy.metadata.name} – {deploy.status.phase}
              </li>
            ))}
          </ul>
        ) : (
          <p>{t('No deploy items found')}</p>
        )}
      </div>
    );
  };

  return (
    <>
      <Title level="H4">{t('Providers.headerProviders')}</Title>

      {namespaces && (
        <MultiComboBox
          placeholder={t('Select namespace')}
          style={{ marginBottom: '1rem', maxWidth: '400px' }}
          onSelectionChange={handleSelectionChange}
        >
          {namespaces.map((ns) => (
            <MultiComboBoxItem key={ns.metadata.name} text={ns.metadata.name} />
          ))}
        </MultiComboBox>
      )}

      <AnalyticalTable
        columns={columns}
        data={installations}
        minRows={1}
        loading={loading}
        scaleWidthMode={AnalyticalTableScaleWidthMode.Smart}
        filterable
        retainColumnWidth
        renderRowSubComponent={renderRowSubComponent}
        subComponentsBehavior="IncludeHeightExpandable"
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

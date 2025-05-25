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
import '@ui5/webcomponents-icons/dist/sys-enter-2';
import '@ui5/webcomponents-icons/dist/sys-cancel-2';
import { ListNamespaces } from '../../lib/api/types/k8s/listNamespaces';
import { useEffect, useState } from 'react';
import { resourcesInterval } from '../../lib/shared/constants';
import { InstalationsRequest } from '../../lib/api/types/landscaper/listInstallations';

export function Landscapers() {
  const { t } = useTranslation();

  // Namespaces z API
  const { data: namespaces, error: namespacesError } = useResource(
    ListNamespaces,
    {
      refreshInterval: resourcesInterval,
    },
  );

  const [selectedNamespaces, setSelectedNamespaces] = useState<string[]>([]);
  const [installations, setInstallations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Handler wyboru namespace’ów
  const handleSelectionChange = (e: CustomEvent) => {
    const selectedItems = Array.from(e.detail.items || []);
    const selectedValues = selectedItems.map((item: any) => item.text);
    setSelectedNamespaces(selectedValues);
  };

  // Fetch installations, gdy zmienią się namespace’y
  useEffect(() => {
    const fetchInstallations = async () => {
      if (selectedNamespaces.length === 0) {
        setInstallations([]);
        return;
      }
      setLoading(true);
      try {
        const paths = selectedNamespaces
          .map((ns) => InstalationsRequest(ns).path)
          .filter((p): p is string => p !== null && p !== undefined);

        const allResponses = await Promise.all(
          paths.map((path) => fetch(path).then((res) => res.json())),
        );

        const allItems = allResponses.flatMap((res) => res.items || []);
        setInstallations(allItems);
      } catch (error) {
        console.error(error);
        setInstallations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInstallations();
  }, [selectedNamespaces]);

  // Definicja kolumn tabeli
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

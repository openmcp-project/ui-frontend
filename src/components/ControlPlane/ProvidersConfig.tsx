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
import '@ui5/webcomponents-icons/dist/sys-enter-2';
import '@ui5/webcomponents-icons/dist/sys-cancel-2';
import { useProvidersConfigResource } from '../../lib/api/useApiResource';
import { formatDateAsTimeAgo } from '../../utils/i18n/timeAgo';

import { YamlViewButton } from '../Yaml/YamlViewButton.tsx';

import { useCallback, useContext, useMemo, useRef } from 'react';
import { Resource } from '../../utils/removeManagedFieldsAndFilterData.ts';
import { ProviderConfigItem } from '../../lib/shared/types.ts';
import { ProviderConfigsRowActionsMenu } from './ProviderConfigsActionMenu.tsx';
import { useSplitter } from '../Splitter/SplitterContext.tsx';
import { YamlSidePanel } from '../Yaml/YamlSidePanel.tsx';
import { handleResourcePatch } from '../../lib/api/types/crossplane/handleResourcePatch.ts';
import { useToast } from '../../context/ToastContext.tsx';
import { useResourcePluralNames } from '../../hooks/useResourcePluralNames';
import { ApiConfigContext } from '../Shared/k8s';
import { ErrorDialog, ErrorDialogHandle } from '../Shared/ErrorMessageBox.tsx';

type Rows = {
  parent: string;
  name: string;
  usage: string;
  created: string;
  resource: ProviderConfigItem;
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
  const { openInAside } = useSplitter();
  const toast = useToast();
  const apiConfig = useContext(ApiConfigContext);
  const errorDialogRef = useRef<ErrorDialogHandle>(null);

  const rows: Rows[] = [];

  const { data: providerConfigsList, isLoading } = useProvidersConfigResource({
    refreshInterval: 60000, // Resources are quite expensive to fetch, so we refresh every 60 seconds
  });

  const { getPluralKind } = useResourcePluralNames();

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

  const openEditPanel = useCallback(
    (item: ProviderConfigItem) => {
      const identityKey = `${item.kind}:${item.metadata.name}`;
      openInAside(
        <>
          <YamlSidePanel
            isEdit={true}
            resource={item as unknown as Resource}
            filename={`${item.kind}_${item.metadata.name}`}
            onApply={async (parsed) =>
              await handleResourcePatch({
                item: item as unknown as any, // cast to align with expected shape
                parsed,
                getPluralKind,
                apiConfig,
                t,
                toast,
                errorDialogRef,
              })
            }
          />
        </>,
      );
    },
    [openInAside, getPluralKind, apiConfig, t, toast],
  );

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
            <YamlViewButton variant="resource" resource={cellData.cell.row.original?.resource as unknown as Resource} />
          ) : undefined,
      },
      {
        Header: t('ManagedResources.actionColumnHeader'),
        hAlign: 'Center',
        width: 60,
        disableFilters: true,
        accessor: 'actions',
        Cell: (cellData: CellData<Rows>) => {
          const item = cellData.cell.row.original?.resource;
          return item ? <ProviderConfigsRowActionsMenu item={item} onEdit={openEditPanel} /> : undefined;
        },
      },
    ],
    [t, openEditPanel],
  );

  return (
    <Panel
      fixed
      header={
        <Toolbar>
          <Title>{t('common.resourcesCount', { count: rows.length })}</Title>
          <ToolbarSpacer />
        </Toolbar>
      }
    >
      <>
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
        <ErrorDialog ref={errorDialogRef} />
      </>
    </Panel>
  );
}

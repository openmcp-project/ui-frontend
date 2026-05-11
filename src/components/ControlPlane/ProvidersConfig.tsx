import { useTranslation } from 'react-i18next';
import {
  AnalyticalTable,
  AnalyticalTableColumnDefinition,
  AnalyticalTableScaleWidthMode,
  Button,
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

import { Fragment, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Resource } from '../../utils/removeManagedFieldsAndFilterData.ts';
import { ProviderConfigItem } from '../../lib/shared/types.ts';
import { ActionsMenu, type ActionItem } from './ActionsMenu';
import { useSplitter } from '../Splitter/SplitterContext.tsx';
import { YamlSidePanel } from '../Yaml/YamlSidePanel.tsx';
import { useHandleResourcePatch } from '../../hooks/useHandleResourcePatch.ts';
import { ErrorDialog, ErrorDialogHandle } from '../Shared/ErrorMessageBox.tsx';

import { ApiConfigContext } from '../Shared/k8s';
import { useHasMcpAdminRights } from '../../spaces/mcp/auth/useHasMcpAdminRights.ts';

type Rows = {
  parent: string;
  name: string;
  usage: string;
  created: string;
  resource: ProviderConfigItem;
};

export function ProvidersConfig() {
  const { t } = useTranslation();
  const { openInAsideWithApiConfig } = useSplitter();
  const errorDialogRef = useRef<ErrorDialogHandle>(null);
  const handlePatch = useHandleResourcePatch(errorDialogRef);
  const apiConfig = useContext(ApiConfigContext);
  const rows: Rows[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tableInstanceRef = useRef<any>(null);
  const [areRowsExpanded, setAreRowsExpanded] = useState(true);
  const [isTableReady, setIsTableReady] = useState(false);

  const { data: providerConfigsList, isLoading } = useProvidersConfigResource({
    refreshInterval: 60000, // Resources are quite expensive to fetch, so we refresh every 60 seconds
  });

  // Expand all groups when table is loaded
  useEffect(() => {
    if (tableInstanceRef.current && !isLoading) {
      tableInstanceRef.current.toggleAllRowsExpanded(true);
      setAreRowsExpanded(true);
      setIsTableReady(true);
    }
  }, [isLoading]);

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
      openInAsideWithApiConfig(
        <Fragment key={identityKey}>
          <YamlSidePanel
            isEdit={true}
            resource={item as unknown as Resource}
            filename={`${item.kind}_${item.metadata.name}`}
            onApply={async (parsed) => await handlePatch(item, parsed)}
          />
        </Fragment>,
        apiConfig,
      );
    },
    [openInAsideWithApiConfig, handlePatch, apiConfig],
  );
  const hasMCPAdminRights = useHasMcpAdminRights();
  const columns = useMemo<AnalyticalTableColumnDefinition[]>(
    () =>
      [
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
          Cell: ({ row }) => {
            const item = row.original?.resource;
            return item ? (
              <YamlViewButton
                variant="resource"
                resource={item as unknown as Resource}
                toolbarContent={
                  hasMCPAdminRights ? (
                    <Button
                      icon={'edit'}
                      design={'Transparent'}
                      onClick={() => {
                        openEditPanel(item);
                      }}
                    >
                      {t('buttons.edit')}
                    </Button>
                  ) : undefined
                }
              />
            ) : undefined;
          },
        },
        {
          Header: t('ManagedResources.actionColumnHeader'),
          hAlign: 'Center',
          width: 60,
          disableFilters: true,
          accessor: 'actions',
          Cell: ({ row }) => {
            const item = row.original?.resource;
            if (!item) return undefined;
            const actions: ActionItem<ProviderConfigItem>[] = [
              {
                key: 'edit',
                text: t('ManagedResources.editAction', 'Edit'),
                icon: 'edit',
                onClick: openEditPanel,
                disabled: !hasMCPAdminRights,
              },
            ];
            return <ActionsMenu item={item} actions={actions} />;
          },
        },
      ] as AnalyticalTableColumnDefinition[],
    [t, openEditPanel, hasMCPAdminRights],
  );

  return (
    <Panel
      fixed
      header={
        <Toolbar>
          <Title>{t('common.resourcesCount', { count: rows.length })}</Title>
          <ToolbarSpacer />
          <Button
            icon={areRowsExpanded ? 'collapse-all' : 'expand-all'}
            design="Transparent"
            disabled={!isTableReady}
            onClick={() => {
              const newState = !areRowsExpanded;
              tableInstanceRef.current?.toggleAllRowsExpanded(newState);
              setAreRowsExpanded(newState);
            }}
          >
            {areRowsExpanded ? t('buttons.collapseAll', 'Collapse All') : t('buttons.expandAll', 'Expand All')}
          </Button>
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
          tableInstance={tableInstanceRef}
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

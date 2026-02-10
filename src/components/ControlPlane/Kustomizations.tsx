import ConfiguredAnalyticstable from '../Shared/ConfiguredAnalyticsTable.tsx';
import {
  AnalyticalTableColumnDefinition,
  Panel,
  Title,
  Toolbar,
  ToolbarSpacer,
  Button,
  Link,
} from '@ui5/webcomponents-react';
import IllustratedError from '../Shared/IllustratedError.tsx';
import { useApiResource } from '../../lib/api/useApiResource';
import { FluxKustomization } from '../../lib/api/types/flux/listKustomization';

import { useTranslation } from 'react-i18next';
import { formatDateAsTimeAgo } from '../../utils/i18n/timeAgo.ts';

import { YamlViewButton } from '../Yaml/YamlViewButton.tsx';
import { Fragment, useCallback, useContext, useMemo, useRef, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSplitter } from '../Splitter/SplitterContext.tsx';
import { YamlSidePanel } from '../Yaml/YamlSidePanel.tsx';
import { useHandleResourcePatch } from '../../hooks/useHandleResourcePatch.ts';
import { ErrorDialog, ErrorDialogHandle } from '../Shared/ErrorMessageBox.tsx';
import type { KustomizationsResponse } from '../../lib/api/types/flux/listKustomization';
import { ActionsMenu, type ActionItem } from './ActionsMenu';
import { CreateKustomizationDialog } from '../Dialogs/CreateKustomizationDialog';

import { ApiConfigContext } from '../Shared/k8s';
import { useHasMcpAdminRights } from '../../spaces/mcp/auth/useHasMcpAdminRights.ts';
import styles from './Kustomizations.module.css';
import StatusFilter from '../Shared/StatusFilter/StatusFilter.tsx';
import { ResourceStatusCell } from '../Shared/ResourceStatusCell.tsx';
import { Resource } from '../../utils/removeManagedFieldsAndFilterData.ts';

export type KustomizationItem = KustomizationsResponse['items'][0] & {
  apiVersion?: string;
  metadata: KustomizationsResponse['items'][0]['metadata'] & { namespace?: string };
};

export function Kustomizations() {
  const { data, error, isLoading } = useApiResource(FluxKustomization); //404 if component not enabled
  const apiConfig = useContext(ApiConfigContext);
  const { t } = useTranslation();
  const { openInAsideWithApiConfig } = useSplitter();
  const errorDialogRef = useRef<ErrorDialogHandle>(null);
  const handlePatch = useHandleResourcePatch(errorDialogRef);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const location = useLocation();

  type FluxRow = {
    name: string;
    created: string;
    isReady: boolean;
    status: string;
    statusUpdateTime?: string;
    item: KustomizationItem;
    readyMessage: string;
  };

  const openEditPanel = useCallback(
    (item: KustomizationItem) => {
      const identityKey = `${item.kind}:${item.metadata.namespace ?? ''}:${item.metadata.name}`;
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
          Header: t('FluxList.tableNameHeader'),
          accessor: 'name',
          minWidth: 250,
          Cell: ({ cell: { value } }) => <span id={`kustomization-${value}`}>{value}</span>,
        },
        {
          Header: t('CreateKustomizationDialog.sourceRefTitle'),
          accessor: 'item.spec.sourceRef.name',
          Cell: ({ cell: { value } }) => (
            <Link
              onClick={() => {
                const element = document.getElementById(`git-repository-${value}`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
            >
              {value}
            </Link>
          ),
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
          Cell: ({ row }) =>
            row.original?.isReady != null ? (
              <ResourceStatusCell
                positiveText={t('common.ready')}
                negativeText={t('common.error')}
                isOk={row.original?.isReady}
                transitionTime={row.original?.statusUpdateTime ? row.original?.statusUpdateTime : ''}
                message={row.original?.readyMessage}
              />
            ) : null,
        },
        {
          Header: t('yaml.YAML'),
          hAlign: 'Center',
          width: 75,
          accessor: 'yaml',
          disableFilters: true,
          Cell: ({ row }) => {
            const item = row.original?.item;
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
            const item = row.original?.item;
            if (!item) return undefined;
            const actions: ActionItem<KustomizationItem>[] = [
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

  const rows: FluxRow[] = useMemo(
    () =>
      data?.items?.map((item) => {
        const readyObject = item.status?.conditions?.find((x) => x.type === 'Ready');
        const isReady = readyObject?.status === 'True';
        return {
          name: item.metadata.name,
          isReady: isReady,
          status: String(isReady),
          statusUpdateTime: readyObject?.lastTransitionTime,
          created: formatDateAsTimeAgo(item.metadata.creationTimestamp),
          item: {
            ...item,
            kind: 'Kustomization',
            apiVersion: 'kustomize.toolkit.fluxcd.io/v1',
            metadata: { ...item.metadata },
          } as KustomizationItem,
          readyMessage: readyObject?.message ?? readyObject?.reason ?? '',
        };
      }) ?? [],
    [data],
  );

  useEffect(() => {
    if (!isLoading && rows.length > 0 && location.hash) {
      const hash = location.hash.substring(1);
      if (hash.startsWith('kustomization-')) {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [isLoading, rows, location.hash]);

  if (error) {
    return (
      <IllustratedError
        details={error?.message || t('FluxList.undefinedError')}
        title={t('FluxList.noFluxError')}
        compact={true}
      />
    );
  }

  return (
    <>
      <Panel
        fixed
        header={
          <Toolbar>
            <Title>{t('common.resourcesCount', { count: rows.length })}</Title>
            <YamlViewButton variant="resource" resource={data as unknown as Resource} />
            <ToolbarSpacer />
            <Button icon="add" className={styles.createButton} onClick={() => setIsCreateDialogOpen(true)}>
              {t('buttons.create')}
            </Button>
          </Toolbar>
        }
      >
        <>
          <ConfiguredAnalyticstable columns={columns} isLoading={isLoading} data={rows} />
          <ErrorDialog ref={errorDialogRef} />
        </>
      </Panel>

      <CreateKustomizationDialog isOpen={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)} />
    </>
  );
}

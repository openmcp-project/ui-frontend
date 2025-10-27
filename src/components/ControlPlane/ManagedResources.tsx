import { useTranslation } from 'react-i18next';
import { Fragment, useMemo, useState, useRef, useCallback } from 'react';
import {
  AnalyticalTable,
  AnalyticalTableColumnDefinition,
  AnalyticalTableScaleWidthMode,
  Panel,
  Title,
  Toolbar,
  ToolbarSpacer,
} from '@ui5/webcomponents-react';
import { useApiResource, useApiResourceMutation } from '../../lib/api/useApiResource';
import { ManagedResourcesRequest } from '../../lib/api/types/crossplane/listManagedResources';
import { formatDateAsTimeAgo } from '../../utils/i18n/timeAgo';
import IllustratedError from '../Shared/IllustratedError';
import { resourcesInterval } from '../../lib/shared/constants';

import { YamlViewButton } from '../Yaml/YamlViewButton.tsx';
import StatusFilter from '../Shared/StatusFilter/StatusFilter.tsx';
import { ResourceStatusCell } from '../Shared/ResourceStatusCell.tsx';
import { Resource } from '../../utils/removeManagedFieldsAndFilterData.ts';
import { ManagedResourceItem } from '../../lib/shared/types.ts';
import { ManagedResourceDeleteDialog } from '../Dialogs/ManagedResourceDeleteDialog.tsx';
import { ActionsMenu, type ActionItem } from './ActionsMenu';
import { useToast } from '../../context/ToastContext.tsx';
import {
  DeleteManagedResourceType,
  DeleteMCPManagedResource,
  PatchResourceForForceDeletion,
  PatchResourceForForceDeletionBody,
} from '../../lib/api/types/crate/deleteResource';
import { useResourcePluralNames } from '../../hooks/useResourcePluralNames';
import { useSplitter } from '../Splitter/SplitterContext.tsx';
import { YamlSidePanel } from '../Yaml/YamlSidePanel.tsx';
import { ErrorDialog, ErrorDialogHandle } from '../Shared/ErrorMessageBox.tsx';
import { APIError } from '../../lib/api/error.ts';
import { useHandleResourcePatch } from '../../lib/api/types/crossplane/useHandleResourcePatch.ts';

interface StatusFilterColumn {
  filterValue?: string;
  setFilter?: (value?: string) => void;
}

type ResourceRow = {
  kind: string;
  name: string;
  created: string;
  synced: boolean;
  syncedTransitionTime: string;
  ready: boolean;
  readyTransitionTime: string;
  item: ManagedResourceItem;
  conditionReadyMessage: string;
  conditionSyncedMessage: string;
};

export function ManagedResources() {
  const { t } = useTranslation();
  const toast = useToast();
  const { openInAside } = useSplitter();
  const [pendingDeleteItem, setPendingDeleteItem] = useState<ManagedResourceItem | null>(null);
  const errorDialogRef = useRef<ErrorDialogHandle>(null);
  const handlePatch = useHandleResourcePatch(errorDialogRef);

  const {
    data: managedResources,
    error,
    isLoading,
  } = useApiResource(ManagedResourcesRequest, {
    refreshInterval: resourcesInterval,
  });

  const { getPluralKind, isLoading: isLoadingPluralNames, error: pluralNamesError } = useResourcePluralNames();

  const resourceName = pendingDeleteItem?.metadata?.name ?? '';
  const apiVersion = pendingDeleteItem?.apiVersion ?? '';
  const pluralKind = pendingDeleteItem ? getPluralKind(pendingDeleteItem.kind) : '';
  const namespace = pendingDeleteItem?.metadata?.namespace ?? '';

  const { trigger: deleteTrigger } = useApiResourceMutation<DeleteManagedResourceType>(
    DeleteMCPManagedResource(apiVersion, pluralKind, resourceName, namespace),
  );

  const { trigger: patchTrigger } = useApiResourceMutation<DeleteManagedResourceType>(
    PatchResourceForForceDeletion(apiVersion, pluralKind, resourceName, namespace),
  );

  const openDeleteDialog = useCallback((item: ManagedResourceItem) => {
    setPendingDeleteItem(item);
  }, []);

  const openEditPanel = useCallback(
    (item: ManagedResourceItem) => {
      const identityKey = `${item.kind}:${item.metadata.namespace ?? ''}:${item.metadata.name}`;
      openInAside(
        <Fragment key={identityKey}>
          <YamlSidePanel
            isEdit={true}
            resource={item as unknown as Resource}
            filename={`${item.kind}_${item.metadata.name}`}
            onApply={async (parsed) => await handlePatch(item, parsed)}
          />
        </Fragment>,
      );
    },
    [openInAside, handlePatch],
  );

  const columns = useMemo<AnalyticalTableColumnDefinition[]>(
    () =>
      [
        {
          Header: t('ManagedResources.tableHeaderKind'),
          accessor: 'kind',
        },
        {
          Header: t('ManagedResources.tableHeaderName'),
          accessor: 'name',
        },
        {
          Header: t('ManagedResources.tableHeaderCreated'),
          accessor: 'created',
        },
        {
          Header: t('ManagedResources.tableHeaderSynced'),
          accessor: 'synced',
          hAlign: 'Center',
          width: 125,
          Filter: ({ column }: { column: StatusFilterColumn }) => <StatusFilter column={column} />,
          Cell: ({ row }) => {
            const { original } = row;
            return original?.synced != null ? (
              <ResourceStatusCell
                isOk={original.synced}
                transitionTime={original.syncedTransitionTime}
                positiveText={t('common.synced')}
                negativeText={t('errors.syncError')}
                message={original.conditionSyncedMessage}
              />
            ) : null;
          },
        },
        {
          Header: t('ManagedResources.tableHeaderReady'),
          accessor: 'ready',
          hAlign: 'Center',
          width: 125,
          Filter: ({ column }: { column: StatusFilterColumn }) => <StatusFilter column={column} />,
          Cell: ({ row }) => {
            const { original } = row;
            return original?.ready != null ? (
              <ResourceStatusCell
                isOk={original.ready}
                transitionTime={original.readyTransitionTime}
                positiveText={t('common.ready')}
                negativeText={t('errors.notReady')}
                message={original.conditionReadyMessage}
              />
            ) : null;
          },
        },
        {
          Header: t('yaml.YAML'),
          hAlign: 'Center',
          width: 75,
          accessor: 'yaml',
          disableFilters: true,
          Cell: ({ row }) => {
            const { original } = row;
            return original?.item ? (
              <YamlViewButton variant="resource" resource={original.item as unknown as Resource} />
            ) : undefined;
          },
        },
        {
          Header: t('ManagedResources.actionColumnHeader'),
          hAlign: 'Center',
          width: 60,
          disableFilters: true,
          Cell: ({ row }) => {
            const { original } = row;
            const item = original?.item;
            if (!item) return undefined;

            // Flux-managed check for disabling Edit
            const fluxLabelValue = (item?.metadata?.labels as unknown as Record<string, unknown> | undefined)?.[
              'kustomize.toolkit.fluxcd.io/name'
            ];
            const isFluxManaged =
              typeof fluxLabelValue === 'string' ? fluxLabelValue.trim() !== '' : fluxLabelValue != null;

            const actions: ActionItem<ManagedResourceItem>[] = [
              {
                key: 'edit',
                text: t('ManagedResources.editAction', 'Edit'),
                icon: 'edit',
                disabled: isFluxManaged,
                onClick: openEditPanel,
              },
              {
                key: 'delete',
                text: t('ManagedResources.deleteAction'),
                icon: 'delete',
                onClick: openDeleteDialog,
              },
            ];

            return <ActionsMenu item={item} actions={actions} />;
          },
        },
      ] as AnalyticalTableColumnDefinition[],
    [t, openEditPanel, openDeleteDialog],
  );

  const rows: ResourceRow[] =
    managedResources
      ?.filter((managedResource) => managedResource.items)
      .flatMap((managedResource) =>
        managedResource.items?.map((item) => {
          const conditionSynced = item.status?.conditions?.find((condition) => condition.type === 'Synced');
          const conditionReady = item.status?.conditions?.find((condition) => condition.type === 'Ready');

          return {
            kind: item.kind,
            name: item.metadata.name,
            created: formatDateAsTimeAgo(item.metadata.creationTimestamp),
            synced: conditionSynced?.status === 'True',
            syncedTransitionTime: conditionSynced?.lastTransitionTime ?? '',
            ready: conditionReady?.status === 'True',
            readyTransitionTime: conditionReady?.lastTransitionTime ?? '',
            item: item,
            conditionSyncedMessage: conditionSynced?.message ?? conditionSynced?.reason ?? '',
            conditionReadyMessage: conditionReady?.message ?? conditionReady?.reason ?? '',
          };
        }),
      ) ?? [];

  const handleDeletionConfirmed = async (item: ManagedResourceItem, force: boolean) => {
    toast.show(t('ManagedResources.deleteStarted', { resourceName: item.metadata.name }));

    try {
      await deleteTrigger();

      if (force) {
        try {
          await patchTrigger(PatchResourceForForceDeletionBody);
        } catch (e) {
          if (e instanceof APIError && errorDialogRef.current) {
            errorDialogRef.current.showErrorDialog(`${e.message}: ${JSON.stringify(e.info)}`);
          }
          // already handled
        }
      }
    } catch (e) {
      if (e instanceof APIError && errorDialogRef.current) {
        errorDialogRef.current.showErrorDialog(`${e.message}: ${JSON.stringify(e.info)}`);
      }
    } finally {
      setPendingDeleteItem(null);
    }
  };

  const combinedError = error || pluralNamesError;
  const combinedLoading = isLoading || isLoadingPluralNames;

  return (
    <>
      {combinedError && <IllustratedError details={combinedError.message} />}

      {!combinedError && (
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
              data={rows}
              minRows={1}
              groupBy={['kind']}
              scaleWidthMode={AnalyticalTableScaleWidthMode.Smart}
              loading={combinedLoading}
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

            <ManagedResourceDeleteDialog
              open={!!pendingDeleteItem}
              item={pendingDeleteItem}
              onClose={() => setPendingDeleteItem(null)}
              onDeletionConfirmed={handleDeletionConfirmed}
            />
            <ErrorDialog ref={errorDialogRef} />
          </>
        </Panel>
      )}
    </>
  );
}

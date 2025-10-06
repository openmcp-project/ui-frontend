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
import { useApiResource, useApiResourceMutation } from '../../lib/api/useApiResource';
import { ManagedResourcesRequest } from '../../lib/api/types/crossplane/listManagedResources';
import { formatDateAsTimeAgo } from '../../utils/i18n/timeAgo';
import IllustratedError from '../Shared/IllustratedError';
import { resourcesInterval } from '../../lib/shared/constants';

import { YamlViewButton } from '../Yaml/YamlViewButton.tsx';
import { useMemo, useState } from 'react';
import StatusFilter from '../Shared/StatusFilter/StatusFilter.tsx';
import { ResourceStatusCell } from '../Shared/ResourceStatusCell.tsx';
import { Resource } from '../../utils/removeManagedFieldsAndFilterData.ts';
import { ManagedResourceItem } from '../../lib/shared/types.ts';
import { ManagedResourceDeleteDialog } from '../Dialogs/ManagedResourceDeleteDialog.tsx';
import { RowActionsMenu } from './ManagedResourcesActionMenu.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import {
  DeleteManagedResourceType,
  DeleteMCPManagedResource,
  PatchResourceForForceDeletion,
  PatchResourceForForceDeletionBody,
} from '../../lib/api/types/crate/deleteResource';
import { useResourcePluralNames } from '../../hooks/useResourcePluralNames';

interface CellData<T> {
  cell: {
    value: T | null; // null for grouping rows
    row: {
      original?: ResourceRow; // missing for grouping rows
    };
  };
}

type ResourceRow = {
  kind: string;
  name: string;
  created: string;
  synced: boolean;
  syncedTransitionTime: string;
  ready: boolean;
  readyTransitionTime: string;
  item: unknown;
  conditionReadyMessage: string;
  conditionSyncedMessage: string;
};

export function ManagedResources() {
  const { t } = useTranslation();
  const toast = useToast();
  const [pendingDeleteItem, setPendingDeleteItem] = useState<ManagedResourceItem | null>(null);

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

  const columns: AnalyticalTableColumnDefinition[] = useMemo(
    () => [
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
        Filter: ({ column }) => <StatusFilter column={column} />,
        Cell: (cellData: CellData<ResourceRow['synced']>) =>
          cellData.cell.row.original?.synced != null ? (
            <ResourceStatusCell
              isOk={cellData.cell.row.original?.synced}
              transitionTime={cellData.cell.row.original?.syncedTransitionTime}
              positiveText={t('common.synced')}
              negativeText={t('errors.syncError')}
              message={cellData.cell.row.original?.conditionSyncedMessage}
            />
          ) : null,
      },
      {
        Header: t('ManagedResources.tableHeaderReady'),
        accessor: 'ready',
        hAlign: 'Center',
        width: 125,
        Filter: ({ column }) => <StatusFilter column={column} />,
        Cell: (cellData: CellData<ResourceRow['ready']>) =>
          cellData.cell.row.original?.ready != null ? (
            <ResourceStatusCell
              isOk={cellData.cell.row.original?.ready}
              transitionTime={cellData.cell.row.original?.readyTransitionTime}
              positiveText={t('common.ready')}
              negativeText={'Not ready'}
              message={cellData.cell.row.original?.conditionReadyMessage}
            />
          ) : null,
      },
      {
        Header: t('yaml.YAML'),
        hAlign: 'Center',
        width: 75,
        accessor: 'yaml',
        disableFilters: true,
        Cell: (cellData: CellData<ResourceRow>) => {
          return cellData.cell.row.original?.item ? (
            <YamlViewButton variant="resource" resource={cellData.cell.row.original?.item as Resource} />
          ) : undefined;
        },
      },
      {
        Header: t('ManagedResources.actionColumnHeader'),
        hAlign: 'Center',
        width: 60,
        disableFilters: true,
        Cell: (cellData: CellData<ResourceRow>) => {
          const item = cellData.cell.row.original?.item as ManagedResourceItem;

          return cellData.cell.row.original?.item ? (
            <RowActionsMenu item={item} onOpen={openDeleteDialog} />
          ) : undefined;
        },
      },
    ],
    [t],
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

  const openDeleteDialog = (item: ManagedResourceItem) => {
    setPendingDeleteItem(item);
  };

  const handleDeletionConfirmed = async (item: ManagedResourceItem, force: boolean) => {
    toast.show(t('ManagedResources.deleteStarted', { resourceName: item.metadata.name }));

    try {
      await deleteTrigger();

      if (force) {
        await patchTrigger(PatchResourceForForceDeletionBody);
      }
    } catch (_) {
      // Ignore errors - will be handled by the mutation hook
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
          </>
        </Panel>
      )}
    </>
  );
}

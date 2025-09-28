import { useTranslation } from 'react-i18next';
import {
  AnalyticalTable,
  AnalyticalTableColumnDefinition,
  AnalyticalTableScaleWidthMode,
  Button,
  Title,
  Menu,
  MenuItem,
  MenuDomRef,
} from '@ui5/webcomponents-react';
import { useApiResource, useCRDItemsMapping } from '../../lib/api/useApiResource';
import { ManagedResourcesRequest } from '../../lib/api/types/crossplane/listManagedResources';
import { formatDateAsTimeAgo } from '../../utils/i18n/timeAgo';
import IllustratedError from '../Shared/IllustratedError';
import '@ui5/webcomponents-icons/dist/sys-enter-2';
import '@ui5/webcomponents-icons/dist/sys-cancel-2';
import { resourcesInterval } from '../../lib/shared/constants';

import { YamlViewButton } from '../Yaml/YamlViewButton.tsx';
import { FC, useMemo, useRef, useState } from 'react';
import StatusFilter from '../Shared/StatusFilter/StatusFilter.tsx';
import { ResourceStatusCell } from '../Shared/ResourceStatusCell.tsx';
import { Resource } from '../../utils/removeManagedFieldsAndFilterData.ts';
import { ManagedResourceItem } from '../../lib/shared/types.ts';
import { ManagedResourceDeleteDialog } from '../Dialogs/ManagedResourceDeleteDialog.tsx';

const getItemKey = (item: ManagedResourceItem): string => `${item.kind}-${item.metadata.name}`;

const RowActionsMenu: FC<{
  item: ManagedResourceItem;
  onOpen: (item: ManagedResourceItem) => void;
  isDeleting: boolean;
}> = ({ item, onOpen, isDeleting }) => {
  const { t } = useTranslation();
  const popoverRef = useRef<MenuDomRef>(null);

  return (
    <>
      <Button icon="overflow" icon-end disabled={isDeleting} onClick={() => onOpen(item)} />
      <Menu
        ref={popoverRef}
        onItemClick={() => {
          onOpen(item);
        }}
      >
        <MenuItem text={t('ManagedResources.deleteAction')} icon="delete" />
      </Menu>
    </>
  );
};

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ManagedResourceItem | null>(null);
  const [deletingItems, setDeletingItems] = useState<Set<string>>(new Set());

  const {
    data: managedResources,
    error,
    isLoading,
  } = useApiResource(ManagedResourcesRequest, {
    refreshInterval: resourcesInterval,
  });

  const openDeleteDialog = (item: ManagedResourceItem) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteStart = (item: ManagedResourceItem) => {
    const itemKey = getItemKey(item);
    setDeletingItems((prev) => new Set(prev.add(itemKey)));
  };

  const { data: kindMapping } = useCRDItemsMapping({
    refreshInterval: resourcesInterval,
  });

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
        Header: ' ',
        hAlign: 'Center',
        width: 60,
        disableFilters: true,
        Cell: (cellData: CellData<ResourceRow>) => {
          const item = cellData.cell.row.original?.item as ManagedResourceItem;
          const itemKey = item ? getItemKey(item) : '';
          const isDeleting = deletingItems.has(itemKey);

          return cellData.cell.row.original?.item ? (
            <RowActionsMenu item={item} isDeleting={isDeleting} onOpen={openDeleteDialog} />
          ) : undefined;
        },
      },
    ],
    [t, deletingItems],
  );

  const rows: ResourceRow[] =
    managedResources
      ?.filter((managedResource) => managedResource.items)
      .flatMap((managedResource) =>
        managedResource.items?.map((item) => {
          const itemKey = getItemKey(item);
          const isDeleting = deletingItems.has(itemKey);

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
            style: isDeleting ? { opacity: 0.5, pointerEvents: 'none' } : undefined,
          };
        }),
      ) ?? [];

  return (
    <>
      <Title level="H4">{t('ManagedResources.header')}</Title>

      {error && <IllustratedError details={error.message} />}

      {!error && (
        <>
          <AnalyticalTable
            columns={columns}
            data={rows}
            minRows={1}
            groupBy={['kind']}
            scaleWidthMode={AnalyticalTableScaleWidthMode.Smart}
            loading={isLoading}
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
            kindMapping={kindMapping}
            open={deleteDialogOpen}
            item={selectedItem}
            onClose={() => setDeleteDialogOpen(false)}
            onDeleteStart={handleDeleteStart}
          />
        </>
      )}
    </>
  );
}

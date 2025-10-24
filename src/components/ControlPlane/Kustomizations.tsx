import ConfiguredAnalyticstable from '../Shared/ConfiguredAnalyticsTable.tsx';
import {
  AnalyticalTableColumnDefinition,
  Panel,
  Title,
  Toolbar,
  ToolbarSpacer,
  Button,
} from '@ui5/webcomponents-react';
import IllustratedError from '../Shared/IllustratedError.tsx';
import { useApiResource } from '../../lib/api/useApiResource';
import { FluxKustomization } from '../../lib/api/types/flux/listKustomization';
import { useTranslation } from 'react-i18next';
import { formatDateAsTimeAgo } from '../../utils/i18n/timeAgo.ts';

import { YamlViewButton } from '../Yaml/YamlViewButton.tsx';
import { Fragment, useCallback, useMemo, useRef } from 'react';
import StatusFilter from '../Shared/StatusFilter/StatusFilter.tsx';
import { ResourceStatusCell } from '../Shared/ResourceStatusCell.tsx';
import { Resource } from '../../utils/removeManagedFieldsAndFilterData.ts';
import { useSplitter } from '../Splitter/SplitterContext.tsx';
import { YamlSidePanel } from '../Yaml/YamlSidePanel.tsx';
import { useHandleResourcePatch } from '../../lib/api/types/crossplane/useHandleResourcePatch.ts';
import { ErrorDialog, ErrorDialogHandle } from '../Shared/ErrorMessageBox.tsx';
import type { KustomizationsResponse } from '../../lib/api/types/flux/listKustomization';
import { ActionsMenu, type ActionItem } from './ActionsMenu';

export type KustomizationItem = KustomizationsResponse['items'][0] & {
  apiVersion?: string;
  metadata: KustomizationsResponse['items'][0]['metadata'] & { namespace?: string };
};

export function Kustomizations() {
  const { data, error, isLoading } = useApiResource(FluxKustomization); //404 if component not enabled
  const { t } = useTranslation();
  const { openInAside } = useSplitter();
  const errorDialogRef = useRef<ErrorDialogHandle>(null);
  const handlePatch = useHandleResourcePatch(errorDialogRef);

  interface CellRow<T> {
    original: T;
  }

  type FluxRow = {
    name: string;
    created: string;
    isReady: boolean;
    statusUpdateTime?: string;
    item: KustomizationItem;
    readyMessage: string;
  };

  const openEditPanel = useCallback(
    (item: KustomizationItem) => {
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
          Header: t('FluxList.tableNameHeader'),
          accessor: 'name',
          minWidth: 250,
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
          Cell: ({ row }: { row: CellRow<FluxRow> }) =>
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
          Cell: ({ row }: { row: CellRow<FluxRow> }) => {
            const item = row.original?.item;
            return item ? (
              <YamlViewButton
                variant="resource"
                resource={item as unknown as Resource}
                toolbarContent={
                  <Button
                    icon={'edit'}
                    design={'Transparent'}
                    onClick={() => {
                      openEditPanel(item);
                    }}
                  >
                    {t('buttons.edit')}
                  </Button>
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
          Cell: ({ row }: { row: CellRow<FluxRow> }) => {
            const item = row.original?.item;
            if (!item) return undefined;
            const actions: ActionItem<KustomizationItem>[] = [
              {
                key: 'edit',
                text: t('ManagedResources.editAction', 'Edit'),
                icon: 'edit',
                onClick: openEditPanel,
              },
            ];
            return <ActionsMenu item={item} actions={actions} />;
          },
        },
      ] as AnalyticalTableColumnDefinition[],
    [t, openEditPanel],
  );

  if (error) {
    return (
      <IllustratedError
        details={error?.message || t('FluxList.undefinedError')}
        title={t('FluxList.noFluxError')}
        compact={true}
      />
    );
  }

  const rows: FluxRow[] =
    data?.items?.map((item) => {
      const readyObject = item.status?.conditions?.find((x) => x.type === 'Ready');
      return {
        name: item.metadata.name,
        isReady: readyObject?.status === 'True',
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
    }) ?? [];

  return (
    <Panel
      fixed
      header={
        <Toolbar>
          <Title>{t('common.resourcesCount', { count: rows.length })}</Title>
          <YamlViewButton variant="resource" resource={data as unknown as Resource} />
          <ToolbarSpacer />
        </Toolbar>
      }
    >
      <>
        <ConfiguredAnalyticstable columns={columns} isLoading={isLoading} data={rows} />
        <ErrorDialog ref={errorDialogRef} />
      </>
    </Panel>
  );
}

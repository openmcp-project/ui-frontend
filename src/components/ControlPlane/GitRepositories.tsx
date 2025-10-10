import ConfiguredAnalyticstable from '../Shared/ConfiguredAnalyticsTable.tsx';
import { AnalyticalTableColumnDefinition, Panel, Title, Toolbar, ToolbarSpacer } from '@ui5/webcomponents-react';
import IllustratedError from '../Shared/IllustratedError.tsx';
import { useApiResource } from '../../lib/api/useApiResource';
import { FluxRequest, GitReposResponse } from '../../lib/api/types/flux/listGitRepo';
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
import { GitRepositoriesRowActionsMenu, GitRepoItem } from './GitRepositoriesActionMenu.tsx';

interface CellRow<T> {
  original: T;
}

export function GitRepositories() {
  const { data, error, isLoading } = useApiResource(FluxRequest); //404 if component not enabled
  const { t } = useTranslation();
  const { openInAside } = useSplitter();
  const errorDialogRef = useRef<ErrorDialogHandle>(null);
  const handlePatch = useHandleResourcePatch(errorDialogRef);

  type FluxRow = {
    name: string;
    created: string;
    isReady: boolean;
    statusUpdateTime?: string;
    item: GitRepoItem;
    readyMessage: string;
    revision?: string;
  };

  const openEditPanel = useCallback(
    (item: GitRepoItem) => {
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
          Header: t('FluxList.tableVersionHeader'),
          accessor: 'revision',
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
                negativeText={t('errors.error')}
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
          Cell: ({ row }: { row: CellRow<FluxRow> }) => (
            <YamlViewButton variant="resource" resource={row.original.item as unknown as Resource} />
          ),
        },
        {
          Header: t('ManagedResources.actionColumnHeader'),
          hAlign: 'Center',
          width: 60,
          disableFilters: true,
          accessor: 'actions',
          Cell: ({ row }: { row: CellRow<FluxRow> }) =>
            row.original?.item ? (
              <GitRepositoriesRowActionsMenu item={row.original?.item} onEdit={openEditPanel} />
            ) : undefined,
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
        revision: shortenCommitHash(item.status.artifact?.revision ?? '-'),
        created: formatDateAsTimeAgo(item.metadata.creationTimestamp),
        item: {
          ...item,
          kind: 'GitRepository',
          apiVersion: 'source.toolkit.fluxcd.io/v1',
          metadata: { ...item.metadata },
        } as GitRepoItem,
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

function shortenCommitHash(commitHash: string): string {
  //example hash: master@sha1:b3396adb98a6a0f5eeedd1a600beaf5e954a1f28
  const match = commitHash.match(/^([a-zA-Z0-9-_]+)@sha1:([a-f0-9]{40})/);

  if (match && match[2]) {
    return `${match[1]}@${match[2].slice(0, 7)}`;
  }

  //example output : master@b3396ad
  return commitHash;
}

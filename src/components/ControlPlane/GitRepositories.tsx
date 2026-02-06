import ConfiguredAnalyticstable from '../Shared/ConfiguredAnalyticsTable.tsx';
import { useApiResource } from '../../lib/api/useApiResource';
import { FluxRequest } from '../../lib/api/types/flux/listGitRepo';
import { useTranslation } from 'react-i18next';
import { formatDateAsTimeAgo } from '../../utils/i18n/timeAgo.ts';

import { YamlViewButton } from '../Yaml/YamlViewButton.tsx';
import { Fragment, useCallback, useContext, useMemo, useRef, useState } from 'react';
import {
  AnalyticalTableColumnDefinition,
  Panel,
  Title,
  Toolbar,
  ToolbarSpacer,
  Button,
  Link,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/add';
import IllustratedError from '../Shared/IllustratedError.tsx';
import { ResourceStatusCell } from '../Shared/ResourceStatusCell.tsx';
import { Resource } from '../../utils/removeManagedFieldsAndFilterData.ts';
import { useSplitter } from '../Splitter/SplitterContext.tsx';
import { YamlSidePanel } from '../Yaml/YamlSidePanel.tsx';
import { useHandleResourcePatch } from '../../hooks/useHandleResourcePatch.ts';
import { ErrorDialog, ErrorDialogHandle } from '../Shared/ErrorMessageBox.tsx';
import type { GitReposResponse } from '../../lib/api/types/flux/listGitRepo';
import { ActionsMenu, type ActionItem } from './ActionsMenu';

import { ApiConfigContext } from '../Shared/k8s';
import { useHasMcpAdminRights } from '../../spaces/mcp/auth/useHasMcpAdminRights.ts';
import StatusFilter from '../Shared/StatusFilter/StatusFilter.tsx';
import { CreateGitRepositoryDialog } from '../Dialogs/CreateGitRepositoryDialog.tsx';
import styles from './GitRepositories.module.css';

export type GitRepoItem = GitReposResponse['items'][0] & {
  apiVersion?: string;
  metadata: GitReposResponse['items'][0]['metadata'] & { namespace?: string };
};

export function GitRepositories() {
  const { data, error, isLoading } = useApiResource(FluxRequest); //404 if component not enabled
  const { t } = useTranslation();
  const { openInAsideWithApiConfig } = useSplitter();
  const errorDialogRef = useRef<ErrorDialogHandle>(null);
  const handlePatch = useHandleResourcePatch(errorDialogRef);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  type FluxRow = {
    name: string;
    created: string;
    isReady: boolean;
    statusUpdateTime?: string;
    item: GitRepoItem;
    readyMessage: string;
    revision?: string;
  };
  const apiConfig = useContext(ApiConfigContext);
  const hasMCPAdminRights = useHasMcpAdminRights();
  const openEditPanel = useCallback(
    (item: GitRepoItem) => {
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

  const columns = useMemo<AnalyticalTableColumnDefinition[]>(
    () =>
      [
        {
          Header: t('FluxList.tableNameHeader'),
          accessor: 'name',
          minWidth: 250,
          Cell: ({ cell: { value } }) => <span id={`git-repository-${value}`}>{value}</span>,
        },
        {
          Header: t('FluxList.tableUrlHeader', 'Address'),
          accessor: 'item.spec.url',
          Cell: ({ cell: { value } }) =>
            typeof value === 'string' && value.startsWith('https') ? (
              <Link href={value} target="_blank" rel="noopener noreferrer">
                {value}
              </Link>
            ) : value ? (
              String(value)
            ) : null,
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
          accessor: 'isReady',
          width: 125,
          hAlign: 'Center',
          Filter: ({ column }) => <StatusFilter column={column} />,
          Cell: ({ row }) =>
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
            const actions: ActionItem<GitRepoItem>[] = [
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
    [t, hasMCPAdminRights, openEditPanel],
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

  const rows: FluxRow[] = useMemo(
    () =>
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
      }) ?? [],
    [data],
  );

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
      <CreateGitRepositoryDialog isOpen={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)} />
    </>
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

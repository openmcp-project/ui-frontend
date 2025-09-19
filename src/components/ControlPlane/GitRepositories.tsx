import {
  AnalyticalTable,
  AnalyticalTableColumnDefinition,
  AnalyticalTableDomRef,
  AnalyticalTablePropTypes,
  AnalyticalTableScaleWidthMode,
  Button,
  FlexBox,
  Panel,
  PanelDomRef,
  Table,
  Title,
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarSpacer,
} from '@ui5/webcomponents-react';
import IllustratedError from '../Shared/IllustratedError.tsx';
import { useApiResource } from '../../lib/api/useApiResource';
import { FluxRequest } from '../../lib/api/types/flux/listGitRepo';
import { KustomizationsResponse } from '../../lib/api/types/flux/listKustomization';
import { useTranslation } from 'react-i18next';
import { formatDateAsTimeAgo } from '../../utils/i18n/timeAgo.ts';

import { YamlViewButton } from '../Yaml/YamlViewButton.tsx';
import { Ref, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import StatusFilter from '../Shared/StatusFilter/StatusFilter.tsx';
import { ResourceStatusCell } from '../Shared/ResourceStatusCell.tsx';
import { Condition } from '../../lib/shared/types.ts';
import { ConditionsButton } from '../Conditions/ConditionsButton.tsx';
import { useDialog } from '../../common/dialog/useDialog.ts';
import { ModifyGitRepositoryDialog } from '../Dialogs/ModifyGitRepositoryDialog/ModifyGitRepositoryDialog.tsx';
import { ProjectsListItemMenu } from '../Projects/ProjectsListItemMenu.tsx';
import { useSplitter } from '../../spaces/mcp/pages/SplitterContext.tsx';
import IllustrationMessageType from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageType.js';
import Graph from '../Graphs/Graph.tsx';

type ScrollHandle = { scrollTo: (id: string) => void };
export interface GitRepositoriesProps {
  scrollIntoViewRef: Ref<ScrollHandle>;
}
export default function GitRepositories({ scrollIntoViewRef }: GitRepositoriesProps) {
  const { data: gitReposData, error: repoErr, isLoading: repoIsLoading } = useApiResource(FluxRequest); //404 if component not enabled
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);
  const selectedRowIds = useMemo<AnalyticalTablePropTypes['selectedRowIds']>(() => {
    if (selectedRowKey == null) return {};
    return { [selectedRowKey]: true };
  }, [selectedRowKey]);

  const highlightTimers = useRef(new WeakMap<HTMLElement, number>());

  useImperativeHandle(scrollIntoViewRef, () => ({
    scrollTo(name: string) {
      // Variant1: select the row (ugly because we have a selection column)
      const rowIndex = gitReposRows.findIndex((r) => r.name === name);
      if (rowIndex === -1) {
        //setSelectedRowKey(null);
        //return;
      }
      //setSelectedRowKey(rowIndex.toString());

      // Variant 2: via DOM (somewhat ugly)
      const nameSpan = tableRef.current?.querySelector<HTMLElement>(`[data-name="${name}"]`);
      const target = nameSpan?.parentElement?.parentElement;
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Reset CSS class
        target.classList.remove('highlight');
        void target.offsetWidth; // forces re-flow
        target.classList.add('highlight');

        // cancel previous timer (if any)
        const timers = highlightTimers.current;
        const old = timers.get(target);
        if (old) clearTimeout(old);
        // set a fresh removal timer
        const id = window.setTimeout(() => {
          target.classList.remove('highlight');
          timers.delete(target);
        }, 2000);

        timers.set(target, id);
      }
    },
  }));
  const tableRef = useRef<AnalyticalTableDomRef>(null);

  const { t } = useTranslation();

  const splitter = useSplitter();

  const dialog = useDialog();

  interface CellData<T> {
    cell: {
      value: T | null; // null for grouping rows
      row: {
        original?: FluxRow; // missing for grouping rows
      };
    };
  }

  type FluxRow = {
    name: string;
    created: string;
    isReady: boolean;
    statusUpdateTime?: string;
    item: unknown;
    readyMessage: string;
    conditions: Condition[];
  };

  const gitReposColumns: AnalyticalTableColumnDefinition[] = useMemo(
    () => [
      {
        Header: t('FluxList.tableNameHeader'),
        accessor: 'name',
        minWidth: 250,
        Cell: (cellData: CellData<KustomizationsResponse['items']>) => (
          <span data-name={cellData.cell.row.original?.name}>{cellData.cell.row.original?.name}</span>
        ),
      },
      {
        Header: t('FluxList.tableStatusHeader'),
        accessor: 'status',
        hAlign: 'Left',
        width: 125,
        Filter: ({ column }) => <StatusFilter column={column} />,
        Cell: (cellData: CellData<FluxRow>) =>
          cellData.cell.row.original?.isReady != null ? (
            <ConditionsButton conditions={cellData.cell.row.original.conditions} />
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
        Header: t('yaml.YAML'),
        hAlign: 'Center',
        width: 75,
        accessor: 'yaml',
        disableFilters: true,
        Cell: (cellData: CellData<KustomizationsResponse['items']>) => (
          <YamlViewButton resourceObject={cellData.cell.row.original?.item} />
        ),
      },
      {
        Header: 'Actions',
        hAlign: 'Center',
        width: 75,
        accessor: 'actions',
        disableFilters: true,
        Cell: () => <ProjectsListItemMenu projectName={'TODO adjust'} />,
      },
    ],
    [t],
  );

  const gitReposRows: FluxRow[] =
    gitReposData?.items?.map((item) => {
      const readyObject = item.status?.conditions?.find((x) => x.type === 'Ready');
      return {
        name: item.metadata.name,
        isReady: readyObject?.status === 'True',
        statusUpdateTime: readyObject?.lastTransitionTime,
        revision: shortenCommitHash(item.status.artifact?.revision ?? '-'),
        created: formatDateAsTimeAgo(item.metadata.creationTimestamp),
        item: item,
        readyMessage: readyObject?.message ?? readyObject?.reason ?? '',
        conditions: item.status.conditions as Condition[],
      };
    }) ?? [];

  // TODO: Distinguish between uninstalled and missing error data fetching
  if (repoErr) {
    return (
      <IllustratedError
        illustrationName={IllustrationMessageType.TntComponents}
        details={
          <FlexBox style={{ marginTop: '1rem', width: '15rem' }} direction="Column" gap={'0.5rem'}>
            <Button design="Emphasized" icon="sap-icon://add-product" onClick={() => alert('TODO')}>
              Install Flux
            </Button>
            <Button design="Transparent" onClick={() => splitter.open(<>More info?</>)}>
              Learn about GitRepositories
            </Button>
          </FlexBox>
        }
        title={'Flux is required to manage GitRepositories'}
        compact={true}
      />
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes highlight-fade {
            from {
              background-color: var(--sapList_Hover_SelectionBackground, #todo);
            }
            to {
              background-color: transparent;
            }
          }

          .highlight {
            animation: highlight-fade 2s ease-out;
          }
        `}
      </style>
      <Panel
        fixed
        header={
          <Toolbar>
            <Title>{`Resources (${gitReposRows.length})`}</Title>
            <YamlViewButton resourceObject={gitReposData} />
            <ToolbarSpacer />
            <Button design="Transparent" onClick={() => splitter.open(<>Trdt</>)}>
              Learn about GitRepositories
            </Button>
            <ToolbarSeparator />
            <ToolbarButton design="Transparent" text="Create" onClick={dialog.open} />
          </Toolbar>
        }
      >
        <AnalyticalTable
          ref={tableRef}
          columns={gitReposColumns}
          //selectionMode="Single"
          //selectionBehavior="Row"
          data={gitReposRows}
          minRows={5}
          visibleRows={9999} // TODO: with virtualized rows, scrollintoView does not work
          loading={repoIsLoading}
          filterable
          //selectedRowIds={selectedRowIds}
          //onRowSelect={(e) => {
          //  const first = Object.keys(e.detail.selectedRowIds)[0] ?? null;
          // setSelectedRowKey(first);
        />
      </Panel>
      <ModifyGitRepositoryDialog isOpen={dialog.isOpen} close={dialog.close} />
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

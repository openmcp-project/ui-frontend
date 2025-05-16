import ConfiguredAnalyticstable from '../Shared/ConfiguredAnalyticsTable.tsx';
import {
  AnalyticalTableColumnDefinition,
  FlexBox,
  Title,
} from '@ui5/webcomponents-react';
import IllustratedError from '../Shared/IllustratedError.tsx';
import useResource from '../../lib/api/useApiResource';
import { FluxRequest } from '../../lib/api/types/flux/listGitRepo';
import {
  FluxKustomization,
  KustomizationsResponse,
} from '../../lib/api/types/flux/listKustomization';
import { useTranslation } from 'react-i18next';
import { timeAgo } from '../../utils/i18n/timeAgo.ts';
import { ResourceStatusCell } from '../Shared/ResourceStatusCell.tsx';
import { YamlViewButton } from '../Yaml/YamlViewButton.tsx';
import { useMemo } from 'react';

export default function FluxList() {
  const {
    data: gitReposData,
    error: repoErr,
    isLoading: repoIsLoading,
  } = useResource(FluxRequest); //404 if component not enabled
  const {
    data: kustmizationData,
    error: kustomizationErr,
    isLoading: kustomizationIsLoading,
  } = useResource(FluxKustomization); //404 if component not enabled

  const { t } = useTranslation();

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
  };

  const gitReposColumns: AnalyticalTableColumnDefinition[] = useMemo(
    () => [
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
        width: 85,
        hAlign: 'Center',
        Cell: (cellData: CellData<FluxRow['isReady']>) =>
          cellData.cell.row.original?.isReady != null ? (
            <ResourceStatusCell
              value={cellData.cell.row.original?.isReady}
              transitionTime={
                cellData.cell.row.original?.statusUpdateTime
                  ? cellData.cell.row.original?.statusUpdateTime
                  : ''
              }
            />
          ) : null,
      },
      {
        Header: t('yaml.YAML'),
        hAlign: 'Center',
        width: 85,
        accessor: 'yaml',
        Cell: (cellData: CellData<KustomizationsResponse['items']>) => (
          <YamlViewButton resourceObject={cellData.cell.row.original?.item} />
        ),
      },
    ],
    [],
  );

  const kustomizationsColumns: AnalyticalTableColumnDefinition[] = useMemo(
    () => [
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
        width: 85,
        hAlign: 'Center',
        Cell: (cellData: CellData<FluxRow['isReady']>) =>
          cellData.cell.row.original?.isReady != null ? (
            <ResourceStatusCell
              value={cellData.cell.row.original?.isReady}
              transitionTime={
                cellData.cell.row.original?.statusUpdateTime
                  ? cellData.cell.row.original?.statusUpdateTime
                  : ''
              }
            />
          ) : null,
      },

      {
        Header: t('yaml.YAML'),
        hAlign: 'Center',
        width: 85,
        accessor: 'yaml',
        Cell: (cellData: CellData<FluxRow>) => (
          <YamlViewButton resourceObject={cellData.cell.row.original?.item} />
        ),
      },
    ],
    [],
  );

  if (repoErr || kustomizationErr) {
    return (
      <IllustratedError
        details={repoErr.message || kustomizationErr.message}
        title={t('FluxList.noFluxError')}
      />
    );
  }

  const gitReposRows: FluxRow[] =
    gitReposData?.items?.map((item) => {
      return {
        name: item.metadata.name,
        isReady:
          item.status.conditions.find((x) => x.type === 'Ready')?.status ===
          'True',
        statusUpdateTime: item.status.conditions.find((x) => x.type === 'Ready')
          ?.lastTransitionTime,
        revision: shortenCommitHash(item.status.artifact?.revision ?? '-'),
        created: timeAgo.format(new Date(item.metadata.creationTimestamp)),
        item: item,
      };
    }) ?? [];

  const kustomizationsRows: FluxRow[] =
    kustmizationData?.items?.map((item) => {
      return {
        name: item.metadata.name,
        isReady:
          item.status.conditions.find((x) => x.type === 'Ready')?.status ===
          'True',
        statusUpdateTime: item.status.conditions.find((x) => x.type === 'Ready')
          ?.lastTransitionTime,
        created: timeAgo.format(new Date(item.metadata.creationTimestamp)),
        item: item,
      };
    }) ?? [];

  return (
    <>
      <div className="crossplane-table-element">
        <FlexBox justifyContent={'Start'} alignItems={'Center'} gap={'0.5em'}>
          <Title level="H4">{t('FluxList.gitOpsTitle')}</Title>
          <YamlViewButton resourceObject={gitReposData} />
        </FlexBox>
        <ConfiguredAnalyticstable
          columns={gitReposColumns}
          isLoading={repoIsLoading}
          data={gitReposRows}
        />
      </div>
      <div className="crossplane-table-element">
        <FlexBox justifyContent={'Start'} alignItems={'Center'} gap={'0.5em'}>
          <Title level="H4">{t('FluxList.kustomizationsTitle')}</Title>
          <YamlViewButton resourceObject={kustmizationData} />
        </FlexBox>
        <ConfiguredAnalyticstable
          columns={kustomizationsColumns}
          isLoading={kustomizationIsLoading}
          data={kustomizationsRows}
        />
      </div>
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

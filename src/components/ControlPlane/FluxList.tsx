import ConfiguredAnalyticstable from '../Shared/ConfiguredAnalyticsTable.tsx';
import {
  AnalyticalTableColumnDefinition,
  Title,
} from '@ui5/webcomponents-react';
import IllustratedError from '../Shared/IllustratedError.tsx';
import useResource from '../../lib/api/useApiResource';
import { FluxRequest } from '../../lib/api/types/flux/listGitRepo';
import { FluxKustomization } from '../../lib/api/types/flux/listKustomization';
import { useTranslation } from 'react-i18next';
import { timeAgo } from '../../utils/i18n/timeAgo.ts';
import { ResourceStatusCell } from '../Shared/ResourceStatusCell.tsx';
import { shortenCommitHash } from '../../lib/api/types/shared/helpers.ts';

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
        original?: FluxRows; // missing for grouping rows
      };
    };
  }

  type FluxRows = {
    name: string;
    created: string;
    status: boolean;
    statusUptadeTime?: string;
  };

  if (repoErr) {
    return (
      <IllustratedError error={repoErr} title={t('FluxList.noFluxError')} />
    );
  }
  if (kustomizationErr) {
    return (
      <IllustratedError
        error={kustomizationErr}
        title={t('FluxList.noFluxError')}
      />
    );
  }

  const gitReposColumns: AnalyticalTableColumnDefinition[] = [
    {
      Header: t('FluxList.tableNameHeader'),
      accessor: 'name',
    },
    {
      Header: t('FluxList.tableStatusHeader'),
      accessor: 'status',
      Cell: (cellData: CellData<FluxRows['status']>) =>
        cellData.cell.row.original?.status != null ? (
          <ResourceStatusCell
            value={cellData.cell.row.original?.status}
            transitionTime={
              cellData.cell.row.original?.statusUptadeTime
                ? cellData.cell.row.original?.statusUptadeTime
                : ''
            }
          />
        ) : null,
    },
    {
      Header: t('FluxList.tableVersionHeader'),
      accessor: 'revision',
    },
    {
      Header: t('FluxList.tableCreatedHeader'),
      accessor: 'created',
    },
  ];

  const kustomizationsColumns: AnalyticalTableColumnDefinition[] = [
    {
      Header: t('FluxList.tableNameHeader'),
      accessor: 'name',
    },
    {
      Header: t('FluxList.tableStatusHeader'),
      accessor: 'status',
      Cell: (cellData: CellData<FluxRows['status']>) =>
        cellData.cell.row.original?.status != null ? (
          <ResourceStatusCell
            value={cellData.cell.row.original?.status}
            transitionTime={
              cellData.cell.row.original?.statusUptadeTime
                ? cellData.cell.row.original?.statusUptadeTime
                : ''
            }
          />
        ) : null,
    },
    {
      Header: t('FluxList.tableCreatedHeader'),
      accessor: 'created',
    },
  ];

  const gitReposRows: FluxRows[] =
    gitReposData?.items?.map((item) => {
      return {
        name: item.metadata.name,
        status:
          item.status.conditions.find((x) => x.type === 'Ready')?.status ===
          'True',
        statusUptadeTime: item.status.conditions.find((x) => x.type === 'Ready')
          ?.lastTransitionTime,
        revision: shortenCommitHash(item.status.artifact.revision),
        created: timeAgo.format(new Date(item.metadata.creationTimestamp)),
      };
    }) ?? [];

  const kustomizationsRows: FluxRows[] =
    kustmizationData?.items?.map((item) => {
      return {
        name: item.metadata.name,
        status:
          item.status.conditions.find((x) => x.type === 'Ready')?.status ===
          'True',
        statusUptadeTime: item.status.conditions.find((x) => x.type === 'Ready')
          ?.lastTransitionTime,
        created: timeAgo.format(new Date(item.metadata.creationTimestamp)),
      };
    }) ?? [];

  return (
    <>
      {' '}
      <div className="crossplane-table-element">
        <Title level="H4">{t('FluxList.gitOpsTitle')}</Title>
        <ConfiguredAnalyticstable
          columns={gitReposColumns}
          isLoading={repoIsLoading}
          data={gitReposRows}
        />
      </div>
      <div className="crossplane-table-element">
        <Title level="H4">{t('FluxList.kustomizationsTitle')}</Title>
        <ConfiguredAnalyticstable
          columns={kustomizationsColumns}
          isLoading={kustomizationIsLoading}
          data={kustomizationsRows}
        />
      </div>
    </>
  );
}

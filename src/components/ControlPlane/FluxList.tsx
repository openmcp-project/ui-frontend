import ConfiguredAnalyticstable from '../Shared/ConfiguredAnalyticsTable.tsx';
import {
  AnalyticalTableColumnDefinition,
  Title,
} from '@ui5/webcomponents-react';
import ReactTimeAgo from 'react-time-ago';
import IllustratedError from '../Shared/IllustratedError.tsx';
import useResource from '../../lib/api/useApiResource';
import { FluxGitRepo } from '../../lib/api/types/flux/listGitRepo';
import { FluxKustomization } from '../../lib/api/types/flux/listKustomization';
import { useTranslation } from 'react-i18next';

export default function FluxList() {
  const {
    data: repoData,
    error: repoErr,
    isLoading: repoIsLoading,
  } = useResource(FluxGitRepo); //404 if component not enabled
  const {
    data: kustmizationData,
    error: kustomizationErr,
    isLoading: kustomizationIsLoading,
  } = useResource(FluxKustomization); //404 if component not enabled

  const { t } = useTranslation();

  if (repoErr) {
    return <IllustratedError error={repoErr} />;
  }
  if (kustomizationErr) {
    return <IllustratedError error={kustomizationErr} />;
  }

  const columns: AnalyticalTableColumnDefinition[] = [
    {
      Header: t('FluxList.tableNameHeader'),
      accessor: 'metadata.name',
    },
    {
      Header: t('FluxList.tableStatusHeader'),
      accessor: 'status.usages',
    },
    {
      Header: t('FluxList.tableCreatedHeader'),
      accessor: 'metadata.creationTimestamp',
      Cell: (props: any) => <ReactTimeAgo date={new Date(props.cell.value)} />,
    },
  ];

  return (
    <>
      <Title level="H4">Git Repos</Title>
      <ConfiguredAnalyticstable
        columns={columns}
        isLoading={repoIsLoading}
        data={repoData ?? []}
      />
      <Title level="H4">Kustomizations</Title>
      <ConfiguredAnalyticstable
        columns={columns}
        isLoading={kustomizationIsLoading}
        data={kustmizationData ?? []}
      />
    </>
  );
}

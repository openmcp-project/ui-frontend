import ConfiguredAnalyticstable from '../Shared/ConfiguredAnalyticsTable.tsx';
import {
  AnalyticalTableColumnDefinition,
  Title,
} from '@ui5/webcomponents-react';
import ReactTimeAgo from 'react-time-ago';
import IllustratedError from '../Shared/IllustratedError.tsx';
import useResource from '../../lib/api/useApiResource';
import { ListProviders } from '../../lib/api/types/crossplane/listProviders';
import { useTranslation } from 'react-i18next';
import { ManagedResources } from './ManagedResources';

export default function ProvidersList() {
  const { data, error, isLoading } = useResource(ListProviders);
  const { t } = useTranslation();

  if (error) {
    return <IllustratedError error={error} />;
  }

  const columns: AnalyticalTableColumnDefinition[] = [
    {
      Header: t('ProvidersList.tableNameHeader'),
      accessor: 'metadata.name',
    },
    {
      Header: t('ProvidersList.tableStatusHeader'),
      accessor: 'status.phase',
    },
    {
      Header: t('ProvidersList.tableCreatedHeader'),
      accessor: 'metadata.creationTimestamp',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Cell: (props: any) => <ReactTimeAgo date={new Date(props.cell.value)} />,
    },
  ];

  return (
    <>
      <Title level="H4">Providers</Title>
      <ConfiguredAnalyticstable
        columns={columns}
        isLoading={isLoading}
        data={data ?? []}
      />
      <Title level="H2">ProviderConfigs</Title>
      <ConfiguredAnalyticstable columns={columns} data={[]} />

      <ManagedResources />
    </>
  );
}


import { useTranslation } from 'react-i18next';
import { AnalyticalTable, AnalyticalTableColumnDefinition, AnalyticalTableScaleWidthMode, Icon, Title } from '@ui5/webcomponents-react';
import useResource from '../../lib/api/useApiResource';
import IllustratedError from '../Shared/IllustratedError';
import '@ui5/webcomponents-icons/dist/sys-enter-2';
import '@ui5/webcomponents-icons/dist/sys-cancel-2';
import { ProvidersListRequest } from '../../lib/api/types/crossplane/listProviders';
import ReactTimeAgo from 'react-time-ago';

interface CellData<T> {
    cell: {
      value: T | null;
    };
  }

export function Providers() {
  const { t } = useTranslation();

  let {data: providers, error, isLoading} = useResource(ProvidersListRequest, {
    refreshInterval: 300000
  });

  const columns: AnalyticalTableColumnDefinition[] = [
    {
      Header: t('Providers.tableHeaderName'),
      accessor: 'metadata.name',
    },
    {
      Header: t('Providers.tableHeaderVersion'),
      accessor: 'spec.package',
      Cell: (cellData: CellData<string>) => cellData.cell.value?.match(/\d+(\.\d+)+/)
    },
    {
      Header: t('Providers.tableHeaderInstalled'),
      accessor: 'status.conditions[1].status',
      Cell: (cellData: CellData<boolean>) => <ResourceStatusCell cellData={cellData}/>
    },
    //last.transitiontime on hover
    {
      Header: t('Providers.tableHeaderHealthy'),
      accessor: 'status.conditions[0].status',
      Cell: (cellData: CellData<boolean>) => <ResourceStatusCell cellData={cellData}/>
    },
    {
      Header: t('Providers.tableHeaderCreated'),
      accessor: 'metadata.creationTimestamp',
      Cell: (props: any) => <ReactTimeAgo date={new Date(props.cell.value)} />,
    },
  ];

  return (
    <>
      <Title level='H4'>{t('Providers.headerProviders')}</Title>

      {error && <IllustratedError error={error}/>}

      {!error &&
        <AnalyticalTable
          columns={columns}
          data={providers?.items ?? []}
          minRows={1}
          groupBy={['name']}
          scaleWidthMode={AnalyticalTableScaleWidthMode.Smart}
          loading={isLoading}
          filterable
          // Prevent the table from resetting when the data changes
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
            autoResetResize: false
          }}
        />
      }
    </>
  )
}

interface ResourceStatusCellProps {
    cellData: CellData<boolean>;
  }

function ResourceStatusCell({ cellData }: ResourceStatusCellProps) {
    const { t } = useTranslation();
  
    if (cellData.cell.value === null) {
      return null;
    }
  
    return <Icon
      design={cellData.cell.value ? 'Positive' : 'Negative'}
      accessibleName={cellData.cell.value ? t('ManagedResources.iconAriaYes') : t('ManagedResources.iconAriaNo')}
      name={cellData.cell.value ? 'sys-enter-2' : 'sys-cancel-2'}
    />
  }

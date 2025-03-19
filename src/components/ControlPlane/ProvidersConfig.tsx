
import { useTranslation } from 'react-i18next';
import { AnalyticalTable, AnalyticalTableColumnDefinition, AnalyticalTableScaleWidthMode, Title } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/sys-enter-2';
import '@ui5/webcomponents-icons/dist/sys-cancel-2';

//empty table TBD
export function ProvidersConfig() {
  const { t } = useTranslation();

  const columns: AnalyticalTableColumnDefinition[] = [];

  return (
    <>
      <Title level='H4'>{t('ProvidersConfig.headerProvidersConfig')}</Title>
        <AnalyticalTable
          columns={columns}
          data={[]}
          minRows={1}
          groupBy={['name']}
          scaleWidthMode={AnalyticalTableScaleWidthMode.Smart}
          loading={false}
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
    </>
  )
}

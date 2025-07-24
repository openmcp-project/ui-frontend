import {
  AnalyticalTable,
  AnalyticalTableColumnDefinition,
  AnalyticalTableScaleWidthMode,
} from '@ui5/webcomponents-react';

interface Props {
  columns: (string | AnalyticalTableColumnDefinition)[];
  data: Record<string, unknown>[];
  visibleRows?: number;
  isLoading?: boolean;
}

export default function ConfiguredAnalyticsTable(props: Props) {
  return (
    <AnalyticalTable
      columns={props.columns.map((c) => (typeof c === 'string' ? { Header: c, accessor: c } : c))}
      data={props.data}
      minRows={1}
      visibleRows={props.visibleRows ?? 12}
      scaleWidthMode={AnalyticalTableScaleWidthMode.Smart}
      loading={props.isLoading}
      filterable
      style={{ margin: '12px' }}
    />
  );
}

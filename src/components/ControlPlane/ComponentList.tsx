import {
  AnalyticalTable,
  AnalyticalTableColumnDefinition,
  Panel,
  Title,
  Toolbar,
  ToolbarButton,
  ToolbarSpacer,
} from '@ui5/webcomponents-react';
import { ControlPlaneType } from '../../lib/api/types/crate/controlPlanes';
import { useTranslation } from 'react-i18next';

export default function ComponentList({ mcp, onEditClick }: { mcp: ControlPlaneType; onEditClick: () => void }) {
  const { t } = useTranslation();

  const data = [
    {
      name: 'Crossplane',
      version: mcp.spec?.components.crossplane?.version,
    },
    {
      name: 'BTP Service Operator',
      version: mcp.spec?.components.btpServiceOperator?.version,
    },
    {
      name: 'External Secrets Operator',
      version: mcp.spec?.components.externalSecretsOperator?.version,
    },
    {
      name: 'Kyverno',
      version: mcp.spec?.components.kyverno?.version,
    },
    {
      name: 'Flux',
      version: mcp.spec?.components.flux?.version,
    },
  ].filter((item) => item.version !== undefined);

  const componentTableColumns: AnalyticalTableColumnDefinition[] = [
    {
      Header: t('ComponentList.tableComponentHeader'),
      accessor: 'name',
    },
    {
      Header: t('ComponentList.tableVersionHeader'),
      accessor: 'version',
    },
  ];

  return (
    <Panel
      fixed
      header={
        <Toolbar>
          <Title>{t('common.itemsCount', { count: data.length })}</Title>
          <ToolbarSpacer />
          <ToolbarButton tooltip={t('editMCP.editComponents')} design="Transparent" icon="edit" onClick={onEditClick} />
        </Toolbar>
      }
    >
      <AnalyticalTable scaleWidthMode="Smart" columns={componentTableColumns} minRows={0} data={data} />
    </Panel>
  );
}

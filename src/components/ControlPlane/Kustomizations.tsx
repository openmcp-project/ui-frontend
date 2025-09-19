import {
  AnalyticalTable,
  AnalyticalTableColumnDefinition,
  AnalyticalTableScaleWidthMode,
  Button,
  FlexBox,
  Link,
  Panel,
  Title,
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarSpacer,
} from '@ui5/webcomponents-react';
import IllustratedError from '../Shared/IllustratedError.tsx';
import { useApiResource } from '../../lib/api/useApiResource';
import { FluxKustomization } from '../../lib/api/types/flux/listKustomization';
import { useTranslation } from 'react-i18next';
import { formatDateAsTimeAgo } from '../../utils/i18n/timeAgo.ts';

import { YamlViewButton } from '../Yaml/YamlViewButton.tsx';
import { useMemo } from 'react';
import StatusFilter from '../Shared/StatusFilter/StatusFilter.tsx';
import { useSplitter } from '../../spaces/mcp/pages/SplitterContext.tsx';
import { ConditionsButton } from '../Conditions/ConditionsButton.tsx';
import { Condition } from '../../lib/shared/types.ts';
import { useNavigate } from 'react-router-dom';
import { ProjectsListItemMenu } from '../Projects/ProjectsListItemMenu.tsx';
import IllustrationMessageType from '@ui5/webcomponents-fiori/types/IllustrationMessageType';

export interface KustomizationsProps {
  onNavigateToGitRepository: (gitRepository: string) => void;
}

export default function Kustomizations({ onNavigateToGitRepository }: KustomizationsProps) {
  const {
    data: kustmizationData,
    error: kustomizationErr,
    isLoading: kustomizationIsLoading,
  } = useApiResource(FluxKustomization); //404 if component not enabled

  const { t } = useTranslation();

  const navigate = useNavigate();

  const splitter = useSplitter();

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
    ref?: string;
    conditions: Condition[];
  };

  const kustomizationsColumns: AnalyticalTableColumnDefinition[] = useMemo(
    () => [
      {
        Header: t('FluxList.tableNameHeader'),
        accessor: 'name',
        minWidth: 250,
      },
      {
        Header: t('FluxList.tableStatusHeader'),
        accessor: 'status',
        width: 125,
        hAlign: 'Left',
        Filter: ({ column }) => <StatusFilter column={column} />,
        Cell: (cellData: CellData<FluxRow['isReady']>) =>
          cellData.cell.row.original?.isReady != null ? (
            <>
              <ConditionsButton conditions={cellData.cell.row.original.conditions} />
            </>
          ) : null,
      },
      {
        Header: t('FluxList.tableCreatedHeader'),
        accessor: 'created',
      },
      {
        Header: 'Source reference',
        accessor: 'ref',
        Cell: (cellData: CellData<FluxRow['isReady']>) =>
          cellData.cell.row.original?.ref ? (
            <Link onClick={() => onNavigateToGitRepository(cellData.cell.row.original!.ref!)}>
              GitRepository &gt; {cellData.cell.row.original?.ref}
            </Link>
          ) : null,
      },
      {
        Header: t('yaml.YAML'),
        hAlign: 'Center',
        width: 75,
        accessor: 'yaml',
        disableFilters: true,
        Cell: (cellData: CellData<FluxRow>) => <YamlViewButton resourceObject={cellData.cell.row.original?.item} />,
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

  // TODO: Distinguish between uninstalled and missing error data fetching
  if (kustomizationErr) {
    return (
      <IllustratedError
        illustrationName={IllustrationMessageType.TntComponents}
        details={
          <FlexBox style={{ marginTop: '1rem', width: '15rem' }} direction="Column" gap={'0.5rem'}>
            <Button design="Emphasized" icon="sap-icon://add-product" onClick={() => alert('TODO')}>
              Install Flux
            </Button>
            <Button design="Transparent" onClick={() => splitter.open(<>More info?</>)}>
              Learn about Kustomizations
            </Button>
          </FlexBox>
        }
        title={'Flux is required to manage Kustomizations'}
        compact={true}
      />
    );
  }

  const kustomizationsRows: FluxRow[] =
    kustmizationData?.items?.map((item) => {
      const readyObject = item.status?.conditions?.find((x) => x.type === 'Ready');
      return {
        name: item.metadata.name,
        isReady: readyObject?.status === 'True',
        statusUpdateTime: readyObject?.lastTransitionTime,
        created: formatDateAsTimeAgo(item.metadata.creationTimestamp),
        item: item,
        ref: item.spec?.sourceRef?.name,
        readyMessage: readyObject?.message ?? readyObject?.reason ?? '',
        conditions: item.status.conditions,
      };
    }) ?? [];

  return (
    <>
      <Panel
        fixed
        header={
          <Toolbar>
            <Title>{`Resources (${kustomizationsRows.length})`}</Title>
            <YamlViewButton resourceObject={kustmizationData} />
            <ToolbarSpacer />
            <Button design="Transparent" onClick={() => splitter.open(<>More info?</>)}>
              Learn about Kustomizations
            </Button>
            <ToolbarSeparator />
            <ToolbarButton design="Transparent" text="Create" onClick={() => navigate('kustomizations/new')} />
          </Toolbar>
        }
      >
        <AnalyticalTable
          columns={kustomizationsColumns}
          data={kustomizationsRows}
          minRows={5}
          visibleRows={9999}
          scaleWidthMode={AnalyticalTableScaleWidthMode.Smart}
          loading={kustomizationIsLoading}
          filterable
        />
      </Panel>
    </>
  );
}

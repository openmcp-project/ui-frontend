import {
  AnalyticalTable,
  AnalyticalTableColumnDefinition,
} from '@ui5/webcomponents-react';
import { ThemingParameters } from '@ui5/webcomponents-react-base';
import { CopyButton } from '../Shared/CopyButton.tsx';
import useLuigiNavigate from '../Shared/useLuigiNavigate.tsx';
import IllustratedError from '../Shared/IllustratedError.tsx';
import useResource from '../../lib/api/useApiResource';
import { projectnameToNamespace } from '../../utils';
import '@ui5/webcomponents-icons/dist/copy';
import '@ui5/webcomponents-icons/dist/arrow-right';
import { ListProjectNames } from '../../lib/api/types/crate/listProjectNames';
import { t } from 'i18next';
import { YamlViewButtonWithLoader } from '../Yaml/YamlViewButtonWithLoader.tsx';
import { useMemo } from 'react';

export default function ProjectsList() {
  const navigate = useLuigiNavigate();
  const { data, error } = useResource(ListProjectNames, {
    refreshInterval: 3000,
  });
  const stabilizedData = useMemo(
    () =>
      data?.map((projectName) => {
        return {
          projectName: projectName,
          nameSpace: projectnameToNamespace(projectName),
        };
      }) ?? [],
    [data],
  );
  const stabilizedColumns: AnalyticalTableColumnDefinition[] = useMemo(
    () => [
      {
        Header: t('ProjectsListView.title'),
        accessor: 'projectName',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Cell: (instance: any) => (
          <div
            style={{
              cursor: 'pointer',
              width: '100%',
              color: ThemingParameters.sapLinkColor,
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'start',
              alignItems: 'center',
            }}
          >
            {instance.cell.value}
          </div>
        ),
      },
      {
        Header: 'Namespace',
        accessor: 'nameSpace',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Cell: (instance: any) => (
          <div
            style={{
              display: 'flex',
              justifyContent: 'start',
              gap: '0.5rem',
              alignItems: 'center',
              width: '100%',
              cursor: 'pointer',
            }}
          >
            <CopyButton text={instance.cell.value} />
          </div>
        ),
      },
      {
        Header: t('yaml.YAML'),
        accessor: 'yaml',
        width: 85,
        hAlign: 'Center',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Cell: (instance: any) => (
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'end',
              alignItems: 'center',
            }}
          >
            <YamlViewButtonWithLoader
              resourceType={'projects'}
              resourceName={instance.cell.value}
            />
          </div>
        ),
      },
    ],
    [],
  );
  if (error) {
    return <IllustratedError details={error.message} />;
  }

  return (
    <>
      <AnalyticalTable
        style={{ margin: '12px' }}
        columns={stabilizedColumns}
        data={stabilizedData}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onRowClick={(e: any) => {
          navigate(
            `/mcp/projects/${data ? [e.detail.row.values.projectName] : ''}`,
          );
        }}
      />
    </>
  );
}

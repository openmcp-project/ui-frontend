import { AnalyticalTable, AnalyticalTableColumnDefinition, Button, Link } from '@ui5/webcomponents-react';
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
import { ProjectsListItemMenu } from './ProjectsListItemMenu.tsx';

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
          <Link
            // design={'Transparent'}
            style={{
              // cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              // color: ThemingParameters.sapLinkColor,
              // fontWeight: 'bold',
              // display: 'flex',
              // justifyContent: 'flex-start',
              // alignItems: 'center',
            }}
            onClick={() => {
              navigate(`/mcp/projects/${instance.cell.row.original?.projectName}`);
            }}
          >
            {instance.cell.value}
          </Link>
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
        disableFilters: true,
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
              resourceName={instance.cell.row.original?.projectName}
            />
          </div>
        ),
      },
      {
        Header: t('common.options'),
        accessor: 'options',
        width: 85,
        disableFilters: true,
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
            <ProjectsListItemMenu projectName={instance.cell.row.original?.projectName ?? ''} />
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
      <AnalyticalTable style={{ margin: '12px' }} columns={stabilizedColumns} data={stabilizedData} />
    </>
  );
}

import { AnalyticalTable, Link } from '@ui5/webcomponents-react';

import { CopyButton } from '../Shared/CopyButton.tsx';
import useLuigiNavigate from '../Shared/useLuigiNavigate.tsx';
import IllustratedError from '../Shared/IllustratedError.tsx';
import { useApiResource } from '../../lib/api/useApiResource';
import { projectnameToNamespace } from '../../utils';
import '@ui5/webcomponents-icons/dist/copy';
import '@ui5/webcomponents-icons/dist/arrow-right';
import { ListProjectNames } from '../../lib/api/types/crate/listProjectNames';
import { t } from 'i18next';
import { YamlViewButton } from '../Yaml/YamlViewButton.tsx';
import { useMemo } from 'react';
import { ProjectsListItemMenu } from './ProjectsListItemMenu.tsx';

type ProjectListRow = {
  projectName: string;
  nameSpace: string;
};

type ProjectListCellInstance<T> = {
  cell: {
    value: T | undefined;
    row: {
      original: Record<string, unknown>;
    };
  };
};

export default function ProjectsList() {
  const navigate = useLuigiNavigate();
  const { data, error } = useApiResource(ListProjectNames, {
    refreshInterval: 3000,
  });
  const stabilizedData = useMemo<ProjectListRow[]>(
    () =>
      data?.map((projectName) => {
        return {
          projectName: projectName,
          nameSpace: projectnameToNamespace(projectName),
        };
      }) ?? [],
    [data],
  );
  const stabilizedColumns = useMemo(
    () => [
      {
        Header: t('ProjectsListView.title'),
        accessor: 'projectName',
        Cell: (instance: ProjectListCellInstance<string>) => (
          <Link
            design={'Emphasized'}
            style={{
              width: '100%',
              textAlign: 'left',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
            }}
            onClick={() => {
              navigate(`/mcp/projects/${instance.cell.row.original?.projectName as string}`);
            }}
          >
            {instance.cell.value}
          </Link>
        ),
      },
      {
        Header: 'Namespace',
        accessor: 'nameSpace',
        width: 340,
        Cell: (instance: ProjectListCellInstance<string>) => (
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
            <CopyButton text={instance.cell.value ?? ''} />
          </div>
        ),
      },
      {
        Header: t('yaml.YAML'),
        accessor: 'yaml',
        width: 75,
        disableFilters: true,
        hAlign: 'Center' as const,
        Cell: (instance: ProjectListCellInstance<string>) => (
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <YamlViewButton
              variant="loader"
              resourceType={'projects'}
              resourceName={instance.cell.row.original?.projectName as string}
            />
          </div>
        ),
      },
      {
        Header: '',
        accessor: 'options',
        width: 60,
        disableFilters: true,
        hAlign: 'Center' as const,
        Cell: (instance: ProjectListCellInstance<string>) => (
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ProjectsListItemMenu projectName={(instance.cell.row.original?.projectName as string) ?? ''} />
          </div>
        ),
      },
    ],
    [navigate],
  );
  if (error) {
    return <IllustratedError details={error.message} />;
  }

  return (
    <>
      <AnalyticalTable
        style={{
          maxWidth: '1280px',
          margin: '10px auto 0px auto',
          width: '100%',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
        columns={stabilizedColumns}
        data={stabilizedData}
      />
    </>
  );
}

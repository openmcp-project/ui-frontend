import { AnalyticalTable, AnalyticalTableColumnDefinition, Link } from '@ui5/webcomponents-react';

import '@ui5/webcomponents-icons/dist/copy';
import { t } from 'i18next';
import { useMemo } from 'react';
import { useProjectMembers } from '../../spaces/onboarding/hooks/useProjectMembers';
import { useProjectMembers as _useProjectMembers } from '../../spaces/onboarding/hooks/useProjectMembers';
import { useProjectsDisplayNames } from '../../spaces/onboarding/hooks/useProjectsDisplayNames';
import { useProjectsQuery } from '../../spaces/onboarding/hooks/useProjectsQuery';
import { projectnameToNamespace } from '../../utils';
import { formatDateAsTimeAgo } from '../../utils/i18n/timeAgo';
import { CopyButton } from '../Shared/CopyButton.tsx';
import IllustratedError from '../Shared/IllustratedError.tsx';
import Loading from '../Shared/Loading.tsx';
import useLuigiNavigate from '../Shared/useLuigiNavigate.tsx';
import { YamlViewButton } from '../Yaml/YamlViewButton.tsx';
import { ProjectMembersCell } from './ProjectMembersCell.tsx';
import styles from './ProjectsList.module.css';
import { ProjectsListItemMenu } from './ProjectsListItemMenu.tsx';

type ProjectListRow = {
  projectName: string;
  displayName: string;
  nameSpace: string;
};

function getProjectName(instance: { cell: { row: { original: unknown } } }): string {
  return (instance.cell.row.original as ProjectListRow).projectName;
}

function CreatedAtCell({ projectName }: { projectName: string }) {
  const { creationTimestamp, isLoading } = useProjectMembers(projectName);
  if (isLoading || !creationTimestamp) return null;
  return <span title={new Date(creationTimestamp).toLocaleString()}>{formatDateAsTimeAgo(creationTimestamp)}</span>;
}

interface DisplayNameCellProps {
  projectName: string;
  useProjectMembers?: typeof _useProjectMembers;
}

function DisplayNameCell({ projectName, useProjectMembers = _useProjectMembers }: DisplayNameCellProps) {
  const { displayName } = useProjectMembers(projectName);
  return <span>{displayName ?? ''}</span>;
}

export default function ProjectsList() {
  const navigate = useLuigiNavigate();
  const { data, error } = useProjectsQuery();
  const displayNames = useProjectsDisplayNames();

  const stabilizedData = useMemo<ProjectListRow[]>(
  const { data, error, isLoading } = useProjectsQuery();

  const rows = useMemo<ProjectListRow[]>(
    () =>
      data?.map((projectName) => ({ projectName })).sort((a, b) => a.projectName.localeCompare(b.projectName)) ?? [],
    [data],
  );

  const columns: AnalyticalTableColumnDefinition[] = useMemo(
    () => [
      {
        Header: t('ProjectsListView.title'),
        accessor: 'projectName',
        Cell: (instance) => {
          const projectName = getProjectName(instance);
          return (
            <div className={styles.nameCell}>
              <Link
                className={styles.nameLink}
                design="Emphasized"
                onClick={() => navigate(`/mcp/projects/${projectName}`)}
              >
                {projectName}
              </Link>
              <CopyButton collapsible text={projectnameToNamespace(projectName)} />
            </div>
          );
        },
      },
      {
        Header: t('ProjectsListView.membersHeader'),
        accessor: 'members',
        width: 220,
        disableFilters: true,
        Cell: (instance) => <ProjectMembersCell projectName={getProjectName(instance)} />,
      },
      {
        Header: t('ProjectsListView.createdHeader'),
        accessor: 'created',
        width: 120,
        disableFilters: true,
        responsivePopIn: true,
        responsiveMinWidth: 1200,
        Cell: (instance) => <CreatedAtCell projectName={getProjectName(instance)} />,
        Cell: (instance) => (
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
        Header: t('ProjectsListView.displayNameHeader'),
        accessor: 'displayName',
        Cell: (instance) => <DisplayNameCell projectName={instance.cell.row.original?.projectName as string} />,
      },
      {
        Header: 'Namespace',
        accessor: 'nameSpace',
        width: 340,
        Cell: (instance) => (
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
            <CopyButton text={instance.cell.value != null ? String(instance.cell.value) : ''} />
          </div>
        ),
      },
      {
        Header: t('yaml.YAML'),
        accessor: 'yaml',
        width: 70,
        disableFilters: true,
        disableSortBy: true,
        hAlign: 'Center' as const,
        Cell: (instance) => (
          <div className={styles.centeredCell}>
            <YamlViewButton variant="loader" resourceType="projects" resourceName={getProjectName(instance)} />
          </div>
        ),
      },
      {
        Header: '',
        accessor: 'options',
        width: 55,
        disableFilters: true,
        disableSortBy: true,
        hAlign: 'Center' as const,
        Cell: (instance) => (
          <div className={styles.centeredCell}>
            <ProjectsListItemMenu projectName={getProjectName(instance)} />
          </div>
        ),
      },
    ],
    [navigate],
  );

  if (isLoading) {
    return <Loading />;
  }
  if (error) {
    return <IllustratedError details={error.message} />;
  }

  return <AnalyticalTable className={styles.table} columns={columns} data={rows} minRows={10} />;
}

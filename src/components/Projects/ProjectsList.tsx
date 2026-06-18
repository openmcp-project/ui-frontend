import { AnalyticalTable, AnalyticalTableColumnDefinition, BusyIndicator, Link } from '@ui5/webcomponents-react';

import '@ui5/webcomponents-icons/dist/copy';
import { t } from 'i18next';
import { useMemo, useRef } from 'react';
import { useProjectMembers } from '../../spaces/onboarding/hooks/useProjectMembers';
import { useProjectsQuery } from '../../spaces/onboarding/hooks/useProjectsQuery';
import { projectnameToNamespace } from '../../utils';
import { formatDateAsTimeAgo } from '../../utils/i18n/timeAgo';
import { CopyButton } from '../Shared/CopyButton.tsx';
import IllustratedError from '../Shared/IllustratedError.tsx';
import Loading from '../Shared/Loading.tsx';
import useLuigiNavigate from '../Shared/useLuigiNavigate.tsx';
import { FadeIn } from '../Ui/FadeIn/FadeIn.tsx';
import { YamlViewButton } from '../Yaml/YamlViewButton.tsx';
import { ProjectMembersCell } from './ProjectMembersCell.tsx';
import styles from './ProjectsList.module.css';
import { ProjectsListItemMenu } from './ProjectsListItemMenu.tsx';

type ProjectListRow = {
  projectName: string;
};

function getProjectName(instance: { cell: { row: { original: unknown } } }): string {
  return (instance.cell.row.original as ProjectListRow).projectName;
}

function CreatedAtCell({
  projectName,
  onTimestamp,
}: {
  projectName: string;
  onTimestamp: (name: string, ts: string) => void;
}) {
  const { creationTimestamp, isLoading } = useProjectMembers(projectName);
  if (!isLoading && creationTimestamp) onTimestamp(projectName, creationTimestamp);
  if (isLoading || !creationTimestamp) return null;
  return (
    <FadeIn>
      <span title={new Date(creationTimestamp).toLocaleString()}>{formatDateAsTimeAgo(creationTimestamp)}</span>
    </FadeIn>
  );
}

function ProjectDisplayNameCell({ projectName }: { projectName: string }) {
  const { displayName, isLoading } = useProjectMembers(projectName);
  if (isLoading) return <BusyIndicator active size="S" />;
  return <FadeIn>{displayName ?? ''}</FadeIn>;
}

export default function ProjectsList() {
  const navigate = useLuigiNavigate();
  const { data, error, isLoading } = useProjectsQuery();
  const timestampsRef = useRef<Map<string, string>>(new Map());

  const handleTimestamp = (name: string, ts: string) => {
    timestampsRef.current.set(name, ts);
  };

  const rows = useMemo<ProjectListRow[]>(
    () =>
      data
        ?.map((projectName) => ({
          projectName,
        }))
        .sort((a, b) => a.projectName.localeCompare(b.projectName)) ?? [],
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
        Header: t('ProjectsListView.displayNameHeader'),
        accessor: 'displayName',
        Cell: (instance) => <ProjectDisplayNameCell projectName={getProjectName(instance)} />,
      },
      {
        Header: t('ProjectsListView.createdHeader'),
        accessor: 'creationTimestamp',
        width: 120,
        disableFilters: true,
        responsivePopIn: true,
        responsiveMinWidth: 1200,
        sortType: (rowA: { original: ProjectListRow }, rowB: { original: ProjectListRow }) => {
          const a = timestampsRef.current.get(rowA.original.projectName) ?? '';
          const b = timestampsRef.current.get(rowB.original.projectName) ?? '';
          return a.localeCompare(b);
        },
        Cell: (instance) => <CreatedAtCell projectName={getProjectName(instance)} onTimestamp={handleTimestamp} />,
      },
      {
        Header: t('ProjectsListView.membersHeader'),
        accessor: 'members',
        width: 220,
        disableFilters: true,
        disableSortBy: true,
        Cell: (instance) => <ProjectMembersCell projectName={getProjectName(instance)} />,
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

  return (
    <FadeIn>
      <AnalyticalTable
        style={{
          maxWidth: '1280px',
          margin: '10px auto 0px auto',
          width: '100%',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
        sortable
        className={styles.table}
        columns={columns}
        data={rows}
        minRows={10}
      />
    </FadeIn>
  );
}

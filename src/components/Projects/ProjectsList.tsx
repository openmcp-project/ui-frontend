import { AnalyticalTable, AnalyticalTableColumnDefinition, Link } from '@ui5/webcomponents-react';

import '@ui5/webcomponents-icons/dist/copy';
import { t } from 'i18next';
import { useEffect, useMemo, useState } from 'react';
import { useProjectMembers } from '../../spaces/onboarding/hooks/useProjectMembers';
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
};

function CreatedAtCell({ projectName }: { projectName: string }) {
  const { creationTimestamp, isLoading } = useProjectMembers(projectName);
  if (isLoading || !creationTimestamp) return null;
  return <span title={new Date(creationTimestamp).toLocaleString()}>{formatDateAsTimeAgo(creationTimestamp)}</span>;
}

const SMALL_SCREEN_QUERY = '(max-width: 600px)';

function useIsSmallScreen() {
  const [isSmall, setIsSmall] = useState(() => window.matchMedia(SMALL_SCREEN_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(SMALL_SCREEN_QUERY);
    const handler = (e: MediaQueryListEvent) => setIsSmall(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isSmall;
}

export default function ProjectsList() {
  const navigate = useLuigiNavigate();
  const { data, error, isLoading } = useProjectsQuery();

  const stabilizedData = useMemo<ProjectListRow[]>(
    () =>
      data?.map((projectName) => ({ projectName })).sort((a, b) => a.projectName.localeCompare(b.projectName)) ?? [],
    [data],
  );

  const stabilizedColumns: AnalyticalTableColumnDefinition[] = useMemo(
    () => [
      {
        Header: t('ProjectsListView.title'),
        accessor: 'projectName',
        Cell: (instance) => (
          <div className={styles.nameCell}>
            <Link
              className={styles.nameLink}
              design="Emphasized"
              onClick={() => navigate(`/mcp/projects/${instance.cell.row.original?.projectName as string}`)}
            >
              {instance.cell.row.original?.projectName}
            </Link>
            <CopyButton collapsible text={projectnameToNamespace(instance.cell.row.original?.projectName as string)} />
          </div>
        ),
      },
      {
        Header: t('ProjectsListView.membersHeader'),
        accessor: 'members',
        width: 220,
        disableFilters: true,
        Cell: (instance) => <ProjectMembersCell projectName={instance.cell.row.original?.projectName as string} />,
      },
      {
        Header: t('ProjectsListView.createdHeader'),
        accessor: 'created',
        width: 120,
        disableFilters: true,
        responsivePopIn: true,
        responsiveMinWidth: 1200,
        Cell: (instance) => <CreatedAtCell projectName={instance.cell.row.original?.projectName as string} />,
      },
      {
        Header: t('yaml.YAML'),
        accessor: 'yaml',
        width: 70,
        disableFilters: true,
        hAlign: 'Center' as const,
        Cell: (instance) => (
          <div className={styles.centeredCell}>
            <YamlViewButton
              variant="loader"
              resourceType="projects"
              resourceName={instance.cell.row.original?.projectName as string}
            />
          </div>
        ),
      },
      {
        Header: '',
        accessor: 'options',
        width: 55,
        disableFilters: true,
        hAlign: 'Center' as const,
        Cell: (instance) => (
          <div className={styles.centeredCell}>
            <ProjectsListItemMenu projectName={(instance.cell.row.original?.projectName as string) ?? ''} />
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

  return <AnalyticalTable className={styles.table} columns={stabilizedColumns} data={stabilizedData} minRows={10} />;
}

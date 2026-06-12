import { AnalyticalTable, AnalyticalTableColumnDefinition, Link } from '@ui5/webcomponents-react';

import '@ui5/webcomponents-icons/dist/copy';
import { t } from 'i18next';
import { useMemo } from 'react';
import { useProjectsQuery } from '../../spaces/onboarding/hooks/useProjectsQuery';
import { useProjectMembers } from '../../spaces/onboarding/hooks/useProjectMembers';
import { projectnameToNamespace } from '../../utils';
import { formatDateAsTimeAgo } from '../../utils/i18n/timeAgo';
import { CopyButton } from '../Shared/CopyButton.tsx';
import IllustratedError from '../Shared/IllustratedError.tsx';
import useLuigiNavigate from '../Shared/useLuigiNavigate.tsx';
import { YamlViewButton } from '../Yaml/YamlViewButton.tsx';
import { ProjectMembersCell } from './ProjectMembersCell.tsx';
import { ProjectsListItemMenu } from './ProjectsListItemMenu.tsx';

type ProjectListRow = {
  projectName: string;
};

function CreatedAtCell({ projectName }: { projectName: string }) {
  const { creationTimestamp, isLoading } = useProjectMembers(projectName);
  if (isLoading || !creationTimestamp) return null;
  return <span title={new Date(creationTimestamp).toLocaleString()}>{formatDateAsTimeAgo(creationTimestamp)}</span>;
}

export default function ProjectsList() {
  const navigate = useLuigiNavigate();
  const { data, error } = useProjectsQuery();
  const stabilizedData = useMemo<ProjectListRow[]>(() => data?.map((projectName) => ({ projectName })) ?? [], [data]);

  const stabilizedColumns: AnalyticalTableColumnDefinition[] = useMemo(
    () => [
      {
        Header: t('ProjectsListView.title'),
        accessor: 'projectName',
        Cell: (instance) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', width: '100%' }}>
            <Link
              design="Emphasized"
              style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
              onClick={() => navigate(`/mcp/projects/${instance.cell.row.original?.projectName as string}`)}
            >
              {instance.cell.value}
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
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
  );
}

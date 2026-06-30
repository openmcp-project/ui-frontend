import {
  AnalyticalTable,
  AnalyticalTableColumnDefinition,
  BusyIndicator,
  CheckBox,
  Link,
} from '@ui5/webcomponents-react';

import '@ui5/webcomponents-icons/dist/copy';
import { t } from 'i18next';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRememberedProject } from '../../hooks/useRememberedProject.ts';
import { useProjectMembers as _useProjectMembers } from '../../spaces/onboarding/hooks/useProjectMembers';
import { useProjectsQuery as _useProjectsQuery } from '../../spaces/onboarding/hooks/useProjectsQuery';
import { projectnameToNamespace } from '../../utils';
import { formatDateAsTimeAgo } from '../../utils/i18n/timeAgo';
import { CopyButton } from '../Shared/CopyButton.tsx';
import IllustratedError from '../Shared/IllustratedError.tsx';
import Loading from '../Shared/Loading.tsx';
import { ResourceSearchBar } from '../Shared/ResourceSearchBar.tsx';
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
  useProjectMembers,
}: {
  projectName: string;
  onTimestamp: (name: string, ts: string) => void;
  useProjectMembers: typeof _useProjectMembers;
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

function ProjectDisplayNameCell({
  projectName,
  onDisplayName,
  useProjectMembers,
}: {
  projectName: string;
  onDisplayName: (name: string, displayName: string) => void;
  useProjectMembers: typeof _useProjectMembers;
}) {
  const { displayName, isLoading } = useProjectMembers(projectName);
  if (!isLoading && displayName) onDisplayName(projectName, displayName);
  if (isLoading) return <BusyIndicator active size="S" />;
  return <FadeIn>{displayName ?? ''}</FadeIn>;
}

interface Props {
  useProjectsQuery?: typeof _useProjectsQuery;
  useProjectMembers?: typeof _useProjectMembers;
  onProjectSelect?: (projectName: string) => void;
}

export default function ProjectsList({
  useProjectsQuery = _useProjectsQuery,
  useProjectMembers = _useProjectMembers,
  onProjectSelect,
}: Props = {}) {
  const navigate = useLuigiNavigate();
  const { data, error, isLoading } = useProjectsQuery();
  const timestampsRef = useRef<Map<string, string>>(new Map());
  const displayNamesRef = useRef<Map<string, string>>(new Map());
  const [search, setSearch] = useState('');
  const [displayNamesVersion, setDisplayNamesVersion] = useState(0);

  const { setRememberedProject } = useRememberedProject();
  const [setAsDefault, setSetAsDefault] = useState(false);
  const setAsDefaultRef = useRef(false);
  useEffect(() => {
    setAsDefaultRef.current = setAsDefault;
  }, [setAsDefault]);

  const handleTimestamp = (name: string, ts: string) => {
    timestampsRef.current.set(name, ts);
  };

  const handleDisplayName = (name: string, displayName: string) => {
    if (displayNamesRef.current.get(name) === displayName) return;
    displayNamesRef.current.set(name, displayName);
    setDisplayNamesVersion((v) => v + 1);
  };

  const rows = useMemo<ProjectListRow[]>(() => {
    const query = search.trim().toLowerCase();
    return (
      data
        ?.map((projectName) => ({
          projectName,
        }))
        // eslint-disable-next-line react-hooks/refs
        .filter(({ projectName }) => {
          if (!query) return true;
          if (projectName.toLowerCase().includes(query)) return true;
          const dn = displayNamesRef.current.get(projectName)?.toLowerCase() ?? '';
          return dn.includes(query);
        })
        .sort((a, b) => a.projectName.localeCompare(b.projectName)) ?? []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, search, displayNamesVersion]);

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
                onClick={() => {
                  if (setAsDefaultRef.current) {
                    setRememberedProject(projectName);
                  }
                  onProjectSelect?.(projectName);
                  navigate(`/projects/${projectName}`);
                }}
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
        Cell: (instance) => (
          <ProjectDisplayNameCell
            projectName={getProjectName(instance)}
            useProjectMembers={useProjectMembers}
            onDisplayName={handleDisplayName}
          />
        ),
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
        Cell: (instance) => (
          <CreatedAtCell
            projectName={getProjectName(instance)}
            useProjectMembers={useProjectMembers}
            onTimestamp={handleTimestamp}
          />
        ),
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
    [navigate, useProjectMembers, onProjectSelect, setRememberedProject],
  );

  if (isLoading) {
    return <Loading />;
  }
  if (error) {
    return <IllustratedError details={error.message} />;
  }

  return (
    <FadeIn>
      <ResourceSearchBar value={search} onChange={setSearch} />
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
      <div
        style={{
          maxWidth: '1280px',
          margin: '10px auto 0px auto',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <CheckBox
          checked={setAsDefault}
          text={t('ProjectsListView.setDefaultProject')}
          onChange={() => setSetAsDefault((v) => !v)}
        />
      </div>
    </FadeIn>
  );
}

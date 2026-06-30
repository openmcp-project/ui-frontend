import {
  AnalyticalTable,
  AnalyticalTableColumnDefinition,
  BusyIndicator,
  CheckBox,
  Icon,
  Link,
  ObjectStatus,
} from '@ui5/webcomponents-react';

import '@ui5/webcomponents-icons/dist/copy';
import '@ui5/webcomponents-icons/dist/headset';
import { t } from 'i18next';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRememberedProject } from '../../hooks/useRememberedProject.ts';
import { useProjectMembers } from '../../spaces/onboarding/hooks/useProjectMembers';
import { useProjectsQuery as _useProjectsQuery } from '../../spaces/onboarding/hooks/useProjectsQuery';
import { projectnameToNamespace } from '../../utils';
import { formatDateAsTimeAgo } from '../../utils/i18n/timeAgo';
import { EditProjectDialogContainer } from '../Dialogs/EditProjectDialogContainer.tsx';
import { CopyButton } from '../Shared/CopyButton.tsx';
import IllustratedError from '../Shared/IllustratedError.tsx';
import Loading from '../Shared/Loading.tsx';
import useLuigiNavigate from '../Shared/useLuigiNavigate.tsx';
import { FadeIn } from '../Ui/FadeIn/FadeIn.tsx';
import { YamlViewButton } from '../Yaml/YamlViewButton.tsx';
import { ProjectMembersCell } from './ProjectMembersCell.tsx';
import styles from './ProjectsList.module.css';
import { ProjectsListItemMenu } from './ProjectsListItemMenu.tsx';
import { ProjectSupportInfoPopover } from './ProjectSupportInfoPopover.tsx';

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

function MetadataCell({ projectName }: { projectName: string }) {
  const { supportLandscape, supportSecurityContacts, supportOpsContacts, isLoading } = useProjectMembers(projectName);
  const openerId = `metadata-${projectName}`;
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) return <BusyIndicator active size="S" />;

  const state =
    supportLandscape === 'production'
      ? 'Negative'
      : supportLandscape === 'validation'
        ? 'Critical'
        : supportLandscape === 'testing'
          ? 'None'
          : 'Information';

  const label = supportLandscape
    ? t(`SupportInfo.landscape.${supportLandscape}`, { defaultValue: supportLandscape })
    : t('SupportInfo.pleaseSet');

  // Readiness icon only for production — encourages providing contacts.
  const isProduction = supportLandscape === 'production';
  const ready = !!(supportSecurityContacts && supportOpsContacts);
  const readinessTooltip = ready ? t('SupportInfo.readinessComplete') : t('SupportInfo.readinessMissing');
  const readinessColor = ready ? 'var(--sapPositiveColor)' : 'var(--sapCriticalColor)';

  return (
    <FadeIn>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <ObjectStatus
          id={openerId}
          interactive
          showDefaultIcon
          state={state}
          style={{ cursor: 'pointer' }}
          onClick={() => setPopoverOpen(true)}
        >
          {label}
        </ObjectStatus>
        {isProduction && (
          <Icon
            name="headset"
            title={readinessTooltip}
            style={{ color: readinessColor, fontSize: '1rem' }}
          />
        )}
      </div>
      {popoverOpen && (
        <ProjectSupportInfoPopover
          projectName={projectName}
          opener={openerId}
          open={popoverOpen}
          onClose={() => setPopoverOpen(false)}
          onEditClick={() => setEditOpen(true)}
        />
      )}
      {editOpen && (
        <EditProjectDialogContainer
          isOpen={editOpen}
          setIsOpen={setEditOpen}
          projectName={projectName}
          initialStep="supportInfo"
        />
      )}
    </FadeIn>
  );
}

interface ProjectsListProps {
  onProjectSelect?: (projectName: string) => void;
  useProjectsQuery?: typeof _useProjectsQuery;
}

export default function ProjectsList({
  onProjectSelect,
  useProjectsQuery = _useProjectsQuery,
}: ProjectsListProps = {}) {
  const navigate = useLuigiNavigate();
  const { data, error, isLoading } = useProjectsQuery();
  const timestampsRef = useRef<Map<string, string>>(new Map());

  const handleTimestamp = (name: string, ts: string) => {
    timestampsRef.current.set(name, ts);
  };
  const { setRememberedProject } = useRememberedProject();
  const [setAsDefault, setSetAsDefault] = useState(false);
  const setAsDefaultRef = useRef(false);
  useEffect(() => {
    setAsDefaultRef.current = setAsDefault;
  }, [setAsDefault]);

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
        Header: t('ProjectsListView.metadataHeader'),
        accessor: 'metadata',
        width: 140,
        disableFilters: true,
        disableSortBy: true,
        Cell: (instance) => <MetadataCell projectName={getProjectName(instance)} />,
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
    [navigate, onProjectSelect, setRememberedProject],
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

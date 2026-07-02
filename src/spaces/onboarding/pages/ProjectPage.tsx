import '@ui5/webcomponents-icons/dist/pushpin-off';
import '@ui5/webcomponents-icons/dist/pushpin-on';
import { Button, FlexBox, ObjectPage, ObjectPageTitle, Title } from '@ui5/webcomponents-react';
import { useCallback, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import ControlPlaneListAllWorkspaces from '../../../components/ControlPlanes/List/ControlPlaneListAllWorkspaces.tsx';
import { ControlPlaneListToolbar } from '../../../components/ControlPlanes/List/ControlPlaneListToolbar.tsx';
import { BreadcrumbFeedbackHeader } from '../../../components/Core/BreadcrumbFeedbackHeader.tsx';
import ProjectChooser from '../../../components/Projects/ProjectChooser.tsx';
import { CopyButton } from '../../../components/Shared/CopyButton.tsx';
import IllustratedError from '../../../components/Shared/IllustratedError.tsx';
import Loading from '../../../components/Shared/Loading.tsx';
import { ResourceSearchBar } from '../../../components/Shared/ResourceSearchBar.tsx';
import styles from './ProjectPage.module.css';
import { Center } from '../../../components/Ui/Center/Center.tsx';
import { NotFoundBanner } from '../../../components/Ui/NotFoundBanner/NotFoundBanner.tsx';
import { useRememberedProject } from '../../../hooks/useRememberedProject.ts';
import { isNotFoundError } from '../../../lib/api/error.ts';
import { useTelemetry } from '../../../lib/telemetry/telemetry.ts';
import { Routes } from '../../../Routes.ts';
import { useTelemetry } from '../../../lib/telemetry/telemetry.ts';
import { projectnameToNamespace } from '../../../utils/index.ts';
import { useWorkspacesQuery } from '../hooks/useWorkspacesQuery.ts';

export default function ProjectPage() {
  const { projectName } = useParams();
  const { data: workspaces, error, isPending } = useWorkspacesQuery(projectName);
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { rememberedProject, setRememberedProject, clearRememberedProject: clearRemembered } = useRememberedProject();
  const telemetry = useTelemetry();
  const isProjectRemembered = rememberedProject === projectName;
  const telemetry = useTelemetry();

  // Fire `workspace-list.searched` only once per "search session" — from the
  // first non-empty character until the user clears the field — so we
  // measure adoption, not keystrokes.
  const hasFiredSearchedRef = useRef(false);
  const handleSearchChange = useCallback(
    (value: string) => {
      if (value === '' && hasFiredSearchedRef.current) {
        hasFiredSearchedRef.current = false;
      } else if (value !== '' && !hasFiredSearchedRef.current) {
        telemetry.track({ name: 'workspace-list.searched' });
        hasFiredSearchedRef.current = true;
      }
      setSearch(value);
    },
    [telemetry],
  );

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      if (search.trim() === '') return;
      telemetry.track({ name: 'workspace-list.search-enter-pressed' });

      const allViewButtons = document.querySelectorAll<HTMLElement>('ui5-button[data-testid="connect-button"]');
      const activeViewButton = Array.from(allViewButtons).find(
        (btn) => !btn.hasAttribute('disabled') && btn.offsetParent !== null,
      );
      if (activeViewButton) {
        requestAnimationFrame(() => activeViewButton.focus());
        return;
      }

      const allHealthButtons = document.querySelectorAll<HTMLElement>('ui5-button[data-testid="mcp-health-button"]');
      const visibleHealthButton = Array.from(allHealthButtons).find((btn) => btn.offsetParent !== null);
      if (visibleHealthButton) {
        requestAnimationFrame(() => visibleHealthButton.focus());
      }
    },
    [search, telemetry],
  );

  if (isPending) {
    return <Loading />;
  }

  if (isNotFoundError(error)) {
    if (isProjectRemembered) {
      clearRemembered();
    }
    return (
      <Center>
        <NotFoundBanner entityType={t('Entities.Project')} homePath={`${Routes.Projects}?noRedirect=true`} />
      </Center>
    );
  }

  if (error || !workspaces || !projectName) {
    return (
      <Center>
        <IllustratedError
          button={
            <Button onClick={() => navigate(`${Routes.Projects}?noRedirect=true`)}>
              {t('ProjectPage.backToProjects')}
            </Button>
          }
          details={error?.message}
        />
      </Center>
    );
  }

  return (
    <>
      <ObjectPage
        preserveHeaderStateOnClick={true}
        titleArea={
          <ObjectPageTitle
            header={
              <Title>
                <Trans i18nKey="ProjectsPage.header" components={{ span: <span className="mono-font" /> }} />
              </Title>
            }
            subHeader={
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <p style={{ marginRight: '0.5rem' }}>{t('ProjectsPage.projectHeader')}</p>
                <ProjectChooser currentProjectName={projectName ?? ''} />
                <Button
                  data-testid="pin-button"
                  design="Transparent"
                  icon={isProjectRemembered ? 'pushpin-on' : 'pushpin-off'}
                  tooltip={isProjectRemembered ? t('ProjectsPage.unpinProject') : t('ProjectsPage.pinProject')}
                  onClick={() => {
                    if (isProjectRemembered) {
                      clearRemembered();
                      telemetry.track({ name: 'project.remembered-cleared', source: 'detail-header' });
                    } else if (projectName) {
                      setRememberedProject(projectName);
                      telemetry.track({ name: 'project.remembered', source: 'detail-header' });
                    }
                  }}
                />
                <CopyButton collapsible text={projectnameToNamespace(projectName)} source="project-namespace" />
              </div>
            }
            breadcrumbs={<BreadcrumbFeedbackHeader />}
            actionsBar={
              <FlexBox alignItems="Baseline" gap="0.5rem">
                <ControlPlaneListToolbar projectName={projectName ?? ''} />
              </FlexBox>
            }
          />
        }
        //TODO: project chooser should be part of the breadcrumb section if possible?
      >
        <ResourceSearchBar
          className={styles.searchBar}
          focusOnMount
          value={search}
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
        />
        <ControlPlaneListAllWorkspaces projectName={projectName} workspaces={workspaces} search={search} />
      </ObjectPage>
    </>
  );
}

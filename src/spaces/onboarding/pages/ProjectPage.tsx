import { FlexBox, Label, ObjectPage, ObjectPageTitle, Switch, Title } from '@ui5/webcomponents-react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import ControlPlaneListAllWorkspaces from '../../../components/ControlPlanes/List/ControlPlaneListAllWorkspaces.tsx';
import { ControlPlaneListToolbar } from '../../../components/ControlPlanes/List/ControlPlaneListToolbar.tsx';
import { BreadcrumbFeedbackHeader } from '../../../components/Core/BreadcrumbFeedbackHeader.tsx';
import ProjectChooser from '../../../components/Projects/ProjectChooser.tsx';
import IllustratedError from '../../../components/Shared/IllustratedError.tsx';
import Loading from '../../../components/Shared/Loading.tsx';
import { Center } from '../../../components/Ui/Center/Center.tsx';
import { NotFoundBanner } from '../../../components/Ui/NotFoundBanner/NotFoundBanner.tsx';
import { isNotFoundError } from '../../../lib/api/error.ts';
import { useWorkspacesQuery } from '../hooks/useWorkspacesQuery.ts';
import { clearRememberedProject, getRememberedProject } from '../../../utils/rememberedProject.ts';
import { useRememberedProject } from '../../../hooks/useRememberedProject.ts';
import { Routes } from '../../../Routes.ts';

export default function ProjectPage() {
  const { projectName } = useParams();
  const { data: workspaces, error, isPending } = useWorkspacesQuery(projectName);
  const { t } = useTranslation();
  const { rememberedProject, setRememberedProject, clearRememberedProject: clearRemembered } = useRememberedProject();
  const isProjectRemembered = rememberedProject === projectName;

  if (isPending) {
    return <Loading />;
  }

  if (isNotFoundError(error)) {
    if (getRememberedProject() === projectName) {
      clearRememberedProject();
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
        <IllustratedError details={error?.message} />
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
              </div>
            }
            breadcrumbs={<BreadcrumbFeedbackHeader />}
            actionsBar={
              <FlexBox alignItems="Center" gap="0.5rem">
                <Label>{t('ProjectsPage.rememberProject')}</Label>
                <Switch
                  accessibleName={t('ProjectsPage.rememberProject')}
                  checked={isProjectRemembered}
                  onChange={(e) => {
                    if (e.target.checked) {
                      if (projectName) setRememberedProject(projectName);
                    } else {
                      clearRemembered();
                    }
                  }}
                />
                <ControlPlaneListToolbar projectName={projectName ?? ''} />
              </FlexBox>
            }
          />
        }
        //TODO: project chooser should be part of the breadcrumb section if possible?
      >
        <ControlPlaneListAllWorkspaces projectName={projectName} workspaces={workspaces} />
      </ObjectPage>
    </>
  );
}

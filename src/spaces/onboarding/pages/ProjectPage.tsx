import { ObjectPage, ObjectPageTitle, Title } from '@ui5/webcomponents-react';
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
import { Routes } from '../../../Routes.ts';

export default function ProjectPage() {
  const { projectName } = useParams();
  const { data: workspaces, error, isPending } = useWorkspacesQuery(projectName);
  const { t } = useTranslation();

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
            actionsBar={<ControlPlaneListToolbar projectName={projectName ?? ''} />}
          />
        }
        //TODO: project chooser should be part of the breadcrumb section if possible?
      >
        <ControlPlaneListAllWorkspaces projectName={projectName} workspaces={workspaces} />
      </ObjectPage>
    </>
  );
}

import { ObjectPage, ObjectPageTitle, Title } from '@ui5/webcomponents-react';
import ProjectChooser from '../../../components/Projects/ProjectChooser.tsx';
import { useParams } from 'react-router-dom';
import ControlPlaneListAllWorkspaces from '../../../components/ControlPlanes/List/ControlPlaneListAllWorkspaces.tsx';
import { BreadcrumbFeedbackHeader } from '../../../components/Core/BreadcrumbFeedbackHeader.tsx';
import { ControlPlaneListToolbar } from '../../../components/ControlPlanes/List/ControlPlaneListToolbar.tsx';
import { Trans, useTranslation } from 'react-i18next';
import Loading from '../../../components/Shared/Loading.tsx';
import { APIError, isNotFoundError } from '../../../lib/api/error.ts';
import { NotFoundBanner } from '../../../components/Ui/NotFoundBanner/NotFoundBanner.tsx';
import IllustratedError from '../../../components/Shared/IllustratedError.tsx';
import { useWorkspacesQuery } from '../services/WorkspaceService/WorkspaceService.ts';

export default function ProjectPage() {
  const { projectName } = useParams();
  const projectNamespace = projectName ? `project-${projectName}` : undefined;
  const { data: workspaces, error, loading } = useWorkspacesQuery(projectNamespace);
  const { t } = useTranslation();

  if (loading) {
    return <Loading />;
  }

  const apiError = error && 'status' in error ? (error as APIError) : null;
  if (isNotFoundError(apiError)) {
    return <NotFoundBanner entityType={t('Entities.Project')} />;
  }

  if (error || !workspaces || !projectName) {
    return <IllustratedError details={error?.message} />;
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

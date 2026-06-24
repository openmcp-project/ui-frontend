import { ObjectPage, ObjectPageTitle, Title } from '@ui5/webcomponents-react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useState } from 'react';
import ControlPlaneListAllWorkspaces from '../../../components/ControlPlanes/List/ControlPlaneListAllWorkspaces.tsx';
import { ControlPlaneListToolbar } from '../../../components/ControlPlanes/List/ControlPlaneListToolbar.tsx';
import { BreadcrumbFeedbackHeader } from '../../../components/Core/BreadcrumbFeedbackHeader.tsx';
import ProjectChooser from '../../../components/Projects/ProjectChooser.tsx';
import { ResourceSearchBar } from '../../../components/Shared/ResourceSearchBar.tsx';
import IllustratedError from '../../../components/Shared/IllustratedError.tsx';
import Loading from '../../../components/Shared/Loading.tsx';
import { Center } from '../../../components/Ui/Center/Center.tsx';
import { NotFoundBanner } from '../../../components/Ui/NotFoundBanner/NotFoundBanner.tsx';
import { isNotFoundError } from '../../../lib/api/error.ts';
import { useWorkspacesQuery } from '../hooks/useWorkspacesQuery.ts';

export default function ProjectPage() {
  const { projectName } = useParams();
  const { data: workspaces, error, isPending } = useWorkspacesQuery(projectName);
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  if (isPending) {
    return <Loading />;
  }

  if (isNotFoundError(error)) {
    return (
      <Center>
        <NotFoundBanner entityType={t('Entities.Project')} />
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
        <ResourceSearchBar value={search} onChange={setSearch} />
        <ControlPlaneListAllWorkspaces projectName={projectName} workspaces={workspaces} search={search} />
      </ObjectPage>
    </>
  );
}

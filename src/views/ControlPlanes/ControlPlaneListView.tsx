import { ObjectPage, ObjectPageTitle, Title } from '@ui5/webcomponents-react';
import ProjectChooser from '../../components/Projects/ProjectChooser.tsx';
import { useParams } from 'react-router-dom';
import ControlPlaneListAllWorkspaces from '../../components/ControlPlanes/List/ControlPlaneListAllWorkspaces.tsx';
import IntelligentBreadcrumbs from '../../components/Core/IntelligentBreadcrumbs.tsx';
import { ControlPlaneListToolbar } from '../../components/ControlPlanes/List/ControlPlaneListToolbar.tsx';
import { Trans, useTranslation } from 'react-i18next';

export default function ControlPlaneListView() {
  const { projectName } = useParams();
  const { t } = useTranslation();

  return (
    <>
      <ObjectPage
        preserveHeaderStateOnClick={true}
        titleArea={
          <ObjectPageTitle
            header={
              <Title>
                <Trans i18nKey="ControlPlaneListView.header" components={{ span: <span className="mono-font" /> }} />
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
                <p style={{ marginRight: '0.5rem' }}>{t('ControlPlaneListView.projectHeader')}</p>
                <ProjectChooser currentProjectName={projectName ?? ''} />
              </div>
            }
            breadcrumbs={<IntelligentBreadcrumbs />}
            actionsBar={<ControlPlaneListToolbar projectName={projectName ?? ''} />}
          />
        }
        //TODO: project chooser should be part of the breadcrumb section if possible?
      >
        <ControlPlaneListAllWorkspaces projectName={projectName ?? ''} />
      </ObjectPage>
    </>
  );
}

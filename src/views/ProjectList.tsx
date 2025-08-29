import { ObjectPage, ObjectPageTitle } from '@ui5/webcomponents-react';
import ProjectsList from '../components/Projects/ProjectsList.tsx';
import { BreadCrumbFeedbackHeader } from '../components/Core/IntelligentBreadcrumbs.tsx';
import { ProjectListToolbar } from '../components/Projects/ProjectListToolbar.tsx';
import { useTranslation } from 'react-i18next';

export default function ProjectsListView() {
  const { t } = useTranslation();

  return (
    <ObjectPage
      preserveHeaderStateOnClick={true}
      titleArea={
        <ObjectPageTitle
          header={t('ProjectsListView.pageTitle')}
          breadcrumbs={<BreadCrumbFeedbackHeader />}
          actionsBar={<ProjectListToolbar />}
        />
      }
    >
      <ProjectsList />
    </ObjectPage>
  );
}

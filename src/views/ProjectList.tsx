import { ObjectPage, ObjectPageTitle } from '@ui5/webcomponents-react';
import ProjectsList from '../components/Projects/ProjectsList.tsx';
import { BreadcrumbFeedbackHeader } from '../components/Core/BreadcrumbFeedbackHeader.tsx';
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
          breadcrumbs={<BreadcrumbFeedbackHeader />}
          actionsBar={<ProjectListToolbar />}
        />
      }
    >
      <ProjectsList />
    </ObjectPage>
  );
}

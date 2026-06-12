import { Link, ObjectPage, ObjectPageTitle } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import ProjectsList from '../components/Projects/ProjectsList.tsx';
import { BreadcrumbFeedbackHeader } from '../components/Core/BreadcrumbFeedbackHeader.tsx';
import { ProjectListToolbar } from '../components/Projects/ProjectListToolbar.tsx';

const LEARN_MORE_URL = 'https://open-control-plane.io/users/concepts/projects-and-workspaces/';

export default function ProjectsListView() {
  const { t } = useTranslation();

  return (
    <ObjectPage
      preserveHeaderStateOnClick={true}
      titleArea={
        <ObjectPageTitle
          header={t('ProjectsListView.pageTitle')}
          subHeader={
            <span>
              {t('ProjectsListView.subHeader')}{' '}
              <Link href={LEARN_MORE_URL} target="_blank">
                {t('ProjectsListView.learnMore')}
              </Link>
            </span>
          }
          breadcrumbs={<BreadcrumbFeedbackHeader />}
          actionsBar={<ProjectListToolbar />}
        />
      }
    >
      <ProjectsList />
    </ObjectPage>
  );
}

import { Link, ObjectPage, ObjectPageSection, ObjectPageTitle } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProjectsList from '../components/Projects/ProjectsList.tsx';
import { BreadcrumbFeedbackHeader } from '../components/Core/BreadcrumbFeedbackHeader.tsx';
import { ProjectListToolbar } from '../components/Projects/ProjectListToolbar.tsx';

import { Routes } from '../Routes.ts';
import { useRememberedProject } from '../hooks/useRememberedProject.ts';
const LEARN_MORE_URL = 'https://open-control-plane.io/users/concepts/projects-and-workspaces/';

export default function ProjectsListView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const noRedirect = searchParams.get('noRedirect') === 'true';
  const { rememberedProject } = useRememberedProject();
  // Capture noRedirect at mount time so the redirect effect is not re-triggered
  // when the cleanup effect strips the param and causes a re-render with noRedirect=false.
  const suppressRedirect = useRef(noRedirect);

  useEffect(() => {
    if (rememberedProject && !suppressRedirect.current) {
      navigate(Routes.Project.replace(':projectName', rememberedProject), { replace: true });
    }
  }, [navigate, rememberedProject]);

  useEffect(() => {
    if (noRedirect) {
      setSearchParams({}, { replace: true });
    }
  }, [noRedirect, setSearchParams]);

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
      <ObjectPageSection id="projects" titleText="Projects" hideTitleText>
        <ProjectsList />
      </ObjectPageSection>
    </ObjectPage>
  );
}

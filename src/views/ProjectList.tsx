import { ObjectPage, ObjectPageSection, ObjectPageTitle } from '@ui5/webcomponents-react';
import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProjectsList from '../components/Projects/ProjectsList.tsx';
import { BreadcrumbFeedbackHeader } from '../components/Core/BreadcrumbFeedbackHeader.tsx';
import { ProjectListToolbar } from '../components/Projects/ProjectListToolbar.tsx';
import { Routes } from '../Routes.ts';
import { useRememberedProject } from '../hooks/useRememberedProject.ts';

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

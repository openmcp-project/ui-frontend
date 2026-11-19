import { Link, ObjectPage, ObjectPageSection, ObjectPageTitle } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProjectsList, { ProjectsListHandle } from '../components/Projects/ProjectsList.tsx';
import { BreadcrumbFeedbackHeader } from '../components/Core/BreadcrumbFeedbackHeader.tsx';
import { ProjectListToolbar } from '../components/Projects/ProjectListToolbar.tsx';

import { Routes } from '../Routes.ts';
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts';
import { useRememberedProject } from '../hooks/useRememberedProject.ts';
import { useLink } from '../lib/shared/useLink.ts';

export default function ProjectsListView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const noRedirect = searchParams.get('noRedirect') === 'true';
  const { rememberedProject } = useRememberedProject();
  const { projectsGuide } = useLink();
  const projectsListRef = useRef<ProjectsListHandle>(null);
  // Capture noRedirect at mount time so the redirect effect is not re-triggered
  // when the cleanup effect strips the param and causes a re-render with noRedirect=false.
  const suppressRedirect = useRef(noRedirect);

  useDocumentTitle(t('ProjectsListView.title'));

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
              <Link href={projectsGuide} target="_blank">
                {t('ProjectsListView.learnMore')}
              </Link>
            </span>
          }
          breadcrumbs={<BreadcrumbFeedbackHeader />}
          actionsBar={
            <ProjectListToolbar
              onProjectCreated={() => {
                void projectsListRef.current?.refetch();
              }}
            />
          }
        />
      }
    >
      <ObjectPageSection id="projects" titleText="Projects" hideTitleText>
        <ProjectsList ref={projectsListRef} />
      </ObjectPageSection>
    </ObjectPage>
  );
}

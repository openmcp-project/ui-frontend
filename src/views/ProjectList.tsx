import { CheckBox, ObjectPage, ObjectPageTitle } from '@ui5/webcomponents-react';
import { useEffect, useState } from 'react';
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
  const { rememberedProject, setRememberedProject, clearRememberedProject } = useRememberedProject();
  const [rememberChecked, setRememberChecked] = useState(() => rememberedProject !== null);

  useEffect(() => {
    if (rememberedProject && !noRedirect) {
      navigate(Routes.Project.replace(':projectName', rememberedProject), { replace: true });
    }
  }, [navigate, noRedirect, rememberedProject]);

  useEffect(() => {
    if (noRedirect) {
      setSearchParams({}, { replace: true });
    }
  }, [noRedirect, setSearchParams]);

  const onRememberChange = (checked: boolean) => {
    setRememberChecked(checked);
    if (!checked) {
      clearRememberedProject();
    }
  };

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
      <ProjectsList onProjectSelect={rememberChecked ? setRememberedProject : undefined} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', maxWidth: '1280px', margin: '0.5rem auto 0' }}>
        <CheckBox
          checked={rememberChecked}
          text={t('ProjectsListView.rememberProject')}
          onChange={(e) => onRememberChange(e.target.checked ?? false)}
        />
      </div>
    </ObjectPage>
  );
}

import { Breadcrumbs } from '@ui5/webcomponents-react';
import { BreadcrumbsItem } from '@ui5/webcomponents-react/wrappers';
import { generatePath, useNavigate as _useNavgigate, useParams as _useParams } from 'react-router-dom';

import { useTranslation } from 'react-i18next';
import { useFrontendConfig } from '../../../context/FrontendConfigContext.tsx';
import { Routes } from '../../../Routes.ts';

export interface PathAwareBreadcrumbsProps {
  useNavigate?: typeof _useNavgigate;
  useParams?: typeof _useParams;
}
export function PathAwareBreadcrumbs({
  useNavigate = _useNavgigate,
  useParams = _useParams,
}: PathAwareBreadcrumbsProps) {
  const { projectName, workspaceName, controlPlaneName } = useParams();
  const { t } = useTranslation();
  const frontendConfig = useFrontendConfig();
  const navigate = useNavigate();

  const breadcrumbItems: { label: string; path: string }[] = [
    {
      label: `[${frontendConfig.landscape}] ${t('PathAwareBreadcrumbs.projectsLabel')}`,
      path: Routes.Home,
    },
  ];

  if (projectName) {
    breadcrumbItems.push({
      label: projectName,
      path: generatePath(Routes.Project, {
        projectName,
      }),
    });

    if (workspaceName) {
      breadcrumbItems.push({
        label: workspaceName,
        // Navigate to the project route since workspaces don't provide a direct path
        path: generatePath(Routes.Project, {
          projectName,
        }),
      });

      if (controlPlaneName) {
        breadcrumbItems.push({
          label: controlPlaneName,
          path: generatePath(Routes.Mcp, {
            projectName,
            workspaceName,
            controlPlaneName,
          }),
        });
      }
    }
  }

  return (
    <Breadcrumbs
      design="NoCurrentPage"
      onItemClick={(event) => {
        event.preventDefault();
        const target = event.detail.item.dataset.target;

        if (target) {
          navigate(target);
        }
      }}
    >
      {breadcrumbItems.map((item) => (
        <BreadcrumbsItem key={item.path} data-target={item.path} data-testid="breadcrumb-item">
          {item.label}
        </BreadcrumbsItem>
      ))}
    </Breadcrumbs>
  );
}

import { ReactNode } from 'react';
import { useGetMcpUserRights } from './useGetMcpUserRights.ts';
import { useTranslation } from 'react-i18next';

import IllustratedError from '../../../components/Shared/IllustratedError.tsx';
import { Button } from '@ui5/webcomponents-react';
import { ControlPlaneType } from '../../../lib/api/types/crate/controlPlanes.ts';
import { generatePath, useNavigate, useParams } from 'react-router-dom';
import { Routes } from '../../../Routes.ts';

import { Center } from '../../../components/Ui/Center/Center.tsx';
import { CRDRequest } from '../../../lib/api/types/crossplane/CRDList.ts';
import { useApiResource } from '../../../lib/api/useApiResource.ts';

export interface ManagedControlPlaneAuthorizationProps {
  mcp: ControlPlaneType;
  children: ReactNode;
}
export const ManagedControlPlaneAuthorization = ({ children, mcp }: ManagedControlPlaneAuthorizationProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { projectName, workspaceName } = useParams();
  const onBack = () => {
    if (workspaceName) {
      navigate(
        generatePath(Routes.Project, {
          projectName: projectName ?? '',
        }),
      );
    }
  };

  const { error: crdError, data: crdData } = useApiResource(CRDRequest);
  console.log('crdError:');
  console.log(crdError?.status);
  console.log('crdData:');
  console.log(crdData);
  const isUserNotAuthorized = crdError?.status === 403 || crdError?.status === 401;
  if (isUserNotAuthorized)
    return (
      <Center>
        <IllustratedError
          title={t('mcp.authorization.accessDenied.title')}
          details={t('mcp.authorization.accessDenied.details')}
        />
        <Button design={'Default'} icon={'navigation-left-arrow'} onClick={onBack}>
          {t('mcp.authorization.backToWorkspaces')}
        </Button>
      </Center>
    );

  return <>{children}</>;
};

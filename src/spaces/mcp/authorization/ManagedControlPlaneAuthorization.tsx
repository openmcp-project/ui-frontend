import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import IllustratedError from '../../../components/Shared/IllustratedError.tsx';
import { BusyIndicator, Button } from '@ui5/webcomponents-react';
import { generatePath, useNavigate, useParams } from 'react-router-dom';
import { Routes } from '../../../Routes.ts';

import { Center } from '../../../components/Ui/Center/Center.tsx';
import { useMcpAuthorizationCheck } from './useMcpAuthorizationCheck.ts';

export interface ManagedControlPlaneAuthorizationProps {
  children: ReactNode;
}
export const ManagedControlPlaneAuthorization = ({ children }: ManagedControlPlaneAuthorizationProps) => {
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
    } else {
      navigate(Routes.Home);
    }
  };

  const { isLoading, isUnauthorized } = useMcpAuthorizationCheck();
  if (isLoading) {
    return (
      <Center>
        <BusyIndicator active />
      </Center>
    );
  }
  if (isUnauthorized)
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

import { ReactNode } from 'react';
import { useGetMcpUserRights } from './useGetMcpUserRights.ts';
import { useTranslation } from 'react-i18next';

import IllustratedError from '../../../components/Shared/IllustratedError.tsx';
import { Button, FlexBox } from '@ui5/webcomponents-react';
import { ControlPlaneType } from '../../../lib/api/types/crate/controlPlanes.ts';
import { generatePath, useNavigate, useParams } from 'react-router-dom';
import { Routes } from '../../../Routes.ts';
import styles from './ManagedControlPlaneAuthorization.module.css';

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
  const createdBy =
    mcp?.metadata?.annotations?.['openmcp.cloud/created-by']?.split(':')[1] ||
    t('mcp.authorization.accessDenied.administrator');
  const { isMcpMember } = useGetMcpUserRights();
  if (!isMcpMember)
    return (
      <FlexBox justifyContent={'Center'} alignItems={'Center'} direction={'Column'} className={styles.container}>
        <IllustratedError
          title={t('mcp.authorization.accessDenied.title')}
          details={t('mcp.authorization.accessDenied.details', { createdBy })}
        />
        <Button design={'Emphasized'} icon={'navigation-left-arrow'} onClick={onBack}>
          {t('mcp.authorization.backToWorkspaces')}
        </Button>
      </FlexBox>
    );

  return <>{children}</>;
};

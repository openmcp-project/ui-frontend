import { ReactNode, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { BusyIndicator } from '@ui5/webcomponents-react';
import { generatePath, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Routes } from '../../../Routes.ts';

import { Center } from '../../../components/Ui/Center/Center.tsx';
import { AccessDeniedView } from '../../../components/Ui/AccessDeniedView/AccessDeniedView.tsx';
import { useMcpAuthorizationCheck, useMcpAuthorizationCheckV2 } from './useMcpAuthorizationCheck.ts';
import { useMcp } from '../../../lib/shared/McpContext.tsx';
import { downstreamAccessKey, rememberDenied, clearDenied } from '../../../lib/api/access/downstreamAccessStore.ts';

export interface ManagedControlPlaneAuthorizationProps {
  children: ReactNode;
}

export const ManagedControlPlaneAuthorization = ({ children }: ManagedControlPlaneAuthorizationProps) => {
  const mcp = useMcp();
  if (mcp.isV2) {
    return <ManagedControlPlaneAuthorizationV2>{children}</ManagedControlPlaneAuthorizationV2>;
  }
  return <ManagedControlPlaneAuthorizationV1>{children}</ManagedControlPlaneAuthorizationV1>;
};

function useOnBack() {
  const navigate = useNavigate();
  const { projectName, workspaceName } = useParams();
  return () => {
    if (workspaceName) {
      navigate(generatePath(Routes.Project, { projectName: projectName ?? '' }));
    } else {
      navigate(Routes.Home);
    }
  };
}

const ManagedControlPlaneAuthorizationV1 = ({ children }: ManagedControlPlaneAuthorizationProps) => {
  const onBack = useOnBack();
  const { isLoading, isUnauthorized } = useMcpAuthorizationCheck();

  if (isLoading) {
    return (
      <Center>
        <BusyIndicator active />
      </Center>
    );
  }
  if (isUnauthorized) {
    return <AccessDeniedView onBack={onBack} />;
  }

  return <>{children}</>;
};

const ManagedControlPlaneAuthorizationV2 = ({ children }: ManagedControlPlaneAuthorizationProps) => {
  const { t } = useTranslation();
  const onBack = useOnBack();
  const { projectName, workspaceName, controlPlaneName } = useParams();
  const [searchParams] = useSearchParams();
  const idp = searchParams.get('idp') ?? undefined;

  // No blocking spinner: render children by default (rule of thumb). The Headlamp iframe and the
  // legacy sections handle their own 403s. Recheck on focus so access granted meanwhile unblocks.
  const { isUnauthorized } = useMcpAuthorizationCheckV2();

  // Writer for the remembered downstream deny read by ConnectButtonV2. A confirmed deny is
  // remembered; a successful (not-denied) check clears any stale deny for this IdP.
  useEffect(() => {
    if (!projectName || !workspaceName || !controlPlaneName) return;
    const key = downstreamAccessKey({
      project: projectName,
      workspace: workspaceName,
      controlPlane: controlPlaneName,
      idp,
    });
    if (isUnauthorized) {
      rememberDenied(key);
    } else {
      clearDenied(key);
    }
  }, [isUnauthorized, projectName, workspaceName, controlPlaneName, idp]);

  if (isUnauthorized) {
    return (
      <AccessDeniedView
        title={t('mcp.authorization.accessDenied.title')}
        details={t('mcp.authorization.accessDenied.details')}
        onBack={onBack}
      />
    );
  }

  return <>{children}</>;
};

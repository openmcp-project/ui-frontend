import { ReactNode } from 'react';
import { useGetMcpUserRights } from './useGetMcpUserRights.ts';

import IllustratedError from '../../../components/Shared/IllustratedError.tsx';
import { FlexBox, ObjectPageSection } from '@ui5/webcomponents-react';
import { ControlPlaneType } from '../../../lib/api/types/crate/controlPlanes.ts';

export interface ManagedControlPlaneAuthorization {
  mcp: ControlPlaneType;
  children: ReactNode;
}
export const ManagedControlPlaneAuthorization = ({ children, mcp }: ManagedControlPlaneAuthorization) => {
  const createdBy = mcp?.metadata?.annotations?.['openmcp.cloud/created-by'];
  const { isMcpMember } = useGetMcpUserRights();
  if (!isMcpMember)
    return (
      <ObjectPageSection>
        <FlexBox justifyContent={'Center'} alignItems={'Center'} style={{ height: '100%' }}>
          <IllustratedError
            title={'You are not a member of this Managed Control Plane'}
            details={`To get access to it please contact: ${createdBy}`}
          />
        </FlexBox>
      </ObjectPageSection>
    );

  return <>{children}</>;
};

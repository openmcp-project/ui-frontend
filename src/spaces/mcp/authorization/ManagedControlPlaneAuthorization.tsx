import { ReactNode } from 'react';
import { useGetMcpUserRights } from './useGetMcpUserRights.ts';

import IllustratedError from '../../../components/Shared/IllustratedError.tsx';
import { FlexBox } from '@ui5/webcomponents-react';

export const ManagedControlPlaneAuthorization = ({ children }: { children: ReactNode }) => {
  const { isMcpMember } = useGetMcpUserRights();
  if (!isMcpMember)
    return (
      <FlexBox justifyContent={'Center'} alignItems={'Center'} style={{ height: '100%' }}>
        <IllustratedError title={'You are not a member of this Managed Control Plane'} />
      </FlexBox>
    );

  return <>{children}</>;
};

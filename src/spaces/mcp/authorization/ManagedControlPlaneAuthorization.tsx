import { ReactNode } from 'react';
import { useGetMcpUserRights } from './useGetMcpUserRights.ts';

import IllustratedError from '../../../components/Shared/IllustratedError.tsx';

export const ManagedControlPlaneAuthorization = ({ children }: { children: ReactNode }) => {
  const { isMcpMember } = useGetMcpUserRights();
  if (!isMcpMember) return <IllustratedError title={'Not member of this mcp'} />;

  return <>{children}</>;
};

import { useAuthOnboarding } from '../../onboarding/auth/AuthContextOnboarding.tsx';
import { useMcp } from '../../../lib/shared/McpContext.tsx';

export const useGetMcpUserRights = (): { isMcpMember: boolean; isMcpAdmin: boolean } => {
  const auth = useAuthOnboarding();
  const mcp = useMcp();
  const userEmail = auth.user?.email;
  const mcpUsers = mcp.roleBindings ?? [];

  console.log('auth');
  console.log(auth);
  console.log('mcp');
  console.log(mcp);

  const mcpUser = userEmail
    ? mcpUsers.find(
        (roleBinding) =>
          Array.isArray(roleBinding.subjects) &&
          roleBinding.subjects.some((subject) => subject?.name?.includes(userEmail)),
      )
    : undefined;

  return { isMcpMember: !!mcpUser, isMcpAdmin: !!userEmail && mcpUser?.role === 'admin' };
};

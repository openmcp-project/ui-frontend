import { useAuthOnboarding } from '../../onboarding/auth/AuthContextOnboarding.tsx';
import { useMcp } from '../../../lib/shared/McpContext.tsx';

export const useGetMcpUserRights = (): { isMcpAdmin: boolean } => {
  const auth = useAuthOnboarding();
  const mcp = useMcp();
  const userEmail = auth.user?.email;
  const mcpUsers = mcp.roleBindings ?? [];

  console.log('auth');
  console.log(auth);
  console.log('mcp');
  console.log(mcp);

  const matchingRoleBinding = userEmail
    ? mcpUsers.find(
        (roleBinding) =>
          Array.isArray(roleBinding.subjects) &&
          roleBinding.subjects.some((subject) => subject?.name?.includes(userEmail)),
      )
    : undefined;

  return { isMcpAdmin: !!userEmail && matchingRoleBinding?.role === 'admin' };
};

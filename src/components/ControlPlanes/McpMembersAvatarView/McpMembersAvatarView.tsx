import { MembersAvatarView } from '../List/MembersAvatarView.tsx';
import { useConvertRoleBindingsToMembers } from '../../../hooks/useConvertRoleBindingsToMembers.ts';

interface Props {
  project?: string;
  workspace?: string;
  roleBindings?: { role: string; subjects: { kind: string; name: string }[] }[];
}

export function McpMembersAvatarView({ roleBindings, project, workspace }: Props) {
  const members = useConvertRoleBindingsToMembers(roleBindings);

  return <MembersAvatarView members={members} project={project} workspace={workspace} hideNamespaceColumn />;
}

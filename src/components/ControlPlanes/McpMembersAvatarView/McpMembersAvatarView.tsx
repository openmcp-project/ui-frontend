import { MembersAvatarView } from '../List/MembersAvatarView.tsx';
import { convertRoleBindingsToMembers } from '../../../utils/convertRoleBindingsToMembers.ts';
import styles from './McpMembersAvatarView.module.css';

interface Props {
  project?: string;
  workspace?: string;
  roleBindings?: { role: string; subjects: { kind: string; name: string }[] }[];
  compact?: boolean;
}

export function McpMembersAvatarView({ roleBindings, project, workspace, compact = false }: Props) {
  const members = convertRoleBindingsToMembers(roleBindings);
  return (
    <div className={compact ? styles.avatarScaleCompact : styles.avatarScale}>
      <MembersAvatarView members={members} project={project} workspace={workspace} hideNamespaceColumn />
    </div>
  );
}

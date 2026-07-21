import { MembersAvatarView } from '../List/MembersAvatarView.tsx';
import { convertRoleBindingsToMembers } from '../../../utils/convertRoleBindingsToMembers.ts';
import { useTranslation } from 'react-i18next';
import styles from './McpMembersAvatarView.module.css';

interface Props {
  project?: string;
  workspace?: string;
  roleBindings?: { role: string; subjects: { kind: string; name: string }[] }[];
}

export function McpMembersAvatarView({ roleBindings, project, workspace }: Props) {
  const members = convertRoleBindingsToMembers(roleBindings);
  const { t } = useTranslation();
  return (
    <div className={styles.wrapper}>
      <span className={styles.membersTitle}>
        {t('common.members')} ({members.length})
      </span>
      <MembersAvatarView
        members={members}
        project={project}
        workspace={workspace}
        hideNamespaceColumn
        source="controlplane-detail"
      />
    </div>
  );
}

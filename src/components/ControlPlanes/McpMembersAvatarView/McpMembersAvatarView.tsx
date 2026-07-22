import { FlexBox, Text } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  if (compact) {
    return (
      <MembersAvatarView
        members={members}
        project={project}
        workspace={workspace}
        hideNamespaceColumn
        source="controlplane-card"
        maxWidth="7rem"
      />
    );
  }

  return (
    <FlexBox direction="Column">
      <Text className={styles.membersTitle}>
        {t('common.members')} ({members.length}):
      </Text>
      <MembersAvatarView
        members={members}
        project={project}
        workspace={workspace}
        hideNamespaceColumn
        source="controlplane-detail"
      />
    </FlexBox>
  );
}

import { MembersAvatarView } from '../List/MembersAvatarView.tsx';
import { useConvertRoleBindingsToMembers } from '../../../hooks/useConvertRoleBindingsToMembers.ts';
import { FlexBox, Text } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import styles from './McpMembersAvatarView.module.css';

interface Props {
  project?: string;
  workspace?: string;
  roleBindings?: { role: string; subjects: { kind: string; name: string }[] }[];
}

export function McpMembersAvatarView({ roleBindings, project, workspace }: Props) {
  const members = useConvertRoleBindingsToMembers(roleBindings);
  const { t } = useTranslation();
  return (
    <FlexBox direction="Column">
      <Text className={styles.membersTitle}>
        {t('common.members')} ({members.length}):
      </Text>
      <MembersAvatarView members={members} project={project} workspace={workspace} hideNamespaceColumn />
    </FlexBox>
  );
}

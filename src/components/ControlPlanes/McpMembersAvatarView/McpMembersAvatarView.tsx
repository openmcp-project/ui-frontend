import { FlexBox, Text } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import { MembersAvatarView } from '../List/MembersAvatarView.tsx';
import { convertRoleBindingsToMembers } from '../../../utils/convertRoleBindingsToMembers.ts';
import styles from './McpMembersAvatarView.module.css';

interface Props {
  roleBindings?: { role: string; subjects: { kind: string; name: string }[]; provider?: string }[];
  compact?: boolean;
}

export function McpMembersAvatarView({ roleBindings, compact = false }: Props) {
  const members = convertRoleBindingsToMembers(roleBindings);
  const { t } = useTranslation();

  if (compact) {
    return (
      <MembersAvatarView
        members={members}
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
        hideNamespaceColumn
        source="controlplane-detail"
      />
    </FlexBox>
  );
}

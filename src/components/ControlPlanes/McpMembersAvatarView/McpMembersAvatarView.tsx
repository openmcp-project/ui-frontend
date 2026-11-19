import { FlexBox, Text } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import { useClusterRoles } from '../../../spaces/controlPlaneV2/hooks/useClusterRoles.ts';
import { convertRoleBindingsToMembers } from '../../../utils/convertRoleBindingsToMembers.ts';
import { MembersAvatarView } from '../List/MembersAvatarView.tsx';
import styles from './McpMembersAvatarView.module.css';

interface Props {
  roleBindings?: { role: string; subjects: { kind: string; name: string }[]; provider?: string }[];
  compact?: boolean;
  // ControlPlane (v2): `role` values are Kubernetes RBAC role refs.
  clusterRoles?: boolean;
}

export function McpMembersAvatarView({ roleBindings, compact = false, clusterRoles = false }: Props) {
  const members = convertRoleBindingsToMembers(roleBindings);
  const { t } = useTranslation();
  // When rendering inside a control-plane session context, useClusterRoles resolves to the real
  // list so missing-role warnings can be shown. Outside a session (e.g. CP card, create wizard)
  // the hook self-guards and returns state:'unknown', so no request is made.
  const clusterRolesLookup = useClusterRoles();
  const existingClusterRoles =
    clusterRoles && clusterRolesLookup.state === 'ready' ? clusterRolesLookup.all : undefined;

  if (compact) {
    return (
      <MembersAvatarView
        members={members}
        hideNamespaceColumn
        source="controlplane-card"
        maxWidth="7rem"
        clusterRoles={clusterRoles}
        existingClusterRoles={existingClusterRoles}
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
        clusterRoles={clusterRoles}
        existingClusterRoles={existingClusterRoles}
      />
    </FlexBox>
  );
}

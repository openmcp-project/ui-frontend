import '@ui5/webcomponents-icons/dist/alert';
import '@ui5/webcomponents-icons/dist/badge';
import '@ui5/webcomponents-icons/dist/edit';
import '@ui5/webcomponents-icons/dist/employee';
import '@ui5/webcomponents-icons/dist/group';
import '@ui5/webcomponents-icons/dist/machine';
import '@ui5/webcomponents-icons/dist/shield';
import '@ui5/webcomponents-icons/dist/show';
import { CheckBox, FlexBox, Icon, ObjectStatus, RadioButton, Text } from '@ui5/webcomponents-react';
import { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { clusterRoleIcon, DEFAULT_CLUSTER_ROLE, formatRoleRef } from '../../lib/api/types/shared/clusterRoles.ts';
import { MemberRolesDetailed, memberRolesOptions } from '../../lib/api/types/shared/members.ts';
import styles from './Members.module.css';

// One visual vocabulary for members, used wherever a member's type or role appears — table cells,
// popovers and the options of the add/edit dialog:
//   account type = icon + plain text
//   role         = neutral badge (pill), icon + label. No colour: a role is information, not a warning.
// The dialog's options repeat one shape: [radio | checkbox] + that same label or badge + optional
// bullet points.

const ACCOUNT_TYPE_ICONS: Record<string, string> = {
  User: 'employee',
  Group: 'group',
  ServiceAccount: 'machine',
};

// The account type is a plain fact about the member, so it is plain text with an icon — not a badge.
// Badges are reserved for roles.
export const AccountTypeLabel: FC<{ kind: string; label?: string }> = ({ kind, label }) => (
  <span className={styles.accountType}>
    <Icon name={ACCOUNT_TYPE_ICONS[kind] ?? 'employee'} />
    <Text>{label ?? kind}</Text>
  </span>
);

const CLUSTER_ROLE_LABEL_KEYS: Record<string, string> = {
  [DEFAULT_CLUSTER_ROLE]: 'MemberAccess.roles.clusterAdmin.title',
  admin: 'MemberAccess.roles.admin.title',
  edit: 'MemberAccess.roles.edit.title',
  view: 'MemberAccess.roles.view.title',
};

const MEMBER_ROLE_ICONS: Record<string, string> = Object.fromEntries(
  memberRolesOptions.map(({ value, icon }) => [value, icon ?? 'show']),
);

export interface RoleBadgeProps {
  role: string;
  // true: `role` is a Kubernetes RBAC role ref (ControlPlane v2). false: a project/workspace role.
  clusterRole?: boolean;
  // The role is known not to exist in the control plane. Still a valid state — marked, not coloured.
  missing?: boolean;
}

export const RoleBadge: FC<RoleBadgeProps> = ({ role, clusterRole = false, missing = false }) => {
  const { t } = useTranslation();
  if (!clusterRole) {
    return (
      <ObjectStatus icon={<Icon name={MEMBER_ROLE_ICONS[role] ?? 'show'} />} inverted>
        {MemberRolesDetailed[role]?.displayValue ?? role}
      </ObjectStatus>
    );
  }
  // Only the built-in roles carry an icon; custom roles are shown by name alone.
  const icon = missing ? 'alert' : clusterRoleIcon(role);
  return (
    <ObjectStatus
      icon={icon ? <Icon name={icon} /> : undefined}
      title={missing ? t('MemberAccess.missing.tooltip') : undefined}
      data-testid={missing ? `missing-role-${role}` : undefined}
      inverted
    >
      {CLUSTER_ROLE_LABEL_KEYS[role] ? t(CLUSTER_ROLE_LABEL_KEYS[role]) : formatRoleRef(role)}
    </ObjectStatus>
  );
};

export interface ChoiceOptionProps {
  type: 'radio' | 'checkbox';
  // Radio group name; required for type 'radio'.
  name?: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
  // The same label or badge the table shows for this value.
  badge: ReactNode;
  accessibleName: string;
  points?: string[];
  note?: ReactNode;
  children?: ReactNode;
  testId?: string;
}

/** One selectable option of the member dialog: control + badge, then what it means. */
export const ChoiceOption: FC<ChoiceOptionProps> = ({
  type,
  name,
  checked,
  disabled,
  onToggle,
  badge,
  accessibleName,
  points,
  note,
  children,
  testId,
}) => (
  <div className={styles.choiceOption}>
    <FlexBox alignItems="Center">
      {type === 'radio' ? (
        <RadioButton
          name={name}
          checked={checked}
          disabled={disabled}
          accessibleName={accessibleName}
          data-testid={testId}
          onChange={onToggle}
        />
      ) : (
        <CheckBox
          checked={checked}
          disabled={disabled}
          accessibleName={accessibleName}
          data-testid={testId}
          onChange={onToggle}
        />
      )}
      {/* The badge is the option's label: clicking it selects, like a native label would. */}
      <span
        className={styles.choiceBadge}
        aria-hidden="true"
        onClick={() => {
          if (disabled || (type === 'radio' && checked)) return;
          onToggle();
        }}
      >
        {badge}
      </span>
    </FlexBox>
    {(points?.length || note || children) && (
      <div className={styles.choiceBody}>
        {!!points?.length && (
          <ul className={styles.accessBullets}>
            {points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        )}
        {note}
        {children}
      </div>
    )}
  </div>
);

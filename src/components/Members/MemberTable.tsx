import ValueState from '@ui5/webcomponents-base/dist/types/ValueState.js';
import '@ui5/webcomponents-icons/dist/alert';
import '@ui5/webcomponents-icons/dist/badge';
import '@ui5/webcomponents-icons/dist/search';
import '@ui5/webcomponents-icons/dist/shield';
import '@ui5/webcomponents-icons/dist/show';
import {
  AnalyticalTable,
  Button,
  FlexBox,
  Icon,
  Input,
  InputDomRef,
  MessageStrip,
  ObjectStatus,
  Text,
  Ui5CustomEvent,
} from '@ui5/webcomponents-react';
import { AnalyticalTableColumnDefinition } from '@ui5/webcomponents-react/wrappers';
import { FC, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '@ui5/webcomponents-icons/dist/edit';
import '@ui5/webcomponents-icons/dist/role';
import {
  clusterRoleIcon,
  isNamespacedRole,
  DEFAULT_CLUSTER_ROLE,
  formatRoleRef,
  uniqueRoles,
} from '../../lib/api/types/shared/clusterRoles.ts';
import {
  isUnnamedProvider,
  Member,
  memberRolesOptions,
  MemberRoles,
  MemberRolesDetailed,
} from '../../lib/api/types/shared/members';
import { Infobox } from '../Ui/Infobox/Infobox.tsx';
import { ACCOUNT_TYPES } from './EditMembers.tsx';
import styles from './MemberTable.module.css';

type MemberTableRow = {
  email: string;
  role: string;
  roleValue: string;
  // clusterRoles mode: every role the member is bound to (encoded role refs).
  roleValues: string[];
  kind: string;
  namespace: string;
  _member: Member;
};

type MemberTableProps = {
  members: Member[];
  onDeleteMember?: (email: string) => void;
  onEditMember?: (member: Member) => void;
  isValidationError?: boolean;
  requireAtLeastOneMember: boolean;
  hideNamespaceColumn?: boolean;
  // ControlPlane (v2) members: `roles` are Kubernetes RBAC role refs (possibly several per member),
  // shown by their real names instead of the project/workspace role labels.
  clusterRoles?: boolean;
  // clusterRoles mode: names of the ClusterRoles that exist in the control plane, once the (async)
  // lookup has finished. `undefined` = not checked (yet) — nothing is flagged. A binding to a role
  // that does not exist is accepted by the platform but grants nothing.
  existingClusterRoles?: string[];
};

// Icon per role value, reusing the same options arrays the role-picker dropdowns use — one
// source of truth instead of a badge-only copy that could drift from them.
const ROLE_ICON_BY_VALUE: Record<string, string> = Object.fromEntries(
  memberRolesOptions.map(({ value, icon }) => [value, icon ?? 'show']),
);

// Badge severity has no other owner in the codebase — it's purely a table presentation choice.
const ROLE_STATE_BY_VALUE: Record<string, ValueState> = {
  [MemberRoles.admin]: ValueState.Critical,
};

const roleMeta = (roleValue: string): { icon: string; state: ValueState } => ({
  icon: ROLE_ICON_BY_VALUE[roleValue] ?? 'show',
  state: ROLE_STATE_BY_VALUE[roleValue] ?? ValueState.None,
});

const CLUSTER_ROLE_LABEL_KEYS: Record<string, string> = {
  [DEFAULT_CLUSTER_ROLE]: 'MemberAccess.roles.clusterAdmin.title',
  admin: 'MemberAccess.roles.admin.title',
  view: 'MemberAccess.roles.view.title',
};

// cluster-admin is unrestricted access to the whole ControlPlane — keep it visually distinct.
const clusterRoleState = (role: string): ValueState =>
  role === DEFAULT_CLUSTER_ROLE ? ValueState.Negative : ValueState.None;

const toRow = (m: Member, clusterRoles: boolean): MemberTableRow => {
  const roleValue = m.roles?.[0] ?? '';
  const roleValues = uniqueRoles(m.roles ?? []);
  return {
    email: m.name,
    role: clusterRoles
      ? roleValues.map(formatRoleRef).join(', ')
      : (MemberRolesDetailed[roleValue]?.displayValue ?? m.roles?.toString()),
    roleValue,
    roleValues,
    kind: m.kind,
    namespace: m.namespace ?? '',
    _member: m,
  };
};

// AnalyticalTable defaults to a padded 15-row/min-5 viewport; pin rows to actual data count
// instead, so the table's height always matches its content (min 1, for the "No data" row).
// Capped at MAX_VISIBLE_ROWS so a very large provider group (e.g. a big OIDC group binding)
// scrolls internally instead of growing the table/popover without bound.
const MAX_VISIBLE_ROWS = 10;
const rowCount = (count: number) => Math.min(Math.max(count, 1), MAX_VISIBLE_ROWS);

// Disable react-table's auto-reset behaviours. Without these, each measure pass
// the AnalyticalTable virtualizer triggers can re-dispatch reducer actions,
// feeding a measure→setState→re-measure loop ("Maximum update depth exceeded"),
// especially when several member tables render/animate at once. Mirrors the
// shared ConfiguredAnalyticsTable wrapper.
const reactTableOptions = {
  autoResetHiddenColumns: false,
  autoResetPage: false,
  autoResetExpanded: false,
  autoResetGroupBy: false,
  autoResetSelectedRows: false,
  autoResetSortBy: false,
  autoResetFilters: false,
  autoResetRowState: false,
  autoResetResize: false,
};

export const MemberTable: FC<MemberTableProps> = ({
  members,
  onDeleteMember,
  onEditMember,
  isValidationError = false,
  requireAtLeastOneMember,
  hideNamespaceColumn = false,
  clusterRoles = false,
  existingClusterRoles,
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  // Only ClusterRoles can be verified; namespaced Roles are left alone.
  const isMissingRole = useCallback(
    (role: string) =>
      clusterRoles && !!existingClusterRoles && !isNamespacedRole(role) && !existingClusterRoles.includes(role),
    [clusterRoles, existingClusterRoles],
  );
  const missingRoles = useMemo(
    () => uniqueRoles(members.flatMap((m) => m.roles ?? [])).filter(isMissingRole),
    [members, isMissingRole],
  );

  const hasNamespaceData = useMemo(() => members.some((m) => !!m.namespace), [members]);
  // Based on the unfiltered member set — otherwise searching down to a single remaining
  // provider's rows would hide that provider's group title even though grouping is still active.
  const isGrouped = useMemo(() => new Set(members.map((m) => m.provider)).size > 1, [members]);

  const columns: AnalyticalTableColumnDefinition[] = useMemo(() => {
    const cols: AnalyticalTableColumnDefinition[] = [
      {
        Header: t('MemberTable.columnNameHeader'),
        accessor: 'email',
        minWidth: 200,
      },
      {
        Header: t('MemberTable.columnTypeHeader'),
        accessor: 'kind',
        width: 78,
        Cell: (instance) => {
          const kind = ACCOUNT_TYPES.find(({ value }) => value === instance.cell.row.original.kind);
          return (
            <ObjectStatus icon={<Icon name={kind?.icon ?? 'employee'} />} inverted>
              {kind?.label}
            </ObjectStatus>
          );
        },
      },
      {
        Header: t('MemberTable.columnRoleHeader'),
        accessor: 'role',
        ...(clusterRoles ? { minWidth: 160 } : { width: 125 }),
        Cell: (instance) => {
          const row = instance.cell.row.original as MemberTableRow;
          if (clusterRoles) {
            return (
              <FlexBox gap="0.25rem" title={row.role}>
                {row.roleValues.map((role) =>
                  isMissingRole(role) ? (
                    <ObjectStatus
                      key={role}
                      state={ValueState.Critical}
                      icon={<Icon name="alert" />}
                      title={t('MemberAccess.missing.tooltip')}
                      data-testid={`missing-role-${role}`}
                      inverted
                    >
                      {formatRoleRef(role)}
                    </ObjectStatus>
                  ) : (
                    <ObjectStatus
                      key={role}
                      state={clusterRoleState(role)}
                      icon={<Icon name={clusterRoleIcon(role)} />}
                      inverted
                    >
                      {CLUSTER_ROLE_LABEL_KEYS[role] ? t(CLUSTER_ROLE_LABEL_KEYS[role]) : formatRoleRef(role)}
                    </ObjectStatus>
                  ),
                )}
              </FlexBox>
            );
          }
          const meta = roleMeta(row.roleValue);
          return (
            <ObjectStatus state={meta.state} icon={<Icon name={meta.icon} />} inverted>
              {row.role}
            </ObjectStatus>
          );
        },
      },
    ];

    if (!hideNamespaceColumn && hasNamespaceData) {
      cols.push({
        Header: t('MemberTable.columnNamespaceHeader'),
        accessor: 'namespace',
      });
    }

    if (onEditMember && onDeleteMember) {
      cols.push({
        Header: '',
        id: 'edit',
        width: 100,
        Cell: (instance) => (
          <FlexBox gap={'0.5rem'} justifyContent={'SpaceBetween'}>
            <Button
              icon="edit"
              design="Transparent"
              accessibleName={t('MemberTable.editMemberButton')}
              tooltip={t('MemberTable.editMemberButton')}
              onClick={() => {
                const selectedMember = instance.cell.row.original._member as Member;
                onEditMember(selectedMember);
              }}
            />
            <Button
              design="Transparent"
              icon="delete"
              accessibleName={t('MemberTable.deleteMemberButton')}
              tooltip={t('MemberTable.deleteMemberButton')}
              onClick={() => {
                const selectedMemberEmail = instance.cell.row.original.email as string;
                onDeleteMember(selectedMemberEmail);
              }}
            />
          </FlexBox>
        ),
      });
    }

    return cols;
  }, [t, hideNamespaceColumn, hasNamespaceData, onEditMember, onDeleteMember, clusterRoles, isMissingRole]);

  const providerLabel = useCallback(
    (provider?: string): string => {
      if (!provider) return t('MemberTable.defaultProviderValue');
      if (isUnnamedProvider(provider)) return t('MemberTable.customProviderValue');
      return provider;
    },
    [t],
  );

  // Group by provider so distinct identity providers don't get merged into one table.
  const groupedRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matchesQuery = (row: MemberTableRow) =>
      !query ||
      [row.email, row.role, row.kind, providerLabel(row._member.provider)].some((value) =>
        value.toLowerCase().includes(query),
      );

    const groups = new Map<string | undefined, MemberTableRow[]>();
    for (const m of members) {
      const row = toRow(m, clusterRoles);
      if (!matchesQuery(row)) continue;
      if (!groups.has(m.provider)) groups.set(m.provider, []);
      groups.get(m.provider)!.push(row);
    }
    // Keep at least one empty group so a no-match search still renders the "No data" table.
    if (groups.size === 0) {
      groups.set(undefined, []);
    }
    return [...groups.entries()].map(([provider, rows]) => ({ provider, rows }));
  }, [members, search, providerLabel, clusterRoles]);

  if (requireAtLeastOneMember && members.length === 0) {
    return (
      <Infobox size="sm" variant={isValidationError ? 'danger' : 'normal'} id="members-error">
        {t('validationErrors.atLeastOneUser')}
      </Infobox>
    );
  }

  return (
    <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
      <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
        <Input
          style={{ flex: 1 }}
          icon={<Icon name="search" />}
          placeholder={t('MemberTable.searchPlaceholder')}
          value={search}
          showClearIcon
          onInput={(e: Ui5CustomEvent<InputDomRef, never>) => setSearch(e.target.value)}
        />
      </FlexBox>
      {groupedRows.map(({ provider, rows }) => (
        <FlexBox key={provider ?? '__default__'} className={styles.group} direction="Column" style={{ gap: '0.25rem' }}>
          {isGrouped && rows.length > 0 && (
            <Text className={styles.groupTitle}>
              {providerLabel(provider)} ({rows.length})
            </Text>
          )}
          <AnalyticalTable
            sortable
            scaleWidthMode="Smart"
            columns={columns}
            data={rows}
            visibleRows={rowCount(rows.length)}
            minRows={rowCount(rows.length)}
            reactTableOptions={reactTableOptions}
          />
        </FlexBox>
      ))}
      {missingRoles.length > 0 && (
        <MessageStrip
          className={styles.missingRoles}
          design="Critical"
          data-testid="missing-roles-warning"
          hideCloseButton
        >
          {t('MemberAccess.missing.summary', {
            count: missingRoles.length,
            roles: missingRoles.map(formatRoleRef).join(', '),
          })}
        </MessageStrip>
      )}
    </FlexBox>
  );
};

import ValueState from '@ui5/webcomponents-base/dist/types/ValueState.js';
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
  ObjectStatus,
  Text,
  Ui5CustomEvent,
} from '@ui5/webcomponents-react';
import { AnalyticalTableColumnDefinition } from '@ui5/webcomponents-react/wrappers';
import { FC, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  isUnnamedProvider,
  MCP_V2_DEFAULT_ROLE,
  Member,
  memberRolesOptions,
  MemberRoles,
  MemberRolesDetailed,
  mcpV2RoleOptions,
} from '../../lib/api/types/shared/members';
import { Infobox } from '../Ui/Infobox/Infobox.tsx';
import { ACCOUNT_TYPES } from './EditMembers.tsx';
import styles from './MemberTable.module.css';

type MemberTableRow = {
  email: string;
  role: string;
  roleValue: string;
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
};

// Icon per role value, reusing the same options arrays the role-picker dropdowns use — one
// source of truth instead of a badge-only copy that could drift from them.
const ROLE_ICON_BY_VALUE: Record<string, string> = Object.fromEntries(
  [...memberRolesOptions, ...mcpV2RoleOptions].map(({ value, icon }) => [value, icon ?? 'show']),
);

// Badge severity has no other owner in the codebase — it's purely a table presentation choice.
const ROLE_STATE_BY_VALUE: Record<string, ValueState> = {
  [MemberRoles.admin]: ValueState.Critical,
  [MCP_V2_DEFAULT_ROLE]: ValueState.Negative,
};

const roleMeta = (roleValue: string): { icon: string; state: ValueState } => ({
  icon: ROLE_ICON_BY_VALUE[roleValue] ?? 'show',
  state: ROLE_STATE_BY_VALUE[roleValue] ?? ValueState.None,
});

const toRow = (m: Member): MemberTableRow => {
  const roleValue = m.roles?.[0] ?? '';
  return {
    email: m.name,
    role: MemberRolesDetailed[roleValue]?.displayValue ?? m.roles?.toString(),
    roleValue,
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

export const MemberTable: FC<MemberTableProps> = ({
  members,
  onDeleteMember,
  onEditMember,
  isValidationError = false,
  requireAtLeastOneMember,
  hideNamespaceColumn = false,
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

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
        width: 125,
        Cell: (instance) => {
          const row = instance.cell.row.original as MemberTableRow;
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
  }, [t, hideNamespaceColumn, hasNamespaceData, onEditMember, onDeleteMember]);

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
      const row = toRow(m);
      if (!matchesQuery(row)) continue;
      if (!groups.has(m.provider)) groups.set(m.provider, []);
      groups.get(m.provider)!.push(row);
    }
    // Keep at least one empty group so a no-match search still renders the "No data" table.
    if (groups.size === 0) {
      groups.set(undefined, []);
    }
    return [...groups.entries()].map(([provider, rows]) => ({ provider, rows }));
  }, [members, search, providerLabel]);

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
          />
        </FlexBox>
      ))}
    </FlexBox>
  );
};

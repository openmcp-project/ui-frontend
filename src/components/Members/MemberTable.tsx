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
import '@ui5/webcomponents-icons/dist/search';
import '@ui5/webcomponents-icons/dist/show';
import '@ui5/webcomponents-icons/dist/shield';
import '@ui5/webcomponents-icons/dist/badge';
import { isUnnamedProvider, Member, MemberRolesDetailed } from '../../lib/api/types/shared/members';
import { AnalyticalTableColumnDefinition } from '@ui5/webcomponents-react/wrappers';
import { useTranslation } from 'react-i18next';
import { FC, useState } from 'react';
import { Infobox } from '../Ui/Infobox/Infobox.tsx';
import { ACCOUNT_TYPES } from './EditMembers.tsx';
import ValueState from '@ui5/webcomponents-base/dist/types/ValueState.js';
import styles from './MemberTable.module.css';

type MemberTableRow = {
  email: string;
  role: string;
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

function roleState(role: string): ValueState {
  if (role === 'Cluster Admin') return ValueState.Negative;
  if (role === 'Administrator') return ValueState.Critical;
  return ValueState.None;
}

function roleIcon(role: string): string {
  if (role === 'Cluster Admin') return 'badge';
  if (role === 'Administrator') return 'shield';
  return 'show';
}

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

  const columns: AnalyticalTableColumnDefinition[] = [
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
      width: 155,
      Cell: (instance) => {
        const role = instance.cell.value as string;
        return (
          <ObjectStatus state={roleState(role)} icon={<Icon name={roleIcon(role)} />} inverted>
            {role}
          </ObjectStatus>
        );
      },
    },
  ];

  if (!hideNamespaceColumn) {
    columns.push({
      Header: t('MemberTable.columnNamespaceHeader'),
      accessor: 'namespace',
    });
  }

  if (onEditMember && onDeleteMember) {
    columns.push({
      Header: '',
      id: 'edit',
      width: 100,
      Cell: (instance) => (
        <FlexBox gap={'0.5rem'} justifyContent={'SpaceBetween'}>
          <Button
            icon="edit"
            design="Transparent"
            onClick={() => {
              const selectedMember = instance.cell.row.original._member as Member;
              onEditMember(selectedMember);
            }}
          />
          <Button
            design="Transparent"
            icon="delete"
            onClick={() => {
              const selectedMemberEmail = instance.cell.row.original.email as string;
              onDeleteMember(selectedMemberEmail);
            }}
          />
        </FlexBox>
      ),
    });
  }

  if (requireAtLeastOneMember && members.length === 0) {
    return (
      <Infobox size="sm" variant={isValidationError ? 'danger' : 'normal'} id="members-error">
        {t('validationErrors.atLeastOneUser')}
      </Infobox>
    );
  }

  const query = search.trim().toLowerCase();
  const filteredMembers = query ? members.filter((m) => m.name.toLowerCase().includes(query)) : members;

  const toRow = (m: Member): MemberTableRow => ({
    email: m.name,
    role: MemberRolesDetailed[m.roles?.[0] ?? '']?.displayValue ?? m.roles?.toString(),
    kind: m.kind,
    namespace: m.namespace ?? '',
    _member: m,
  });

  // AnalyticalTable defaults to a fixed 15-row viewport padded with empty rows down to a minimum
  // of 5, regardless of the actual data size. Pin both to the row count instead, so the table's
  // height always matches its content — no dead space, no internal scrollbar. minRows must be
  // >=1, so an empty result still renders (as a single "No data" row) instead of collapsing.
  const rowCount = (count: number) => Math.max(count, 1);

  const providerLabel = (provider?: string): string => {
    if (!provider) return t('MemberTable.defaultProviderValue');
    if (isUnnamedProvider(provider)) return t('MemberTable.customProviderValue');
    return provider;
  };

  // Group by provider so a V2 control plane with a default + one or more custom identity
  // providers gets one table per provider instead of merging distinct identities together.
  // V1 members and the wizard's already-per-provider EditMembers slices never carry more than one
  // distinct provider, so they fall through to the plain single-table rendering below.
  const providerOrder: (string | undefined)[] = [];
  const groupedMembers = new Map<string | undefined, Member[]>();
  for (const m of filteredMembers) {
    if (!groupedMembers.has(m.provider)) {
      groupedMembers.set(m.provider, []);
      providerOrder.push(m.provider);
    }
    groupedMembers.get(m.provider)!.push(m);
  }
  const isGrouped = providerOrder.length > 1;

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
      {isGrouped ? (
        providerOrder.map((provider) => {
          const providerMembers = groupedMembers.get(provider)!;
          return (
            <FlexBox key={provider ?? ''} direction="Column" style={{ gap: '0.25rem' }}>
              <Text className={styles.groupTitle}>
                {providerLabel(provider)} ({providerMembers.length})
              </Text>
              <AnalyticalTable
                sortable
                scaleWidthMode="Smart"
                className={styles.table}
                columns={columns}
                data={providerMembers.map(toRow)}
                visibleRows={rowCount(providerMembers.length)}
                minRows={rowCount(providerMembers.length)}
              />
            </FlexBox>
          );
        })
      ) : (
        <AnalyticalTable
          sortable
          scaleWidthMode="Smart"
          className={styles.table}
          columns={columns}
          data={filteredMembers.map(toRow)}
          visibleRows={rowCount(filteredMembers.length)}
          minRows={rowCount(filteredMembers.length)}
        />
      )}
    </FlexBox>
  );
};

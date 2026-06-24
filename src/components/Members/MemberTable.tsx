import {
  AnalyticalTable,
  Button,
  FlexBox,
  Icon,
  Input,
  InputDomRef,
  ObjectStatus,
  Ui5CustomEvent,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/search';
import '@ui5/webcomponents-icons/dist/badge';
import '@ui5/webcomponents-icons/dist/key-user-settings';
import { Member, MemberRolesDetailed } from '../../lib/api/types/shared/members';
import { AnalyticalTableColumnDefinition } from '@ui5/webcomponents-react/wrappers';
import { useTranslation } from 'react-i18next';
import { FC, useState } from 'react';
import { Infobox } from '../Ui/Infobox/Infobox.tsx';
import { ACCOUNT_TYPES } from './EditMembers.tsx';
import ValueState from '@ui5/webcomponents-base/dist/types/ValueState.js';

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
  if (role === 'Administrator' || role === 'Cluster Admin') return ValueState.Critical;
  return ValueState.None;
}

function roleIcon(role: string): string {
  if (role === 'Administrator' || role === 'Cluster Admin') return 'key-user-settings';
  return 'badge';
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
      width: 155,
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

  const data: MemberTableRow[] = filteredMembers.map((m) => ({
    email: m.name,
    role: MemberRolesDetailed[m.roles?.[0] ?? '']?.displayValue ?? m.roles?.toString(),
    kind: m.kind,
    namespace: m.namespace ?? '',
    _member: m,
  }));

  return (
    <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
      <Input
        icon={<Icon name="search" />}
        placeholder={t('MemberTable.searchPlaceholder')}
        value={search}
        showClearIcon
        onInput={(e: Ui5CustomEvent<InputDomRef, never>) => setSearch(e.target.value)}
      />
      <AnalyticalTable sortable scaleWidthMode="Smart" columns={columns} data={data} />
    </FlexBox>
  );
};

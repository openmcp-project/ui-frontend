import { AnalyticalTable, Button } from '@ui5/webcomponents-react';
import { Member, MemberRolesDetailed } from '../../lib/api/types/shared/members';
import { AnalyticalTableColumnDefinition } from '@ui5/webcomponents-react/wrappers';
import { useTranslation } from 'react-i18next';
import { FC } from 'react';
import { Infobox } from '../Ui/Infobox/Infobox.tsx';

type MemberTableRow = {
  email: string;
  role: string;
  _member: Member;
};

type MemberTableProps = {
  members: Member[];
  onDeleteMember?: (email: string) => void;
  onEditMember?: (member: Member) => void;
  isValidationError?: boolean;
  requireAtLeastOneMember: boolean;
};

type CellInstance = {
  cell: {
    row: {
      original: MemberTableRow;
    };
  };
};

export const MemberTable: FC<MemberTableProps> = ({
  members,
  onDeleteMember,
  onEditMember,
  isValidationError = false,
  requireAtLeastOneMember,
}) => {
  const { t } = useTranslation();

  const columns: AnalyticalTableColumnDefinition[] = [
    {
      Header: t('MemberTable.columnEmailHeader'),
      accessor: 'email',
    },
    {
      Header: t('MemberTable.columnRoleHeader'),
      accessor: 'role',
    },
  ];

  if (onEditMember) {
    columns.push({
      Header: '',
      id: 'edit',
      width: 50,
      Cell: (instance: CellInstance) => (
        <Button
          icon="edit"
          onClick={() => {
            const selectedMember = instance.cell.row.original._member;
            onEditMember(selectedMember);
          }}
        />
      ),
    });
  }

  if (onDeleteMember) {
    columns.push({
      Header: '',
      id: 'delete',
      width: 50,
      Cell: (instance: CellInstance) => (
        <Button
          icon="delete"
          onClick={() => {
            const selectedMemberEmail = instance.cell.row.original.email;
            onDeleteMember(selectedMemberEmail);
          }}
        />
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

  const data: MemberTableRow[] = members.map((m) => ({
    email: m.name,
    role: m.roles.map((r) => MemberRolesDetailed[r].displayValue).join(', '),
    _member: m,
  }));

  return <AnalyticalTable scaleWidthMode="Smart" columns={columns} data={data} />;
};

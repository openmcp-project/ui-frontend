import { AnalyticalTable, Button } from '@ui5/webcomponents-react';
import {
  Member,
  MemberRolesDetailed,
} from '../../lib/api/types/shared/members';
import { AnalyticalTableColumnDefinition } from '@ui5/webcomponents-react/wrappers';
import { useTranslation } from 'react-i18next';
import { FC } from 'react';
import { Infobox } from '../Ui/Infobox/Infobox.tsx';

type MemberTableRow = {
  email: string;
  role: string;
};

type MemberTableProps = {
  members: Member[];
  onDeleteMember?: (email: string) => void;
  isValidationError?: boolean;
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
  isValidationError = false,
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

  if (onDeleteMember) {
    columns.push({
      Header: '',
      accessor: '.',
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

  if (members.length === 0) {
    return (
      <Infobox
        size="sm"
        variant={isValidationError ? 'danger' : 'normal'}
        id="members-error"
      >
        {t('validationErrors.atLeastOneUser')}
      </Infobox>
    );
  }

  const data: MemberTableRow[] = members.map((m) => ({
    email: m.name,
    role: m.roles.map((r) => MemberRolesDetailed[r].displayValue).join(', '),
  }));

  return (
    <AnalyticalTable scaleWidthMode="Smart" columns={columns} data={data} />
  );
};

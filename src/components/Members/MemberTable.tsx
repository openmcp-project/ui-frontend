import { AnalyticalTable, Button } from '@ui5/webcomponents-react';
import {
  Member,
  MemberRolesDetailed,
} from '../../lib/api/types/shared/members';
import { AnalyticalTableColumnDefinition } from '@ui5/webcomponents-react/wrappers';
import { useTranslation } from 'react-i18next';

export function MemberTable({
  members,
  onDeleteMember,
}: {
  members: Member[];
  onDeleteMember?: (email: string) => void;
}) {
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
      Cell: (instance: any) => (
        <Button
          icon="delete"
          onClick={() => {
            const selectedMemberEmail = instance.cell.row.original.email;
            if (onDeleteMember) {
              onDeleteMember(selectedMemberEmail);
            }
          }}
        />
      ),
    });
  }

  return (
    <AnalyticalTable
      scaleWidthMode="Smart"
      columns={columns}
      data={members.map((m) => {
        return {
          email: m.name,
          role: m.roles
            .map((r) => MemberRolesDetailed[r].displayValue)
            .join(', '),
        };
      })}
    />
  );
}

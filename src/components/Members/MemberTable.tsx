import { AnalyticalTable, Button, FlexBox, Icon } from '@ui5/webcomponents-react';
import { Member, MemberRoles, MemberRolesDetailed } from '../../lib/api/types/shared/members';
import { AnalyticalTableColumnDefinition } from '@ui5/webcomponents-react/wrappers';
import { useTranslation } from 'react-i18next';
import { FC } from 'react';
import { Infobox } from '../Ui/Infobox/Infobox.tsx';
import { ACCOUNT_TYPES } from './EditMembers.tsx';
import { on } from 'events';

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
      Header: t('MemberTable.columnTypeHeader'),
      accessor: 'kind',
      width: 145,
      Cell: (instance: CellInstance) => {
        const kind = ACCOUNT_TYPES.find(({ value }) => value === instance.cell.row.original.kind);
        return (
          <FlexBox gap={'0.5rem'} wrap={'NoWrap'}>
            <Icon name={kind?.icon} accessibleName={kind?.label} showTooltip />
            {kind?.label}
          </FlexBox>
        );
      },
    },
    {
      Header: t('MemberTable.columnRoleHeader'),
      accessor: 'role',
      width: 105,
    },
    {
      Header: t('MemberTable.columnNamespaceHeader'),
      accessor: 'namespace',
    },
  ];

  if (onEditMember || onDeleteMember) {
    columns.push({
      Header: '',
      id: 'edit',
      width: 85,
      Cell: (instance: CellInstance) => (
        <>
          {onEditMember ? (
            <Button
              icon="edit"
              design="Transparent"
              onClick={() => {
                const selectedMember = instance.cell.row.original._member;
                onEditMember(selectedMember);
              }}
            />
          ) : null}
          {onDeleteMember ? (
            <Button
              icon="delete"
              design="Transparent"
              onClick={() => {
                const selectedMemberEmail = instance.cell.row.original.email;
                onDeleteMember(selectedMemberEmail);
              }}
            />
          ) : null}
        </>
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
  const data: MemberTableRow[] = members.map((m) => {
    return {
      email: m.name,
      role: MemberRolesDetailed[m.roles?.[0] as MemberRoles]?.displayValue ?? m.roles?.toString(),
      kind: m.kind,
      namespace: m.namespace ?? '',
      _member: m,
    };
  });

  return <AnalyticalTable scaleWidthMode="Smart" columns={columns} data={data} />;
};

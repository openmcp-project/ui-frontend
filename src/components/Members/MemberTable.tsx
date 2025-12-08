import { AnalyticalTable, Button, FlexBox, Icon } from '@ui5/webcomponents-react';
import { Member, MemberRoles, MemberRolesDetailed } from '../../lib/api/types/shared/members';
import { AnalyticalTableColumnDefinition } from '@ui5/webcomponents-react/wrappers';
import { useTranslation } from 'react-i18next';
import { FC } from 'react';
import { Infobox } from '../Ui/Infobox/Infobox.tsx';
import { ACCOUNT_TYPES } from './EditMembers.tsx';

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

export const MemberTable: FC<MemberTableProps> = ({
  members,
  onDeleteMember,
  onEditMember,
  isValidationError = false,
  requireAtLeastOneMember,
  hideNamespaceColumn = false,
}) => {
  const { t } = useTranslation();

  const columns: AnalyticalTableColumnDefinition[] = [
    {
      Header: t('MemberTable.columnNameHeader'),
      accessor: 'email',
    },

    {
      Header: t('MemberTable.columnTypeHeader'),
      accessor: 'kind',
      width: 145,
      Cell: (instance) => {
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

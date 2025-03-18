import {AnalyticalTable, Button} from "@ui5/webcomponents-react";
import {Member, MemberRolesDetailed} from "../../lib/api/types/shared/members";
import {AnalyticalTableColumnDefinition} from "@ui5/webcomponents-react/wrappers";
import {useTranslation} from "react-i18next";
import {FC} from "react";
import {Infobox} from "../Ui/Infobox/Infobox.tsx";

type MemberTableProps = { members: Member[]; onDeleteMember?: (email: string) => void, isValidationError?: boolean }

export const MemberTable: FC<MemberTableProps> = ({members, onDeleteMember, isValidationError = false}) => {
  const {t} = useTranslation();

  const columns: AnalyticalTableColumnDefinition[] = [
    {
      Header: t('MemberTable.columnEmailHeader'),
      accessor: "email",
    },
    {
      Header: t('MemberTable.columnRoleHeader'),
      accessor: "role",
    },
  ]

  if (onDeleteMember) {
    columns.push({
      Header: "",
      accessor: ".",
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
        >
        </Button>
      ),
    },)
  }
  if (members.length === 0) {
    return (<Infobox variant={isValidationError ? 'error' : 'normal'}> You need to have at least one member assigned</Infobox>)
  }
  return (
    <AnalyticalTable
      scaleWidthMode="Smart"
      columns={columns}
      data={
        members.map((m) => {
          return {
            email: m.name,
            role: m.roles.map((r) => MemberRolesDetailed[r].displayValue).join(", "),
          };
        })
      }
    />
  )
}
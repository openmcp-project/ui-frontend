import { RadioButtonsSelectOption } from '../../../../components/Ui/RadioButtonsSelect/RadioButtonsSelect.tsx';

export enum MemberRoles {
  view = 'view',
  admin = 'admin',
}

export const memberRolesOptions: RadioButtonsSelectOption[] = [
  { label: 'Viewer', value: MemberRoles.view, icon: 'employee' },
  { label: 'Admin', value: MemberRoles.admin, icon: 'key-user-settings' },
];

export const MemberRolesDetailed = {
  [MemberRoles.view]: { value: MemberRoles.view, displayValue: 'Viewer' },
  [MemberRoles.admin]: {
    value: MemberRoles.admin,
    displayValue: 'Administrator',
  },
} as const;

export enum MemberKind {
  User = 'User',
}

export interface Member {
  kind: string;
  name: string;
  roles: string[];
  namespace?: string;
}

export function areMembersEqual(a: Member, b?: Member): boolean {
  return (
    !!b &&
    a.kind === b.kind &&
    a.name === b.name &&
    a.namespace === b.namespace &&
    a.roles.length === b.roles.length &&
    a.roles.every((r) => b.roles.includes(r))
  );
}

export interface MemberPayload {
  kind: string;
  name: string;
  roles: string[];
  namespace?: string;
}

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

export interface MemberPayload {
  kind: string;
  name: string;
  roles: string[];
  namespace?: string;
}

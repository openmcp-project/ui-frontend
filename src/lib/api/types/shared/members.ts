import { RadioButtonsSelectOption } from '../../../../components/Ui/RadioButtonsSelect/RadioButtonsSelect.tsx';

export enum MemberRoles {
  viewer = 'view',
  admin = 'admin',
}

export const memberRolesOptions: RadioButtonsSelectOption[] = [
  { label: 'Viewer', value: MemberRoles.viewer, icon: 'employee' },
  { label: 'Admin', value: MemberRoles.admin, icon: 'key-user-settings' },
];

export const MemberRolesDetailed = {
  [MemberRoles.viewer]: { value: MemberRoles.viewer, displayValue: 'Viewer' },
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
}

import { z } from 'zod';
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

export const MemberSchema = z.preprocess(
  (value) => {
    if (!value || typeof value !== 'object') {
      return value;
    }

    const record = value as Record<string, unknown>;
    const roles = Array.isArray(record.roles)
      ? record.roles.filter((role) => role != null).map((role) => String(role))
      : [];

    return {
      kind: record.kind ?? '',
      name: record.name ?? '',
      roles,
      namespace: record.namespace ?? undefined,
    };
  },
  z.object({
    kind: z.string(),
    name: z.string(),
    roles: z.array(z.string()),
    namespace: z.string().optional(),
  }),
);

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

export type Member = z.infer<typeof MemberSchema>;

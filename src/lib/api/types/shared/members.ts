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

export const MCP_V2_DEFAULT_ROLE = 'cluster-admin';
export const MCP_V2_VIEWER_ROLE = 'viewer';

export const mcpV2RoleOptions: RadioButtonsSelectOption[] = [
  { value: 'cluster-admin', label: 'Cluster Admin', icon: 'key-user-settings' },
  { value: MCP_V2_VIEWER_ROLE, label: 'Viewer', icon: 'employee' },
];

export const MemberRolesDetailed: Record<string, { value: string; displayValue: string }> = {
  [MemberRoles.view]: { value: MemberRoles.view, displayValue: 'Viewer' },
  [MemberRoles.admin]: {
    value: MemberRoles.admin,
    displayValue: 'Administrator',
  },
  [MCP_V2_DEFAULT_ROLE]: {
    value: MCP_V2_DEFAULT_ROLE,
    displayValue: 'Cluster Admin',
  },
  [MCP_V2_VIEWER_ROLE]: {
    value: MCP_V2_VIEWER_ROLE,
    displayValue: 'Viewer',
  },
};

export enum MemberKind {
  User = 'User',
}

export const MemberSchema = z.object({
  kind: z.string(),
  name: z.string(),
  roles: z.array(z.string()),
  namespace: z.string().optional(),
});

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

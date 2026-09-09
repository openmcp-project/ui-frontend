import { z } from 'zod';
import { RadioButtonsSelectOption } from '../../../../components/Ui/RadioButtonsSelect/RadioButtonsSelect.tsx';

export enum MemberRoles {
  view = 'view',
  admin = 'admin',
}

export const memberRolesOptions: RadioButtonsSelectOption[] = [
  { label: 'Viewer', value: MemberRoles.view, icon: 'show' },
  { label: 'Admin', value: MemberRoles.admin, icon: 'shield' },
];

export const MCP_V2_DEFAULT_ROLE = 'cluster-admin';
export const MCP_V2_VIEWER_ROLE = 'viewer';

export const mcpV2RoleOptions: RadioButtonsSelectOption[] = [
  { value: 'cluster-admin', label: 'Cluster Admin', icon: 'badge' },
  // TODO: re-enable once the viewer ClusterRole is provisioned on all managed clusters.
  // { value: MCP_V2_VIEWER_ROLE, label: 'Viewer', icon: 'show' },
];

export const MemberRolesDetailed: Record<string, { value: string; displayValue: string }> = {
  [MemberRoles.view]: { value: MemberRoles.view, displayValue: 'Viewer' },
  [MemberRoles.admin]: { value: MemberRoles.admin, displayValue: 'Administrator' },
  [MCP_V2_DEFAULT_ROLE]: { value: MCP_V2_DEFAULT_ROLE, displayValue: 'Cluster Admin' },
  [MCP_V2_VIEWER_ROLE]: { value: MCP_V2_VIEWER_ROLE, displayValue: 'Viewer' },
};

export enum MemberKind {
  User = 'User',
}

export const MemberSchema = z.object({
  kind: z.string(),
  name: z.string(),
  roles: z.array(z.string()),
  namespace: z.string().optional(),
  // V2-only: extraProviders[] entry name; undefined = default provider.
  provider: z.string().optional(),
});

// Marks members from an unnamed extra provider so dedup doesn't merge them with each other
// or the default provider — see convertRoleBindingsToMembers.
export const UNNAMED_PROVIDER_PREFIX = '__unnamed-provider-';

export function isUnnamedProvider(provider?: string): boolean {
  return !!provider?.startsWith(UNNAMED_PROVIDER_PREFIX);
}

export function areMembersEqual(a: Member, b?: Member): boolean {
  return (
    !!b &&
    a.kind === b.kind &&
    a.name === b.name &&
    a.namespace === b.namespace &&
    a.provider === b.provider &&
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

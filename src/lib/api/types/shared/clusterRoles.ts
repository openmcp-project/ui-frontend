// ControlPlane (v2) members are bound to Kubernetes RBAC roles via `spec.iam.oidc.*.roleBindings[].roleRefs`.
// A member's `roles` entries are *encoded role refs*:
//   - ClusterRole  → its plain name, e.g. `cluster-admin`, `view`, `my-custom-role`
//   - Role         → `Role/<namespace>/<name>` (RBAC names can never contain `/`, so this is unambiguous)
// The UI only lets users add ClusterRoles, but namespaced Role refs that were written via YAML/kubectl
// are carried through untouched so that editing a ControlPlane never rewrites or drops them.

export type RoleRefKind = 'ClusterRole' | 'Role';

export interface RoleRef {
  kind: RoleRefKind;
  name: string;
  namespace?: string;
}

export const DEFAULT_CLUSTER_ROLE = 'cluster-admin';

const NAMESPACED_ROLE_PREFIX = 'Role/';

// User-facing ClusterRoles every Kubernetes API server bootstraps
// (https://kubernetes.io/docs/reference/access-authn-authz/rbac/#user-facing-roles).
// Anything else (e.g. a ClusterRole created inside the ControlPlane) is entered as a custom name.
export const CLUSTER_ROLE_PRESETS = [
  { name: DEFAULT_CLUSTER_ROLE, icon: 'badge', descriptionKey: 'ClusterRoles.presets.clusterAdmin' },
  { name: 'admin', icon: 'shield', descriptionKey: 'ClusterRoles.presets.admin' },
  { name: 'edit', icon: 'edit', descriptionKey: 'ClusterRoles.presets.edit' },
  { name: 'view', icon: 'show', descriptionKey: 'ClusterRoles.presets.view' },
] as const;

const PRESET_BY_NAME: Record<string, (typeof CLUSTER_ROLE_PRESETS)[number]> = Object.fromEntries(
  CLUSTER_ROLE_PRESETS.map((preset) => [preset.name, preset]),
);

export function isPresetClusterRole(role: string): boolean {
  return role in PRESET_BY_NAME;
}

export function clusterRoleIcon(role: string): string {
  return PRESET_BY_NAME[role]?.icon ?? 'role';
}

export function encodeRoleRef(ref: {
  kind?: string | null;
  name?: string | null;
  namespace?: string | null;
}): string | undefined {
  const name = ref.name?.trim();
  if (!name) return undefined;
  if (ref.kind === 'Role') return `${NAMESPACED_ROLE_PREFIX}${ref.namespace?.trim() ?? ''}/${name}`;
  return name;
}

export function decodeRoleRef(role: string): RoleRef {
  if (role.startsWith(NAMESPACED_ROLE_PREFIX)) {
    const rest = role.slice(NAMESPACED_ROLE_PREFIX.length);
    const separator = rest.indexOf('/');
    if (separator >= 0) {
      const namespace = rest.slice(0, separator);
      return { kind: 'Role', name: rest.slice(separator + 1), ...(namespace ? { namespace } : {}) };
    }
  }
  return { kind: 'ClusterRole', name: role };
}

export function isNamespacedRole(role: string): boolean {
  return decodeRoleRef(role).kind === 'Role';
}

/** Human-readable label: ClusterRoles by name, namespaced Roles as `<namespace>/<name>`. */
export function formatRoleRef(role: string): string {
  const ref = decodeRoleRef(role);
  if (ref.kind === 'ClusterRole') return ref.name;
  return ref.namespace ? `${ref.namespace}/${ref.name}` : ref.name;
}

export const CLUSTER_ROLE_NAME_MAX_LENGTH = 253;

// RBAC object names are "path segment names": anything but `/` and `%`, and not `.` / `..`
// (e.g. `system:aggregate-to-view` is valid). Whitespace is rejected as it is always a typo.
export function isValidClusterRoleName(name: string): boolean {
  return (
    name.length > 0 &&
    name.length <= CLUSTER_ROLE_NAME_MAX_LENGTH &&
    name !== '.' &&
    name !== '..' &&
    !/[\s/%]/.test(name)
  );
}

/**
 * Maps a role coming from a non-RBAC source (project/workspace members, v1 templates: `admin` / `view`)
 * to the ClusterRole a v2 member should get. Unknown values are kept as ClusterRole names rather than
 * being silently promoted to cluster-admin.
 */
export function mapMemberRoleToClusterRole(roleInput?: string | null): string {
  const role = (roleInput ?? '').toString().trim();
  switch (role.toLowerCase()) {
    case '':
    case 'admin':
    case 'cluster-admin':
      return DEFAULT_CLUSTER_ROLE;
    case 'view':
    case 'viewer':
      return 'view';
    default:
      return role;
  }
}

/** De-duplicates while keeping first-seen order. */
export function uniqueRoles(roles: (string | undefined | null)[]): string[] {
  return [...new Set(roles.filter((r): r is string => !!r))];
}

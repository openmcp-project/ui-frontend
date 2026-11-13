// Pure logic for ClusterRoleDialog, kept out of the component so it can be unit-tested without
// mounting UI5 web components. The dialog lets a user view, create or edit a single ClusterRole
// from the member dialog; it is not a role-management UI (that is Headlamp's job).

import { parseYamlDocuments, type ParsedResource } from '../../hooks/useYamlApplyResource.ts';
import { CLUSTER_ROLE_PRESETS, isValidClusterRoleName } from '../../lib/api/types/shared/clusterRoles.ts';

export const CLUSTER_ROLE_API_VERSION = 'rbac.authorization.k8s.io/v1';
export const CLUSTER_ROLE_KIND = 'ClusterRole';

// Server-managed metadata that must be stripped before a server-side apply.
const SERVER_METADATA_FIELDS = ['managedFields', 'resourceVersion', 'uid', 'creationTimestamp', 'generation'] as const;

// The built-in user-facing roles plus everything the controller owns cannot be edited: Kubernetes
// overwrites the rules of aggregated and auto-updated roles, so edits would silently vanish.
const BUILTIN_READ_ONLY = new Set<string>(CLUSTER_ROLE_PRESETS.map((preset) => preset.name));

export type ClusterRoleValidation = { valid: true; resource: ParsedResource } | { valid: false; message: string };

export interface ClusterRoleValidationMessages {
  wrongType: string;
  multiDoc: string;
  invalidName: string;
  renamed: (expected: string) => string;
  parseError: (detail: string) => string;
}

/**
 * Parses the editor YAML and checks it is exactly one valid ClusterRole. In Edit mode `expectedName`
 * is set and the name is immutable: a renamed role is refused.
 */
export function validateClusterRoleYaml(
  yaml: string,
  messages: ClusterRoleValidationMessages,
  expectedName?: string,
): ClusterRoleValidation {
  const parsed = parseYamlDocuments('role.yaml', yaml);
  if (!parsed.valid) {
    return { valid: false, message: messages.parseError(parsed.message) };
  }
  if (parsed.resources.length !== 1) {
    return { valid: false, message: messages.multiDoc };
  }
  const resource = parsed.resources[0];
  if (resource.apiVersion !== CLUSTER_ROLE_API_VERSION || resource.kind !== CLUSTER_ROLE_KIND) {
    return { valid: false, message: messages.wrongType };
  }
  if (!resource.metadata?.name || !isValidClusterRoleName(resource.metadata.name)) {
    return { valid: false, message: messages.invalidName };
  }
  if (expectedName !== undefined && resource.metadata.name !== expectedName) {
    return { valid: false, message: messages.renamed(expectedName) };
  }
  return { valid: true, resource };
}

/** Drops server-managed metadata so a fetched role can be re-applied cleanly. */
export function stripServerFields(resource: ParsedResource): ParsedResource {
  const metadata = { ...resource.metadata } as Record<string, unknown>;
  for (const field of SERVER_METADATA_FIELDS) {
    delete metadata[field];
  }
  return { ...resource, metadata: metadata as ParsedResource['metadata'] };
}

/**
 * A role whose rules the user may not change: the four built-in roles, anything in the `system:`
 * namespace, and any aggregated role. These are shown read-only with a one-line explanation.
 */
export function isReadOnlyClusterRole(name: string, aggregated: boolean): boolean {
  return BUILTIN_READ_ONLY.has(name) || name.startsWith('system:') || aggregated;
}

/** The commented, valid starter manifest for Create mode. */
export function clusterRoleTemplate(name: string): string {
  return `apiVersion: ${CLUSTER_ROLE_API_VERSION}
kind: ${CLUSTER_ROLE_KIND}
metadata:
  name: ${name}
rules:
  # Example: read-only access to ConfigMaps in all namespaces
  - apiGroups: [""]
    resources: ["configmaps"]
    verbs: ["get", "list", "watch"]
`;
}

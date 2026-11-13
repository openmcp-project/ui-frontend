import { Resource } from '../resource';

export interface ClusterRoleListItem {
  metadata: {
    name: string;
    labels?: Record<string, string>;
  };
  // Set when the ClusterRole is aggregated/auto-updated by Kubernetes; such roles must not be edited
  // (their rules are overwritten by the controller).
  aggregated: boolean;
}

// The full ClusterRole list is large (every rule of every role), so jq trims each item down to the
// name, its labels, and whether an aggregationRule is present — all the role lookup needs.
export const ListClusterRoles: Resource<ClusterRoleListItem[]> = {
  path: `/apis/rbac.authorization.k8s.io/v1/clusterroles`,
  jq: '[.items[] | {metadata: (.metadata | {name, labels}), aggregated: (.aggregationRule != null)}]',
};

import { useQuery } from '@apollo/client/react';
import {
  CHARGING_TARGET_LABEL,
  CHARGING_TARGET_TYPE_LABEL,
  DISPLAY_NAME_ANNOTATION,
} from '../../../lib/api/types/shared/keyNames';
import { Member } from '../../../lib/api/types/shared/members';
import { graphql } from '../../../types/__generated__/graphql';

const GetWorkspaceQuery = graphql(`
  query GetWorkspace($name: String!, $namespace: String!) {
    core_openmcp_cloud {
      v1alpha1 {
        Workspace(name: $name, namespace: $namespace) {
          metadata {
            name
            namespace
            annotations
            labels
          }
          spec {
            members {
              kind
              name
              namespace
              roles
            }
          }
        }
      }
    }
  }
`);

export interface WorkspaceData {
  name: string;
  namespace: string;
  displayName: string;
  chargingTarget: string;
  chargingTargetType: string;
  members: Member[];
}

export function useGetWorkspace(workspaceName: string | undefined, namespace: string | undefined) {
  const { data, loading, error } = useQuery(GetWorkspaceQuery, {
    variables: { name: workspaceName ?? '', namespace: namespace ?? '' },
    skip: !workspaceName || !namespace,
    fetchPolicy: 'network-only',
  });

  const workspace = data?.core_openmcp_cloud?.v1alpha1?.Workspace;
  const annotations = (workspace?.metadata?.annotations as Record<string, string> | null | undefined) ?? {};
  const labels = (workspace?.metadata?.labels as Record<string, string> | null | undefined) ?? {};

  const workspaceData: WorkspaceData | undefined = workspace
    ? {
        name: workspace.metadata?.name ?? '',
        namespace: workspace.metadata?.namespace ?? '',
        displayName: annotations[DISPLAY_NAME_ANNOTATION] ?? '',
        chargingTarget: labels[CHARGING_TARGET_LABEL] ?? '',
        chargingTargetType: labels[CHARGING_TARGET_TYPE_LABEL] ?? '',
        members: (workspace.spec?.members ?? []).flatMap((member) => {
          if (!member?.name || !member?.kind) return [];
          return [
            {
              kind: member.kind,
              name: member.name,
              namespace: member.namespace ?? undefined,
              roles: member.roles?.filter((role): role is string => Boolean(role)) ?? [],
            },
          ];
        }),
      }
    : undefined;

  return { workspaceData, isLoading: loading, error };
}

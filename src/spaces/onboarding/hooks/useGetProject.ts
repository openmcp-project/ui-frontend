import { gql, type TypedDocumentNode } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  CHARGING_TARGET_LABEL,
  CHARGING_TARGET_TYPE_LABEL,
  DISPLAY_NAME_ANNOTATION,
} from '../../../lib/api/types/shared/keyNames';
import { Member } from '../../../lib/api/types/shared/members';
import type { CoreOpenmcpCloudV1alpha1QueryProjectArgs, Query } from '../../../types/__generated__/graphql/graphql';

type GetProjectQueryData = Pick<Query, 'core_openmcp_cloud'>;
type GetProjectQueryVariables = CoreOpenmcpCloudV1alpha1QueryProjectArgs;

const GetProjectQuery = gql(`
  query GetProject($name: String!) {
    core_openmcp_cloud {
      v1alpha1 {
        Project(name: $name) {
          metadata {
            name
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
`) as TypedDocumentNode<GetProjectQueryData, GetProjectQueryVariables>;

export interface ProjectData {
  name: string;
  displayName: string;
  chargingTarget: string;
  chargingTargetType: string;
  members: Member[];
}

export function useGetProject(projectName: string | undefined) {
  const { data, loading, error } = useQuery(GetProjectQuery, {
    variables: { name: projectName ?? '' },
    skip: !projectName,
    fetchPolicy: 'network-only',
  });

  const project = data?.core_openmcp_cloud?.v1alpha1?.Project;
  const annotations = (project?.metadata?.annotations as Record<string, string> | null | undefined) ?? {};
  const labels = (project?.metadata?.labels as Record<string, string> | null | undefined) ?? {};

  const projectData: ProjectData | undefined = project
    ? {
        name: project.metadata?.name ?? '',
        displayName: annotations[DISPLAY_NAME_ANNOTATION] ?? '',
        chargingTarget: labels[CHARGING_TARGET_LABEL] ?? '',
        chargingTargetType: labels[CHARGING_TARGET_TYPE_LABEL] ?? '',
        members: (project.spec?.members ?? []).flatMap((member) => {
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

  return { projectData, isLoading: loading, error };
}

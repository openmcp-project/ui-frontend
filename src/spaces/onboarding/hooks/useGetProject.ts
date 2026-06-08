import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  CHARGING_TARGET_LABEL,
  CHARGING_TARGET_TYPE_LABEL,
  DISPLAY_NAME_ANNOTATION,
} from '../../../lib/api/types/shared/keyNames';
import { Member, MemberRoles } from '../../../lib/api/types/shared/members';

const GetProjectQuery = gql`
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
`;

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const project = (data as any)?.core_openmcp_cloud?.v1alpha1?.Project;
  const annotations = (project?.metadata?.annotations as Record<string, string> | null | undefined) ?? {};
  const labels = (project?.metadata?.labels as Record<string, string> | null | undefined) ?? {};

  const projectData: ProjectData | undefined = project
    ? {
        name: project.metadata?.name ?? '',
        displayName: annotations[DISPLAY_NAME_ANNOTATION] ?? '',
        chargingTarget: labels[CHARGING_TARGET_LABEL] ?? '',
        chargingTargetType: labels[CHARGING_TARGET_TYPE_LABEL] ?? '',
        members: (project.spec?.members ?? []).flatMap(
          (m: { kind?: string; name?: string; namespace?: string; roles?: string[] } | null) => {
            if (!m?.name || !m?.kind) return [];
            return [
              {
                kind: m.kind,
                name: m.name,
                namespace: m.namespace ?? undefined,
                roles: (m.roles?.filter((r): r is string => !!r) ?? []) as MemberRoles[],
              },
            ];
          },
        ),
      }
    : undefined;

  return { projectData, isLoading: loading, error };
}

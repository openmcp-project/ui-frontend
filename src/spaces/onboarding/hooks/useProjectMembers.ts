import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { DISPLAY_NAME_ANNOTATION } from '../../../lib/api/types/shared/keyNames';

const GetProjectMembersQuery = gql`
  query GetProjectMembers($name: String!) {
    core_openmcp_cloud {
      v1alpha1 {
        Project(name: $name) {
          metadata {
            annotations
          }
        }
      }
    }
  }
`;

export function useProjectMembers(projectName: string) {
  const { data, loading } = useQuery(GetProjectMembersQuery, {
    variables: { name: projectName },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metadata = (data as any)?.core_openmcp_cloud?.v1alpha1?.Project?.metadata;
  const annotations: Record<string, string> = metadata?.annotations ?? {};
  const displayName: string | undefined = annotations[DISPLAY_NAME_ANNOTATION] || undefined;

  return { displayName, isLoading: loading };
}

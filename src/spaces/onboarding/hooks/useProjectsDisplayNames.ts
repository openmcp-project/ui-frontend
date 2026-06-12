import { gql, TypedDocumentNode } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { DISPLAY_NAME_ANNOTATION } from '../../../lib/api/types/shared/keyNames';

type GetProjectsDisplayNamesData = {
  core_openmcp_cloud?: {
    v1alpha1?: {
      Projects?: {
        items: {
          metadata?: { name?: string | null; annotations?: Record<string, string> | null } | null;
        }[];
      };
    };
  };
};

const GetProjectsDisplayNamesQuery: TypedDocumentNode<GetProjectsDisplayNamesData, Record<string, never>> = gql`
  query GetProjectsDisplayNames {
    core_openmcp_cloud {
      v1alpha1 {
        Projects {
          items {
            metadata {
              name
              annotations
            }
          }
        }
      }
    }
  }
`;

export function useProjectsDisplayNames(): Map<string, string> {
  const { data } = useQuery(GetProjectsDisplayNamesQuery);
  const items = data?.core_openmcp_cloud?.v1alpha1?.Projects?.items;

  return useMemo(() => {
    const map = new Map<string, string>();
    for (const item of items ?? []) {
      const name = item.metadata?.name;
      if (!name) continue;
      const displayName = (item.metadata?.annotations ?? {})[DISPLAY_NAME_ANNOTATION];
      if (displayName) map.set(name, displayName);
    }
    return map;
  }, [items]);
}

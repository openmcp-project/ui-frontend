import { useQuery } from '@apollo/client/react';
import { parse } from 'yaml';
import { useTranslation } from 'react-i18next';

import { graphql } from '../../types/__generated__/graphql';
import { useYamlQuery } from '../../spaces/mcp/hooks/useYamlQuery.ts';
import IllustratedError from '../Shared/IllustratedError.tsx';
import Loading from '../Shared/Loading.tsx';
import type { Resource } from '../../utils/removeManagedFieldsAndFilterData.ts';
import type { ResourceType } from '../../lib/api/types/crate/resourceObject.ts';
import { YamlSidePanel } from './YamlSidePanel.tsx';

const ProjectYamlQuery = graphql(`
  query ProjectYaml($name: String!) {
    core_openmcp_cloud {
      v1alpha1 {
        ProjectYaml(name: $name)
      }
    }
  }
`);

const WorkspaceYamlQuery = graphql(`
  query WorkspaceYaml($name: String!, $namespace: String) {
    core_openmcp_cloud {
      v1alpha1 {
        WorkspaceYaml(name: $name, namespace: $namespace)
      }
    }
  }
`);

const McpYamlQuery = graphql(`
  query McpYaml($name: String!, $namespace: String) {
    core_openmcp_cloud {
      v1alpha1 {
        ManagedControlPlaneYaml(name: $name, namespace: $namespace)
      }
    }
  }
`);

const ControlPlaneYamlQuery = graphql(`
  query ControlPlaneYaml($name: String!, $namespace: String) {
    core_open_control_plane_io {
      v2alpha1 {
        ControlPlaneYaml(name: $name, namespace: $namespace)
      }
    }
  }
`);

export interface YamlSidePanelWithLoaderProps {
  workspaceName?: string;
  resourceType: ResourceType;
  resourceName: string;
  isEdit?: boolean;
}

export function YamlSidePanelWithLoader({
  workspaceName,
  resourceType,
  resourceName,
  isEdit = false,
}: YamlSidePanelWithLoaderProps) {
  const { t } = useTranslation();
  const ns = workspaceName ?? '';

  // All four hooks are called unconditionally (rules of hooks); exactly one
  // is not skipped, so only one network request actually fires.
  const projectQuery = useQuery(ProjectYamlQuery, {
    variables: { name: resourceName },
    skip: resourceType !== 'projects' || !resourceName,
    fetchPolicy: 'network-only',
    pollInterval: 30_000,
  });
  const workspaceYaml = useYamlQuery(
    WorkspaceYamlQuery,
    (d) => d.core_openmcp_cloud?.v1alpha1?.WorkspaceYaml,
    resourceName,
    ns,
    resourceType !== 'workspaces',
  );
  const mcpYaml = useYamlQuery(
    McpYamlQuery,
    (d) => d.core_openmcp_cloud?.v1alpha1?.ManagedControlPlaneYaml,
    resourceName,
    ns,
    resourceType !== 'managedcontrolplanes',
  );
  const cpYaml = useYamlQuery(
    ControlPlaneYamlQuery,
    (d) => d.core_open_control_plane_io?.v2alpha1?.ControlPlaneYaml,
    resourceName,
    ns,
    resourceType !== 'controlplanes',
  );

  const { yaml, isLoading, error } = {
    projects: {
      yaml: projectQuery.data?.core_openmcp_cloud?.v1alpha1?.ProjectYaml ?? null,
      isLoading: projectQuery.loading,
      error: projectQuery.error,
    },
    workspaces: workspaceYaml,
    managedcontrolplanes: mcpYaml,
    controlplanes: cpYaml,
  }[resourceType];

  if (isLoading) return <Loading />;
  if (error || !yaml) return <IllustratedError details={t('common.cannotLoadData')} />;

  let resource: Resource;
  try {
    resource = parse(yaml) as Resource;
  } catch {
    return <IllustratedError details={t('common.cannotLoadData')} />;
  }

  const filename = `${workspaceName ? `${workspaceName}_` : ''}${resourceType}_${resourceName}`;

  return <YamlSidePanel resource={resource} filename={filename} isEdit={isEdit} />;
}

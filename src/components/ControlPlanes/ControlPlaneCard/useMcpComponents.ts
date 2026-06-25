import { useMemo } from 'react';
import { useApiResource } from '../../../lib/api/useApiResource';
import { ControlPlane as ControlPlaneResource } from '../../../lib/api/types/crate/controlPlanes';

interface ComponentVersion {
  version?: string;
}

interface McpComponents {
  crossplane?: ComponentVersion;
  flux?: ComponentVersion;
  landscaper?: unknown;
  kyverno?: ComponentVersion;
  externalSecretsOperator?: ComponentVersion;
}

interface RoleBinding {
  role: string;
  subjects: { kind: string; name: string }[];
}

export function useMcpComponents(projectName: string, workspaceName: string, controlPlaneName: string) {
  const { data: mcp, isLoading } = useApiResource(ControlPlaneResource(projectName, workspaceName, controlPlaneName));

  const components = useMemo<McpComponents | null>(() => {
    if (!mcp?.spec?.components) return null;
    return mcp.spec.components as McpComponents;
  }, [mcp]);

  const roleBindings = useMemo<RoleBinding[] | undefined>(() => {
    return mcp?.spec?.authorization?.roleBindings as RoleBinding[] | undefined;
  }, [mcp]);

  return { components, roleBindings, isLoading };
}

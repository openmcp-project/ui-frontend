import { useMemo } from 'react';
import { useApiResource } from '../../../lib/api/useApiResource';
import { ControlPlane as ControlPlaneResource } from '../../../lib/api/types/crate/controlPlanes';

interface McpComponents {
  crossplane?: unknown;
  flux?: unknown;
  landscaper?: unknown;
  kyverno?: unknown;
  externalSecretsOperator?: unknown;
}

export function useMcpComponents(projectName: string, workspaceName: string, controlPlaneName: string) {
  const { data: mcp, isLoading } = useApiResource(ControlPlaneResource(projectName, workspaceName, controlPlaneName));

  const components = useMemo<McpComponents | null>(() => {
    if (!mcp?.spec?.components) return null;
    return mcp.spec.components as McpComponents;
  }, [mcp]);

  const roleBindings = useMemo<{ role: string; subjects: { kind: string; name: string }[] }[] | undefined>(
    () =>
      mcp?.spec?.authorization?.roleBindings as
        | { role: string; subjects: { kind: string; name: string }[] }[]
        | undefined,
    [mcp],
  );

  return { components, roleBindings, isLoading };
}

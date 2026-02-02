import { useMemo } from 'react';
import yaml from 'js-yaml';
import { z } from 'zod';

const KubeContextSchema = z.object({
  name: z.string(),
  context: z.object({
    user: z.string(),
  }),
});

const KubeConfigSchema = z.object({
  contexts: z.array(KubeContextSchema).default([]),
});

const KUBE_CONTEXT_USER_SYSTEM_IDP = 'openmcp' as const;

// example: "project-test--ws-dev" => "dev"
function extractWorkspaceNameFromNamespace(namespace: string): string {
  return namespace.split('--ws-').pop() ?? namespace;
}

function buildMcpUrl(projectName: string, workspaceName: string, controlPlaneName: string, idp?: string): string {
  const normalizedWorkspace = extractWorkspaceNameFromNamespace(workspaceName);
  const basePath = `/mcp/projects/${projectName}/workspaces/${normalizedWorkspace}/mcps/${controlPlaneName}`;
  return idp ? `${basePath}?idp=${encodeURIComponent(idp)}` : basePath;
}

export interface ConnectOption {
  name: string;
  user: string;
  isSystemIdP: boolean;
  url: string;
}

export function useConnectionOptions(
  kubeconfigYaml: string | undefined,
  projectName: string,
  workspaceName: string,
  controlPlaneName: string,
): ConnectOption[] {
  return useMemo(() => {
    if (!kubeconfigYaml) {
      return [];
    }

    try {
      const parsedYaml = yaml.load(kubeconfigYaml);
      const result = KubeConfigSchema.safeParse(parsedYaml);
      if (!result.success) {
        console.error('Invalid Kubeconfig structure:', result.error);
        return [];
      }

      const { contexts } = result.data;

      const systemContext = contexts.find((ctx) => ctx.context.user === KUBE_CONTEXT_USER_SYSTEM_IDP);
      const otherIdps = contexts.filter((ctx) => ctx.context.user !== KUBE_CONTEXT_USER_SYSTEM_IDP);

      return [
        ...(systemContext
          ? [
              {
                name: systemContext.name,
                user: systemContext.context.user,
                url: buildMcpUrl(projectName, workspaceName, controlPlaneName),
                isSystemIdP: true,
              },
            ]
          : []),
        ...otherIdps.map((ctx) => ({
          name: ctx.name,
          user: ctx.context.user,
          url: buildMcpUrl(projectName, workspaceName, controlPlaneName, ctx.context.user),
          isSystemIdP: false,
        })),
      ];
    } catch (e) {
      console.error('Failed to parse kubeconfig', e);
      return [];
    }
  }, [kubeconfigYaml, projectName, workspaceName, controlPlaneName]);
}

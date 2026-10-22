import { load } from 'js-yaml';
import { z } from 'zod';
import { telemetry } from '../../../lib/telemetry/telemetry.ts';

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

function buildMcpUrl(projectName: string, workspaceName: string, controlPlaneName: string, idp?: string): string {
  // Segments are resource names (metadata.name) and must land in the URL verbatim — the read
  // side rebuilds the namespace from these route params, so any transformation here desyncs it.
  const basePath = `/projects/${encodeURIComponent(projectName)}/workspaces/${encodeURIComponent(workspaceName)}/managedcontrolplane/${encodeURIComponent(controlPlaneName)}`;
  return idp ? `${basePath}?idp=${encodeURIComponent(idp)}` : basePath;
}

export interface ConnectOption {
  name: string;
  user: string;
  isSystemIdP: boolean;
  url: string;
}

export function buildConnectOptions(
  kubeconfigYaml: string | undefined,
  projectName: string,
  workspaceName: string,
  controlPlaneName: string,
): ConnectOption[] {
  if (!kubeconfigYaml) {
    return [];
  }

  try {
    const parsedYaml = load(kubeconfigYaml);
    const result = KubeConfigSchema.safeParse(parsedYaml);
    if (!result.success) {
      telemetry().report(result.error, {
        message: 'Invalid Kubeconfig structure',
        context: { item: parsedYaml, issues: z.treeifyError(result.error) },
      });
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
    telemetry().report(e, {
      message: 'Failed to parse kubeconfig',
      context: { item: kubeconfigYaml },
    });
    return [];
  }
}

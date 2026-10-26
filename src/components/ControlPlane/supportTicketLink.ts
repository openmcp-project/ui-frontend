import type { TFunction } from 'i18next';
import type { ControlPlaneCondition } from '../../spaces/onboarding/types/ControlPlane';

interface SupportTicketLinkInput {
  baseUrl: string;
  projectName: string;
  workspaceName: string;
  mcpName: string;
  title: string;
  statusText: string;
  conditions?: ControlPlaneCondition[] | null;
  /** Prepended to the issue body, e.g. a human-readable status summary. */
  summary?: string;
  t: TFunction;
}

export function buildSupportTicketLink({
  baseUrl,
  projectName,
  workspaceName,
  mcpName,
  title,
  statusText,
  conditions,
  summary,
  t,
}: SupportTicketLinkInput): string {
  const clusterDetails = `${projectName}/${workspaceName}/${mcpName}`;

  const conditionDetails = conditions
    ? `${t('MCPHealthPopoverButton.statusDetailsLabel')}: ${statusText}\n\n${t('MCPHealthPopoverButton.detailsLabel')}\n` +
      conditions
        .map((condition) => {
          let text = `- ${condition.type}: ${condition.status}\n`;
          if (condition.reason) text += `  - ${t('MCPHealthPopoverButton.reasonHeader')}: ${condition.reason}\n`;
          if (condition.message) text += `  - ${t('MCPHealthPopoverButton.messageHeader')}: ${condition.message}\n`;
          return text;
        })
        .join('')
    : '';

  const params = new URLSearchParams({
    template: '1-mcp_issue.yml',
    title: `[${clusterDetails}]: ${title}`,
    'cluster-link': clusterDetails,
    'what-happened': summary ? `${summary}\n\n${conditionDetails}` : conditionDetails,
  });

  return `${baseUrl}?${params}`;
}

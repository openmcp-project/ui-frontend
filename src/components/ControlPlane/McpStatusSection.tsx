import { FlexBox } from '@ui5/webcomponents-react';
import MCPHealthPopoverButton from './MCPHealthPopoverButton.tsx';
import { ControlPlaneCondition } from '../../spaces/onboarding/types/ControlPlane.ts';

interface McpStatusSectionProps {
  mcpStatus:
    | {
        status?: string | null;
        phase?: string | null;
        conditions?: ControlPlaneCondition[] | null;
      }
    | null
    | undefined;
  projectName: string;
  workspaceName: string;
  mcpName: string;
}

export function McpStatusSection({ mcpStatus, projectName, workspaceName, mcpName }: McpStatusSectionProps) {
  return (
    <FlexBox direction={'Column'}>
      <MCPHealthPopoverButton
        mcpStatus={mcpStatus}
        projectName={projectName}
        workspaceName={workspaceName}
        mcpName={mcpName}
        large
      />
    </FlexBox>
  );
}

import { FlexBox, Text } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import MCPHealthPopoverButton from './MCPHealthPopoverButton.tsx';
import { ControlPlaneCondition } from '../../spaces/onboarding/types/ControlPlane.ts';
import styles from './McpStatusSection.module.css';

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
  const { t } = useTranslation();

  return (
    <FlexBox direction={'Column'}>
      <Text className={styles.statusLabel}>{t('common.status')}:</Text>
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

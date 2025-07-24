import { KubectlBaseDialog, CustomCommand } from './KubectlBaseDialog';
import { Text } from '@ui5/webcomponents-react';
import { useTranslation, Trans } from 'react-i18next';
import { Fragment } from 'react/jsx-runtime';

interface KubectlDeleteMcpDialogProps {
  onClose: () => void;
  workspaceName: string;
  projectName: string;
  resourceName: string;
  isOpen: boolean;
}

export const KubectlDeleteMcpDialog = ({
  onClose,
  workspaceName,
  projectName,
  resourceName,
  isOpen,
}: KubectlDeleteMcpDialogProps) => {
  const { t } = useTranslation();
  const workspaceNamespace = projectName ? `project-${projectName}--ws-${workspaceName}` : '<project-namespace>';
  const mcpName = resourceName || '<mcp-name>';

  const customCommands: CustomCommand[] = [
    {
      command: `kubectl -n ${workspaceNamespace} annotate managedcontrolplane ${mcpName} "confirmation.openmcp.cloud/deletion=true"`,
      description: t('KubectlDeleteMcpDialog.annotateCommand'),
      isMainCommand: true,
    },
    {
      command: `kubectl -n ${workspaceNamespace} delete managedcontrolplane ${mcpName}`,
      description: t('KubectlDeleteMcpDialog.deleteCommand'),
      isMainCommand: true,
    },
    {
      command: `kubectl -n ${workspaceNamespace} get managedcontrolplane`,
      description: t('KubectlDeleteMcpDialog.verificationCommandDescription'),
    },
  ];

  const introSection = [
    <Fragment key="intro-1">
      <Text>
        {t('KubectlDeleteMcpDialog.introSection1', {
          mcpName,
          workspaceNamespace,
        })}
      </Text>
      <Text>
        <Trans
          i18nKey="KubectlDeleteMcpDialog.introSection2"
          components={{
            bold1: <b />,
            bold2: <b />,
          }}
        />
      </Text>
    </Fragment>,
  ];

  return (
    <KubectlBaseDialog
      title={t('KubectlDeleteMcpDialog.title')}
      introSection={introSection}
      customCommands={customCommands}
      open={isOpen}
      onClose={onClose}
    />
  );
};

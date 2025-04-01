import { KubectlBaseDialog, CustomCommand } from './KubectlBaseDialog';
import { Text } from '@ui5/webcomponents-react';
import { useTranslation, Trans } from 'react-i18next';
import { Fragment } from 'react/jsx-runtime';

interface DeleteMcpDialogProps {
  onClose: () => void;
  workspaceName: string;
  projectName?: string;
  resourceName: string;
  isOpen: boolean;
}

export const DeleteMcpDialog = ({
  onClose,
  workspaceName,
  projectName,
  resourceName,
  isOpen,
}: DeleteMcpDialogProps) => {
  const { t } = useTranslation();
  const workspaceNamespace = projectName
    ? `project-${projectName}--ws-${workspaceName}`
    : '<project-namespace>';
  const mcpName = resourceName || '<mcp-name>';

  const customCommands: CustomCommand[] = [
    {
      command: `kubectl -n ${workspaceNamespace} annotate managedcontrolplane ${mcpName} "confirmation.openmcp.cloud/deletion=true"`,
      description: t('DeleteMcpDialog.annotateCommand'),
      isMainCommand: true,
    },
    {
      command: `kubectl -n ${workspaceNamespace} delete managedcontrolplane ${mcpName}`,
      description: t('DeleteMcpDialog.deleteCommand'),
      isMainCommand: true,
    },
    {
      command: `kubectl -n ${workspaceNamespace} get managedcontrolplane`,
      description: t('DeleteMcpDialog.verificationCommandDescription'),
    },
  ];

  const introSection = [
    <Fragment key="intro-1">
      <Text>
        {t('DeleteMcpDialog.introSection1', { mcpName, workspaceNamespace })}
      </Text>
      <Text>
        <Trans
          i18nKey="DeleteMcpDialog.introSection2"
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
      title={t('DeleteMcpDialog.title')}
      introSection={introSection}
      customCommands={customCommands}
      open={isOpen}
      onClose={onClose}
    />
  );
};

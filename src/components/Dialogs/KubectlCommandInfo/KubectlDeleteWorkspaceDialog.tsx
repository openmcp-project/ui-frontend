import { KubectlBaseDialog, CustomCommand } from './KubectlBaseDialog';
import { Text } from '@ui5/webcomponents-react';
import { useTranslation, Trans } from 'react-i18next';
import { Fragment } from 'react/jsx-runtime';

interface DeleteWorkspaceDialogProps {
  onClose: () => void;
  resourceName?: string;
  projectName?: string;
  isOpen: boolean;
}

export const DeleteWorkspaceDialog = ({ onClose, resourceName, projectName, isOpen }: DeleteWorkspaceDialogProps) => {
  const { t } = useTranslation();

  const projectNamespace = projectName ? `project-${projectName}` : '<project-namespace>"';
  const workspaceName = resourceName || '<workspace-name>';

  const customCommands: CustomCommand[] = [
    {
      command: `kubectl delete workspace ${resourceName} -n ${projectNamespace}`,
      description: t('DeleteWorkspaceDialog.mainCommandDescription'),
      isMainCommand: true,
    },
    {
      command: `kubectl get workspace -n ${projectNamespace}`,
      description: t('DeleteWorkspaceDialog.verificationCommandDescription'),
      isMainCommand: true,
    },
  ];

  const introSection = [
    <Fragment key="intro-1">
      <Text>
        {t('DeleteWorkspaceDialog.introSection1', {
          workspaceName,
          projectNamespace,
        })}
      </Text>
      <Text>
        <Trans
          i18nKey="DeleteWorkspaceDialog.introSection2"
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
      title={t('DeleteWorkspaceDialog.title')}
      introSection={introSection}
      customCommands={customCommands}
      open={isOpen}
      onClose={onClose}
    />
  );
};

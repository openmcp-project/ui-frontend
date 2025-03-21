import { KubectlBaseDialog, CustomCommand } from './KubectlBaseDialog';
import { Text } from '@ui5/webcomponents-react';

interface DeleteWorkspaceDialogProps {
  onClose: () => void;
  resourceName?: string;
  projectName?: string;
}

export const DeleteWorkspaceDialog = ({
  onClose,
  resourceName,
  projectName,
}: DeleteWorkspaceDialogProps) => {
  const projectNamespace = projectName
    ? `project-${projectName}`
    : '<project-namespace>"';
  const workspaceName = resourceName || '<workspace-name>';

  const customCommands: CustomCommand[] = [
    {
      command: `kubectl delete workspace ${resourceName} -n ${projectNamespace}`,
      description: 'Run this command to delete the workspace:',
      isMainCommand: true,
    },
    {
      command: `kubectl get workspace -n ${projectNamespace}`,
      description: 'To verify the workspace has been deleted, run:',
    },
  ];

  const introSection = [
    <Text>
      The below instructions will help you delete the workspace "{workspaceName}
      " from project namespace "{projectNamespace}" using kubectl.
    </Text>,
    <Text>
      Remember that this action is <b>irreversible</b> and all resources within
      the workspace will be <b>permanently deleted</b>.
    </Text>,
  ];

  return (
    <KubectlBaseDialog
      onClose={onClose}
      title="Delete a Workspace"
      introSection={introSection}
      customCommands={customCommands}
    />
  );
};

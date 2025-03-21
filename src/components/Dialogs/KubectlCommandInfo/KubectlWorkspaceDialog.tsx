import {
  KubectlBaseDialog,
  FormField,
  CustomCommand,
} from './KubectlBaseDialog';

interface KubectlWorkspaceDialogProps {
  onClose: () => void;
  project?: string;
}

export const KubectlWorkspaceDialog = ({
  onClose,
  project,
}: KubectlWorkspaceDialogProps) => {
  const randomWorkspaceName = Math.random().toString(36).substring(2, 8);
  const projectName = project || '<Project Namespace>';
  const projectNamespace = `project-${projectName}`;

  const formFields: FormField[] = [
    {
      id: 'workspaceName',
      label: 'Workspace Name',
      placeholder: 'Enter workspace name',
      defaultValue: randomWorkspaceName,
    },
    {
      id: 'chargingTargetId',
      label: 'BTP Global Account ID',
      placeholder: 'Enter your Global Account ID',
      defaultValue: '<your-ga-id>',
    },
    {
      id: 'userEmail',
      label: 'User Email',
      placeholder: 'Enter your email address',
      defaultValue: '<youremail@example.com>',
    },
  ];

  const customCommands: CustomCommand[] = [
    {
      command: `echo '
      apiVersion: core.openmcp.cloud/v1alpha1
      kind: Workspace
      metadata:
        name: \${workspaceName}
        namespace: ${projectNamespace}
        annotations:
          openmcp.cloud/display-name: My Workspace
        labels:
          openmcp.cloud.sap/charging-target: \${chargingTargetId}
      spec:
        members:
        - kind: User
          name: \${userEmail}
          roles:
          - admin
      ' | kubectl create -f -`,
      description:
        'Run this command to create a new workspace in your project:',
      isMainCommand: true,
    },
    {
      command: `kubectl get workspace \${workspaceName} -n ${projectNamespace}`,
      description:
        'To see the result of the workspace creation, run the below command:',
    },
  ];

  const introSection = [
    "Let's add a Workspace to our Project. We use workspaces to separate productive and non-productive ManagedControlPlanes.",
  ];

  return (
    <KubectlBaseDialog
      onClose={onClose}
      title="Create a Workspace"
      introSection={introSection}
      formFields={formFields}
      customCommands={customCommands}
    />
  );
};

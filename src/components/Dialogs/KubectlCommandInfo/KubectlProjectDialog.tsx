import {
  KubectlBaseDialog,
  FormField,
  CustomCommand,
} from './KubectlBaseDialog';

interface KubectlProjectDialogProps {
  onClose: () => void;
}

export const KubectlProjectDialog = ({
  onClose,
}: KubectlProjectDialogProps) => {
  const randomProjectName = Math.random().toString(36).substring(2, 8);
  const formFields: FormField[] = [
    {
      id: 'projectName',
      label: 'Project Name',
      placeholder: 'Enter project name',
      defaultValue: randomProjectName,
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
      kind: Project
      metadata:
        name: \${projectName}
        annotations:
          openmcp.cloud/display-name: My Project
        labels:
          openmcp.cloud.sap/charging-target-type: btp
          openmcp.cloud.sap/charging-target: \${chargingTargetId}
      spec:
        members:
        - kind: User
          name: \${userEmail}
          roles:
          - admin
      ' | kubectl create -f -`,
      description: 'Run this command to create a new project:',
      isMainCommand: true,
    },
    {
      command: `kubectl get project \${projectName}`,
      description:
        'To see the result of the project creation, run the below command:',
    },
    {
      command: `kubectl get namespace project-\${projectName}`,
      description: 'A namespace is automatically generated for your project:',
    },
  ];

  const introSection = [
    'A Project is the starting point to our ManagedControlPlane offering. Projects are usually created for each Organization/Team or similar root setups.',
  ];

  return (
    <KubectlBaseDialog
      onClose={onClose}
      title="Create a Project"
      introSection={introSection}
      formFields={formFields}
      customCommands={customCommands}
    />
  );
};

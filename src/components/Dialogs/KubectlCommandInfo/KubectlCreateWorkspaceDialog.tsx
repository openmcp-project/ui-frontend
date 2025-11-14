import { KubectlBaseDialog, FormField, CustomCommand } from './KubectlBaseDialog';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

interface KubectlCreateWorkspaceDialogProps {
  onClose: () => void;
  isOpen: boolean;
  project?: string;
}

export const KubectlCreateWorkspaceDialog = ({ onClose, isOpen, project }: KubectlCreateWorkspaceDialogProps) => {
  const { t } = useTranslation();
  const [randomWorkspaceName] = useState(() => Math.random().toString(36).substring(2, 8));
  const projectName = project || '<Project Namespace>';
  const projectNamespace = `project-${projectName}`;

  const formFields: FormField[] = [
    {
      id: 'workspaceName',
      label: t('KubectlCreateWorkspaceDialog.formFields.workspaceName.label'),
      placeholder: t('KubectlCreateWorkspaceDialog.formFields.workspaceName.placeholder'),
      defaultValue: randomWorkspaceName,
    },
    {
      id: 'chargingTargetId',
      label: t('KubectlCreateWorkspaceDialog.formFields.chargingTargetId.label'),
      placeholder: t('KubectlCreateWorkspaceDialog.formFields.chargingTargetId.placeholder'),
      defaultValue: t('KubectlCreateWorkspaceDialog.formFields.chargingTargetId.defaultValue'),
    },
    {
      id: 'userEmail',
      label: t('KubectlCreateWorkspaceDialog.formFields.userEmail.label'),
      placeholder: t('KubectlCreateWorkspaceDialog.formFields.userEmail.placeholder'),
      defaultValue: t('KubectlCreateWorkspaceDialog.formFields.userEmail.defaultValue'),
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
      description: t('KubectlCreateWorkspaceDialog.mainCommandDescription'),
      isMainCommand: true,
    },
    {
      command: `kubectl get workspace \${workspaceName} -n ${projectNamespace}`,
      description: t('KubectlCreateWorkspaceDialog.resultCommandDescription'),
    },
  ];

  const introSection = [t('KubectlCreateWorkspaceDialog.introSection')];

  return (
    <KubectlBaseDialog
      title={t('KubectlCreateWorkspaceDialog.title')}
      introSection={introSection}
      formFields={formFields}
      customCommands={customCommands}
      open={isOpen}
      onClose={onClose}
    />
  );
};

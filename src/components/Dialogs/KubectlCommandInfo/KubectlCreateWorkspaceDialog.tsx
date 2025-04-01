import {
  KubectlBaseDialog,
  FormField,
  CustomCommand,
} from './KubectlBaseDialog';
import { useTranslation } from 'react-i18next';

interface KubectlWorkspaceDialogProps {
  onClose: () => void;
  isOpen: boolean;
  project?: string;
}

export const KubectlWorkspaceDialog = ({
  onClose,
  isOpen,
  project,
}: KubectlWorkspaceDialogProps) => {
  const { t } = useTranslation();
  const randomWorkspaceName = Math.random().toString(36).substring(2, 8);
  const projectName = project || '<Project Namespace>';
  const projectNamespace = `project-${projectName}`;

  const formFields: FormField[] = [
    {
      id: 'workspaceName',
      label: t('KubectlWorkspaceDialog.formFields.workspaceName.label'),
      placeholder: t(
        'KubectlWorkspaceDialog.formFields.workspaceName.placeholder',
      ),
      defaultValue: randomWorkspaceName,
    },
    {
      id: 'chargingTargetId',
      label: t('KubectlWorkspaceDialog.formFields.chargingTargetId.label'),
      placeholder: t(
        'KubectlWorkspaceDialog.formFields.chargingTargetId.placeholder',
      ),
      defaultValue: t(
        'KubectlWorkspaceDialog.formFields.chargingTargetId.defaultValue',
      ),
    },
    {
      id: 'userEmail',
      label: t('KubectlWorkspaceDialog.formFields.userEmail.label'),
      placeholder: t('KubectlWorkspaceDialog.formFields.userEmail.placeholder'),
      defaultValue: t(
        'KubectlWorkspaceDialog.formFields.userEmail.defaultValue',
      ),
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
      description: t('KubectlWorkspaceDialog.mainCommandDescription'),
      isMainCommand: true,
    },
    {
      command: `kubectl get workspace \${workspaceName} -n ${projectNamespace}`,
      description: t('KubectlWorkspaceDialog.resultCommandDescription'),
    },
  ];

  const introSection = [t('KubectlWorkspaceDialog.introSection')];

  return (
    <KubectlBaseDialog
      title={t('KubectlWorkspaceDialog.title')}
      introSection={introSection}
      formFields={formFields}
      customCommands={customCommands}
      open={isOpen}
      onClose={onClose}
    />
  );
};

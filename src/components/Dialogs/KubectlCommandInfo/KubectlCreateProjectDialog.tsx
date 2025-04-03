import {
  KubectlBaseDialog,
  FormField,
  CustomCommand,
} from './KubectlBaseDialog';
import { useTranslation } from 'react-i18next';

interface KubectlCreateProjectDialogProps {
  onClose: () => void;
  isOpen: boolean;
}

export const KubectlCreateProjectDialog = ({
  onClose,
  isOpen,
}: KubectlCreateProjectDialogProps) => {
  const { t } = useTranslation();
  const randomProjectName = Math.random().toString(36).substring(2, 8);

  const formFields: FormField[] = [
    {
      id: 'projectName',
      label: t('KubectlCreateProjectDialog.formFields.projectName.label'),
      placeholder: t(
        'KubectlCreateProjectDialog.formFields.projectName.placeholder',
      ),
      defaultValue: randomProjectName,
    },
    {
      id: 'chargingTargetId',
      label: t('KubectlCreateProjectDialog.formFields.chargingTargetId.label'),
      placeholder: t(
        'KubectlCreateProjectDialog.formFields.chargingTargetId.placeholder',
      ),
      defaultValue: t(
        'KubectlCreateProjectDialog.formFields.chargingTargetId.defaultValue',
      ),
    },
    {
      id: 'userEmail',
      label: t('KubectlCreateProjectDialog.formFields.userEmail.label'),
      placeholder: t(
        'KubectlCreateProjectDialog.formFields.userEmail.placeholder',
      ),
      defaultValue: t(
        'KubectlCreateProjectDialog.formFields.userEmail.defaultValue',
      ),
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
      description: t('KubectlCreateProjectDialog.mainCommandDescription'),
      isMainCommand: true,
    },
    {
      command: `kubectl get project \${projectName}`,
      description: t('KubectlCreateProjectDialog.resultCommandDescription'),
    },
    {
      command: `kubectl get namespace project-\${projectName}`,
      description: t('KubectlCreateProjectDialog.namespaceCommandDescription'),
    },
  ];

  const introSection = [t('KubectlCreateProjectDialog.introSection')];

  return (
    <KubectlBaseDialog
      title={t('KubectlCreateProjectDialog.title')}
      introSection={introSection}
      formFields={formFields}
      customCommands={customCommands}
      open={isOpen}
      onClose={onClose}
    />
  );
};

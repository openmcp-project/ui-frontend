import {
  KubectlBaseDialog,
  FormField,
  CustomCommand,
} from './KubectlBaseDialog';
import { useTranslation } from 'react-i18next';

interface KubectlProjectDialogProps {
  onClose: () => void;
  isOpen: boolean;
}

export const KubectlProjectDialog = ({
  onClose,
  isOpen,
}: KubectlProjectDialogProps) => {
  const { t } = useTranslation();
  const randomProjectName = Math.random().toString(36).substring(2, 8);

  const formFields: FormField[] = [
    {
      id: 'projectName',
      label: t('KubectlProjectDialog.formFields.projectName.label'),
      placeholder: t('KubectlProjectDialog.formFields.projectName.placeholder'),
      defaultValue: randomProjectName,
    },
    {
      id: 'chargingTargetId',
      label: t('KubectlProjectDialog.formFields.chargingTargetId.label'),
      placeholder: t(
        'KubectlProjectDialog.formFields.chargingTargetId.placeholder',
      ),
      defaultValue: t(
        'KubectlProjectDialog.formFields.chargingTargetId.defaultValue',
      ),
    },
    {
      id: 'userEmail',
      label: t('KubectlProjectDialog.formFields.userEmail.label'),
      placeholder: t('KubectlProjectDialog.formFields.userEmail.placeholder'),
      defaultValue: t('KubectlProjectDialog.formFields.userEmail.defaultValue'),
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
      description: t('KubectlProjectDialog.mainCommandDescription'),
      isMainCommand: true,
    },
    {
      command: `kubectl get project \${projectName}`,
      description: t('KubectlProjectDialog.resultCommandDescription'),
    },
    {
      command: `kubectl get namespace project-\${projectName}`,
      description: t('KubectlProjectDialog.namespaceCommandDescription'),
    },
  ];

  const introSection = [t('KubectlProjectDialog.introSection')];

  return (
    <KubectlBaseDialog
      title={t('KubectlProjectDialog.title')}
      introSection={introSection}
      formFields={formFields}
      customCommands={customCommands}
      open={isOpen}
      onClose={onClose}
    />
  );
};

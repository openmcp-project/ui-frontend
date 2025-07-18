import { KubectlBaseDialog, CustomCommand } from './KubectlBaseDialog';
import { Text } from '@ui5/webcomponents-react';
import { useTranslation, Trans } from 'react-i18next';
import { Fragment } from 'react/jsx-runtime';

interface DeleteProjectDialogProps {
  onClose: () => void;
  resourceName?: string;
  projectName?: string;
  isOpen: boolean;
}

export const DeleteProjectDialog = ({ onClose, projectName, isOpen }: DeleteProjectDialogProps) => {
  const { t } = useTranslation();

  const projectNamespace = projectName ?? '<project-names>"';

  const customCommands: CustomCommand[] = [
    {
      command: `kubectl delete project  ${projectNamespace}`,
      description: t('DeleteProjectDialog.mainCommandDescription'),
      isMainCommand: true,
    },
  ];

  const introSection = [
    <Fragment key="intro-1">
      <Text>
        {t('DeleteProjectDialog.introSection1', {
          projectName,
        })}
      </Text>
      <Text>
        <Trans
          i18nKey={t('DeleteProjectDialog.introSection2')}
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
      title={t('DeleteProjectDialog.title')}
      introSection={introSection}
      customCommands={customCommands}
      open={isOpen}
      onClose={onClose}
    />
  );
};

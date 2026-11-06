import { Toolbar, ToolbarButton } from '@ui5/webcomponents-react';
import styles from './ControlPlaneListToolbar.module.css';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreateWorkspaceDialogContainer } from '../../Dialogs/CreateWorkspaceDialogContainer.tsx';

type ControlPlaneListToolbarProps = {
  projectName: string;
};

export function ControlPlaneListToolbar({ projectName }: ControlPlaneListToolbarProps) {
  const [dialogCreateProjectIsOpen, setDialogIsOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <Toolbar className={styles.toolbar}>
        <ToolbarButton
          design="Emphasized"
          icon="add"
          text={t('ControlPlaneListToolbar.buttonText')}
          onClick={() => setDialogIsOpen(true)}
        />
      </Toolbar>

      <CreateWorkspaceDialogContainer
        isOpen={dialogCreateProjectIsOpen}
        setIsOpen={setDialogIsOpen}
        project={projectName}
      />
    </>
  );
}

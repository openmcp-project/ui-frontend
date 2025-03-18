import { Toolbar, ToolbarButton } from "@ui5/webcomponents-react";
import { useState } from "react";
import { useTranslation } from 'react-i18next';
import {CreateWorkspaceDialogContainer} from "../../Dialogs/CreateWorkspaceDialogContainer.tsx";



export function ControlPlaneListToolbar({ projectName }: { projectName: string }) {
  const [dialogCreateProjectIsOpen, setDialogIsOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <Toolbar>
        <ToolbarButton icon="add" text={t('ControlPlaneListToolbar.buttonText')} onClick={() => setDialogIsOpen(true)} />
      </Toolbar>
      <CreateWorkspaceDialogContainer isOpen={dialogCreateProjectIsOpen} setIsOpen={setDialogIsOpen} project={projectName} type={'workspace'}/>
    </>
  )

}
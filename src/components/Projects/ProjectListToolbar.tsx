import { Toolbar, ToolbarButton } from '@ui5/webcomponents-react';
import { useState } from 'react';
import { CreateProjectDialogContainer } from '../Dialogs/CreateProjectDialogContainer.tsx';

export function ProjectListToolbar() {
  const [dialogCreateProjectIsOpen, setDialogIsOpen] = useState(false);
  return (
    <>
      <Toolbar>
        <ToolbarButton icon="add" text="Project" onClick={() => setDialogIsOpen(true)} />
      </Toolbar>
      <CreateProjectDialogContainer isOpen={dialogCreateProjectIsOpen} setIsOpen={setDialogIsOpen} />
    </>
  );
}

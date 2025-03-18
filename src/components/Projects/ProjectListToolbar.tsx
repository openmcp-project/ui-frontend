import { Toolbar, ToolbarButton } from "@ui5/webcomponents-react";
import { useState } from "react";

import {CreateWorkspaceDialogContainer} from "../Dialogs/CreateWorkspaceDialogContainer.tsx";


export function ProjectListToolbar() {
  const [dialogCreateProjectIsOpen, setDialogIsOpen] = useState(false);
  return (
    <>
      <Toolbar>
        <ToolbarButton icon="add" text="Project" onClick={() => setDialogIsOpen(true)} />
      </Toolbar>
      <CreateWorkspaceDialogContainer project={'Project'} type={'project'} isOpen={dialogCreateProjectIsOpen} setIsOpen={setDialogIsOpen} />
    </>
  )
}
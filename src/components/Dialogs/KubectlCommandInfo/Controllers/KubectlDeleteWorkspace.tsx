import { DeleteWorkspaceDialog } from '../KubectlDeleteWorkspaceDialog';
import { KubectlInfoButton } from '../KubectlInfoButton';
import { useState } from 'react';

interface KubectlDeleteWorkspaceProps {
  projectName?: string;
  resourceName: string;
}

export const KubectlDeleteWorkspace = ({
  projectName,
  resourceName,
}: KubectlDeleteWorkspaceProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const closeDialog = () => {
    setIsDialogOpen(false);
  };

  return (
    <>
      <KubectlInfoButton
        onClick={() => setIsDialogOpen(true)}
      ></KubectlInfoButton>

      {isDialogOpen && (
        <DeleteWorkspaceDialog
          onClose={closeDialog}
          projectName={projectName}
          resourceName={resourceName}
        ></DeleteWorkspaceDialog>
      )}
    </>
  );
};

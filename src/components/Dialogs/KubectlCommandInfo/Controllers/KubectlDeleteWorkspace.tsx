import { useState } from 'react';
import { DeleteWorkspaceDialog } from '../KubectlDeleteWorkspaceDialog';
import { KubectlInfoButton } from '../KubectlInfoButton';

interface KubectlDeleteWorkspaceProps {
  projectName?: string;
  resourceName: string;
}

export const KubectlDeleteWorkspace = ({
  projectName,
  resourceName,
}: KubectlDeleteWorkspaceProps) => {
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);

  const openInfoDialog = () => setIsInfoDialogOpen(true);
  const closeInfoDialog = () => setIsInfoDialogOpen(false);

  return (
    <>
      <KubectlInfoButton onClick={openInfoDialog} />
      <DeleteWorkspaceDialog
        projectName={projectName}
        resourceName={resourceName}
        isOpen={isInfoDialogOpen}
        onClose={closeInfoDialog}
      />
    </>
  );
};

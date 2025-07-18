import { useState } from 'react';

import { KubectlInfoButton } from '../KubectlInfoButton';
import { DeleteProjectDialog } from '../KubectlDeleteProjectDialog.tsx';

interface KubectlDeleteWorkspaceProps {
  projectName?: string;
}

export const KubectlDeleteProject = ({ projectName }: KubectlDeleteWorkspaceProps) => {
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);

  const openInfoDialog = () => setIsInfoDialogOpen(true);
  const closeInfoDialog = () => setIsInfoDialogOpen(false);

  return (
    <>
      <KubectlInfoButton onClick={openInfoDialog} />
      <DeleteProjectDialog projectName={projectName} isOpen={isInfoDialogOpen} onClose={closeInfoDialog} />
    </>
  );
};

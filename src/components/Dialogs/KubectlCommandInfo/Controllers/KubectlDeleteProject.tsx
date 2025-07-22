import { useState } from 'react';

import { KubectlInfoButton } from '../KubectlInfoButton';
import { KubectlDeleteProjectDialog } from '../KubectlDeleteProjectDialog.tsx';

interface KubectlDeleteProjectProps {
  projectName?: string;
}

export const KubectlDeleteProject = ({ projectName }: KubectlDeleteProjectProps) => {
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);

  const openInfoDialog = () => setIsInfoDialogOpen(true);
  const closeInfoDialog = () => setIsInfoDialogOpen(false);

  return (
    <>
      <KubectlInfoButton onClick={openInfoDialog} />
      <KubectlDeleteProjectDialog projectName={projectName} isOpen={isInfoDialogOpen} onClose={closeInfoDialog} />
    </>
  );
};

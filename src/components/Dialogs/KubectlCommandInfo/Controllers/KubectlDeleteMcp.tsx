import { useState } from 'react';
import { KubectlDeleteMcpDialog } from '../KubectlDeleteMcpDialog';
import { KubectlInfoButton } from '../KubectlInfoButton';

interface KubectlDeleteMcpProps {
  projectName: string;
  workspaceName: string;
  resourceName: string;
}

export const KubectlDeleteMcp = ({ projectName, workspaceName, resourceName }: KubectlDeleteMcpProps) => {
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);

  const openInfoDialog = () => setIsInfoDialogOpen(true);
  const closeInfoDialog = () => setIsInfoDialogOpen(false);

  return (
    <>
      <KubectlInfoButton onClick={openInfoDialog} />
      <KubectlDeleteMcpDialog
        projectName={projectName}
        workspaceName={workspaceName}
        resourceName={resourceName}
        isOpen={isInfoDialogOpen}
        onClose={closeInfoDialog}
      />
    </>
  );
};

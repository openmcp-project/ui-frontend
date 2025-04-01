import { DeleteMcpDialog } from '../KubectlDeleteMcpDialog';
import { KubectlInfoButton } from '../KubectlInfoButton';
import { useDialog } from '../../UseDialog';

interface KubectlDeleteMcpProps {
  projectName?: string;
  workspaceName: string;
  resourceName: string;
}

export const KubectlDeleteMcp = ({
  projectName,
  workspaceName,
  resourceName,
}: KubectlDeleteMcpProps) => {
  const infoDialog = useDialog();

  return (
    <>
      <KubectlInfoButton onClick={infoDialog.open} />
      <DeleteMcpDialog
        projectName={projectName}
        workspaceName={workspaceName}
        resourceName={resourceName}
        isOpen={infoDialog.isOpen}
        onClose={infoDialog.close}
      />
    </>
  );
};

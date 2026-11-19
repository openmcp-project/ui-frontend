import { ResolvedSupportInfo } from '../../../lib/supportInfo.ts';
import { EditWorkspaceDialogContainer } from '../../Dialogs/EditWorkspaceDialogContainer.tsx';
import { SupportInfoTag } from '../../Shared/SupportInfoTag.tsx';

interface Props {
  workspaceName: string;
  namespace: string;
  resolved: ResolvedSupportInfo;
}

export function WorkspaceSupportInfoTag({ workspaceName, namespace, resolved }: Props) {
  return (
    <SupportInfoTag
      resolved={resolved}
      testId="workspace-support-info-tag"
      renderEditDialog={(close) => (
        <EditWorkspaceDialogContainer
          isOpen
          setIsOpen={(open) => !open && close()}
          workspaceName={workspaceName}
          namespace={namespace}
          initialStep="supportInfo"
        />
      )}
    />
  );
}

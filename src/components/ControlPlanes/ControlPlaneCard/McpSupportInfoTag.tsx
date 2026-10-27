import { ResolvedSupportInfo } from '../../../lib/supportInfo.ts';
import { SupportInfoTag } from '../../Shared/SupportInfoTag.tsx';
import { EditControlPlaneV2WizardDataLoader } from '../../Wizards/CreateControlPlaneV2/EditControlPlaneV2WizardDataLoader.tsx';

interface Props {
  namespace: string;
  resourceName: string;
  resolved: ResolvedSupportInfo;
}

export function McpSupportInfoTag({ namespace, resourceName, resolved }: Props) {
  return (
    <SupportInfoTag
      resolved={resolved}
      testId="mcp-support-info-tag"
      renderEditDialog={(close) => (
        <EditControlPlaneV2WizardDataLoader
          isOpen
          setIsOpen={(open) => !open && close()}
          namespace={namespace}
          resourceName={resourceName}
          initialSection="supportInfo"
        />
      )}
    />
  );
}

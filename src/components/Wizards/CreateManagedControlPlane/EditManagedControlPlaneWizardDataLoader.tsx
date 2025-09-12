import { FC } from 'react';
import { useApiResource } from '../../../lib/api/useApiResource.ts';
import { ResourceObject } from '../../../lib/api/types/crate/resourceObject.ts';

import Loading from '../../Shared/Loading.tsx';
import { CreateManagedControlPlaneWizardContainer } from './CreateManagedControlPlaneWizardContainer.tsx';
import { PROJECT_NAME_LABEL, WORKSPACE_LABEL } from '../../../lib/api/types/shared/keyNames.ts';

export type EditManagedControlPlaneWizardDataLoaderProps = {
  workspaceName?: string;
  resourceName: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export const EditManagedControlPlaneWizardDataLoader: FC<EditManagedControlPlaneWizardDataLoaderProps> = ({
  workspaceName,
  resourceName,
  isOpen,
  setIsOpen,
}) => {
  const { isLoading, data, error } = useApiResource(
    ResourceObject(workspaceName ?? '', 'managedcontrolplanes', resourceName),
    undefined,
    true,
    !isOpen,
  );

  if (isLoading) return <Loading />;
  if (error || !data) {
    return null;
  }

  return (
    <CreateManagedControlPlaneWizardContainer
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      projectName={`project-${data?.metadata?.labels?.[PROJECT_NAME_LABEL]}`}
      workspaceName={data?.metadata?.labels?.[WORKSPACE_LABEL]}
      isEditMode={true}
      initialData={data}
    />
  );
};

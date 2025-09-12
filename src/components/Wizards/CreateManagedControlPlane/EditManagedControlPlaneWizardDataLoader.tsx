import { FC } from 'react';
import { useApiResource } from '../../../lib/api/useApiResource.ts';
import { ResourceObject } from '../../../lib/api/types/crate/resourceObject.ts';
import styles from './EditManagedControlPlaneWizardDataLoader.module.css';
import Loading from '../../Shared/Loading.tsx';
import { CreateManagedControlPlaneWizardContainer } from './CreateManagedControlPlaneWizardContainer.tsx';
import { PROJECT_NAME_LABEL, WORKSPACE_LABEL } from '../../../lib/api/types/shared/keyNames.ts';
import { ManagedControlPlaneInterface } from './mcp_type.ts';
import { BusyIndicator } from '@ui5/webcomponents-react';

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
    ResourceObject<ManagedControlPlaneInterface>(workspaceName ?? '', 'managedcontrolplanes', resourceName),
    undefined,
    true,
    !isOpen,
  );

  if (isLoading) {
    return (
      <div className={styles.absolute}>
        <BusyIndicator active />
      </div>
    );
  }
  if (error || !data) {
    return null;
  }

  return (
    <>
      <CreateManagedControlPlaneWizardContainer
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        projectName={`project-${data?.metadata?.labels?.[PROJECT_NAME_LABEL]}`}
        workspaceName={data?.metadata?.labels?.[WORKSPACE_LABEL]}
        isEditMode={true}
        initialData={data}
      />
    </>
  );
};

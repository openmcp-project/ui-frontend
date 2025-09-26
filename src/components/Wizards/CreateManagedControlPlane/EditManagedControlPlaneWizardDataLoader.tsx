import { FC } from 'react';
import { useApiResource } from '../../../lib/api/useApiResource.ts';
import { ResourceObject } from '../../../lib/api/types/crate/resourceObject.ts';
import styles from './EditManagedControlPlaneWizardDataLoader.module.css';

import {
  CreateManagedControlPlaneWizardContainer,
  WizardStepType,
} from './CreateManagedControlPlaneWizardContainer.tsx';
import { PROJECT_NAME_LABEL, WORKSPACE_LABEL } from '../../../lib/api/types/shared/keyNames.ts';

import { BusyIndicator } from '@ui5/webcomponents-react';
import { ManagedControlPlaneInterface } from '../../../lib/api/types/mcpResource.ts';

export type EditManagedControlPlaneWizardDataLoaderProps = {
  workspaceName?: string;
  resourceName: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isOnMcpPage?: boolean;
  initialSection?: WizardStepType;
  mode?: 'edit' | 'duplicate';
};

export const EditManagedControlPlaneWizardDataLoader: FC<EditManagedControlPlaneWizardDataLoaderProps> = ({
  workspaceName,
  resourceName,
  isOpen,
  setIsOpen,
  isOnMcpPage = false,
  initialSection,
  mode = 'edit',
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
      {isOpen ? (
        <CreateManagedControlPlaneWizardContainer
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          projectName={`project-${data?.metadata?.labels?.[PROJECT_NAME_LABEL]}`}
          workspaceName={data?.metadata?.labels?.[WORKSPACE_LABEL]}
          isEditMode={mode === 'edit'}
          isDuplicateMode={mode === 'duplicate'}
          initialData={data}
          isOnMcpPage={isOnMcpPage}
          initialSection={initialSection}
        />
      ) : null}
    </>
  );
};

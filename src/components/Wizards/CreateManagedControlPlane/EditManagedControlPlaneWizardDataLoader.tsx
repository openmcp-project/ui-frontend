import { FC } from 'react';
import { useManagedControlPlaneEditQuery } from '../../../spaces/onboarding/hooks/useManagedControlPlaneEditQuery.ts';
import styles from './EditManagedControlPlaneWizardDataLoader.module.css';

import {
  CreateManagedControlPlaneWizardContainer,
  WizardStepType,
} from './CreateManagedControlPlaneWizardContainer.tsx';
import { PROJECT_NAME_LABEL, WORKSPACE_LABEL } from '../../../lib/api/types/shared/keyNames.ts';

import { BusyIndicator } from '@ui5/webcomponents-react';

export type EditManagedControlPlaneWizardDataLoaderProps = {
  workspaceName?: string;
  resourceName: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  initialSection?: WizardStepType;
  mode?: 'edit' | 'duplicate';
};

export const EditManagedControlPlaneWizardDataLoader: FC<EditManagedControlPlaneWizardDataLoaderProps> = ({
  workspaceName,
  resourceName,
  isOpen,
  setIsOpen,
  initialSection,
  mode = 'edit',
}) => {
  const { isLoading, data, error } = useManagedControlPlaneEditQuery(workspaceName, resourceName, !isOpen);

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
          initialSection={initialSection}
        />
      ) : null}
    </>
  );
};

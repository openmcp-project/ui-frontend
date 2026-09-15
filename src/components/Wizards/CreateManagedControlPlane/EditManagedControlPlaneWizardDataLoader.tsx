import { BusyIndicator } from '@ui5/webcomponents-react';
import { FC, useRef } from 'react';
import { useManagedControlPlaneEditQuery } from '../../../spaces/onboarding/hooks/useManagedControlPlaneEditQuery.ts';
import styles from './EditManagedControlPlaneWizardDataLoader.module.css';

import {
  CreateManagedControlPlaneWizardContainer,
  WizardStepType,
} from './CreateManagedControlPlaneWizardContainer.tsx';
import { PROJECT_NAME_LABEL, WORKSPACE_LABEL } from '../../../lib/api/types/shared/keyNames.ts';

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
  const { isLoading, data } = useManagedControlPlaneEditQuery(workspaceName, resourceName, !isOpen);

  // Preserve the last successfully loaded data so the wizard stays mounted and retains
  // its form state during Apollo background refetches. Cleared on close so the next
  // open re-seeds from live data. useRef avoids triggering re-renders on update.
  const cachedDataRef = useRef<typeof data>(undefined);
  if (data) cachedDataRef.current = data;
  if (!isOpen) cachedDataRef.current = undefined;
  const stableData = data ?? cachedDataRef.current;

  if (isLoading && !stableData) {
    return (
      <div className={styles.absolute}>
        <BusyIndicator active />
      </div>
    );
  }
  if (!stableData) {
    return null;
  }

  return (
    <>
      {isOpen ? (
        <CreateManagedControlPlaneWizardContainer
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          projectName={`project-${stableData?.metadata?.labels?.[PROJECT_NAME_LABEL]}`}
          workspaceName={stableData?.metadata?.labels?.[WORKSPACE_LABEL]}
          isEditMode={mode === 'edit'}
          isDuplicateMode={mode === 'duplicate'}
          initialData={stableData}
          initialSection={initialSection}
        />
      ) : null}
    </>
  );
};

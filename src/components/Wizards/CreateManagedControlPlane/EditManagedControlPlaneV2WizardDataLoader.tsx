import { BusyIndicator } from '@ui5/webcomponents-react';
import { FC } from 'react';
import { ManagedControlPlaneV2 } from '../../../spaces/onboarding/types/ControlPlane.ts';
import { useMcpV2Query } from '../../../spaces/onboarding/hooks/useMcpV2Query.ts';
import {
  CreateManagedControlPlaneV2WizardContainer,
  WizardStepType,
} from './CreateManagedControlPlaneV2WizardContainer.tsx';
import styles from './EditManagedControlPlaneWizardDataLoader.module.css';

export type EditManagedControlPlaneV2WizardDataLoaderProps = {
  namespace?: string;
  resourceName: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  initialSection?: WizardStepType;
};

function parseNamespaceString(namespace: string): { projectName: string; workspaceName: string } {
  // namespace format: "project-{projectName}--ws-{workspaceName}"
  const separatorIndex = namespace.indexOf('--ws-');
  if (separatorIndex === -1) {
    return { projectName: namespace, workspaceName: '' };
  }
  return {
    projectName: namespace.slice(0, separatorIndex),
    workspaceName: namespace.slice(separatorIndex + '--ws-'.length),
  };
}

export const EditManagedControlPlaneV2WizardDataLoader: FC<EditManagedControlPlaneV2WizardDataLoaderProps> = ({
  namespace,
  resourceName,
  isOpen,
  setIsOpen,
  initialSection,
}) => {
  const { isPending, data, error } = useMcpV2Query(isOpen ? resourceName : undefined, isOpen ? namespace : undefined);

  if (!isOpen) {
    return null;
  }

  if (error) {
    return null;
  }

  if (isPending || !data) {
    return (
      <div className={styles.absolute}>
        <BusyIndicator active />
      </div>
    );
  }

  const { projectName, workspaceName } = parseNamespaceString(namespace ?? '');

  return (
    <CreateManagedControlPlaneV2WizardContainer
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      projectName={projectName}
      workspaceName={workspaceName}
      isEditMode
      initialData={data as ManagedControlPlaneV2}
      initialSection={initialSection}
    />
  );
};

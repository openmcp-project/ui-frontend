import { BusyIndicator, Button } from '@ui5/webcomponents-react';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ManagedControlPlaneV2 } from '../../../spaces/onboarding/types/ControlPlane.ts';
import { useControlPlaneV2Query } from '../../../spaces/onboarding/hooks/controlPlaneV2/useControlPlaneV2Query.ts';
import { CreateControlPlaneV2WizardContainer, WizardStepType } from './CreateControlPlaneV2WizardContainer.tsx';
import styles from '../CreateManagedControlPlane/EditManagedControlPlaneWizardDataLoader.module.css';

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

export const EditControlPlaneV2WizardDataLoader: FC<EditManagedControlPlaneV2WizardDataLoaderProps> = ({
  namespace,
  resourceName,
  isOpen,
  setIsOpen,
  initialSection,
}) => {
  const { t } = useTranslation();
  const { data, error } = useControlPlaneV2Query(isOpen ? resourceName : undefined, isOpen ? namespace : undefined);

  // Preserve the last successfully loaded data across background re-fetches, Apollo query
  // restarts, and React StrictMode double-mounts so the wizard stays mounted and retains
  // its form state. The wizard's own `prefilledResourceRef` logic prevents stale data from
  // clobbering in-progress edits. Cleared on close so the next open re-seeds from live data.
  // Adjusted during render (not an effect) to avoid an extra render pass — mirrors the
  // pattern in ControlPlaneListAllWorkspaces.tsx.
  const [cachedData, setCachedData] = useState<ManagedControlPlaneV2 | undefined>(undefined);
  if (data && (data as ManagedControlPlaneV2) !== cachedData) setCachedData(data as ManagedControlPlaneV2);
  if (!isOpen && cachedData !== undefined) setCachedData(undefined);
  const stableData = data ? (data as ManagedControlPlaneV2) : cachedData;

  if (!isOpen) {
    return null;
  }

  if (error && !stableData) {
    return (
      <div className={styles.absolute} role="alert" aria-live="assertive">
        <p>{t('common.cannotLoadData')}</p>
        <Button onClick={() => setIsOpen(false)}>{t('buttons.close')}</Button>
      </div>
    );
  }

  if (!stableData) {
    return (
      <div className={styles.absolute}>
        <BusyIndicator active />
      </div>
    );
  }

  const { projectName, workspaceName } = parseNamespaceString(namespace ?? '');

  return (
    <CreateControlPlaneV2WizardContainer
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      projectName={projectName}
      workspaceName={workspaceName}
      isEditMode
      initialData={stableData}
      initialSection={initialSection}
    />
  );
};

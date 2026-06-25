import { BusyIndicator, Button } from '@ui5/webcomponents-react';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { NewControlPlane } from '../../../spaces/onboarding/types/ControlPlane.ts';
import { useControlPlaneQuery } from '../../../spaces/onboarding/hooks/useControlPlaneQuery.ts';
import { NewCreateWizardContainer, WizardStepType } from './NewCreateWizardContainer.tsx';
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

export const NewEditWizardDataLoader: FC<EditManagedControlPlaneV2WizardDataLoaderProps> = ({
  namespace,
  resourceName,
  isOpen,
  setIsOpen,
  initialSection,
}) => {
  const { t } = useTranslation();
  const { isPending, data, error } = useControlPlaneQuery(
    isOpen ? resourceName : undefined,
    isOpen ? namespace : undefined,
  );

  if (!isOpen) {
    return null;
  }

  if (error) {
    return (
      <div className={styles.absolute} role="alert" aria-live="assertive">
        <p>{t('common.cannotLoadData')}</p>
        <Button onClick={() => setIsOpen(false)}>{t('buttons.close')}</Button>
      </div>
    );
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
    <NewCreateWizardContainer
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      projectName={projectName}
      workspaceName={workspaceName}
      isEditMode
      initialData={data as NewControlPlane}
      initialSection={initialSection}
    />
  );
};

import { Button } from '@ui5/webcomponents-react';
import { FC, useState } from 'react';
import { YamlLoader } from './YamlLoader.tsx';
import { useTranslation } from 'react-i18next';
import styles from './YamlViewer.module.css';
import { YamlIcon } from './YamlIcon.tsx';
import { YamlViewDialog } from './YamlViewDialog.tsx';

export interface YamlViewButtonProps {
  workspaceName?: string;
  resourceType: 'projects' | 'workspaces' | 'managedcontrolplanes';
  resourceName: string;
}

export const YamlViewButtonWithLoader: FC<YamlViewButtonProps> = ({ workspaceName, resourceType, resourceName }) => {
  const [showOnlyImportantData, setShowOnlyImportantData] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  return (
    <span>
      <YamlViewDialog
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        dialogContent={
          <YamlLoader
            workspaceName={workspaceName}
            resourceName={resourceName}
            resourceType={resourceType}
            showOnlyImportantData={showOnlyImportantData}
            setShowOnlyImportantData={setShowOnlyImportantData}
          />
        }
        setShowOnlyImportantData={setShowOnlyImportantData}
        showOnlyImportantData={showOnlyImportantData}
      />

      <Button
        className={styles.button}
        design={'Transparent'}
        aria-label={t('buttons.viewResource')}
        title={t('buttons.viewResource')}
        onClick={() => {
          setIsOpen(true);
        }}
      >
        <YamlIcon />
      </Button>
    </span>
  );
};

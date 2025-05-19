import { Bar, Button, Dialog } from '@ui5/webcomponents-react';
import { FC, useState } from 'react';
import { YamlLoader } from './YamlLoader.tsx';
import { useTranslation } from 'react-i18next';
import styles from './YamlViewer.module.css';
import { YamlIcon } from './YamlIcon.tsx';

export type YamlViewButtonProps = {
  workspaceName?: string;
  resourceType: 'projects' | 'workspaces' | 'managedcontrolplanes';
  resourceName: string;
};

export const YamlViewButtonWithLoader: FC<YamlViewButtonProps> = ({
  workspaceName,
  resourceType,
  resourceName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  return (
    <span>
      <Dialog
        open={isOpen}
        stretch
        onClick={(e) => e.stopPropagation()}
        footer={
          <Bar
            design="Footer"
            endContent={
              <Button design="Emphasized" onClick={() => setIsOpen(false)}>
                {t('common.close')}
              </Button>
            }
          />
        }
        onClose={() => {
          setIsOpen(false);
        }}
      >
        {isOpen && (
          <YamlLoader
            workspaceName={workspaceName}
            resourceName={resourceName}
            resourceType={resourceType}
          />
        )}
      </Dialog>
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

import { Bar, Button, Dialog } from '@ui5/webcomponents-react';
import { FC, useState } from 'react';
import styles from './YamlViewer.module.css';
import { useTranslation } from 'react-i18next';
import YamlViewer from './YamlViewer.tsx';
import { stringify } from 'yaml';
import {
  removeManagedFieldsProperty,
  Resource,
} from '../../utils/removeManagedFieldsProperty.ts';
import { YamlIcon } from './YamlIcon.tsx';

export type YamlViewButtonProps = {
  resourceObject: unknown;
};

export const YamlViewButton: FC<YamlViewButtonProps> = ({ resourceObject }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const resource = resourceObject as Resource;
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
          <YamlViewer
            yamlString={stringify(removeManagedFieldsProperty(resource))}
            filename={`${resource.kind ?? ''}${resource.metadata.name ? '_' : ''}${resource.metadata.name ?? ''}`}
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

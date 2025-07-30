import { Button, Icon } from '@ui5/webcomponents-react';
import { FC, useMemo, useState } from 'react';
import styles from './YamlViewer.module.css';
import { useTranslation } from 'react-i18next';
import YamlViewer from './YamlViewer.tsx';
import { stringify } from 'yaml';
import { removeManagedFieldsProperty, Resource } from '../../utils/removeManagedFieldsProperty.ts';
import { YamlIcon } from './YamlIcon.tsx';
import { YamlViewDialog } from './YamlViewDialog.tsx';

export type YamlViewButtonProps = {
  resourceObject: unknown;
  smallerIcon?: boolean;
};

export const YamlViewButton: FC<YamlViewButtonProps> = ({ resourceObject, smallerIcon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const resource = resourceObject as Resource;
  const yamlString = useMemo(() => {
    return stringify(removeManagedFieldsProperty(resource));
  }, [resource]);
  return (
    <span>
      <YamlViewDialog
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        dialogContent={
          <YamlViewer
            yamlString={yamlString}
            filename={`${resource?.kind ?? ''}${resource?.metadata?.name ? '_' : ''}${resource?.metadata?.name ?? ''}`}
          />
        }
      />

      <Button
        className={smallerIcon ? styles.smallerIconButton : styles.button}
        design={'Transparent'}
        aria-label={t('buttons.viewResource')}
        title={t('buttons.viewResource')}
        onClick={() => {
          setIsOpen(true);
        }}
      >
        {smallerIcon ? <Icon name="document" className={styles.smallIcon} /> : <YamlIcon />}
      </Button>
    </span>
  );
};

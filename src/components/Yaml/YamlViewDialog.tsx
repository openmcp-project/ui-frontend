import { Bar, Button, CheckBox, CheckBoxDomRef, Dialog, Ui5CustomEvent } from '@ui5/webcomponents-react';

import { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './YamlViewer.module.css';

export type YamlViewDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  dialogContent: ReactNode;
  showOnlyImportantYamlProperties: boolean;
  setShowOnlyImportantYamlProperties?: (value: boolean) => void;
};

export const YamlViewDialog: FC<YamlViewDialogProps> = ({
  isOpen,
  setIsOpen,
  dialogContent,
  setShowOnlyImportantYamlProperties,
  showOnlyImportantYamlProperties,
}) => {
  const { t } = useTranslation();

  const handleWrapTextChange = (event: Ui5CustomEvent<CheckBoxDomRef, never>) => {
    console.log(event.target.checked);
    setShowOnlyImportantYamlProperties?.(event.target.checked);
  };
  return (
    <Dialog
      open={isOpen}
      stretch
      initialFocus="closeButton"
      footer={
        <Bar
          design="Footer"
          endContent={
            <Button id={'closeButton'} design="Emphasized" onClick={() => setIsOpen(false)}>
              {t('common.close')}
            </Button>
          }
          startContent={
            setShowOnlyImportantYamlProperties && (
              <CheckBox
                text={t('yaml.showOnlyImportant')}
                className={styles.checkbox}
                checked={showOnlyImportantYamlProperties}
                onChange={handleWrapTextChange}
              />
            )
          }
        />
      }
      onClick={(e) => e.stopPropagation()}
      onClose={() => {
        setIsOpen(false);
      }}
    >
      {isOpen && dialogContent}
    </Dialog>
  );
};

import { Bar, Button, CheckBox, Dialog } from '@ui5/webcomponents-react';

import { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export type YamlViewDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  dialogContent: ReactNode;
  showOnlyImportantData?: boolean;
  setShowOnlyImportantData?: (showOnlyImportantData: boolean) => void;
};

export const YamlViewDialog: FC<YamlViewDialogProps> = ({
  isOpen,
  setIsOpen,
  dialogContent,
  showOnlyImportantData,
  setShowOnlyImportantData,
}) => {
  const { t } = useTranslation();
  const handleShowOnlyImportantData = () => {
    setShowOnlyImportantData?.(!showOnlyImportantData);
  };
  return (
    <Dialog
      open={isOpen}
      stretch
      initialFocus={'closeButton'}
      footer={
        <Bar
          startContent={
            setShowOnlyImportantData && (
              <CheckBox
                text={t('yaml.showOnlyImportant')}
                checked={showOnlyImportantData}
                onChange={handleShowOnlyImportantData}
              />
            )
          }
          design="Footer"
          endContent={
            <Button design="Emphasized" id={'closeButton'} onClick={() => setIsOpen(false)}>
              {t('common.close')}
            </Button>
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

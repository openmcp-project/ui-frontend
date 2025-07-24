import { Bar, Button, Dialog } from '@ui5/webcomponents-react';

import { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export type YamlViewDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  dialogContent: ReactNode;
};

export const YamlViewDialog: FC<YamlViewDialogProps> = ({ isOpen, setIsOpen, dialogContent }) => {
  const { t } = useTranslation();
  return (
    <Dialog
      open={isOpen}
      stretch
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
      onClick={(e) => e.stopPropagation()}
      onClose={() => {
        setIsOpen(false);
      }}
    >
      {isOpen && dialogContent}
    </Dialog>
  );
};

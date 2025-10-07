import { FC, useState, useEffect } from 'react';
import {
  Button,
  CheckBox,
  Dialog,
  FlexBox,
  MessageStrip,
  Panel,
  InputDomRef,
  Ui5CustomEvent,
} from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import { ManagedResourceItem } from '../../lib/shared/types';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';
import { DeleteConfirmationForm } from './DeleteConfirmationForm.tsx';
import styles from './ManagedResourceDeleteDialog.module.css';

type Props = {
  open: boolean;
  onClose: () => void;
  item: ManagedResourceItem | null;
  onDeletionConfirmed?: (item: ManagedResourceItem, force: boolean) => void;
  onCanceled?: () => void;
};

export const ManagedResourceDeleteDialog: FC<Props> = ({ open, onClose, item, onDeletionConfirmed, onCanceled }) => {
  const { t } = useTranslation();
  const [forceDeletion, setForceDeletion] = useState(false);
  const [advancedCollapsed, setAdvancedCollapsed] = useState(true);
  const [confirmationText, setConfirmationText] = useState('');

  useEffect(() => {
    if (!open) {
      setForceDeletion(false);
      setAdvancedCollapsed(true);
      setConfirmationText('');
    }
  }, [open]);

  const resourceName = item?.metadata?.name ?? '';

  const onConfirmationInputChange = (event: Ui5CustomEvent<InputDomRef>) => {
    setConfirmationText(event.target.value);
  };

  const isConfirmed = confirmationText === resourceName;

  const handleForceDeletionChange = () => {
    setForceDeletion(!forceDeletion);
    if (!forceDeletion) setAdvancedCollapsed(false);
  };

  const handleDelete = () => {
    if (item && onDeletionConfirmed) {
      onDeletionConfirmed(item, forceDeletion);
    }
    onClose();
  };

  const handleCancel = () => {
    onClose();
    if (onCanceled) {
      onCanceled();
    }
  };

  return (
    <Dialog
      open={open}
      headerText={t('ManagedResources.deleteDialogTitle')}
      className={styles.dialog}
      onClose={handleCancel}
    >
      <FlexBox direction="Column" className={styles.content}>
        <DeleteConfirmationForm
          resourceName={resourceName}
          confirmationText={confirmationText}
          deleteMessageKey="DeleteConfirmationDialog.deleteMessage"
          deleteConfirmationLabel={t('DeleteConfirmationDialog.deleteConfirmation', { resourceName })}
          onConfirmationInputChange={onConfirmationInputChange}
        />

        <Panel
          headerText={t('ManagedResources.advancedOptions')}
          collapsed={advancedCollapsed}
          fixed={forceDeletion}
          onToggle={() => !forceDeletion && setAdvancedCollapsed((v) => !v)}
        >
          <FlexBox direction="Column" className={styles.advancedOptionsContent}>
            <CheckBox
              checked={forceDeletion}
              text={t('ManagedResources.forceDeletion')}
              onChange={handleForceDeletionChange}
            />
            <MessageStrip design="Critical" hideCloseButton>
              <span>{t('ManagedResources.forceWarningLine')}</span>
            </MessageStrip>
          </FlexBox>
        </Panel>

        <FlexBox justifyContent="End" className={styles.actions}>
          <Button design="Transparent" onClick={handleCancel}>
            {t('buttons.cancel')}
          </Button>
          <Button design={ButtonDesign.Negative} disabled={!isConfirmed} onClick={handleDelete}>
            {t('DeleteConfirmationDialog.deleteButton')}
          </Button>
        </FlexBox>
      </FlexBox>
    </Dialog>
  );
};

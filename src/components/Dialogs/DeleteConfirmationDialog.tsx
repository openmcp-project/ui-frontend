import { ReactNode, useState } from 'react';
import { Bar, Button, CheckBox, Dialog, InputDomRef, MessageStrip } from '@ui5/webcomponents-react';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';
import { useTranslation } from 'react-i18next';
import { KubectlInfoButton } from './KubectlCommandInfo/KubectlInfoButton.tsx';

import type { Ui5CustomEvent } from '@ui5/webcomponents-react-base';
import { DeleteConfirmationForm } from './DeleteConfirmationForm.tsx';
import { Reveal } from '../Ui/Reveal/Reveal.tsx';
import styles from './DeleteConfirmationDialog.module.css';

/**
 * Optional "force delete" escalation. When provided, the dialog offers an exceptional deletion path
 * (behind an extra acknowledgement) for resources whose regular deletion is stuck. The regular
 * deletion remains the primary action; force deletion must be explicitly opted into.
 */
interface ForceDeleteConfig {
  /** Invoked instead of `onDeletionConfirmed` once the user opts into and acknowledges force delete. */
  onForceDeletionConfirmed: () => Promise<void> | void;
}

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  resourceName: string;
  kubectlDialog?: (props: { isOpen: boolean; onClose: () => void }) => ReactNode;
  onDeletionConfirmed?: () => Promise<void> | void;
  onCanceled?: () => void;
  forceDelete?: ForceDeleteConfig;
}

export function DeleteConfirmationDialog({
  isOpen,
  setIsOpen,
  resourceName,
  onDeletionConfirmed,
  onCanceled,
  kubectlDialog,
  forceDelete,
}: DeleteConfirmationDialogProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const [isKubectlDialogOpen, setIsKubectlDialogOpen] = useState(false);
  // Exceptional path state. Both reset whenever the dialog closes (see resetState).
  const [forceDeleteSelected, setForceDeleteSelected] = useState(false);
  const [forceDeleteAcknowledged, setForceDeleteAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

  const onConfirmationInputChange = (event: Ui5CustomEvent<InputDomRef>) => {
    setConfirmationText(event.target.value);
  };

  const resetState = () => {
    setIsKubectlDialogOpen(false);
    setForceDeleteSelected(false);
    setForceDeleteAcknowledged(false);
    setConfirmationText('');
    setIsSubmitting(false);
  };

  const closeDialog = () => {
    setIsOpen(false);
    resetState();
  };

  const isNameConfirmed = confirmationText === resourceName;
  const isForceActive = !!forceDelete && forceDeleteSelected;
  // Force delete additionally requires the explicit acknowledgement of the risk.
  const isConfirmed = isNameConfirmed && (!isForceActive || forceDeleteAcknowledged);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      if (isForceActive) {
        await forceDelete.onForceDeletionConfirmed();
      } else {
        await onDeletionConfirmed?.();
      }
      closeDialog();
    } catch {
      // toast already shown by the hook; keep dialog open
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        className={styles.dialog}
        stretch={false}
        headerText={t('DeleteConfirmationDialog.header', { resourceName })}
        open={isOpen}
        footer={
          <Bar
            design="Footer"
            endContent={
              <>
                {kubectlDialog ? <KubectlInfoButton onClick={() => setIsKubectlDialogOpen(true)} /> : null}
                <Button
                  design={ButtonDesign.Transparent}
                  disabled={isSubmitting}
                  onClick={() => {
                    closeDialog();
                    onCanceled && onCanceled();
                  }}
                >
                  {t('DeleteConfirmationDialog.cancelButton')}
                </Button>
                <Button
                  design={ButtonDesign.Negative}
                  disabled={!isConfirmed || isSubmitting}
                  loading={isSubmitting}
                  onClick={handleConfirm}
                >
                  {isForceActive
                    ? t('DeleteConfirmationDialog.forceDeleteButton')
                    : t('DeleteConfirmationDialog.deleteButton')}
                </Button>
              </>
            }
          />
        }
      >
        <DeleteConfirmationForm
          resourceName={resourceName}
          confirmationText={confirmationText}
          deleteMessageKey="DeleteConfirmationDialog.deleteMessage"
          onConfirmationInputChange={onConfirmationInputChange}
        />

        {forceDelete ? (
          <div className={styles.forceDeleteSection}>
            <CheckBox
              data-testid="force-delete-toggle"
              checked={forceDeleteSelected}
              text={t('DeleteConfirmationDialog.forceDeleteToggle')}
              onChange={(event) => {
                const checked = event.target.checked;
                setForceDeleteSelected(checked);
                // Acknowledgement only matters while force delete is selected; clear it when toggled off.
                if (!checked) setForceDeleteAcknowledged(false);
              }}
            />
            <Reveal isVisible={forceDeleteSelected}>
              <div className={styles.forceDeleteDetails}>
                <MessageStrip data-testid="force-delete-warning" design="Negative" hideCloseButton>
                  <div className={styles.warningContent}>
                    <strong className={styles.warningTitle}>
                      {t('DeleteConfirmationDialog.forceDeleteWarningTitle')}
                    </strong>
                    <span className={styles.warningBody}>{t('DeleteConfirmationDialog.forceDeleteWarningBody')}</span>
                    <strong className={styles.warningCannotUndo}>
                      {t('DeleteConfirmationDialog.forceDeleteWarningCannotUndo')}
                    </strong>
                  </div>
                </MessageStrip>
                <CheckBox
                  data-testid="force-delete-acknowledge"
                  checked={forceDeleteAcknowledged}
                  text={t('DeleteConfirmationDialog.forceDeleteAcknowledge')}
                  onChange={(event) => setForceDeleteAcknowledged(event.target.checked)}
                />
              </div>
            </Reveal>
          </div>
        ) : null}
      </Dialog>
      {kubectlDialog
        ? kubectlDialog({
            isOpen: isKubectlDialogOpen,
            onClose: () => setIsKubectlDialogOpen(false),
          })
        : null}
    </>
  );
}

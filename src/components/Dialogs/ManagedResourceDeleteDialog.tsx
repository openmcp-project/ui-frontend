import { FC, useState, useMemo, useEffect } from 'react';
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
import { useApiResourceMutation } from '../../lib/api/useApiResource';
import {
  DeleteManagedResourceType,
  DeleteMCPManagedResource,
  PatchResourceForForceDeletion,
} from '../../lib/api/types/crate/deleteResource';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';
import { DeleteConfirmationForm } from './DeleteConfirmationForm.tsx';
import styles from './ManagedResourceDeleteDialog.module.css';
import { getPluralKind } from '../Helper/getPluralKind.ts';

type Props = {
  kindMapping: Record<string, string>;
  open: boolean;
  onClose: () => void;
  item: ManagedResourceItem | null;
  onDeleteStart: (item: ManagedResourceItem) => void;
};

export const ManagedResourceDeleteDialog: FC<Props> = ({ kindMapping, open, onClose, item, onDeleteStart }) => {
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

  const { apiVersion, resourceName, pluralKind } = useMemo(
    () => ({
      apiVersion: item?.apiVersion ?? '',
      resourceName: item?.metadata?.name ?? '',
      pluralKind: item ? getPluralKind(item, kindMapping) : '',
    }),
    [item, kindMapping],
  );

  const onConfirmationInputChange = (event: Ui5CustomEvent<InputDomRef>) => {
    setConfirmationText(event.target.value);
  };

  const isConfirmed = confirmationText === resourceName;

  const { trigger: deleteTrigger, isMutating: isMutatingDelete } = useApiResourceMutation<DeleteManagedResourceType>(
    DeleteMCPManagedResource(apiVersion, pluralKind, resourceName),
  );

  const { trigger: patchTrigger, isMutating: isMutatingPatch } = useApiResourceMutation<undefined>(
    PatchResourceForForceDeletion(apiVersion, pluralKind, resourceName),
  );

  const isMutating = isMutatingDelete || isMutatingPatch;

  const handleForceDeletionChange = () => {
    setForceDeletion(!forceDeletion);
    if (!forceDeletion) setAdvancedCollapsed(false);
  };

  const handleDelete = async () => {
    if (!item) return;

    onDeleteStart(item);

    try {
      await deleteTrigger({ data: { force: forceDeletion } });

      if (forceDeletion) {
        await patchTrigger({ data: { force: forceDeletion } });
      }
    } catch (_) {
      // Ignore errors - item can be deleted before patch and it's ok.
    }

    onClose();
  };

  return (
    <Dialog
      open={open}
      headerText={t('ManagedResources.deleteDialogTitle')}
      className={styles.dialog}
      onClose={onClose}
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
            <CheckBox checked={forceDeletion} text={t('ManagedResources.forceDeletion')} onChange={handleForceDeletionChange} />
            <MessageStrip design="Critical" hideCloseButton>
              <span>{t('ManagedResources.forceWarningLine')}</span>
            </MessageStrip>
          </FlexBox>
        </Panel>

        <FlexBox justifyContent="End" className={styles.actions}>
          <Button design="Transparent" disabled={isMutating} onClick={onClose}>
            {t('buttons.cancel')}
          </Button>
          <Button design={ButtonDesign.Negative} disabled={isMutating || !isConfirmed} onClick={handleDelete}>
            {t('DeleteConfirmationDialog.deleteButton')}
          </Button>
        </FlexBox>
      </FlexBox>
    </Dialog>
  );
};

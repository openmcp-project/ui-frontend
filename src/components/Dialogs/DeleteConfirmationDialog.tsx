import { useEffect, useRef, useState } from 'react';
import {
  Bar,
  Button,
  Dialog,
  Form,
  FormGroup,
  FormItem,
  Input,
  InputDomRef,
  Label,
} from '@ui5/webcomponents-react';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';
import { useTranslation } from 'react-i18next';
import { KubectlDeleteWorkspace } from './KubectlCommandInfo/Controllers/KubectlDeleteWorkspace';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  resourceName: string;
  projectName?: string;
  onDeletionConfirmed?: () => void;
  onCanceled?: () => void;
}

export function DeleteConfirmationDialog({
  isOpen,
  setIsOpen,
  resourceName,
  projectName,
  onDeletionConfirmed,
  onCanceled,
}: DeleteConfirmationDialogProps) {
  const [confirmed, setConfirmed] = useState(false);
  const confirmationInput = useRef<InputDomRef>(null);
  const { t } = useTranslation();

  useEffect(() => {
    return () => {
      setConfirmed(false);
      if (confirmationInput.current) {
        confirmationInput.current.value = '';
      }
    };
  }, [isOpen]);

  const onConfirmationInputChange = (event: any) => {
    if (event.target.value === resourceName) {
      setConfirmed(true);
    } else {
      setConfirmed(false);
    }
  };

  return (
    <>
      <Dialog
        stretch={false}
        headerText="Confirm deletion"
        open={isOpen}
        footer={
          <Bar
            design="Footer"
            endContent={
              <>
                <Button
                  design={ButtonDesign.Transparent}
                  onClick={() => {
                    setIsOpen(false);
                    onCanceled && onCanceled();
                  }}
                >
                  {t('DeleteConfirmationDialog.cancelButton')}
                </Button>
                <Button
                  design={ButtonDesign.Negative}
                  disabled={confirmed === false}
                  onClick={() => {
                    setIsOpen(false);
                    onDeletionConfirmed && onDeletionConfirmed();
                  }}
                >
                  {t('DeleteConfirmationDialog.deleteButton')}
                </Button>
              </>
            }
          />
        }
      >
        <Form layout="S1 M1 L1 XL1">
          <FormGroup>
            <Label>
              {t('DeleteConfirmationDialog.deleteMessage')} {resourceName}.
            </Label>
            <Label>
              {' '}
              {t('DeleteConfirmationDialog.deleteMessageType')}{' '}
              <b>{resourceName}</b>{' '}
              {t('DeleteConfirmationDialog.deleteMessageConfirm')}
            </Label>
          </FormGroup>
          <FormGroup>
            <FormItem
              labelContent={
                <Label>
                  {t('DeleteConfirmationDialog.deleteMessageType')}{' '}
                  {resourceName}{' '}
                  {t('DeleteConfirmationDialog.deleteMessageConfirm')}
                </Label>
              }
            >
              <Input
                ref={confirmationInput}
                id="mcp-name-input"
                placeholder=""
                onInput={onConfirmationInputChange}
              />
            </FormItem>
            <FormItem>
              <KubectlDeleteWorkspace
                projectName={projectName}
                resourceName={resourceName}
              />
            </FormItem>
          </FormGroup>
        </Form>
      </Dialog>
    </>
  );
}

import {
  Bar,
  Button,
  Dialog,
  Form,
  FormGroup,
  FormItem,
  Input,
  Label,
  Ui5CustomEvent,
  Wizard,
  WizardDomRef,
  WizardStep,
} from '@ui5/webcomponents-react';

import styles from './ModifyGitRepositoryDialog.module.css';
import { ModifyGitRepositoryDialogStep1 } from './ModifyGitRepositoryDialogStep1.tsx';
import { ModifyGitRepositoryDialogStep2 } from './ModifyGitRepositoryDialogStep2.tsx';
import { useCallback, useState } from 'react';
import type { WizardStepChangeEventDetail } from '@ui5/webcomponents-fiori/Wizard';
import { useSplitter } from '../../../spaces/mcp/pages/SplitterContext.tsx';

export interface ModifyGitRepositoryDialogProps {
  isOpen: boolean;
  close: () => void;
}

export function ModifyGitRepositoryDialog({ isOpen, close }: ModifyGitRepositoryDialogProps) {
  const [step, setStep] = useState(1);

  const handleStepChange = useCallback((e: Ui5CustomEvent<WizardDomRef, WizardStepChangeEventDetail>) => {
    setStep(Number(e.detail.step.dataset.step));
  }, []);

  const isBackVisible = step > 1;
  const isNextVisible = step < 3;
  const isCreateVisible = step === 3;

  const splitter = useSplitter();

  return (
    <Dialog
      style={{ width: '50rem', height: '50rem' }}
      open={isOpen}
      headerText="Create GitRepository"
      footer={
        <Bar
          design="Footer"
          className={styles.footer}
          endContent={
            <>
              {isBackVisible ? <Button onClick={() => setStep((step) => step - 1)}>Back</Button> : null}
              {isCreateVisible ? (
                <Button design="Emphasized" onClick={() => alert('Todo Creating…')}>
                  Create
                </Button>
              ) : null}
              {isNextVisible ? (
                <Button design="Emphasized" onClick={() => setStep((step) => step + 1)}>
                  Next
                </Button>
              ) : null}
              <Button design="Transparent" onClick={close}>
                Cancel
              </Button>
            </>
          }
        />
      }
      onClose={close}
    >
      <Wizard className={styles.wizard} contentLayout="SingleStep" onStepChange={handleStepChange}>
        <WizardStep className={styles.wizardStep} selected={step === 1} data-step={1} titleText="Start">
          <p>This wizard will guide you through the creation of a GitRepository resource.</p>
          <p>You will need the following information:</p>
          <ul>
            <li>Branch in a Git Repository</li>
            <li>For private repositories a SecretRef</li>
          </ul>
        </WizardStep>
        <WizardStep className={styles.wizardStep} selected={step === 2} data-step={2} titleText="Details">
          <ModifyGitRepositoryDialogStep1 />
        </WizardStep>
        <WizardStep selected={step === 3} data-step={3} titleText="Summary (YAML)">
          <ModifyGitRepositoryDialogStep2 />
        </WizardStep>
      </Wizard>
    </Dialog>
  );
}

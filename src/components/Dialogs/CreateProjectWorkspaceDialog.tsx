import {
  Bar,
  Button,
  Dialog,
  FormGroup,
  SplitterElement,
  SplitterLayout,
  Wizard,
  WizardStep,
} from '@ui5/webcomponents-react';
import type { WizardStepChangeEventDetail } from '@ui5/webcomponents-fiori/dist/Wizard.js';

import { Member } from '../../lib/api/types/shared/members';
import { ErrorDialog, ErrorDialogHandle } from '../Shared/ErrorMessageBox.tsx';

import { FormEvent, Suspense, lazy, useState } from 'react';

import { EditMembers } from '../Members/EditMembers.tsx';

import { useTranslation } from 'react-i18next';

import { CreateDialogProps } from './CreateWorkspaceDialogContainer.tsx';
import { FieldErrors, UseFormWatch, UseFormRegister, UseFormSetValue, UseFormHandleSubmit } from 'react-hook-form';
import { MetadataForm } from './MetadataForm.tsx';
import { useYamlPreview } from '../../hooks/useYamlPreview.ts';
import { projectnameToNamespace } from '../../utils/index.ts';

const YamlViewer = lazy(() => import('../Yaml/YamlViewer.tsx').then((m) => ({ default: m.YamlViewer })));

export type OnCreatePayload = {
  name: string;
  displayName?: string;
  chargingTarget?: string;
  chargingTargetType?: string;
  members: Member[];
};

export interface CreateProjectWorkspaceDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  titleText: string;
  onCreate: (e?: FormEvent<HTMLFormElement> | undefined) => void;
  errorDialogRef: React.RefObject<ErrorDialogHandle | null>;
  members: Member[];
  register: UseFormRegister<CreateDialogProps>;
  errors: FieldErrors<CreateDialogProps>;
  setValue: UseFormSetValue<CreateDialogProps>;
  handleSubmit: UseFormHandleSubmit<CreateDialogProps>;
  projectName?: string;
  type: 'workspace' | 'project' | 'mcp';
  watch: UseFormWatch<CreateDialogProps>;
  isMetadataValid: boolean;
}

type Step = 'metadata' | 'members';

export function CreateProjectWorkspaceDialog({
  isOpen,
  setIsOpen,
  titleText,
  onCreate,
  errorDialogRef,
  members,
  register,
  errors,
  setValue,
  handleSubmit,
  projectName,
  type,
  watch,
  isMetadataValid,
}: CreateProjectWorkspaceDialogProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('metadata');

  const setMembers = (members: Member[]) => setValue('members', members);

  const projectNamespace = projectName ? projectnameToNamespace(projectName) : undefined;
  const yamlString = useYamlPreview(watch, type === 'mcp' ? 'project' : type, projectNamespace);
  const resourceName = watch('name') || 'new';

  const handleStepChange = (e: { detail: WizardStepChangeEventDetail }) => {
    setStep((e.detail.step.dataset.step ?? 'metadata') as Step);
  };

  const onClose = () => {
    setStep('metadata');
    setIsOpen(false);
  };

  const goToMembers = () => handleSubmit(() => setStep('members'))();

  return (
    <>
      <Dialog
        stretch
        headerText={titleText}
        open={isOpen}
        initialFocus="project-name-input"
        footer={
          <Bar
            design="Footer"
            endContent={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Button design="Transparent" onClick={onClose}>
                  {t('CreateProjectWorkspaceDialog.cancelButton')}
                </Button>
                {step === 'metadata' ? (
                  <Button design="Emphasized" disabled={!isMetadataValid} onClick={goToMembers}>
                    {t('buttons.next')}
                  </Button>
                ) : (
                  <>
                    <Button onClick={() => setStep('metadata')}>{t('buttons.back')}</Button>
                    <Button design="Emphasized" onClick={() => onCreate()}>
                      {t('CreateProjectWorkspaceDialog.createButton')}
                    </Button>
                  </>
                )}
              </div>
            }
          />
        }
        onClose={onClose}
      >
        <SplitterLayout style={{ height: '100%' }}>
          <SplitterElement size="50%">
            <Wizard contentLayout="SingleStep" style={{ height: '100%' }} onStepChange={handleStepChange}>
              <WizardStep
                data-step="metadata"
                icon="create-form"
                selected={step === 'metadata'}
                titleText={t('CreateProjectWorkspaceDialog.metadataHeader')}
              >
                <MetadataForm
                  errors={errors}
                  register={register}
                  requireChargingTarget={type === 'project'}
                  setValue={setValue}
                  watch={watch}
                />
              </WizardStep>
              <WizardStep
                data-step="members"
                disabled={!isMetadataValid}
                icon="user-edit"
                selected={step === 'members'}
                titleText={t('CreateProjectWorkspaceDialog.membersHeader')}
              >
                <FormGroup>
                  <EditMembers
                    isValidationError={!!errors.members}
                    members={members}
                    projectName={projectName}
                    type={type}
                    onMemberChanged={setMembers}
                  />
                </FormGroup>
              </WizardStep>
            </Wizard>
          </SplitterElement>

          <SplitterElement size="50%" style={{ overflow: 'hidden' }}>
            <Suspense fallback={null}>
              <YamlViewer filename={`${type}-${resourceName}`} isEdit={false} yamlString={yamlString} />
            </Suspense>
          </SplitterElement>
        </SplitterLayout>
      </Dialog>
      <ErrorDialog ref={errorDialogRef} />
    </>
  );
}

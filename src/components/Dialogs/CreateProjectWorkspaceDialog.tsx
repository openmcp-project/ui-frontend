import type { WizardStepChangeEventDetail } from '@ui5/webcomponents-fiori/dist/Wizard.js';
import {
  Bar,
  BusyIndicator,
  Button,
  Dialog,
  FormGroup,
  SplitterElement,
  SplitterLayout,
  Wizard,
  WizardStep,
} from '@ui5/webcomponents-react';

import '@ui5/webcomponents-icons/dist/decline';
import '@ui5/webcomponents-icons/dist/save';
import '@ui5/webcomponents-icons/dist/navigation-right-arrow';
import '@ui5/webcomponents-icons/dist/navigation-left-arrow';
import '@ui5/webcomponents-icons/dist/add';

import { Member } from '../../lib/api/types/shared/members';
import { ErrorDialog, ErrorDialogHandle } from '../Shared/ErrorMessageBox.tsx';

import { FormEvent, Suspense, lazy, useState } from 'react';

import { EditMembers } from '../Members/EditMembers.tsx';

import { useTranslation } from 'react-i18next';

import { FieldErrors, UseFormHandleSubmit, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { useYamlPreview } from '../../hooks/useYamlPreview.ts';
import { projectnameToNamespace } from '../../utils/index.ts';
import { CreateDialogProps } from './CreateWorkspaceDialogContainer.tsx';
import { MetadataForm } from './MetadataForm.tsx';
import { SupportInfoForm } from './SupportInfoForm.tsx';

const YamlViewer = lazy(() => import('../Yaml/YamlViewer.tsx').then((m) => ({ default: m.YamlViewer })));

export type OnCreatePayload = Omit<CreateDialogProps, 'componentsList'>;

interface FormHandles {
  register: UseFormRegister<CreateDialogProps>;
  errors: FieldErrors<CreateDialogProps>;
  setValue: UseFormSetValue<CreateDialogProps>;
  watch: UseFormWatch<CreateDialogProps>;
  handleSubmit?: UseFormHandleSubmit<CreateDialogProps>;
}

export interface CreateProjectWorkspaceDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  titleText: string;
  onCreate: (e?: FormEvent<HTMLFormElement> | undefined) => void;
  errorDialogRef: React.RefObject<ErrorDialogHandle | null>;
  members: Member[];
  form: FormHandles;
  projectName?: string;
  type: 'workspace' | 'project';
  isMetadataValid?: boolean;
  isLoading?: boolean;
  isEditMode?: boolean;
  initialStep?: Step;
}

export type Step = 'metadata' | 'members' | 'supportInfo';

export function CreateProjectWorkspaceDialog({
  isOpen,
  setIsOpen,
  titleText,
  onCreate,
  errorDialogRef,
  members,
  form: { register, errors, setValue, watch, handleSubmit },
  projectName,
  type,
  isMetadataValid = true,
  isLoading = false,
  isEditMode = false,
  initialStep = 'metadata',
}: CreateProjectWorkspaceDialogProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>(initialStep);

  const canSave = isMetadataValid && members.length > 0;

  const setMembers = (members: Member[]) => setValue('members', members);

  const projectNamespace = projectName ? projectnameToNamespace(projectName) : undefined;
  const [
    name = '',
    displayName = '',
    chargingTarget = '',
    chargingTargetType = '',
    supportLandscape = '',
    supportServiceIds = '',
    supportSecurityContacts = '',
    supportOpsContacts = '',
  ] = watch([
    'name',
    'displayName',
    'chargingTarget',
    'chargingTargetType',
    'supportLandscape',
    'supportServiceIds',
    'supportSecurityContacts',
    'supportOpsContacts',
  ]);
  const yamlString = useYamlPreview(
    {
      name,
      displayName,
      chargingTarget,
      chargingTargetType,
      members,
      supportLandscape,
      supportServiceIds,
      supportSecurityContacts,
      supportOpsContacts,
    },
    type,
    projectNamespace,
  );
  const resourceName = name || 'new';

  const handleStepChange = (e: { detail: WizardStepChangeEventDetail }) => {
    setStep((e.detail.step.dataset.step ?? 'metadata') as Step);
  };

  const onClose = () => {
    setStep(initialStep);
    setIsOpen(false);
  };

  const goToMembers = () => handleSubmit?.(() => setStep('members'))();

  return (
    <>
      <Dialog
        stretch
        headerText={titleText}
        open={isOpen}
        initialFocus="name"
        footer={
          <Bar
            design="Footer"
            endContent={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Button design="Transparent" icon="decline" onClick={onClose}>
                  {t('CreateProjectWorkspaceDialog.cancelButton')}
                </Button>
                {isEditMode ? (
                  <>
                    <BusyIndicator active={isLoading} size="S" />
                    <Button design="Emphasized" icon="save" disabled={isLoading || !canSave} onClick={() => onCreate()}>
                      {t('CreateProjectWorkspaceDialog.saveButton')}
                    </Button>
                  </>
                ) : step === 'metadata' ? (
                  <Button
                    design="Emphasized"
                    endIcon="navigation-right-arrow"
                    disabled={!isMetadataValid}
                    onClick={goToMembers}
                  >
                    {t('buttons.next')}
                  </Button>
                ) : step === 'members' ? (
                  <>
                    <Button icon="navigation-left-arrow" onClick={() => setStep('metadata')}>
                      {t('buttons.back')}
                    </Button>
                    {type === 'project' ? (
                      <Button
                        design="Emphasized"
                        endIcon="navigation-right-arrow"
                        disabled={members.length === 0}
                        onClick={() => setStep('supportInfo')}
                      >
                        {t('buttons.next')}
                      </Button>
                    ) : (
                      <>
                        <BusyIndicator active={isLoading} size="S" />
                        <Button design="Emphasized" icon="add" disabled={isLoading} onClick={() => onCreate()}>
                          {t('CreateProjectWorkspaceDialog.createButton')}
                        </Button>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Button icon="navigation-left-arrow" onClick={() => setStep('members')}>
                      {t('buttons.back')}
                    </Button>
                    <BusyIndicator active={isLoading} size="S" />
                    <Button design="Emphasized" icon="add" disabled={isLoading} onClick={() => onCreate()}>
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
                  isEditMode={isEditMode}
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
              {type === 'project' && (
                <WizardStep
                  data-step="supportInfo"
                  disabled={!canSave}
                  icon="activities"
                  selected={step === 'supportInfo'}
                  titleText={t('SupportInfo.wizardStepTitle')}
                >
                  <SupportInfoForm register={register} watch={watch} setValue={setValue} />
                </WizardStep>
              )}
            </Wizard>
          </SplitterElement>

          <SplitterElement size="50%" style={{ overflow: 'hidden' }}>
            <Suspense fallback={<BusyIndicator active size="M" style={{ margin: 'auto' }} />}>
              <YamlViewer filename={`${type}-${resourceName}`} isEdit={false} yamlString={yamlString} />
            </Suspense>
          </SplitterElement>
        </SplitterLayout>
      </Dialog>
      <ErrorDialog ref={errorDialogRef} />
    </>
  );
}

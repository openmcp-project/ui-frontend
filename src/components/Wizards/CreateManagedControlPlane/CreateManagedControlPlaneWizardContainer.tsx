import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import IllustrationMessageType from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageType.js';

import type { WizardStepChangeEventDetail } from '@ui5/webcomponents-fiori/dist/Wizard.js';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import {
  Bar,
  Button,
  Dialog,
  Form,
  FormGroup,
  Ui5CustomEvent,
  Wizard,
  WizardDomRef,
  WizardStep,
} from '@ui5/webcomponents-react';

import { SummarizeStep } from './SummarizeStep.tsx';
import { useTranslation } from 'react-i18next';
import { useAuthOnboarding } from '../../../spaces/onboarding/auth/AuthContextOnboarding.tsx';
import { ErrorDialog, ErrorDialogHandle } from '../../Shared/ErrorMessageBox.tsx';
import { CreateDialogProps } from '../../Dialogs/CreateWorkspaceDialogContainer.tsx';
import { createManagedControlPlaneSchema } from '../../../lib/api/validations/schemas.ts';
import { Member, MemberRoles } from '../../../lib/api/types/shared/members.ts';
import { useApiResourceMutation } from '../../../lib/api/useApiResource.ts';
import {
  ComponentsListItem,
  CreateManagedControlPlane,
  CreateManagedControlPlaneResource,
  CreateManagedControlPlaneType,
} from '../../../lib/api/types/crate/createManagedControlPlane.ts';
import { OnCreatePayload } from '../../Dialogs/CreateProjectWorkspaceDialog.tsx';
import { idpPrefix } from '../../../utils/idpPrefix.ts';
import { APIError } from '../../../lib/api/error.ts';
import { MetadataForm } from '../../Dialogs/MetadataForm.tsx';
import { EditMembers } from '../../Members/EditMembers.tsx';
import { ComponentsSelectionContainer } from '../../ComponentsSelection/ComponentsSelectionContainer.tsx';
import { IllustratedBanner } from '../../Ui/IllustratedBanner/IllustratedBanner.tsx';

type CreateManagedControlPlaneWizardContainerProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  projectName?: string;
  workspaceName?: string;
};

type WizardStepType = 'metadata' | 'members' | 'componentSelection' | 'summarize' | 'success';

const wizardStepOrder: WizardStepType[] = ['metadata', 'members', 'componentSelection', 'summarize', 'success'];

export const CreateManagedControlPlaneWizardContainer: FC<CreateManagedControlPlaneWizardContainerProps> = ({
  isOpen,
  setIsOpen,
  projectName = '',
  workspaceName = '',
}) => {
  const { t } = useTranslation();
  const { user } = useAuthOnboarding();
  const errorDialogRef = useRef<ErrorDialogHandle>(null);

  const [selectedStep, setSelectedStep] = useState<WizardStepType>('metadata');
  const validationSchemaCreateManagedControlPlane = useMemo(() => createManagedControlPlaneSchema(t), [t]);

  const {
    register,
    handleSubmit,
    resetField,
    setValue,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<CreateDialogProps>({
    resolver: zodResolver(validationSchemaCreateManagedControlPlane),
    defaultValues: {
      name: '',
      displayName: '',
      chargingTarget: '',
      chargingTargetType: '',
      members: [],
      componentsList: [],
    },
    mode: 'onChange',
  });

  const nextButtonText = useMemo(
    () => ({
      metadata: t('buttons.next'),
      members: t('buttons.next'),
      componentSelection: t('buttons.next'),
      summarize: t('buttons.create'),
      success: t('buttons.close'),
    }),
    [t],
  );

  const resetFormAndClose = useCallback(() => {
    reset();
    setSelectedStep('metadata');
    setIsOpen(false);
  }, [reset, setIsOpen]);

  const clearFormFields = useCallback(() => {
    resetField('name');
    resetField('chargingTarget');
    resetField('chargingTargetType');
    resetField('displayName');
  }, [resetField]);

  useEffect(() => {
    if (user?.email && isOpen) {
      setValue('members', [{ name: user.email, role: MemberRoles.admin, kind: 'User' }]);
    }
    if (!isOpen) {
      clearFormFields();
    }
  }, [user?.email, isOpen, setValue, clearFormFields]);

  const { trigger } = useApiResourceMutation<CreateManagedControlPlaneType>(
    CreateManagedControlPlaneResource(projectName, workspaceName),
  );
  const componentsList = watch('componentsList');

  const handleCreateManagedControlPlane = useCallback(
    async ({ name, displayName, chargingTarget, members, chargingTargetType }: OnCreatePayload): Promise<boolean> => {
      try {
        await trigger(
          CreateManagedControlPlane(
            name,
            `${projectName}--ws-${workspaceName}`,
            {
              displayName,
              chargingTarget,
              chargingTargetType,
              members,
              componentsList,
            },
            idpPrefix,
          ),
        );
        setSelectedStep('success');
        return true;
      } catch (e) {
        if (e instanceof APIError && errorDialogRef.current) {
          errorDialogRef.current.showErrorDialog(`${e.message}: ${JSON.stringify(e.info)}`);
        } else {
          console.error(e);
        }
        return false;
      }
    },
    [trigger, projectName, workspaceName, componentsList],
  );

  const handleStepChange = useCallback((e: Ui5CustomEvent<WizardDomRef, WizardStepChangeEventDetail>) => {
    const step = (e.detail.step.dataset.step ?? '') as WizardStepType;
    setSelectedStep(step);
  }, []);

  const onNextClick = useCallback(() => {
    switch (selectedStep) {
      case 'metadata':
        handleSubmit(() => setSelectedStep('members'))();
        break;
      case 'members':
        setSelectedStep('componentSelection');
        break;
      case 'componentSelection':
        setSelectedStep('summarize');
        break;
      case 'summarize':
        handleCreateManagedControlPlane(watch());
        break;
      case 'success':
        resetFormAndClose();
        break;
      default:
        break;
    }
  }, [selectedStep, handleSubmit, setSelectedStep, handleCreateManagedControlPlane, watch, resetFormAndClose]);

  const setMembers = useCallback(
    (members: Member[]) => {
      setValue('members', members, { shouldValidate: true });
    },
    [setValue],
  );

  const setComponentsList = useCallback(
    (components: ComponentsListItem[]) => {
      setValue('componentsList', components, { shouldValidate: false });
    },
    [setValue],
  );

  const isStepDisabled = useCallback(
    (step: WizardStepType) => {
      switch (step) {
        case 'metadata':
          return false;
        case 'members':
          return selectedStep === 'metadata' || !isValid;
        case 'componentSelection':
          return selectedStep === 'metadata' || selectedStep === 'members' || !isValid;
        case 'summarize':
          return (
            selectedStep === 'metadata' ||
            selectedStep === 'members' ||
            selectedStep === 'componentSelection' ||
            !isValid
          );

        case 'success':
          return selectedStep !== 'success';
        default:
          return false;
      }
    },
    [selectedStep, isValid],
  );

  const onBackClick = useCallback(() => {
    const currentIndex = wizardStepOrder.indexOf(selectedStep);
    if (currentIndex > 0) {
      setSelectedStep(wizardStepOrder[currentIndex - 1]);
    }
  }, [selectedStep]);

  if (!isOpen) return null;

  return (
    <Dialog
      stretch
      headerText={t('createMCP.dialogTitle') || 'Create Managed Control Plane'}
      open={isOpen}
      initialFocus="project-name-input"
      footer={
        <Bar
          design="Footer"
          endContent={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {selectedStep !== 'success' &&
                (selectedStep === 'metadata' ? (
                  <Button onClick={resetFormAndClose}>{t('buttons.close')}</Button>
                ) : (
                  <Button onClick={onBackClick}>{t('buttons.back')}</Button>
                ))}
              <Button design="Emphasized" onClick={onNextClick}>
                {nextButtonText[selectedStep]}
              </Button>
            </div>
          }
        />
      }
      data-testid="create-mcp-dialog"
      onClose={resetFormAndClose}
    >
      <ErrorDialog ref={errorDialogRef} />
      <Wizard contentLayout="SingleStep" onStepChange={handleStepChange}>
        <WizardStep
          icon="create-form"
          titleText={t('common.metadata')}
          disabled={isStepDisabled('metadata')}
          selected={selectedStep === 'metadata'}
          data-step="metadata"
        >
          <MetadataForm watch={watch} setValue={setValue} register={register} errors={errors} />
        </WizardStep>
        <WizardStep
          icon="user-edit"
          titleText={t('common.members')}
          selected={selectedStep === 'members'}
          data-step="members"
          disabled={isStepDisabled('members')}
        >
          <Form>
            <FormGroup headerText={t('CreateProjectWorkspaceDialog.membersHeader')}>
              <EditMembers
                members={watch('members')}
                isValidationError={!!errors.members}
                requireAtLeastOneMember={false}
                onMemberChanged={setMembers}
              />
            </FormGroup>
          </Form>
        </WizardStep>
        <WizardStep
          icon="add-product"
          titleText={t('common.componentSelection')}
          selected={selectedStep === 'componentSelection'}
          data-step="componentSelection"
          disabled={isStepDisabled('componentSelection')}
        >
          <ComponentsSelectionContainer componentsList={componentsList ?? []} setComponentsList={setComponentsList} />
        </WizardStep>
        <WizardStep
          icon="activities"
          titleText={t('common.summarize')}
          disabled={isStepDisabled('summarize')}
          selected={selectedStep === 'summarize'}
          data-step="summarize"
        >
          <SummarizeStep
            watch={watch}
            workspaceName={workspaceName}
            projectName={projectName}
            componentsList={componentsList}
          />
        </WizardStep>
        <WizardStep
          icon="activities"
          titleText={t('common.success')}
          disabled={isStepDisabled('success')}
          selected={selectedStep === 'success'}
          data-step="success"
        >
          <IllustratedBanner
            illustrationName={IllustrationMessageType.SuccessScreen}
            title={t('createMCP.titleText')}
            subtitle={t('createMCP.subtitleText')}
          />
        </WizardStep>
      </Wizard>
    </Dialog>
  );
};

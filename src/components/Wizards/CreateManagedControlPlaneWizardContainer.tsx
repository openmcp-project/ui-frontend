import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApiResourceMutation } from '../../lib/api/useApiResource';
import IllustrationMessageType from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageType.js';
import { useAuth } from '../../spaces/onboarding/auth/AuthContext.tsx';
import { Member, MemberRoles } from '../../lib/api/types/shared/members.ts';
import type { WizardStepChangeEventDetail } from '@ui5/webcomponents-fiori/dist/Wizard.js';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { validationSchemaCreateManagedControlPlane } from '../../lib/api/validations/schemas.ts';
import { OnCreatePayload } from '../Dialogs/CreateProjectWorkspaceDialog.tsx';
import {
  Bar,
  Button,
  Dialog,
  Form,
  FormGroup,
  Grid,
  List,
  ListItemStandard,
  Ui5CustomEvent,
  Wizard,
  WizardDomRef,
  WizardStep,
} from '@ui5/webcomponents-react';
import YamlViewer from '../Yaml/YamlViewer.tsx';
import { stringify } from 'yaml';
import { APIError } from '../../lib/api/error.ts';
import {
  CreateManagedControlPlane,
  CreateManagedControlPlaneResource,
  CreateManagedControlPlaneType,
} from '../../lib/api/types/crate/createManagedControlPlane.ts';
import { ErrorDialog, ErrorDialogHandle } from '../Shared/ErrorMessageBox.tsx';

import { EditMembers } from '../Members/EditMembers.tsx';
import { useTranslation } from 'react-i18next';
import { MetadataForm } from '../Dialogs/MetadataForm.tsx';
import { IllustratedBanner } from '../Ui/IllustratedBanner/IllustratedBanner.tsx';
import {
  ComponentItem,
  ComponentsSelection,
} from '../ComponentsSelection/ComponentsSelection.tsx';

export type CreateDialogProps = {
  name: string;
  displayName?: string;
  chargingTarget?: string;
  members: Member[];
};

type CreateManagedControlPlaneWizardContainerProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  projectName?: string;
  workspaceName?: string;
};

type WizardStepType =
  | 'metadata'
  | 'members'
  | 'componentSelection'
  | 'summarize'
  | 'success';

const wizardStepOrder: WizardStepType[] = [
  'metadata',
  'members',
  'componentSelection',
  'summarize',
  'success',
];

const mockedItems: ComponentItem[] = [
  { name: 'cert-manager', versions: ['1.13.1', '1.16.1'] },
  {
    name: 'crossplane',
    versions: [
      '1.15.0',
      '1.15.5',
      '1.16.0',
      '1.16.1',
      '1.16.2',
      '1.17.0',
      '1.17.1',
      '1.17.2',
      '1.17.3',
      '1.18.0',
      '1.18.1',
      '1.18.2',
      '1.18.3',
      '1.19.0',
    ],
  },
  {
    name: 'external-secrets',
    versions: [
      '0.10.7',
      '0.11.0',
      '0.12.1',
      '0.13.0',
      '0.14.4',
      '0.15.1',
      '0.16.2',
      '0.17.0',
      '0.8.0',
    ],
  },
  { name: 'flux', versions: ['2.12.4', '2.13.0', '2.14.0', '2.15.0'] },
  { name: 'kyverno', versions: ['3.2.4'] },
  { name: 'provider-argocd', versions: ['0.8.0', '0.8.1', '0.9.0', '0.9.1'] },
  { name: 'provider-avs', versions: ['0.1.1', '0.2.0', '0.3.0'] },
  {
    name: 'provider-btp',
    versions: ['1.0.0', '1.0.1', '1.0.2', '1.0.3', '1.1.0', '1.1.1', '1.1.2'],
  },
  { name: 'provider-btp-account', versions: ['0.7.5', '0.7.6'] },
  { name: 'provider-cloudfoundry', versions: ['2.2.3', '2.2.4', '2.2.5'] },
  { name: 'provider-cloudfoundry-opensource', versions: ['0.3.0'] },
  { name: 'provider-destinations', versions: ['1.0.3'] },
  { name: 'provider-dynatrace', versions: ['1.1.2', '1.1.3'] },
  { name: 'provider-gardener-auth', versions: ['0.0.4', '0.0.6'] },
  { name: 'provider-hana', versions: ['0.1.0'] },
  { name: 'provider-helm', versions: ['0.19.0'] },
  {
    name: 'provider-hyperscaler',
    versions: ['0.0.1', '0.0.2', '0.0.3', '0.0.4'],
  },
  { name: 'provider-ias', versions: ['0.2.0', '0.2.1', '0.2.2', '0.2.3'] },
  { name: 'provider-kubernetes', versions: ['0.14.0', '0.14.1', '0.15.0'] },
  { name: 'provider-message-queue', versions: ['1.0.1'] },
  { name: 'provider-onboarding-experimental', versions: ['0.0.3'] },
  { name: 'provider-terraform', versions: ['0.16.0'] },
  { name: 'provider-vault', versions: ['1.0.0'] },
  {
    name: 'sap-btp-service-operator',
    versions: [
      '0.5.4',
      '0.6.0',
      '0.6.1',
      '0.6.2',
      '0.6.3',
      '0.6.4',
      '0.6.5',
      '0.6.6',
      '0.6.8',
    ],
  },
  { name: 'velero', versions: ['7.1.0'] },
];

const idpPrefix = 'openmcp';

export const CreateManagedControlPlaneWizardContainer: FC<
  CreateManagedControlPlaneWizardContainerProps
> = ({ isOpen, setIsOpen, projectName = '', workspaceName = '' }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const errorDialogRef = useRef<ErrorDialogHandle>(null);

  const [selectedStep, setSelectedStep] = useState<WizardStepType>('metadata');

  const {
    register,
    handleSubmit,
    resetField,
    setValue,
    reset,
    getValues,
    formState: { errors, isValid },
    watch,
  } = useForm<CreateDialogProps>({
    resolver: zodResolver(validationSchemaCreateManagedControlPlane),
    defaultValues: {
      name: '',
      displayName: '',
      chargingTarget: '',
      members: [],
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
    resetField('displayName');
  }, [resetField]);

  useEffect(() => {
    if (user?.email && isOpen) {
      setValue('members', [
        { name: user.email, roles: [MemberRoles.admin], kind: 'User' },
      ]);
    }
    if (!isOpen) {
      clearFormFields();
    }
  }, [user?.email, isOpen, setValue, clearFormFields]);

  const { trigger } = useApiResourceMutation<CreateManagedControlPlaneType>(
    CreateManagedControlPlaneResource(projectName, workspaceName),
  );

  const handleCreateManagedControlPlane = useCallback(
    async ({
      name,
      displayName,
      chargingTarget,
      members,
    }: OnCreatePayload): Promise<boolean> => {
      try {
        await trigger(
          CreateManagedControlPlane(
            name,
            `${projectName}--ws-${workspaceName}`,
            {
              displayName,
              chargingTarget,
              members,
            },
            idpPrefix,
          ),
        );
        setSelectedStep('success');
        return true;
      } catch (e) {
        if (e instanceof APIError && errorDialogRef.current) {
          errorDialogRef.current.showErrorDialog(
            `${e.message}: ${JSON.stringify(e.info)}`,
          );
        } else {
          console.error(e);
        }
        return false;
      }
    },
    [trigger, projectName, workspaceName],
  );

  const handleStepChange = useCallback(
    (e: Ui5CustomEvent<WizardDomRef, WizardStepChangeEventDetail>) => {
      const step = (e.detail.step.dataset.step ?? '') as WizardStepType;
      setSelectedStep(step);
    },
    [],
  );

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
        handleCreateManagedControlPlane(getValues());
        break;
      case 'success':
        resetFormAndClose();
        break;
      default:
        break;
    }
  }, [
    selectedStep,
    handleSubmit,
    setSelectedStep,
    handleCreateManagedControlPlane,
    getValues,
    resetFormAndClose,
  ]);

  const setMembers = useCallback(
    (members: Member[]) => {
      setValue('members', members, { shouldValidate: true });
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
        case 'summarize':
          return (
            selectedStep === 'metadata' ||
            selectedStep === 'members' ||
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
                  <Button onClick={resetFormAndClose}>
                    {t('buttons.close')}
                  </Button>
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
          <MetadataForm register={register} errors={errors} />
        </WizardStep>
        <WizardStep
          titleText={t('common.members')}
          selected={selectedStep === 'members'}
          data-step="members"
          disabled={isStepDisabled('members')}
        >
          <Form>
            <FormGroup
              headerText={t('CreateProjectWorkspaceDialog.membersHeader')}
            >
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
          titleText={t('common.componentSelection')}
          selected={selectedStep === 'componentSelection'}
          data-step="componentSelection"
          disabled={isStepDisabled('componentSelection')}
        >
          <ComponentsSelection items={mockedItems} />
        </WizardStep>
        <WizardStep
          icon="activities"
          titleText={t('common.summarize')}
          disabled={isStepDisabled('summarize')}
          selected={selectedStep === 'summarize'}
          data-step="summarize"
        >
          <h1>{t('common.summarize')}</h1>
          <Grid defaultSpan="XL6 L6 M6 S6">
            <div>
              <List headerText={t('common.metadata')}>
                <ListItemStandard
                  text={t('common.name')}
                  additionalText={getValues('name')}
                />
                <ListItemStandard
                  text={t('common.displayName')}
                  additionalText={getValues('displayName')}
                />
                <ListItemStandard
                  text={t('CreateProjectWorkspaceDialog.chargingTargetLabel')}
                  additionalText={getValues('chargingTarget')}
                />
                <ListItemStandard
                  text={t('common.namespace')}
                  additionalText={`${projectName}--ws-${workspaceName}`}
                />
              </List>
              <br />
              <List headerText={t('common.members')}>
                {getValues('members').map((member) => (
                  <ListItemStandard
                    key={member.name}
                    text={member.name}
                    additionalText={member.kind}
                  />
                ))}
              </List>
            </div>
            <div>
              <YamlViewer
                yamlString={stringify(
                  CreateManagedControlPlane(
                    getValues('name'),
                    `${projectName}--ws-${workspaceName}`,
                    {
                      displayName: getValues('displayName'),
                      chargingTarget: getValues('chargingTarget'),
                      members: getValues('members'),
                    },
                  ),
                )}
                filename={`mcp_${projectName}--ws-${workspaceName}`}
              />
            </div>
          </Grid>
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

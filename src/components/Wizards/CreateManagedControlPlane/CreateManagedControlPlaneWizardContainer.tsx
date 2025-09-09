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
  UpdateManagedControlPlaneResource,
} from '../../../lib/api/types/crate/createManagedControlPlane.ts';
import {
  CHARGING_TARGET_LABEL,
  CHARGING_TARGET_TYPE_LABEL,
  DISPLAY_NAME_ANNOTATION,
} from '../../../lib/api/types/shared/keyNames.ts';
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
  isEditMode: boolean;
};

type WizardStepType = 'metadata' | 'members' | 'componentSelection' | 'summarize' | 'success';

const wizardStepOrder: WizardStepType[] = ['metadata', 'members', 'componentSelection', 'summarize', 'success'];

export const CreateManagedControlPlaneWizardContainer: FC<CreateManagedControlPlaneWizardContainerProps> = ({
  isOpen,
  setIsOpen,
  projectName = '',
  workspaceName = '',
  isEditMode = false,
}) => {
  const { t } = useTranslation();
  const { user } = useAuthOnboarding();
  const errorDialogRef = useRef<ErrorDialogHandle>(null);
  const mockedData = {
    apiVersion: 'core.openmcp.cloud/v1alpha1',
    kind: 'ManagedControlPlane',
    metadata: {
      annotations: {
        'kubectl.kubernetes.io/last-applied-configuration':
          '{"apiVersion":"core.openmcp.cloud/v1alpha1","kind":"ManagedControlPlane","metadata":{"annotations":{},"name":"playground-mcp","namespace":"project-webapp-playground--ws-development"},"spec":{"authentication":{"enableSystemIdentityProvider":true},"authorization":{"roleBindings":[{"role":"admin","subjects":[{"kind":"User","name":"openmcp:johannes.ott@sap.com"}]},{"role":"admin","subjects":[{"kind":"User","name":"openmcp:enrico.kaack@sap.com"}]},{"role":"admin","subjects":[{"kind":"User","name":"openmcp:caroline.schaefer@sap.com"}]},{"role":"admin","subjects":[{"kind":"User","name":"openmcp:moritz.reich@sap.com"}]},{"role":"admin","subjects":[{"kind":"User","name":"openmcp:hubert.szczepanski@sap.com"}]},{"role":"admin","subjects":[{"kind":"User","name":"openmcp:lukasz.goral@sap.com"}]},{"role":"admin","subjects":[{"kind":"User","name":"openmcp:andreas.kienle@sap.com"}]},{"role":"admin","subjects":[{"kind":"User","name":"openmcp:fabian.wolski@sap.com"}]},{"role":"admin","subjects":[{"kind":"User","name":"openmcp:bozhidara.hristova@sap.com"}]},{"role":"admin","subjects":[{"kind":"User","name":"openmcp:anna.helmke@sap.com"}]},{"role":"admin","subjects":[{"kind":"User","name":"openmcp:ingo.kober@sap.com"}]}]},"components":{"apiServer":{"type":"GardenerDedicated"},"crossplane":{"providers":[{"name":"gardener-auth","version":"0.0.4"},{"name":"provider-kubernetes","version":"0.15.0"},{"name":"btp","version":"1.0.3"}],"version":"1.19.0"},"flux":{"version":"2.14.0"},"landscaper":{"deployers":["helm","container","manifest"]}},"desiredRegion":{"direction":"central","name":"europe"}}}\n',
      },
      creationTimestamp: '2025-05-13T09:29:05Z',
      finalizers: ['finalizer.managedcontrolplane.openmcp.cloud'],
      generation: 9,
      labels: {
        'openmcp.cloud/mcp-project': 'webapp-playground',
        'openmcp.cloud/mcp-workspace': 'development',
      },
      name: 'playground-mcp',
      namespace: 'project-webapp-playground--ws-development',
      resourceVersion: '54678547',
      uid: '449c6fb8-3504-4515-aa73-efd692cd2077',
    },
    spec: {
      authentication: {
        enableSystemIdentityProvider: true,
      },
      authorization: {
        roleBindings: [
          {
            role: 'admin',
            subjects: [
              {
                kind: 'User',
                name: 'openmcp:lasse.friedrich@sap.com',
              },
            ],
          },
          {
            role: 'admin',
            subjects: [
              {
                kind: 'User',
                name: 'openmcp:johannes.ott@sap.com',
              },
            ],
          },
          {
            role: 'admin',
            subjects: [
              {
                kind: 'User',
                name: 'openmcp:enrico.kaack@sap.com',
              },
            ],
          },
          {
            role: 'admin',
            subjects: [
              {
                kind: 'User',
                name: 'openmcp:caroline.schaefer@sap.com',
              },
            ],
          },
          {
            role: 'admin',
            subjects: [
              {
                kind: 'User',
                name: 'openmcp:moritz.reich@sap.com',
              },
            ],
          },
          {
            role: 'admin',
            subjects: [
              {
                kind: 'User',
                name: 'openmcp:hubert.szczepanski@sap.com',
              },
            ],
          },
          {
            role: 'admin',
            subjects: [
              {
                kind: 'User',
                name: 'openmcp:lukasz.goral@sap.com',
              },
            ],
          },
          {
            role: 'admin',
            subjects: [
              {
                kind: 'User',
                name: 'openmcp:andreas.kienle@sap.com',
              },
            ],
          },
          {
            role: 'admin',
            subjects: [
              {
                kind: 'User',
                name: 'openmcp:fabian.wolski@sap.com',
              },
            ],
          },
          {
            role: 'admin',
            subjects: [
              {
                kind: 'User',
                name: 'openmcp:bozhidara.hristova@sap.com',
              },
            ],
          },
          {
            role: 'admin',
            subjects: [
              {
                kind: 'User',
                name: 'openmcp:anna.helmke@sap.com',
              },
            ],
          },
          {
            role: 'admin',
            subjects: [
              {
                kind: 'User',
                name: 'openmcp:ingo.kober@sap.com',
              },
            ],
          },
          {
            role: 'admin',
            subjects: [
              {
                kind: 'User',
                name: 'openmcp:maximilian.braun@sap.com',
              },
            ],
          },
        ],
      },
      components: {
        apiServer: {
          type: 'GardenerDedicated',
        },
        crossplane: {
          providers: [
            {
              name: 'gardener-auth',
              version: '0.0.4',
            },
            {
              name: 'provider-kubernetes',
              version: '0.15.0',
            },
            {
              name: 'btp',
              version: '1.0.3',
            },
          ],
          version: '1.19.0',
        },
        externalSecretsOperator: {
          version: '0.18.2',
        },
        flux: {
          version: '2.16.2',
        },
        kyverno: {
          version: '3.2.4',
        },
        landscaper: {
          deployers: ['helm', 'container', 'manifest'],
        },
      },
      desiredRegion: {
        direction: 'central',
        name: 'europe',
      },
    },
    status: {
      components: {
        apiServer: {
          endpoint: 'https://api.zqxz6e5iyqsjbwpc.mcpds.shoot.canary.k8s-hana.ondemand.com',
          serviceAccountIssuer:
            'https://discovery.ingress.garden.canary.k8s.ondemand.com/projects/mcpds/shoots/8209381f-3dfc-4f3a-ba3c-dd3fcfca7891/issuer',
        },
        authentication: {
          access: {
            key: 'kubeconfig',
            name: 'playground-mcp.kubeconfig',
            namespace: 'project-webapp-playground--ws-development',
          },
        },
      },
      observedGeneration: 9,
      status: 'Ready',
    },
  };
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
      setValue('members', [{ name: user.email, roles: [MemberRoles.admin], kind: 'User' }]);
    }
    if (!isOpen) {
      clearFormFields();
    }
  }, [user?.email, isOpen, setValue, clearFormFields]);

  const { trigger } = useApiResourceMutation<CreateManagedControlPlaneType>(
    CreateManagedControlPlaneResource(projectName, workspaceName),
  );
  const { trigger: triggerUpdate } = useApiResourceMutation<CreateManagedControlPlaneType>(
    UpdateManagedControlPlaneResource(projectName, workspaceName, mockedData.metadata.name),
  );
  const componentsList = watch('componentsList');

  const handleCreateManagedControlPlane = useCallback(
    async ({ name, displayName, chargingTarget, members, chargingTargetType }: OnCreatePayload): Promise<boolean> => {
      try {
        if (isEditMode) {
          await triggerUpdate(
            CreateManagedControlPlane(
              mockedData.metadata.name,
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
        } else {
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
        }
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

  // Prepare initial selections for components when editing
  const initialSelection = useMemo(() => {
    if (!isEditMode) return undefined;
    const selection: Record<string, { isSelected: boolean; version: string }> = {};
    const components = mockedData.spec.components as any;
    Object.keys(components).forEach((key) => {
      if (key === 'apiServer' || key === 'landscaper') return;
      const value = components[key];
      if (key === 'crossplane') {
        selection[key] = { isSelected: true, version: value.version ?? '' };
        (value.providers ?? []).forEach((prov: { name: string; version: string }) => {
          selection[prov.name] = { isSelected: true, version: prov.version ?? '' };
        });
      } else {
        selection[key] = { isSelected: true, version: value.version ?? '' };
      }
    });
    return selection;
  }, [isEditMode]);

  // Prefill form when editing
  useEffect(() => {
    if (!isOpen || !isEditMode) return;
    const roleBindings = mockedData.spec.authorization.roleBindings ?? [];
    const members: Member[] = roleBindings.flatMap((rb) =>
      (rb.subjects ?? []).map((s: any) => ({
        kind: s.kind,
        name: s.kind === 'User' && s.name?.includes(':') ? s.name.split(':').slice(1).join(':') : s.name,
        roles: [rb.role],
        namespace: s.namespace,
      })),
    );
    const labels = (mockedData.metadata.labels as unknown as Record<string, string>) ?? {};
    const annotations = (mockedData.metadata.annotations as unknown as Record<string, string>) ?? {};
    reset({
      name: mockedData.metadata.name,
      displayName: annotations?.[DISPLAY_NAME_ANNOTATION] ?? '',
      chargingTarget: labels?.[CHARGING_TARGET_LABEL] ?? '',
      chargingTargetType: labels?.[CHARGING_TARGET_TYPE_LABEL] ?? '',
      members,
      componentsList: componentsList ?? [],
    });
  }, [isOpen, isEditMode]);

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
          <MetadataForm
            watch={watch}
            setValue={setValue}
            register={register}
            errors={errors}
            isEditMode={isEditMode}
          />
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
          <ComponentsSelectionContainer
            componentsList={componentsList ?? []}
            setComponentsList={setComponentsList}
            initialSelection={initialSelection}
          />
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

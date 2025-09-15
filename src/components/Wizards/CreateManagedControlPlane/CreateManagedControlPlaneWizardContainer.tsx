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
import { ManagedControlPlaneTemplate, noTemplateValue } from '../../../lib/api/types/templates/mcpTemplate.ts';
import { stripIdpPrefix } from '../../../utils/stripIdpPrefix.ts';
import { buildNameWithPrefixesAndSuffixes } from '../../../utils/buildNameWithPrefixesAndSuffixes.ts';
import { ManagedControlPlaneInterface } from './mcp_type.ts';

type CreateManagedControlPlaneWizardContainerProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  projectName?: string;
  workspaceName?: string;
  isEditMode: boolean;
  initialTemplateName?: string;
  initialData?: ManagedControlPlaneInterface;
};

type WizardStepType = 'metadata' | 'members' | 'componentSelection' | 'summarize' | 'success';

const wizardStepOrder: WizardStepType[] = ['metadata', 'members', 'componentSelection', 'summarize', 'success'];

export const CreateManagedControlPlaneWizardContainer: FC<CreateManagedControlPlaneWizardContainerProps> = ({
  isOpen,
  setIsOpen,
  projectName = '',
  workspaceName = '',
  isEditMode = false,
  initialTemplateName,
  initialData,
}) => {
  const { t } = useTranslation();
  const { user } = useAuthOnboarding();
  const errorDialogRef = useRef<ErrorDialogHandle>(null);

  const [selectedStep, setSelectedStep] = useState<WizardStepType>('metadata');
  const [metadataFormKey, setMetadataFormKey] = useState(0);

  const normalizeChargingTargetType = useCallback((val?: string | null) => (val ?? '').trim().toLowerCase(), []);

  // Here we will use OnboardingAPI to get all available templates
  const templates = useMemo<ManagedControlPlaneTemplate[]>(() => [], []);

  const [selectedTemplateValue, setSelectedTemplateValue] = useState<string>(noTemplateValue);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.metadata.name === selectedTemplateValue),
    [templates, selectedTemplateValue],
  );

  const templateAffixes = useMemo(
    () => ({
      namePrefix: selectedTemplate?.spec.meta.name?.prefix ?? '',
      nameSuffix: selectedTemplate?.spec.meta.name?.suffix ?? '',
      displayNamePrefix: selectedTemplate?.spec.meta.displayName?.prefix ?? '',
      displayNameSuffix: selectedTemplate?.spec.meta.displayName?.suffix ?? '',
    }),
    [selectedTemplate],
  );

  useEffect(() => {
    const exists = templates.some((t) => t.metadata.name === selectedTemplateValue);
    if (!exists && selectedTemplateValue !== noTemplateValue) {
      setSelectedTemplateValue(noTemplateValue);
    }
  }, [templates, selectedTemplateValue]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedTemplateValue(initialTemplateName ?? noTemplateValue);
  }, [isOpen, initialTemplateName]);

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

  useEffect(() => {
    if (selectedStep !== 'metadata') return;

    if (selectedTemplate) {
      setValue('chargingTarget', selectedTemplate.spec.meta.chargingTarget.value, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue('chargingTargetType', normalizeChargingTargetType(selectedTemplate.spec.meta.chargingTarget.type), {
        shouldValidate: true,
        shouldDirty: true,
      });
    } else {
      setValue('chargingTarget', '', { shouldValidate: true, shouldDirty: true });
      setValue('chargingTargetType', '', { shouldValidate: true, shouldDirty: true });
    }

    setMetadataFormKey((k) => k + 1);
  }, [selectedTemplate, selectedStep, setValue, normalizeChargingTargetType]);

  const nextButtonText = useMemo(
    () => ({
      metadata: t('buttons.next'),
      members: t('buttons.next'),
      componentSelection: t('buttons.next'),
      summarize: isEditMode ? t('buttons.update') : t('buttons.create'),
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
    UpdateManagedControlPlaneResource(projectName, workspaceName, initialData?.metadata?.name ?? ''),
  );
  const componentsList = watch('componentsList');

  const hasMissingComponentVersions = useMemo(() => {
    const list = (componentsList ?? []) as ComponentsListItem[];
    return list.some(({ isSelected, selectedVersion }) => isSelected && !selectedVersion);
  }, [componentsList]);

  const handleCreateManagedControlPlane = useCallback(
    async ({ name, displayName, chargingTarget, members, chargingTargetType }: OnCreatePayload): Promise<boolean> => {
      try {
        const { finalName, finalDisplayName } = buildNameWithPrefixesAndSuffixes(name, displayName, templateAffixes);

        const normalizedType = (chargingTargetType ?? '').trim().toUpperCase();

        if (isEditMode) {
          await triggerUpdate(
            CreateManagedControlPlane(
              initialData?.metadata?.name ?? '',
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
              finalName,
              `${projectName}--ws-${workspaceName}`,
              {
                displayName: finalDisplayName,
                chargingTarget,
                chargingTargetType: normalizedType,
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
    [trigger, projectName, workspaceName, componentsList, templateAffixes],
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
        if (hasMissingComponentVersions) {
          return;
        }
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
  }, [
    selectedStep,
    handleSubmit,
    setSelectedStep,
    handleCreateManagedControlPlane,
    watch,
    resetFormAndClose,
    hasMissingComponentVersions,
  ]);

  const normalizeMemberRole = useCallback((roleInput?: string | null) => {
    const normalizedRole = (roleInput ?? '').toString().trim().toLowerCase();
    if (normalizedRole === 'admin' || normalizedRole === 'administrator') return MemberRoles.admin;
    if (normalizedRole === 'viewer' || normalizedRole === 'view' || normalizedRole === 'readonly') {
      return MemberRoles.view;
    }
    return MemberRoles.view;
  }, []);

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
            !isValid ||
            hasMissingComponentVersions
          );
        case 'success':
          return selectedStep !== 'success';
        default:
          return false;
      }
    },
    [selectedStep, isValid, hasMissingComponentVersions],
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
    const componentsMap = (initialData?.spec.components ?? {}) as Record<string, any>;
    Object.keys(componentsMap).forEach((key) => {
      if (key === 'apiServer' || key === 'landscaper') return;
      const value = componentsMap[key];
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
    const roleBindings = initialData?.spec?.authorization?.roleBindings ?? [];
    const members: Member[] = roleBindings.flatMap((rb) =>
      (rb.subjects ?? []).map((s: any) => ({
        kind: s.kind,
        name: s.kind === 'User' && s.name?.includes(':') ? s.name.split(':').slice(1).join(':') : s.name,
        roles: [rb.role],
        namespace: s.namespace,
      })),
    );
    const labels = (initialData?.metadata.labels as unknown as Record<string, string>) ?? {};
    const annotations = (initialData?.metadata.annotations as unknown as Record<string, string>) ?? {};

    reset({
      name: initialData?.metadata.name,
      displayName: annotations?.[DISPLAY_NAME_ANNOTATION] ?? '',
      chargingTarget: labels?.[CHARGING_TARGET_LABEL] ?? '',
      chargingTargetType: labels?.[CHARGING_TARGET_TYPE_LABEL] ?? '',
      members,
      componentsList: componentsList ?? [],
    });
  }, [isOpen, isEditMode]);

  const normalizeMemberKind = useCallback((kindInput?: string | null) => {
    const normalizedKind = (kindInput ?? '').toString().trim().toLowerCase();
    return normalizedKind === 'serviceaccount' ? 'ServiceAccount' : 'User';
  }, []);

  const appliedTemplateMembersRef = useRef(false);
  const appliedTemplateComponentsRef = useRef(false);

  useEffect(() => {
    appliedTemplateMembersRef.current = false;
    appliedTemplateComponentsRef.current = false;
  }, [selectedTemplateValue, isOpen]);

  useEffect(() => {
    if (selectedStep !== 'members') return;
    if (!selectedTemplate) return;
    if (appliedTemplateMembersRef.current) return;

    const templateMembers = (selectedTemplate?.spec?.spec?.authorization?.defaultMembers ??
      []) as ManagedControlPlaneTemplate['spec']['spec']['authorization']['defaultMembers'];
    if (!templateMembers?.length) {
      appliedTemplateMembersRef.current = true;
      return;
    }

    const currentMembers = (watch('members') ?? []) as Member[];

    let merged = currentMembers;
    if (user?.email && !currentMembers.some((m) => m.name === user.email)) {
      merged = [{ name: user.email, roles: [MemberRoles.admin], kind: 'User' }, ...currentMembers];
    }

    const mappedFromTemplate: Member[] = templateMembers
      .map((m) => ({
        name: stripIdpPrefix(String(m?.name ?? ''), idpPrefix),
        roles: [normalizeMemberRole(m?.role)],
        kind: normalizeMemberKind(m?.kind),
      }))
      .filter((m) => !!m.name);

    const byName = new Map<string, Member>();
    merged.forEach((m) => m?.name && byName.set(m.name, m));
    mappedFromTemplate.forEach((m) => {
      if (m.name && !byName.has(m.name)) byName.set(m.name, m);
    });

    const normalizedMembers = Array.from(byName.values()).map((m) => ({
      ...m,
      roles: (m.roles ?? []).length
        ? m.roles.map((r) => normalizeMemberRole(r as unknown as string))
        : [MemberRoles.view],
    }));

    setValue('members', normalizedMembers, { shouldValidate: true });
    appliedTemplateMembersRef.current = true;
  }, [selectedStep, selectedTemplate, watch, setValue, user?.email, normalizeMemberRole, normalizeMemberKind]);

  useEffect(() => {
    if (selectedStep !== 'componentSelection') return;
    if (!selectedTemplate) return;
    if (appliedTemplateComponentsRef.current) return;

    const defaults = (selectedTemplate?.spec?.spec?.components?.defaultComponents ??
      []) as ManagedControlPlaneTemplate['spec']['spec']['components']['defaultComponents'];
    if (!defaults?.length) {
      appliedTemplateComponentsRef.current = true;
      return;
    }

    const current = (watch('componentsList') ?? []) as ComponentsListItem[];
    if (current.length > 0) {
      appliedTemplateComponentsRef.current = true;
      return;
    }

    const mapped = defaults
      .filter((c) => !!c?.name && !!c?.version)
      .map((c) => ({
        name: String(c.name),
        version: String(c.version),
        selectedVersion: String(c.version),
        selected: true,
        removable: Boolean(c.removable),
        versionChangeable: Boolean(c.versionChangeable),
      })) as unknown as ComponentsListItem[];

    setValue('componentsList', mapped, { shouldValidate: false });
    appliedTemplateComponentsRef.current = true;
  }, [selectedStep, selectedTemplate, watch, setValue]);

  if (!isOpen) return null;

  return (
    <Dialog
      stretch
      headerText={isEditMode ? t('editMCP.dialogTitle') : t('createMCP.dialogTitle')}
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
            key={metadataFormKey}
            watch={watch}
            setValue={setValue}
            register={register}
            errors={errors}
            isEditMode={isEditMode}
            disableChargingFields={!!selectedTemplate}
            namePrefix={templateAffixes.namePrefix}
            displayNamePrefix={templateAffixes.displayNamePrefix}
            nameSuffix={templateAffixes.nameSuffix}
            displayNameSuffix={templateAffixes.displayNameSuffix}
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
                workspaceName={workspaceName}
                projectName={projectName}
                type={'mcp'}
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
            managedControlPlaneTemplate={selectedTemplate}
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
          {isEditMode ? (
            <IllustratedBanner
              illustrationName={IllustrationMessageType.SuccessScreen}
              title={t('editMCP.titleText')}
              subtitle={t('editMCP.subtitleText')}
            />
          ) : (
            <IllustratedBanner
              illustrationName={IllustrationMessageType.SuccessScreen}
              title={t('createMCP.titleText')}
              subtitle={t('createMCP.subtitleText')}
            />
          )}
        </WizardStep>
      </Wizard>
    </Dialog>
  );
};

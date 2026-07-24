import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import IllustrationMessageType from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageType.js';

import { zodResolver } from '@hookform/resolvers/zod';
import type { WizardStepChangeEventDetail } from '@ui5/webcomponents-fiori/dist/Wizard.js';
import { useForm, useWatch } from 'react-hook-form';

import {
  Bar,
  Button,
  Dialog,
  FlexBox,
  Form,
  FormGroup,
  Text,
  Ui5CustomEvent,
  Wizard,
  WizardDomRef,
  WizardStep,
} from '@ui5/webcomponents-react';

import { Trans, useTranslation } from 'react-i18next';
import { APIError } from '../../../lib/api/error.ts';
import { DISPLAY_NAME_ANNOTATION } from '../../../lib/api/types/shared/keyNames.ts';
import { MCP_V2_DEFAULT_ROLE, MCP_V2_VIEWER_ROLE, Member } from '../../../lib/api/types/shared/members.ts';
import { createManagedControlPlaneSchema } from '../../../lib/api/validations/schemas.ts';
import { useAuthOnboarding as _useAuthOnboarding } from '../../../spaces/onboarding/auth/AuthContextOnboarding.tsx';
import { idpPrefix } from '../../../utils/idpPrefix.ts';
import { CreateDialogProps } from '../../Dialogs/CreateWorkspaceDialogContainer.tsx';
import { MetadataForm } from '../../Dialogs/MetadataForm.tsx';
import { ErrorDialog, ErrorDialogHandle } from '../../Shared/ErrorMessageBox.tsx';

import { ManagedControlPlaneTemplate, noTemplateValue } from '../../../lib/api/types/templates/mcpTemplate.ts';
import { ManagedControlPlaneV2 } from '../../../spaces/onboarding/types/ControlPlane.ts';
import { buildNameWithPrefixesAndSuffixes } from '../../../utils/buildNameWithPrefixesAndSuffixes.ts';
import { stripIdpPrefix } from '../../../utils/stripIdpPrefix.ts';
import { IllustratedBanner } from '../../Ui/IllustratedBanner/IllustratedBanner.tsx';

import { useCreateControlPlaneV2GraphQL as _useCreateManagedControlPlaneV2GraphQL } from '../../../spaces/controlPlaneV2/hooks/useCreateControlPlaneV2GraphQL.ts';
import { useUpdateControlPlaneV2GraphQL as _useUpdateManagedControlPlaneV2GraphQL } from '../../../spaces/controlPlaneV2/hooks/useUpdateControlPlaneV2GraphQL.ts';
import { useCrossplaneQuery } from '../../../spaces/controlPlaneV2/components/Kpi/useCrossplaneQuery.ts';
import { useFluxQuery } from '../../../spaces/controlPlaneV2/components/Kpi/useFluxQuery.ts';
import { useLandscaperQuery } from '../../../spaces/controlPlaneV2/components/Kpi/useLandscaperQuery.ts';
import { useEsoQuery } from '../../../spaces/controlPlaneV2/components/Kpi/useEsoQuery.ts';
import { useCreateCrossplane } from '../../../spaces/mcp/hooks/useCreateCrossplane.ts';
import { useCreateFlux } from '../../../spaces/mcp/hooks/useCreateFlux.ts';
import { useCreateLandscaper } from '../../../spaces/mcp/hooks/useCreateLandscaper.ts';
import { useCreateEso } from '../../../spaces/mcp/hooks/useCreateEso.ts';
import { useUpdateCrossplane } from '../../../spaces/mcp/hooks/useUpdateCrossplane.ts';
import { useUpdateFlux } from '../../../spaces/mcp/hooks/useUpdateFlux.ts';
import { useUpdateLandscaper } from '../../../spaces/mcp/hooks/useUpdateLandscaper.ts';
import { useUpdateEso } from '../../../spaces/mcp/hooks/useUpdateEso.ts';
import { EditMembers } from '../../Members/EditMembers.tsx';
import { Infobox } from '../../Ui/Infobox/Infobox.tsx';
import styles from '../CreateManagedControlPlane/CreateManagedControlPlaneWizardContainer.module.css';
import { ServiceSelectionStep } from './ServiceSelectionStep.tsx';
import { SummarizeStepV2 } from './SummarizeStepV2.tsx';
import { useTelemetry } from '../../../lib/telemetry/telemetry.ts';
import { ServiceSelection } from '../../../spaces/mcp/schemas/mcpV2Input.schema.ts';

type CreateManagedControlPlaneV2WizardContainerProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  projectName?: string;
  workspaceName?: string;
  isEditMode?: boolean;
  isDuplicateMode?: boolean;
  initialTemplateName?: string;
  initialData?: ManagedControlPlaneV2;
  initialSection?: WizardStepType;
  useCreateManagedControlPlaneV2GraphQL?: typeof _useCreateManagedControlPlaneV2GraphQL;
  useUpdateManagedControlPlaneV2GraphQL?: typeof _useUpdateManagedControlPlaneV2GraphQL;
  useAuthOnboarding?: typeof _useAuthOnboarding;
};

export type WizardStepType = 'metadata' | 'members' | 'componentSelection' | 'summarize' | 'success';

const wizardStepOrder: WizardStepType[] = ['metadata', 'members', 'componentSelection', 'summarize', 'success'];

const normalizeMcpV2Role = (roleInput?: string | null): string => {
  const normalizedRole = (roleInput ?? '').toString().trim().toLowerCase();
  if (normalizedRole === MCP_V2_VIEWER_ROLE || normalizedRole === 'view') {
    return MCP_V2_VIEWER_ROLE;
  }
  return MCP_V2_DEFAULT_ROLE;
};

export const CreateControlPlaneV2WizardContainer: FC<CreateManagedControlPlaneV2WizardContainerProps> = ({
  isOpen,
  setIsOpen,
  projectName = '',
  workspaceName = '',
  isEditMode = false,
  isDuplicateMode = false,
  initialTemplateName,
  initialData,
  initialSection,
  useCreateManagedControlPlaneV2GraphQL = _useCreateManagedControlPlaneV2GraphQL,
  useUpdateManagedControlPlaneV2GraphQL = _useUpdateManagedControlPlaneV2GraphQL,
  useAuthOnboarding = _useAuthOnboarding,
}) => {
  const { t } = useTranslation();
  const telemetry = useTelemetry();
  const { user } = useAuthOnboarding();
  const errorDialogRef = useRef<ErrorDialogHandle>(null);
  const [selectedStep, setSelectedStep] = useState<WizardStepType>(initialSection ?? 'metadata');
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedTemplateValue(noTemplateValue);
    }
  }, [templates, selectedTemplateValue]);

  useEffect(() => {
    if (!isOpen) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    getValues,
    control,

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
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    [t, isEditMode],
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
    if (!isEditMode && user?.email && isOpen) {
      setValue('members', [{ name: user.email, roles: [MCP_V2_DEFAULT_ROLE], kind: 'User' }]);
    }
    if (!isOpen) {
      clearFormFields();
    }
  }, [user?.email, isOpen, isEditMode, setValue, clearFormFields]);

  const { createMcp, loading: isCreatingMcp } = useCreateManagedControlPlaneV2GraphQL();
  const { updateMcp, loading: isUpdatingMcp } = useUpdateManagedControlPlaneV2GraphQL();
  const isSubmitting = isEditMode ? isUpdatingMcp : isCreatingMcp;

  // Services state — selected + optional version per service
  const [services, setServices] = useState<ServiceSelection>({});

  // Edit-mode: query existing service state to pre-populate the step.
  // Hooks are always called (rules of hooks) but skipped when not relevant.
  const editNs = initialData?.metadata?.namespace ?? '';
  const editName = initialData?.metadata?.name ?? '';
  const skipKpi = !isEditMode || !editName || !editNs;
  const { crossplaneData } = useCrossplaneQuery(skipKpi ? '' : editName, skipKpi ? '' : editNs);
  const { fluxData } = useFluxQuery(skipKpi ? '' : editName, skipKpi ? '' : editNs);
  const { landscaperData } = useLandscaperQuery(skipKpi ? '' : editName, skipKpi ? '' : editNs);
  const { esoData } = useEsoQuery(skipKpi ? '' : editName, skipKpi ? '' : editNs);

  // Prefill services when entering the componentSelection step in edit mode.
  useEffect(() => {
    if (!isEditMode || selectedStep !== 'componentSelection') return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setServices({
      crossplane: crossplaneData
        ? {
            selected: crossplaneData.isInstalled,
            version: crossplaneData.version ?? '',
            providers: crossplaneData.providers
              .filter((p): p is { name: string; version: string | null } => !!p.name)
              .map((p) => ({ name: p.name, version: p.version ?? '' })),
          }
        : undefined,
      flux: fluxData ? { selected: fluxData.isInstalled, version: fluxData.version ?? '' } : undefined,
      landscaper: landscaperData
        ? { selected: landscaperData.isInstalled, version: landscaperData.version ?? '' }
        : undefined,
      externalSecretsOperator: esoData ? { selected: esoData.isInstalled, version: esoData.version ?? '' } : undefined,
    });
  }, [isEditMode, selectedStep, crossplaneData, fluxData, landscaperData, esoData]);

  // Service create/update hooks (always called per rules of hooks)
  const { create: createCrossplane } = useCreateCrossplane();
  const { create: createFlux } = useCreateFlux();
  const { create: createLandscaper } = useCreateLandscaper();
  const { create: createEso } = useCreateEso();
  const { update: updateCrossplane } = useUpdateCrossplane();
  const { update: updateFlux } = useUpdateFlux();
  const { update: updateLandscaper } = useUpdateLandscaper();
  const { update: updateEso } = useUpdateEso();
  const name = useWatch({ control, name: 'name' });
  const displayName = useWatch({ control, name: 'displayName' });
  const members = useWatch({ control, name: 'members' });
  const rawInput = useMemo(() => {
    const { finalName } = buildNameWithPrefixesAndSuffixes(name, displayName, templateAffixes);
    const normalizeKind = (kind: string): 'User' | 'Group' => {
      const lower = kind.trim().toLowerCase();
      if (lower === 'group') return 'Group';
      return 'User';
    };
    const roleMap = new Map<string, { kind: 'User' | 'Group'; name: string }[]>();
    (members ?? [])
      .filter((m) => !!m.name)
      .forEach((m) => {
        const kind = normalizeKind(m.kind);
        const roleName = normalizeMcpV2Role(m.roles?.[0]);
        if (!roleMap.has(roleName)) roleMap.set(roleName, []);
        roleMap.get(roleName)!.push({
          kind,
          name: m.name,
        });
      });
    const roleBindings = Array.from(roleMap.entries()).map(([roleName, subjects]) => ({
      roleRefs: [{ kind: 'ClusterRole' as const, name: roleName }],
      subjects,
    }));
    return {
      name: finalName,
      namespace: `${projectName}--ws-${workspaceName}`,
      roleBindings,
    };
  }, [name, displayName, templateAffixes, projectName, workspaceName, members]);

  const handleCreateManagedControlPlane = useCallback(async (): Promise<boolean> => {
    try {
      const cpName = isEditMode ? (initialData?.metadata?.name ?? '') : rawInput.name;
      const cpNamespace = isEditMode ? (initialData?.metadata?.namespace ?? '') : rawInput.namespace;

      if (isEditMode) {
        await updateMcp({
          name: cpName,
          namespace: cpNamespace,
          roleBindings: rawInput.roleBindings,
        });
      } else {
        await createMcp(rawInput);
      }

      // Fire service create/update mutations in parallel for selected services.
      // If not selected and currently installed, leave as-is (deletion out of scope).
      const servicePromises: Promise<unknown>[] = [];

      const makeServiceObject = (
        serviceName: string,
        version: string,
        ns: string,
        apiVersion: string,
        kind: string,
      ) => ({
        namespace: ns,
        object: {
          apiVersion,
          kind,
          metadata: { name: serviceName, namespace: ns },
          spec: { version: version || 'latest' },
        },
      });

      if (services.crossplane?.selected) {
        const vars = {
          namespace: cpNamespace,
          object: {
            apiVersion: 'crossplane.services.open-control-plane.io/v1alpha1',
            kind: 'Crossplane',
            metadata: { name: cpName, namespace: cpNamespace },
            spec: {
              version: services.crossplane.version || 'latest',
              providers: (services.crossplane.providers ?? []).map((p) => ({
                name: p.name,
                version: p.version || 'latest',
              })),
            },
          },
        };
        servicePromises.push(
          isEditMode && crossplaneData?.isInstalled
            ? updateCrossplane({ ...vars, name: cpName })
            : createCrossplane(vars),
        );
      }
      if (services.flux?.selected) {
        const vars = makeServiceObject(
          cpName,
          services.flux.version ?? '',
          cpNamespace,
          'flux.services.open-control-plane.io/v1alpha1',
          'Flux',
        );
        servicePromises.push(
          isEditMode && fluxData?.isInstalled ? updateFlux({ ...vars, name: cpName }) : createFlux(vars),
        );
      }
      if (services.landscaper?.selected) {
        const vars = makeServiceObject(
          cpName,
          services.landscaper.version ?? '',
          cpNamespace,
          'landscaper.services.open-control-plane.io/v1alpha2',
          'Landscaper',
        );
        servicePromises.push(
          isEditMode && landscaperData?.isInstalled
            ? updateLandscaper({ ...vars, name: cpName })
            : createLandscaper(vars),
        );
      }
      if (services.externalSecretsOperator?.selected) {
        const vars = makeServiceObject(
          cpName,
          services.externalSecretsOperator.version ?? '',
          cpNamespace,
          'external-secrets.services.open-control-plane.io/v1alpha1',
          'ExternalSecretsOperator',
        );
        servicePromises.push(
          isEditMode && esoData?.isInstalled ? updateEso({ ...vars, name: cpName }) : createEso(vars),
        );
      }
      await Promise.all(servicePromises);

      telemetry.track({ name: isEditMode ? 'controlplane.edited' : 'controlplane.created', source: 'v2' });
      setSelectedStep('success');
      return true;
    } catch (e) {
      const message =
        e instanceof APIError ? `${e.message}: ${JSON.stringify(e.info)}` : e instanceof Error ? e.message : String(e);
      if (errorDialogRef.current) {
        errorDialogRef.current.showErrorDialog(message);
      }
      console.error(e);
      return false;
    }
  }, [
    isEditMode,
    updateMcp,
    initialData,
    createMcp,
    rawInput,
    telemetry,
    services,
    crossplaneData,
    fluxData,
    landscaperData,
    esoData,
    createCrossplane,
    createFlux,
    createLandscaper,
    createEso,
    updateCrossplane,
    updateFlux,
    updateLandscaper,
    updateEso,
  ]);

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
        if (isSubmitting) {
          return;
        }
        void handleCreateManagedControlPlane();
        break;
      case 'success':
        resetFormAndClose();
        break;
      default:
        break;
    }
  }, [selectedStep, handleSubmit, setSelectedStep, handleCreateManagedControlPlane, resetFormAndClose, isSubmitting]);

  const normalizeMemberRole = useCallback((roleInput?: string | null): string => normalizeMcpV2Role(roleInput), []);

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
          return (selectedStep === 'metadata' && !isEditMode) || !isValid;
        case 'componentSelection':
          return ((selectedStep === 'metadata' || selectedStep === 'members') && !isEditMode) || !isValid;
        case 'summarize':
          return (
            ((selectedStep === 'metadata' || selectedStep === 'members' || selectedStep === 'componentSelection') &&
              !isEditMode) ||
            !isValid
          );
        case 'success':
          return selectedStep !== 'success';
        default:
          return false;
      }
    },
    [selectedStep, isValid, isEditMode],
  );

  const onBackClick = useCallback(() => {
    const currentIndex = wizardStepOrder.indexOf(selectedStep);
    if (currentIndex > 0) {
      setSelectedStep(wizardStepOrder[currentIndex - 1]);
    }
  }, [selectedStep]);

  // Prefill form when editing
  useEffect(() => {
    if (!isOpen || !initialData) return;
    const roleBindings = initialData.spec?.iam?.oidc?.defaultProvider?.roleBindings ?? [];
    const normalizeMemberKind = (kindInput?: string | null): 'User' | 'Group' => {
      const normalizedKind = (kindInput ?? '').toString().trim().toLowerCase();
      return normalizedKind === 'group' ? 'Group' : 'User';
    };
    const members: Member[] = roleBindings
      .filter(Boolean)
      .flatMap((rb) => {
        const roleName = normalizeMcpV2Role(rb?.roleRefs?.filter(Boolean)?.[0]?.name);
        return (rb?.subjects ?? []).filter(Boolean).map((s) => {
          const kind = normalizeMemberKind(s?.kind);
          const rawName = s?.name ?? '';
          return {
            kind,
            name: kind === 'User' ? stripIdpPrefix(rawName, idpPrefix) : rawName,
            roles: [roleName],
          };
        });
      })
      .filter((m) => !!m.name);
    const name = initialData.metadata.name;
    const annotations = initialData.metadata.annotations;
    reset({
      name,
      displayName: annotations[DISPLAY_NAME_ANNOTATION] ?? '',
      chargingTarget: '',
      chargingTargetType: '',
      members,
      componentsList: [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isEditMode]);
  const normalizeMemberKind = useCallback((kindInput?: string | null) => {
    const normalizedKind = (kindInput ?? '').toString().trim().toLowerCase();
    return normalizedKind === 'group' ? 'Group' : 'User';
  }, []);

  const appliedTemplateMembersRef = useRef(false);

  useEffect(() => {
    appliedTemplateMembersRef.current = false;
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

    const currentMembers = (getValues('members') ?? []) as Member[];

    let merged = currentMembers;
    if (user?.email && !currentMembers.some((m) => m.name === user.email)) {
      merged = [{ name: user.email, roles: [MCP_V2_DEFAULT_ROLE], kind: 'User' }, ...currentMembers];
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
        : [MCP_V2_DEFAULT_ROLE],
    }));

    setValue('members', normalizedMembers, { shouldValidate: true });
    appliedTemplateMembersRef.current = true;
  }, [selectedStep, selectedTemplate, getValues, setValue, user?.email, normalizeMemberRole, normalizeMemberKind]);

  // Template application for components is handled inside the hook

  if (!isOpen) return null;

  return (
    <>
      <Dialog
        stretch
        headerText={isEditMode ? t('editMCP.dialogTitle') : t('createMCP.dialogTitleControlPlane')}
        open={isOpen}
        initialFocus="project-name-input"
        footer={
          <Bar
            design="Footer"
            endContent={
              <div className={styles.footer}>
                {selectedStep !== 'metadata' && isEditMode && (
                  <Button disabled={isSubmitting} onClick={resetFormAndClose}>
                    {t('buttons.close')}
                  </Button>
                )}
                {selectedStep !== 'success' &&
                  (selectedStep === 'metadata' ? (
                    <Button disabled={isSubmitting} onClick={resetFormAndClose}>
                      {t('buttons.close')}
                    </Button>
                  ) : (
                    <Button disabled={isSubmitting} onClick={onBackClick}>
                      {t('buttons.back')}
                    </Button>
                  ))}
                <Button design="Emphasized" disabled={isSubmitting} onClick={onNextClick}>
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
            <FlexBox direction={'Row'} justifyContent={'SpaceBetween'} gap={16}>
              <div className={styles.metadataForm}>
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
                  isV2
                />
              </div>
              {isDuplicateMode && (
                <div className={styles.infoboxContainer}>
                  <Infobox size={'sm'}>
                    <Text>
                      <Trans
                        i18nKey="editMCP.duplicatingMCPInfo1"
                        components={{ span: <span className="mono-font" /> }}
                      />
                    </Text>
                    <Text>
                      <Trans i18nKey="editMCP.duplicatingMCPInfo2" components={{ b: <b /> }} />
                    </Text>
                  </Infobox>
                </div>
              )}
            </FlexBox>
          </WizardStep>
          <WizardStep
            icon="user-edit"
            titleText={t('common.members')}
            selected={selectedStep === 'members'}
            data-step="members"
            disabled={isStepDisabled('members')}
          >
            <Form>
              <FormGroup>
                <EditMembers
                  members={members}
                  isValidationError={!!errors.members}
                  requireAtLeastOneMember={false}
                  workspaceName={workspaceName}
                  projectName={projectName}
                  type={'mcp'}
                  isV2
                  onMemberChanged={setMembers}
                />
              </FormGroup>
            </Form>
          </WizardStep>

          <WizardStep
            icon="add-product"
            titleText={t('ServiceSelectionStep.stepTitle')}
            disabled={isStepDisabled('componentSelection')}
            selected={selectedStep === 'componentSelection'}
            data-step="componentSelection"
          >
            <ServiceSelectionStep services={services} onServicesChange={setServices} />
          </WizardStep>

          <WizardStep
            icon="activities"
            titleText={t('common.summarize')}
            disabled={isStepDisabled('summarize')}
            selected={selectedStep === 'summarize'}
            data-step="summarize"
          >
            <SummarizeStepV2 rawInput={rawInput} services={services} />
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
    </>
  );
};

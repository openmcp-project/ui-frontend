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
  Text,
  Ui5CustomEvent,
  Wizard,
  WizardDomRef,
  WizardStep,
} from '@ui5/webcomponents-react';

import { Trans, useTranslation } from 'react-i18next';
import { stringify } from 'yaml';
import { APIError } from '../../../lib/api/error.ts';
import { DISPLAY_NAME_ANNOTATION } from '../../../lib/api/types/shared/keyNames.ts';
import { MCP_V2_DEFAULT_ROLE, Member } from '../../../lib/api/types/shared/members.ts';
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

import { useTelemetry } from '../../../lib/telemetry/telemetry.ts';
import { useCrossplaneQuery } from '../../../spaces/controlPlaneV2/components/Kpi/useCrossplaneQuery.ts';
import { useEsoQuery } from '../../../spaces/controlPlaneV2/components/Kpi/useEsoQuery.ts';
import { useFluxQuery } from '../../../spaces/controlPlaneV2/components/Kpi/useFluxQuery.ts';
import { useKroQuery } from '../../../spaces/controlPlaneV2/components/Kpi/useKroQuery.ts';
import { useLandscaperQuery } from '../../../spaces/controlPlaneV2/components/Kpi/useLandscaperQuery.ts';
import { useOcmQuery } from '../../../spaces/controlPlaneV2/components/Kpi/useOcmQuery.ts';
import {
  buildRoleBindingsForProviderMembers,
  normalizeMcpV2Role,
} from '../../../spaces/controlPlaneV2/helpers/buildRoleBindingsForProviderMembers.ts';
import { buildMcpV2GraphQLInput } from '../../../spaces/controlPlaneV2/helpers/controlPlaneV2GraphQLInput.ts';
import { extractMcpV2FormState } from '../../../spaces/controlPlaneV2/helpers/extractMcpV2FormState.ts';
import { hasAssignedIamMember } from '../../../spaces/controlPlaneV2/helpers/hasAssignedIamMember.ts';
import { useCreateControlPlaneV2GraphQL as _useCreateManagedControlPlaneV2GraphQL } from '../../../spaces/controlPlaneV2/hooks/useCreateControlPlaneV2GraphQL.ts';
import { useUpdateControlPlaneV2GraphQL as _useUpdateManagedControlPlaneV2GraphQL } from '../../../spaces/controlPlaneV2/hooks/useUpdateControlPlaneV2GraphQL.ts';
import { useCreateCrossplane as _useCreateCrossplane } from '../../../spaces/mcp/hooks/useCreateCrossplane.ts';
import { useCreateEso as _useCreateEso } from '../../../spaces/mcp/hooks/useCreateEso.ts';
import { useCreateFlux as _useCreateFlux } from '../../../spaces/mcp/hooks/useCreateFlux.ts';
import { useCreateKro as _useCreateKro } from '../../../spaces/mcp/hooks/useCreateKro.ts';
import { useCreateLandscaper as _useCreateLandscaper } from '../../../spaces/mcp/hooks/useCreateLandscaper.ts';
import { useCreateOcm as _useCreateOcm } from '../../../spaces/mcp/hooks/useCreateOcm.ts';
import { useDeleteCrossplane as _useDeleteCrossplane } from '../../../spaces/mcp/hooks/useDeleteCrossplane.ts';
import { useDeleteEso as _useDeleteEso } from '../../../spaces/mcp/hooks/useDeleteEso.ts';
import { useDeleteFlux as _useDeleteFlux } from '../../../spaces/mcp/hooks/useDeleteFlux.ts';
import { useDeleteKro as _useDeleteKro } from '../../../spaces/mcp/hooks/useDeleteKro.ts';
import { useDeleteLandscaper as _useDeleteLandscaper } from '../../../spaces/mcp/hooks/useDeleteLandscaper.ts';
import { useDeleteOcm as _useDeleteOcm } from '../../../spaces/mcp/hooks/useDeleteOcm.ts';
import { useUpdateCrossplane as _useUpdateCrossplane } from '../../../spaces/mcp/hooks/useUpdateCrossplane.ts';
import { useUpdateEso as _useUpdateEso } from '../../../spaces/mcp/hooks/useUpdateEso.ts';
import { useUpdateFlux as _useUpdateFlux } from '../../../spaces/mcp/hooks/useUpdateFlux.ts';
import { useUpdateKro as _useUpdateKro } from '../../../spaces/mcp/hooks/useUpdateKro.ts';
import { useUpdateLandscaper as _useUpdateLandscaper } from '../../../spaces/mcp/hooks/useUpdateLandscaper.ts';
import { useUpdateOcm as _useUpdateOcm } from '../../../spaces/mcp/hooks/useUpdateOcm.ts';
import { ExtraProviderMetadata, McpV2Input, ServiceSelection } from '../../../spaces/mcp/schemas/mcpV2Input.schema.ts';
import { resolveServiceMutationAction } from '../../../spaces/mcp/utils/resolveServiceMutationAction.ts';
import { Infobox } from '../../Ui/Infobox/Infobox.tsx';
import styles from '../CreateManagedControlPlane/CreateManagedControlPlaneWizardContainer.module.css';
import { IdentityProvidersStep } from './IdentityProviders/IdentityProvidersStep.tsx';
import { ServiceSelectionStep } from './ServiceSelectionStep.tsx';
import { SummarizeStepV2 } from './SummarizeStepV2.tsx';

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
  useCreateCrossplane?: typeof _useCreateCrossplane;
  useUpdateCrossplane?: typeof _useUpdateCrossplane;
  useDeleteCrossplane?: typeof _useDeleteCrossplane;
  useCreateFlux?: typeof _useCreateFlux;
  useUpdateFlux?: typeof _useUpdateFlux;
  useDeleteFlux?: typeof _useDeleteFlux;
  useCreateLandscaper?: typeof _useCreateLandscaper;
  useUpdateLandscaper?: typeof _useUpdateLandscaper;
  useDeleteLandscaper?: typeof _useDeleteLandscaper;
  useCreateEso?: typeof _useCreateEso;
  useUpdateEso?: typeof _useUpdateEso;
  useDeleteEso?: typeof _useDeleteEso;
  useCreateOcm?: typeof _useCreateOcm;
  useUpdateOcm?: typeof _useUpdateOcm;
  useDeleteOcm?: typeof _useDeleteOcm;
  useCreateKro?: typeof _useCreateKro;
  useUpdateKro?: typeof _useUpdateKro;
  useDeleteKro?: typeof _useDeleteKro;
};

export type WizardStepType = 'metadata' | 'members' | 'componentSelection' | 'summarize' | 'success';

const wizardStepOrder: WizardStepType[] = ['metadata', 'members', 'componentSelection', 'summarize', 'success'];

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
  useCreateCrossplane = _useCreateCrossplane,
  useUpdateCrossplane = _useUpdateCrossplane,
  useDeleteCrossplane = _useDeleteCrossplane,
  useCreateFlux = _useCreateFlux,
  useUpdateFlux = _useUpdateFlux,
  useDeleteFlux = _useDeleteFlux,
  useCreateLandscaper = _useCreateLandscaper,
  useUpdateLandscaper = _useUpdateLandscaper,
  useDeleteLandscaper = _useDeleteLandscaper,
  useCreateEso = _useCreateEso,
  useUpdateEso = _useUpdateEso,
  useDeleteEso = _useDeleteEso,
  useCreateOcm = _useCreateOcm,
  useUpdateOcm = _useUpdateOcm,
  useDeleteOcm = _useDeleteOcm,
  useCreateKro = _useCreateKro,
  useUpdateKro = _useUpdateKro,
  useDeleteKro = _useDeleteKro,
}) => {
  const { t } = useTranslation();
  const telemetry = useTelemetry();
  const { user } = useAuthOnboarding();
  const errorDialogRef = useRef<ErrorDialogHandle>(null);
  const [selectedStep, setSelectedStep] = useState<WizardStepType>(initialSection ?? 'metadata');
  const [metadataFormKey, setMetadataFormKey] = useState(0);
  const [extraProviders, setExtraProviders] = useState<ExtraProviderMetadata[]>([]);

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExtraProviders([]);
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
  const { crossplaneData, isLoading: isCrossplaneKpiLoading } = useCrossplaneQuery(
    skipKpi ? '' : editName,
    skipKpi ? '' : editNs,
  );
  const { fluxData, isLoading: isFluxKpiLoading } = useFluxQuery(skipKpi ? '' : editName, skipKpi ? '' : editNs);
  const { landscaperData, isLoading: isLandscaperKpiLoading } = useLandscaperQuery(
    skipKpi ? '' : editName,
    skipKpi ? '' : editNs,
  );
  const { esoData, isLoading: isEsoKpiLoading } = useEsoQuery(skipKpi ? '' : editName, skipKpi ? '' : editNs);
  const { ocmData, isLoading: isOcmKpiLoading } = useOcmQuery(skipKpi ? '' : editName, skipKpi ? '' : editNs);
  const { kroData, isLoading: isKroKpiLoading } = useKroQuery(skipKpi ? '' : editName, skipKpi ? '' : editNs);

  // Gates submission so it never reads stale "was this installed" data.
  const isKpiLoading =
    !skipKpi &&
    (isCrossplaneKpiLoading ||
      isFluxKpiLoading ||
      isLandscaperKpiLoading ||
      isEsoKpiLoading ||
      isOcmKpiLoading ||
      isKroKpiLoading);

  // Prefill once per edit session, not per visit to the step, so it can't wipe user edits on back/forward nav.
  const hasPrefilledServicesRef = useRef(false);
  useEffect(() => {
    if (!isEditMode || skipKpi || isKpiLoading || hasPrefilledServicesRef.current) return;
    hasPrefilledServicesRef.current = true;

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
      ocm: ocmData ? { selected: ocmData.isInstalled, version: ocmData.version ?? '' } : undefined,
      kro: kroData ? { selected: kroData.isInstalled, version: kroData.version ?? '' } : undefined,
    });
  }, [isEditMode, skipKpi, isKpiLoading, crossplaneData, fluxData, landscaperData, esoData, ocmData, kroData]);

  // Service create/update/delete hooks (always called per rules of hooks)
  const { create: createCrossplane } = useCreateCrossplane();
  const { create: createFlux } = useCreateFlux();
  const { create: createLandscaper } = useCreateLandscaper();
  const { create: createEso } = useCreateEso();
  const { create: createOcm } = useCreateOcm();
  const { create: createKro } = useCreateKro();
  const { update: updateCrossplane } = useUpdateCrossplane();
  const { update: updateFlux } = useUpdateFlux();
  const { update: updateLandscaper } = useUpdateLandscaper();
  const { update: updateEso } = useUpdateEso();
  const { update: updateOcm } = useUpdateOcm();
  const { update: updateKro } = useUpdateKro();
  const { deleteCrossplane } = useDeleteCrossplane();
  const { deleteFlux } = useDeleteFlux();
  const { deleteLandscaper } = useDeleteLandscaper();
  const { deleteEso } = useDeleteEso();
  const { deleteOcm } = useDeleteOcm();
  const { deleteKro } = useDeleteKro();
  const name = useWatch({ control, name: 'name' });
  const displayName = useWatch({ control, name: 'displayName' });
  const members = useWatch({ control, name: 'members' });

  const hasNoAssignedMembers = useMemo(
    () => !hasAssignedIamMember(members ?? [], extraProviders),
    [members, extraProviders],
  );

  const rawInput = useMemo<McpV2Input>(() => {
    const { finalName } = buildNameWithPrefixesAndSuffixes(name, displayName, templateAffixes);
    const defaultProviderMembers = (members ?? []).filter((m) => !m.provider);
    const roleBindings = buildRoleBindingsForProviderMembers(defaultProviderMembers);
    const extraProvidersInput = extraProviders.map((p) => ({
      ...p,
      roleBindings: buildRoleBindingsForProviderMembers((members ?? []).filter((m) => m.provider === p.name)),
    }));
    return {
      name: finalName,
      namespace: `${projectName}--ws-${workspaceName}`,
      roleBindings,
      extraProviders: extraProvidersInput,
    };
  }, [name, displayName, templateAffixes, projectName, workspaceName, members, extraProviders]);

  const originalYamlString = useMemo(() => {
    if (!isEditMode || !initialData) return '';
    const { members: initMembers, extraProviders: initExtraProviders } = extractMcpV2FormState(initialData);
    const initDefaultMembers = initMembers.filter((m) => !m.provider);
    const originalInput: McpV2Input = {
      name: initialData.metadata.name,
      namespace: initialData.metadata.namespace,
      roleBindings: buildRoleBindingsForProviderMembers(initDefaultMembers),
      extraProviders: initExtraProviders.map((p) => ({
        ...p,
        roleBindings: buildRoleBindingsForProviderMembers(initMembers.filter((m) => m.provider === p.name)),
      })),
    };
    return stringify(buildMcpV2GraphQLInput(originalInput));
  }, [isEditMode, initialData]);

  const initialServices = useMemo(
    () => ({
      crossplane: !!crossplaneData?.isInstalled,
      flux: !!fluxData?.isInstalled,
      landscaper: !!landscaperData?.isInstalled,
      externalSecretsOperator: !!esoData?.isInstalled,
      ocm: !!ocmData?.isInstalled,
      kro: !!kroData?.isInstalled,
    }),
    [crossplaneData, fluxData, landscaperData, esoData, ocmData, kroData],
  );

  const initialCrossplaneProviders = useMemo(
    () =>
      (crossplaneData?.providers ?? [])
        .filter((p): p is { name: string; version: string | null } => !!p.name)
        .map((p) => p.name),
    [crossplaneData],
  );

  const handleCreateManagedControlPlane = useCallback(async (): Promise<boolean> => {
    try {
      const cpName = isEditMode ? (initialData?.metadata?.name ?? '') : rawInput.name;
      const cpNamespace = isEditMode ? (initialData?.metadata?.namespace ?? '') : rawInput.namespace;

      if (isEditMode) {
        await updateMcp({
          name: cpName,
          namespace: cpNamespace,
          roleBindings: rawInput.roleBindings,
          extraProviders: rawInput.extraProviders,
        });
      } else {
        await createMcp(rawInput);
      }

      // Named so a partial failure below can report which service(s) failed.
      const servicePromises: { name: string; promise: Promise<unknown> }[] = [];

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

      const crossplaneAction = resolveServiceMutationAction(
        isEditMode,
        !!crossplaneData?.isInstalled,
        !!services.crossplane?.selected,
      );
      if (crossplaneAction === 'create' || crossplaneAction === 'update') {
        const vars = {
          namespace: cpNamespace,
          object: {
            apiVersion: 'crossplane.services.open-control-plane.io/v1alpha1',
            kind: 'Crossplane',
            metadata: { name: cpName, namespace: cpNamespace },
            spec: {
              version: services.crossplane?.version || 'latest',
              providers: (services.crossplane?.providers ?? []).map((p) => ({
                name: p.name,
                version: p.version || 'latest',
              })),
            },
          },
        };
        servicePromises.push({
          name: 'Crossplane',
          promise: crossplaneAction === 'update' ? updateCrossplane({ ...vars, name: cpName }) : createCrossplane(vars),
        });
      } else if (crossplaneAction === 'delete') {
        servicePromises.push({
          name: 'Crossplane',
          promise: deleteCrossplane({ name: cpName, namespace: cpNamespace }),
        });
      }

      const fluxAction = resolveServiceMutationAction(isEditMode, !!fluxData?.isInstalled, !!services.flux?.selected);
      if (fluxAction === 'create' || fluxAction === 'update') {
        const vars = makeServiceObject(
          cpName,
          services.flux?.version ?? '',
          cpNamespace,
          'flux.services.open-control-plane.io/v1alpha1',
          'Flux',
        );
        servicePromises.push({
          name: 'Flux',
          promise: fluxAction === 'update' ? updateFlux({ ...vars, name: cpName }) : createFlux(vars),
        });
      } else if (fluxAction === 'delete') {
        servicePromises.push({ name: 'Flux', promise: deleteFlux({ name: cpName, namespace: cpNamespace }) });
      }

      const landscaperAction = resolveServiceMutationAction(
        isEditMode,
        !!landscaperData?.isInstalled,
        !!services.landscaper?.selected,
      );
      if (landscaperAction === 'create' || landscaperAction === 'update') {
        const vars = makeServiceObject(
          cpName,
          services.landscaper?.version ?? '',
          cpNamespace,
          'landscaper.services.open-control-plane.io/v1alpha2',
          'Landscaper',
        );
        servicePromises.push({
          name: 'Landscaper',
          promise: landscaperAction === 'update' ? updateLandscaper({ ...vars, name: cpName }) : createLandscaper(vars),
        });
      } else if (landscaperAction === 'delete') {
        servicePromises.push({
          name: 'Landscaper',
          promise: deleteLandscaper({ name: cpName, namespace: cpNamespace }),
        });
      }

      const esoAction = resolveServiceMutationAction(
        isEditMode,
        !!esoData?.isInstalled,
        !!services.externalSecretsOperator?.selected,
      );
      if (esoAction === 'create' || esoAction === 'update') {
        const vars = makeServiceObject(
          cpName,
          services.externalSecretsOperator?.version ?? '',
          cpNamespace,
          'external-secrets.services.open-control-plane.io/v1alpha1',
          'ExternalSecretsOperator',
        );
        servicePromises.push({
          name: 'ExternalSecretsOperator',
          promise: esoAction === 'update' ? updateEso({ ...vars, name: cpName }) : createEso(vars),
        });
      } else if (esoAction === 'delete') {
        servicePromises.push({
          name: 'ExternalSecretsOperator',
          promise: deleteEso({ name: cpName, namespace: cpNamespace }),
        });
      }

      const ocmAction = resolveServiceMutationAction(isEditMode, !!ocmData?.isInstalled, !!services.ocm?.selected);
      if (ocmAction === 'create' || ocmAction === 'update') {
        const vars = makeServiceObject(
          cpName,
          services.ocm?.version ?? '',
          cpNamespace,
          'ocm.services.open-control-plane.io/v1alpha1',
          'OCM',
        );
        servicePromises.push({
          name: 'OCM',
          promise: ocmAction === 'update' ? updateOcm({ ...vars, name: cpName }) : createOcm(vars),
        });
      } else if (ocmAction === 'delete') {
        servicePromises.push({ name: 'OCM', promise: deleteOcm({ name: cpName, namespace: cpNamespace }) });
      }

      const kroAction = resolveServiceMutationAction(isEditMode, !!kroData?.isInstalled, !!services.kro?.selected);
      if (kroAction === 'create' || kroAction === 'update') {
        const vars = makeServiceObject(
          cpName,
          services.kro?.version ?? '',
          cpNamespace,
          'kro.services.open-control-plane.io/v1alpha1',
          'KRO',
        );
        servicePromises.push({
          name: 'KRO',
          promise: kroAction === 'update' ? updateKro({ ...vars, name: cpName }) : createKro(vars),
        });
      } else if (kroAction === 'delete') {
        servicePromises.push({ name: 'KRO', promise: deleteKro({ name: cpName, namespace: cpNamespace }) });
      }

      const settledServices = await Promise.allSettled(servicePromises.map((s) => s.promise));
      const failedServices = settledServices
        .map((result, index) =>
          result.status === 'rejected' ? { name: servicePromises[index].name, reason: result.reason } : null,
        )
        .filter((failure): failure is { name: string; reason: unknown } => failure !== null);
      if (failedServices.length > 0) {
        const details = failedServices
          .map(({ name, reason }) => `${name}: ${reason instanceof Error ? reason.message : String(reason)}`)
          .join('; ');
        throw new Error(`Failed to apply changes for service(s): ${details}`);
      }

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
    ocmData,
    kroData,
    createCrossplane,
    createFlux,
    createLandscaper,
    createEso,
    createOcm,
    createKro,
    updateCrossplane,
    updateFlux,
    updateLandscaper,
    updateEso,
    updateOcm,
    updateKro,
    deleteCrossplane,
    deleteFlux,
    deleteLandscaper,
    deleteEso,
    deleteOcm,
    deleteKro,
  ]);

  const handleStepChange = useCallback((e: Ui5CustomEvent<WizardDomRef, WizardStepChangeEventDetail>) => {
    const step = (e.detail.step.dataset.step ?? '') as WizardStepType;
    setSelectedStep(step);
  }, []);

  const onNextClick = useCallback(() => {
    // Block all forward navigation in edit mode until the KPI queries resolve, so the Services
    // step can never be reached (or left) before it's been prefilled with the real installed
    // state — otherwise a late-arriving prefill can silently re-select a service the user meant
    // to leave unchecked, and it never gets deleted.
    if (isEditMode && isKpiLoading) return;
    // Mirrors the Next button's disabled state: no RBAC subject may end up assigned nowhere.
    if (selectedStep !== 'metadata' && selectedStep !== 'success' && hasNoAssignedMembers) return;
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
  }, [
    isEditMode,
    isKpiLoading,
    selectedStep,
    hasNoAssignedMembers,
    handleSubmit,
    setSelectedStep,
    handleCreateManagedControlPlane,
    resetFormAndClose,
    isSubmitting,
  ]);

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
          return (
            ((selectedStep === 'metadata' || selectedStep === 'members') && !isEditMode) ||
            !isValid ||
            hasNoAssignedMembers
          );
        case 'summarize':
          return (
            ((selectedStep === 'metadata' || selectedStep === 'members' || selectedStep === 'componentSelection') &&
              !isEditMode) ||
            !isValid ||
            hasNoAssignedMembers
          );
        case 'success':
          return selectedStep !== 'success';
        default:
          return false;
      }
    },
    [selectedStep, isValid, isEditMode, hasNoAssignedMembers],
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
    const { members, extraProviders: prefilledProviders } = extractMcpV2FormState(initialData);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExtraProviders(prefilledProviders);
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
                <Button
                  design="Emphasized"
                  disabled={
                    isSubmitting ||
                    (isEditMode && isKpiLoading) ||
                    (selectedStep !== 'metadata' && selectedStep !== 'success' && hasNoAssignedMembers)
                  }
                  onClick={onNextClick}
                >
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
            <IdentityProvidersStep
              members={members}
              providers={extraProviders}
              isValidationError={!!errors.members}
              workspaceName={workspaceName}
              projectName={projectName}
              onMembersChange={setMembers}
              onProvidersChange={setExtraProviders}
            />
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
            <SummarizeStepV2
              rawInput={rawInput}
              services={services}
              isEditMode={isEditMode}
              originalYamlString={originalYamlString}
              initialServices={isEditMode ? initialServices : undefined}
              initialCrossplaneProviders={isEditMode ? initialCrossplaneProviders : undefined}
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
    </>
  );
};

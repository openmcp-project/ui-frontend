import '@ui5/webcomponents-fiori/dist/illustrations/EmptyList.js';
import '@ui5/webcomponents-fiori/dist/illustrations/NoData.js';
import '@ui5/webcomponents-icons/dist/add.js';
import '@ui5/webcomponents-icons/dist/edit.js';
import { Button, Card, FlexBox, Icon, Title } from '@ui5/webcomponents-react';
import ConnectButton from '../ConnectButton/ConnectButton.tsx';
import TitleLevel from '@ui5/webcomponents/dist/types/TitleLevel.js';
import { useContext, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ControlPlaneListItem,
  ReadyStatus,
  flattenV1RoleBindings,
} from '../../../spaces/onboarding/types/ControlPlane.ts';
import { Workspace } from '../../../spaces/onboarding/types/Workspace.ts';
import MCPHealthPopoverButton from '../../ControlPlane/MCPHealthPopoverButton.tsx';
import { DeleteConfirmationDialog } from '../../Dialogs/DeleteConfirmationDialog.tsx';
import { KubectlDeleteMcpDialog } from '../../Dialogs/KubectlCommandInfo/KubectlDeleteMcpDialog.tsx';
import { YamlViewButton } from '../../Yaml/YamlViewButton.tsx';
import { YamlSidePanelWithGraphqlLoader } from '../../Yaml/YamlSidePanelWithGraphqlLoader.tsx';
import { useSplitter } from '../../Splitter/SplitterContext.tsx';
import { ApiConfigContext } from '../../Shared/k8s';
import { getControlPlaneV2Service, ServiceKey } from '../../../spaces/controlPlaneV2/helpers/controlPlaneV2Services.ts';
import { canConnectToMCP } from '../controlPlanes.ts';
import { ControlPlaneCardMenu } from './ControlPlaneCardMenu.tsx';
import { ControlPlaneCardMenuV2 } from './ControlPlaneCardMenuV2.tsx';
import { McpSupportInfoTag } from './McpSupportInfoTag.tsx';
import { EditManagedControlPlaneWizardDataLoader } from '../../Wizards/CreateManagedControlPlane/EditManagedControlPlaneWizardDataLoader.tsx';
import { EditControlPlaneV2WizardDataLoader } from '../../Wizards/CreateControlPlaneV2/EditControlPlaneV2WizardDataLoader.tsx';
import { DISPLAY_NAME_ANNOTATION } from '../../../lib/api/types/shared/keyNames.ts';
import { extractSupportInfo, resolveSupportInfo, SupportInfoCandidate } from '../../../lib/supportInfo.ts';
import { useDeleteManagedControlPlane as _useDeleteManagedControlPlane } from '../../../hooks/useDeleteManagedControlPlane.ts';
import { useDeleteControlPlaneV2GraphQL as _useDeleteManagedControlPlaneV2GraphQL } from '../../../spaces/controlPlaneV2/hooks/useDeleteControlPlaneV2GraphQL.ts';
import { useTelemetry } from '../../../lib/telemetry/telemetry.ts';
import { useFeatureToggle } from '../../../context/FeatureToggleContext.tsx';
import { DeprecatedLabel } from '../../Ui/DeprecatedLabel/DeprecatedLabel.tsx';
import ConnectButtonV2 from '../ConnectButton/ConnectButtonV2.tsx';
import type { McpV2Components } from '../../../spaces/controlPlaneV2/components/Kpi/useMcpV2ComponentsListQuery.ts';
import { flattenOidcRoleBindings } from '../../../spaces/controlPlaneV2/helpers/flattenOidcRoleBindings.ts';
import { ServiceIcon } from './ServiceIcon.tsx';
import { McpMembersAvatarView } from '../McpMembersAvatarView/McpMembersAvatarView.tsx';
import styles from './ControlPlaneCard.module.css';
import { generatePath, useNavigate } from 'react-router-dom';
import { Routes } from '../../../Routes.ts';
import { useManagedServicesQuery } from '../../../spaces/mcp/hooks/useManagedServicesQuery.ts';
import { latestAvailableVersion, getVersionDiff, VersionDiff } from '../../../utils/componentsVersions.ts';

import LogoCrossplane from '../../../assets/images/logo-crossplane.svg';
import LogoFlux from '../../../assets/images/logo-flux.svg';
import LogoLandscaper from '../../../assets/images/logo-landscaper.svg';
import LogoKyverno from '../../../assets/images/logo-kyverno.png';
import LogoEso from '../../../assets/images/logo-eso.svg';
import LogoOcm from '../../../assets/images/logo-ocm.svg';
import LogoKro from '../../../assets/images/logo-kro.svg';

interface Props {
  controlPlane: ControlPlaneListItem;
  workspace: Workspace;
  projectName: string;
  /** Nearest ancestor's resolved support info; used when the control plane sets none of its own. */
  parentSupportInfo?: SupportInfoCandidate;
  useDeleteManagedControlPlane?: typeof _useDeleteManagedControlPlane;
  useDeleteManagedControlPlaneV2GraphQL?: typeof _useDeleteManagedControlPlaneV2GraphQL;
  /** V2 only: component-install status, pre-fetched per workspace by the parent grid tile.
   * `undefined` while that fetch is still loading. */
  v2Components?: McpV2Components;
  isLoadingV2Components?: boolean;
}

type MCPWizardState = {
  isOpen: boolean;
  mode?: 'edit' | 'duplicate';
};

interface ComponentInfo {
  name: string;
  logo: string;
  installed: boolean;
  /** V2 only: raw `status.phase` of the service resource; drives the lifecycle badge. */
  phase?: string | null;
  /** V2 only: message from a failing `Ready` condition; drives the error state and its tooltip. */
  errorMessage?: string | null;
  /** V2 only: ISO timestamp since the service began reconciling (benign in-progress), for the tooltip. */
  reconcilingSince?: string | null;
  /** V2 only: identifies the service for the YAML side panel and the edit wizard. */
  serviceKey?: ServiceKey;
  /** V2 only: type of version bump available from catalog, or null if up-to-date. */
  updateDiff?: VersionDiff | null;
}

/** Maps McpV2Components keys to ManagedService catalog names. */
const SERVICE_CATALOG_NAME: Record<string, string> = {
  crossplane: 'crossplane',
  flux: 'flux',
  landscaper: 'landscaper',
  externalSecretsOperator: 'external-secrets-operator',
  ocm: 'ocm',
  kro: 'kro',
};

export const ControlPlaneCard = ({
  controlPlane,
  workspace,
  projectName,
  parentSupportInfo,
  useDeleteManagedControlPlane = _useDeleteManagedControlPlane,
  useDeleteManagedControlPlaneV2GraphQL = _useDeleteManagedControlPlaneV2GraphQL,
  v2Components,
  isLoadingV2Components = false,
}: Props) => {
  const { markMcpV1asDeprecated, showLandscaperCard } = useFeatureToggle();
  const { services: catalogServices } = useManagedServicesQuery();
  const [dialogDeleteMcpIsOpen, setDialogDeleteMcpIsOpen] = useState(false);
  const [isEditV2WizardOpen, setIsEditV2WizardOpen] = useState(false);
  // Service to focus when the V2 edit wizard is opened from a service's YAML panel.
  const [editV2WizardService, setEditV2WizardService] = useState<ServiceKey | undefined>(undefined);
  const { openInAsideWithApiConfig } = useSplitter();
  const apiConfig = useContext(ApiConfigContext);
  const [managedControlPlaneWizardState, setManagedControlPlaneWizardState] = useState<MCPWizardState>({
    isOpen: false,
    mode: undefined,
  });

  const handleIsManagedControlPlaneWizardOpen = (isOpen: boolean, mode?: 'edit' | 'duplicate') => {
    setManagedControlPlaneWizardState({ isOpen, mode });
  };

  const { deleteManagedControlPlane } = useDeleteManagedControlPlane(
    controlPlane.metadata.namespace,
    controlPlane.metadata.name,
  );

  const { deleteManagedControlPlaneV2 } = useDeleteManagedControlPlaneV2GraphQL(
    controlPlane.metadata.namespace,
    controlPlane.metadata.name,
  );
  const telemetry = useTelemetry();

  const name = controlPlane.metadata.name;
  const { t } = useTranslation();
  const displayName = controlPlane.metadata.annotations?.[DISPLAY_NAME_ANNOTATION];
  const namespace = controlPlane.metadata.namespace;
  const isConnectButtonEnabled = canConnectToMCP(controlPlane);

  const isV2 = controlPlane.version === 'v2';
  const navigate = useNavigate();

  // V1 components and role bindings come with the `GetMCPsList` result — no per-card fetch
  // (unlike V2, whose component status lives in separate CRs).
  const v1Spec = controlPlane.version === 'v1' ? controlPlane.spec : undefined;
  const mcpComponents = v1Spec?.components;
  const v1RoleBindings = useMemo(() => flattenV1RoleBindings(v1Spec?.authorization?.roleBindings), [v1Spec]);
  // V2 install status is pre-fetched by the parent grid tile; `undefined` = not yet resolved.
  const mcpV2Components = v2Components;

  const v2RoleBindings = useMemo(() => {
    if (!isV2) return undefined;
    return flattenOidcRoleBindings(controlPlane.spec?.iam?.oidc);
  }, [isV2, controlPlane]);

  const components = useMemo<ComponentInfo[]>(() => {
    const getUpdateDiff = (componentKey: string, componentStatus: { version?: string | null } | undefined) => {
      if (!componentStatus?.version) return null;
      const catalogName = SERVICE_CATALOG_NAME[componentKey];
      const catalogVersions = catalogServices.find((s) => s.name === catalogName)?.versions.map((v) => v.version) ?? [];
      const newerVersion = latestAvailableVersion(componentStatus.version, catalogVersions, {
        sameMajorOnly: catalogName === 'crossplane',
      });
      return newerVersion ? getVersionDiff(componentStatus.version, newerVersion) : null;
    };

    if (isV2) {
      return [
        {
          name: 'Crossplane',
          logo: LogoCrossplane,
          installed: !!mcpV2Components?.crossplane,
          phase: mcpV2Components?.crossplane?.phase,
          errorMessage: mcpV2Components?.crossplane?.errorMessage,
          reconcilingSince: mcpV2Components?.crossplane?.reconcilingSince,
          serviceKey: 'crossplane',
          updateDiff: getUpdateDiff('crossplane', mcpV2Components?.crossplane),
        },
        {
          name: 'Flux',
          logo: LogoFlux,
          installed: !!mcpV2Components?.flux,
          phase: mcpV2Components?.flux?.phase,
          errorMessage: mcpV2Components?.flux?.errorMessage,
          reconcilingSince: mcpV2Components?.flux?.reconcilingSince,
          serviceKey: 'flux',
          updateDiff: getUpdateDiff('flux', mcpV2Components?.flux),
        },
        ...(showLandscaperCard || !!mcpV2Components?.landscaper
          ? [
              {
                name: 'Landscaper',
                logo: LogoLandscaper,
                installed: !!mcpV2Components?.landscaper,
                phase: mcpV2Components?.landscaper?.phase,
                errorMessage: mcpV2Components?.landscaper?.errorMessage,
                reconcilingSince: mcpV2Components?.landscaper?.reconcilingSince,
                serviceKey: 'landscaper' as const,
                updateDiff: getUpdateDiff('landscaper', mcpV2Components?.landscaper),
              },
            ]
          : []),
        {
          name: 'External Secrets Operator',
          logo: LogoEso,
          installed: !!mcpV2Components?.externalSecretsOperator,
          phase: mcpV2Components?.externalSecretsOperator?.phase,
          errorMessage: mcpV2Components?.externalSecretsOperator?.errorMessage,
          reconcilingSince: mcpV2Components?.externalSecretsOperator?.reconcilingSince,
          serviceKey: 'externalSecretsOperator',
          updateDiff: getUpdateDiff('externalSecretsOperator', mcpV2Components?.externalSecretsOperator),
        },
        {
          name: 'OCM',
          logo: LogoOcm,
          installed: !!mcpV2Components?.ocm,
          phase: mcpV2Components?.ocm?.phase,
          errorMessage: mcpV2Components?.ocm?.errorMessage,
          reconcilingSince: mcpV2Components?.ocm?.reconcilingSince,
          serviceKey: 'ocm',
          updateDiff: getUpdateDiff('ocm', mcpV2Components?.ocm),
        },
        {
          name: 'KRO',
          logo: LogoKro,
          installed: !!mcpV2Components?.kro,
          phase: mcpV2Components?.kro?.phase,
          errorMessage: mcpV2Components?.kro?.errorMessage,
          reconcilingSince: mcpV2Components?.kro?.reconcilingSince,
          serviceKey: 'kro',
          updateDiff: getUpdateDiff('kro', mcpV2Components?.kro),
        },
      ];
    }
    return [
      { name: 'Crossplane', logo: LogoCrossplane, installed: !!mcpComponents?.crossplane },
      { name: 'Flux', logo: LogoFlux, installed: !!mcpComponents?.flux },
      ...(showLandscaperCard || !!mcpComponents?.landscaper
        ? [{ name: 'Landscaper', logo: LogoLandscaper, installed: !!mcpComponents?.landscaper }]
        : []),
      { name: 'Kyverno', logo: LogoKyverno, installed: !!mcpComponents?.kyverno },
      { name: 'External Secrets Operator', logo: LogoEso, installed: !!mcpComponents?.externalSecretsOperator },
    ];
  }, [isV2, mcpComponents, mcpV2Components, showLandscaperCard, catalogServices]);

  const installedComponents = useMemo(() => components.filter((c) => c.installed), [components]);

  const openEditV2Wizard = (serviceKey?: ServiceKey) => {
    setEditV2WizardService(serviceKey);
    setIsEditV2WizardOpen(true);
  };

  const openServiceYamlPanel = (serviceKey: ServiceKey) => {
    const { yamlComponent } = getControlPlaneV2Service(serviceKey);
    telemetry.track({ category: 'yaml', action: 'viewed', resourceType: yamlComponent });
    openInAsideWithApiConfig(
      <YamlSidePanelWithGraphqlLoader
        component={yamlComponent}
        mcpName={name}
        mcpNamespace={namespace}
        toolbarContent={
          <Button
            icon="edit"
            design="Transparent"
            data-testid="service-yaml-edit-button"
            onClick={() => openEditV2Wizard(serviceKey)}
          >
            {t('buttons.edit')}
          </Button>
        }
      />,
      apiConfig,
    );
  };

  return (
    <>
      <Card key={`${name}--${namespace}`} className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.titleSection}>
            <FlexBox direction="Column" className={styles.titleContent}>
              <Title level={TitleLevel.H5} className={styles.title}>
                {displayName ? displayName : name}
              </Title>
              <span className={`${styles.kindLabel} mono-font`}>{isV2 ? 'ControlPlane' : 'ManagedControlPlane'}</span>
            </FlexBox>
          </div>

          <div className={styles.headerActions}>
            {isV2 && (
              <McpSupportInfoTag
                namespace={namespace}
                resourceName={name}
                resolved={resolveSupportInfo(
                  extractSupportInfo(controlPlane.metadata.annotations),
                  parentSupportInfo ? [parentSupportInfo] : [],
                )}
              />
            )}
            <MCPHealthPopoverButton
              mcpStatus={controlPlane.status}
              projectName={projectName}
              workspaceName={workspace.metadata.name ?? ''}
              mcpName={controlPlane.metadata.name}
              source="card"
              creationTimestamp={controlPlane.metadata.creationTimestamp}
            />
          </div>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.componentsRow}>
            <div className={styles.componentIcons}>
              {isV2 && isLoadingV2Components ? (
                <>
                  <div
                    className={`${styles.componentIcon} ${styles.componentIconSkeleton}`}
                    data-testid="component-skeleton"
                  />
                  <div
                    className={`${styles.componentIcon} ${styles.componentIconSkeleton}`}
                    data-testid="component-skeleton"
                  />
                  <div
                    className={`${styles.componentIcon} ${styles.componentIconSkeleton}`}
                    data-testid="component-skeleton"
                  />
                </>
              ) : (
                <>
                  {installedComponents.map((component) => (
                    <ServiceIcon
                      key={component.name}
                      name={component.name}
                      logo={component.logo}
                      phase={component.phase}
                      errorMessage={component.errorMessage}
                      reconcilingSince={component.reconcilingSince}
                      updateDiff={component.updateDiff}
                      lifecycleEnabled={isV2}
                      title={component.name}
                      onClick={() => {
                        if (isV2 && component.serviceKey) {
                          openServiceYamlPanel(component.serviceKey);
                        } else if (isV2) {
                          openEditV2Wizard();
                        } else {
                          handleIsManagedControlPlaneWizardOpen(true, 'edit');
                        }
                      }}
                    />
                  ))}
                  {installedComponents.length === 0 && (isV2 ? mcpV2Components !== undefined : true) && (
                    <button
                      className={`${styles.componentIcon} ${styles.addComponentPlaceholder}`}
                      data-testid="add-component-button"
                      title={t('ControlPlaneCard.installComponents')}
                      onClick={() => {
                        if (isV2) {
                          // V2 edit can't add components yet — route to the MCP page to install there.
                          navigate(
                            generatePath(Routes.McpV2, {
                              projectName,
                              workspaceName: workspace.metadata.name ?? '',
                              controlPlaneName: name,
                            }),
                          );
                        } else {
                          handleIsManagedControlPlaneWizardOpen(true, 'edit');
                        }
                      }}
                    >
                      <Icon name="add" className={styles.addComponentIcon} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {markMcpV1asDeprecated && !isV2 && (
            <div className={styles.deprecatedSection}>
              <DeprecatedLabel />
            </div>
          )}
        </div>

        <div className={styles.cardFooter}>
          <div className={styles.footerLeft}>
            {!isV2 && (
              <ControlPlaneCardMenu
                setDialogDeleteMcpIsOpen={setDialogDeleteMcpIsOpen}
                isDeleteMcpButtonDisabled={controlPlane.status?.status === ReadyStatus.InDeletion}
                setIsEditManagedControlPlaneWizardOpen={handleIsManagedControlPlaneWizardOpen}
                controlPlaneName={name}
                namespace={controlPlane.status?.access?.namespace ?? ''}
                secretName={controlPlane.status?.access?.name ?? ''}
                secretKey={controlPlane.status?.access?.key ?? ''}
              />
            )}
            {isV2 && (
              <ControlPlaneCardMenuV2
                setDialogDeleteMcpIsOpen={setDialogDeleteMcpIsOpen}
                isDeleteMcpButtonDisabled={controlPlane.status?.status === ReadyStatus.InDeletion}
                setIsEditManagedControlPlaneWizardOpen={(open) => {
                  setEditV2WizardService(undefined);
                  setIsEditV2WizardOpen(open);
                }}
                controlPlaneName={name}
                mcpNamespace={controlPlane.metadata.namespace}
                access={controlPlane.status?.access}
              />
            )}
            <YamlViewButton
              variant="loader"
              workspaceName={controlPlane.metadata.namespace}
              resourceName={controlPlane.metadata.name}
              resourceType={isV2 ? 'controlplanes' : 'managedcontrolplanes'}
            />
            <McpMembersAvatarView roleBindings={isV2 ? v2RoleBindings : v1RoleBindings} compact />
          </div>

          <div className={styles.footerRight}>
            {isV2 ? (
              <ConnectButtonV2
                controlPlaneName={name}
                projectName={projectName}
                workspaceName={workspace.metadata.name ?? ''}
                access={controlPlane.status?.access}
                disabled={controlPlane.status?.status !== ReadyStatus.Ready}
                loading={!controlPlane.status}
              />
            ) : (
              <ConnectButton
                disabled={!isConnectButtonEnabled}
                controlPlaneName={name}
                projectName={projectName}
                workspaceName={workspace.metadata.name ?? ''}
                namespace={controlPlane.status?.access?.namespace ?? ''}
                secretName={controlPlane.status?.access?.name ?? ''}
                secretKey={controlPlane.status?.access?.key ?? ''}
              />
            )}
          </div>
        </div>
      </Card>

      {!isV2 && (
        <DeleteConfirmationDialog
          resourceName={controlPlane.metadata.name}
          kubectlDialog={({ isOpen, onClose }) => (
            <KubectlDeleteMcpDialog
              projectName={projectName}
              workspaceName={workspace.metadata.name}
              resourceName={controlPlane.metadata.name}
              isOpen={isOpen}
              onClose={onClose}
            />
          )}
          isOpen={dialogDeleteMcpIsOpen}
          setIsOpen={setDialogDeleteMcpIsOpen}
          onDeletionConfirmed={async () => {
            telemetry.track({ category: 'controlplane', action: 'deleted', source: 'v1-card' });
            await deleteManagedControlPlane();
          }}
        />
      )}
      {isV2 && (
        <DeleteConfirmationDialog
          resourceName={controlPlane.metadata.name}
          isOpen={dialogDeleteMcpIsOpen}
          setIsOpen={setDialogDeleteMcpIsOpen}
          onDeletionConfirmed={async () => {
            telemetry.track({ category: 'controlplane', action: 'deleted', source: 'v2-card' });
            await deleteManagedControlPlaneV2();
          }}
        />
      )}
      <div
        data-testid={managedControlPlaneWizardState.isOpen ? 'v1-wizard-open' : undefined}
        className={styles.wizardAnchor}
      >
        <EditManagedControlPlaneWizardDataLoader
          isOpen={managedControlPlaneWizardState.isOpen}
          setIsOpen={(isOpen) => handleIsManagedControlPlaneWizardOpen(isOpen)}
          workspaceName={namespace}
          resourceName={name}
          mode={managedControlPlaneWizardState.mode}
        />
      </div>
      {controlPlane.version === 'v2' && (
        <div data-testid={isEditV2WizardOpen ? 'v2-wizard-open' : undefined} className={styles.wizardAnchor}>
          <EditControlPlaneV2WizardDataLoader
            isOpen={isEditV2WizardOpen}
            setIsOpen={setIsEditV2WizardOpen}
            namespace={namespace}
            resourceName={name}
            initialSection={editV2WizardService ? 'componentSelection' : undefined}
            initialService={editV2WizardService}
          />
        </div>
      )}
    </>
  );
};

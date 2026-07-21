import '@ui5/webcomponents-fiori/dist/illustrations/EmptyList.js';
import '@ui5/webcomponents-fiori/dist/illustrations/NoData.js';
import '@ui5/webcomponents-icons/dist/delete';
import { Card, FlexBox, Title } from '@ui5/webcomponents-react';
import ConnectButton from '../ConnectButton/ConnectButton.tsx';
import TitleLevel from '@ui5/webcomponents/dist/types/TitleLevel.js';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ControlPlaneListItem, ReadyStatus } from '../../../spaces/onboarding/types/ControlPlane.ts';
import { Workspace } from '../../../spaces/onboarding/types/Workspace.ts';
import MCPHealthPopoverButton from '../../ControlPlane/MCPHealthPopoverButton.tsx';
import { DeleteConfirmationDialog } from '../../Dialogs/DeleteConfirmationDialog.tsx';
import { KubectlDeleteMcpDialog } from '../../Dialogs/KubectlCommandInfo/KubectlDeleteMcpDialog.tsx';
import { YamlViewButton } from '../../Yaml/YamlViewButton.tsx';
import { canConnectToMCP } from '../controlPlanes.ts';
import { ControlPlaneCardMenu } from './ControlPlaneCardMenu.tsx';
import { ControlPlaneCardMenuV2 } from './ControlPlaneCardMenuV2.tsx';
import { EditManagedControlPlaneWizardDataLoader } from '../../Wizards/CreateManagedControlPlane/EditManagedControlPlaneWizardDataLoader.tsx';
import { EditControlPlaneV2WizardDataLoader } from '../../Wizards/CreateControlPlaneV2/EditControlPlaneV2WizardDataLoader.tsx';
import { DISPLAY_NAME_ANNOTATION } from '../../../lib/api/types/shared/keyNames.ts';
import { useDeleteManagedControlPlane as _useDeleteManagedControlPlane } from '../../../hooks/useDeleteManagedControlPlane.ts';
import { useDeleteControlPlaneV2GraphQL as _useDeleteManagedControlPlaneV2GraphQL } from '../../../spaces/controlPlaneV2/hooks/useDeleteControlPlaneV2GraphQL.ts';
import { useTelemetry } from '../../../lib/telemetry/telemetry.ts';
import { useFeatureToggle } from '../../../context/FeatureToggleContext.tsx';
import { DeprecatedLabel } from '../../Ui/DeprecatedLabel/DeprecatedLabel.tsx';
import ConnectButtonV2 from '../ConnectButton/ConnectButtonV2.tsx';
import { useMcpComponents } from './useMcpComponents.ts';
import { McpMembersAvatarView } from '../McpMembersAvatarView/McpMembersAvatarView.tsx';
import styles from './ControlPlaneCard.module.css';

import LogoCrossplane from '../../../assets/images/logo-crossplane.svg';
import LogoFlux from '../../../assets/images/logo-flux.svg';
import LogoLandscaper from '../../../assets/images/logo-landscaper.svg';
import LogoKyverno from '../../../assets/images/logo-kyverno.png';
import LogoEso from '../../../assets/images/logo-eso.svg';

interface Props {
  controlPlane: ControlPlaneListItem;
  workspace: Workspace;
  projectName: string;
  useDeleteManagedControlPlane?: typeof _useDeleteManagedControlPlane;
  useDeleteManagedControlPlaneV2GraphQL?: typeof _useDeleteManagedControlPlaneV2GraphQL;
}

type MCPWizardState = {
  isOpen: boolean;
  mode?: 'edit' | 'duplicate';
};

interface ComponentInfo {
  name: string;
  logo: string;
  installed: boolean;
  version?: string;
}

export const ControlPlaneCard = ({
  controlPlane,
  workspace,
  projectName,
  useDeleteManagedControlPlane = _useDeleteManagedControlPlane,
  useDeleteManagedControlPlaneV2GraphQL = _useDeleteManagedControlPlaneV2GraphQL,
}: Props) => {
  const { markMcpV1asDeprecated } = useFeatureToggle();
  const [dialogDeleteMcpIsOpen, setDialogDeleteMcpIsOpen] = useState(false);
  const [isEditV2WizardOpen, setIsEditV2WizardOpen] = useState(false);
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

  const { components: mcpComponents, roleBindings } = useMcpComponents(projectName, workspace.metadata.name, name);

  const components = useMemo<ComponentInfo[]>(() => {
    return [
      {
        name: 'Crossplane',
        logo: LogoCrossplane,
        installed: !!mcpComponents?.crossplane,
        version: mcpComponents?.crossplane?.version,
      },
      {
        name: 'Flux',
        logo: LogoFlux,
        installed: !!mcpComponents?.flux,
        version: mcpComponents?.flux?.version,
      },
      {
        name: 'Landscaper',
        logo: LogoLandscaper,
        installed: !!mcpComponents?.landscaper,
      },
      {
        name: 'Kyverno',
        logo: LogoKyverno,
        installed: !!mcpComponents?.kyverno,
        version: mcpComponents?.kyverno?.version,
      },
      {
        name: 'External Secrets Operator',
        logo: LogoEso,
        installed: !!mcpComponents?.externalSecretsOperator,
        version: mcpComponents?.externalSecretsOperator?.version,
      },
    ];
  }, [mcpComponents]);

  const installedComponents = useMemo(() => components.filter((c) => c.installed), [components]);

  const getStatusColor = () => {
    const status = controlPlane.status?.status ?? controlPlane.status?.phase;
    switch (status) {
      case ReadyStatus.Ready:
        return 'success';
      case ReadyStatus.NotReady:
        return 'error';
      case ReadyStatus.Progressing:
        return 'warning';
      case ReadyStatus.InDeletion:
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  return (
    <>
      <Card key={`${name}--${namespace}`} className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.titleSection}>
            <div className={`${styles.statusIndicator} ${styles[getStatusColor()]}`} />
            <FlexBox direction="Column" className={styles.titleContent}>
              <Title level={TitleLevel.H5} className={styles.title}>
                {displayName ? displayName : name}
              </Title>
              <span className={`${styles.kindLabel} mono-font`}>
                {controlPlane.version === 'v2' ? 'ControlPlane' : 'ManagedControlPlane'}
              </span>
            </FlexBox>
          </div>

          <div className={styles.headerActions}>
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
          <McpMembersAvatarView roleBindings={roleBindings} project={projectName} workspace={workspace.metadata.name} />

          <div className={styles.componentsRow}>
            <span className={styles.rowLabel}>
              {t('ControlPlaneCard.installedComponents', {
                count: installedComponents.length,
                defaultValue: 'Content ({{count}})',
              })}
            </span>
            <div className={styles.componentIcons}>
              {installedComponents.map((component) => (
                <div key={component.name} className={styles.componentIcon} title={component.name}>
                  <img src={component.logo} alt={component.name} className={styles.componentLogo} />
                </div>
              ))}
            </div>
          </div>

          {markMcpV1asDeprecated && controlPlane.version !== 'v2' && (
            <div className={styles.deprecatedSection}>
              <DeprecatedLabel />
            </div>
          )}
        </div>

        <div className={styles.cardFooter}>
          <div className={styles.footerLeft}>
            {controlPlane.version !== 'v2' && (
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
            {controlPlane.version === 'v2' && (
              <ControlPlaneCardMenuV2
                setDialogDeleteMcpIsOpen={setDialogDeleteMcpIsOpen}
                isDeleteMcpButtonDisabled={controlPlane.status?.status === ReadyStatus.InDeletion}
                setIsEditManagedControlPlaneWizardOpen={setIsEditV2WizardOpen}
                controlPlaneName={name}
                mcpNamespace={controlPlane.metadata.namespace}
                oidcOpenmcpSecretName={controlPlane.status?.access?.oidc_openmcp?.name}
              />
            )}
            <YamlViewButton
              variant="loader"
              workspaceName={controlPlane.metadata.namespace}
              resourceName={controlPlane.metadata.name}
              resourceType={controlPlane.version === 'v2' ? 'controlplanes' : 'managedcontrolplanes'}
            />
          </div>

          <div className={styles.footerRight}>
            {controlPlane.version === 'v2' ? (
              <ConnectButtonV2
                controlPlaneName={name}
                projectName={projectName}
                workspaceName={workspace.metadata.name ?? ''}
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

      {controlPlane.version !== 'v2' && (
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
            telemetry.track({ name: 'controlplane.deleted', source: 'v1-card' });
            await deleteManagedControlPlane();
          }}
        />
      )}
      {controlPlane.version === 'v2' && (
        <DeleteConfirmationDialog
          resourceName={controlPlane.metadata.name}
          isOpen={dialogDeleteMcpIsOpen}
          setIsOpen={setDialogDeleteMcpIsOpen}
          onDeletionConfirmed={async () => {
            telemetry.track({ name: 'controlplane.deleted', source: 'v2-card' });
            await deleteManagedControlPlaneV2();
          }}
        />
      )}
      <EditManagedControlPlaneWizardDataLoader
        isOpen={managedControlPlaneWizardState.isOpen}
        setIsOpen={(isOpen) => handleIsManagedControlPlaneWizardOpen(isOpen)}
        workspaceName={namespace}
        resourceName={name}
        mode={managedControlPlaneWizardState.mode}
      />
      {controlPlane.version === 'v2' && (
        <EditControlPlaneV2WizardDataLoader
          isOpen={isEditV2WizardOpen}
          setIsOpen={setIsEditV2WizardOpen}
          namespace={namespace}
          resourceName={name}
        />
      )}
    </>
  );
};

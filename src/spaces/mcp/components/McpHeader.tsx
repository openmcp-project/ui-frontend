import { ControlPlaneType } from '../../../lib/api/types/crate/controlPlanes.ts';

import styles from './McpHeader.module.css';
import { formatDateAsTimeAgo } from '../../../utils/i18n/timeAgo.ts';
import { useTranslation } from 'react-i18next';
import { MembersAvatarView } from '../../../components/ControlPlanes/List/MembersAvatarView.tsx';
import { ObjectStatus } from '@ui5/webcomponents-react';
import MCPHealthPopoverButton from '../../../components/ControlPlane/MCPHealthPopoverButton.tsx';

export interface McpHeaderProps {
  mcp: ControlPlaneType;
}

export function McpHeader({ mcp }: McpHeaderProps) {
  const { t } = useTranslation();

  const created = new Date().toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const createdBy = 'name.name@domain.com';

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        <span className={styles.label}>Name</span>
        <span>MCP Name</span>

        <span className={styles.label}>Created On</span>
        <span>{created} (3 days ago)</span>

        {createdBy ? (
          <>
            <span className={styles.label}>Created By</span>
            <span>{createdBy}</span>
          </>
        ) : null}
      </div>

      <div className={styles.tile}>
        <span className={styles.tileHeader}>Status</span>

        <MCPHealthPopoverButton
          large
          mcpStatus={{
            access: '{key: "kubeconfig", name: "playground-mcp.kubeconfi…}',
            conditions: [
              {
                lastTransitionTime: '2025-09-29T12:56:09Z',
                message: '[Reconcile: Succeeded] Shoot cluster has been successfully reconciled.',
                reason: null,
                status: 'True',
                type: 'APIServerHealthy',
              },
              {
                lastTransitionTime: '2025-09-30T08:24:41Z',
                message: null,
                reason: null,
                status: 'True',
                type: 'AuthenticationHealthy',
              },
              {
                lastTransitionTime: '2025-09-30T08:24:42Z',
                message: null,
                reason: null,
                status: 'True',
                type: 'AuthorizationHealthy',
              },
              {
                lastTransitionTime: '2025-09-30T08:25:43Z',
                message:
                  "The ControlPlane resource is not ready yet.\nThe following ControlPlane conditions are not 'True':\n\tProviderBtpReady: UnhealthyPackageRevision: cannot establish control of object: entitlements.account.btp.sap.crossplane.io is already controlled by ProviderRevision provider-btp-89c57f416d95 (UID 11176c65-7c71-448a-8f72-96e3b8fa4177)\n",
                reason: 'WaitingForCloudOrchestrator',
                status: 'False',
                type: 'CloudOrchestratorHealthy',
              },
              {
                lastTransitionTime: '2025-09-30T07:56:31Z',
                message: 'Crossplane is healthy.',
                reason: 'Healthy',
                status: 'True',
                type: 'CrossplaneReady',
              },
              {
                lastTransitionTime: '2025-09-30T07:56:31Z',
                message: 'ExternalSecretsOperator is healthy.',
                reason: 'Healthy',
                status: 'True',
                type: 'ExternalSecretsOperatorReady',
              },
              {
                lastTransitionTime: '2025-09-30T07:56:31Z',
                message: 'Flux is healthy.',
                reason: 'Healthy',
                status: 'True',
                type: 'FluxReady',
              },
              {
                lastTransitionTime: '2025-09-30T07:56:31Z',
                message: 'Kyverno is healthy.',
                reason: 'Healthy',
                status: 'True',
                type: 'KyvernoReady',
              },
              {
                lastTransitionTime: '2025-09-30T08:25:43Z',
                message:
                  'UnhealthyPackageRevision: cannot establish control of object: entitlements.account.btp.sap.crossplane.io is already controlled by ProviderRevision provider-btp-89c57f416d95 (UID 11176c65-7c71-448a-8f72-96e3b8fa4177)',
                reason: 'Unhealthy',
                status: 'False',
                type: 'ProviderBtpReady',
              },
              {
                lastTransitionTime: '2025-09-30T07:57:31Z',
                message: 'ProviderKubernetes is healthy.',
                reason: 'Healthy',
                status: 'True',
                type: 'ProviderKubernetesReady',
              },
              {
                lastTransitionTime: '2025-09-30T07:56:31Z',
                message: null,
                reason: 'Available',
                status: 'True',
                type: 'Ready',
              },
              {
                lastTransitionTime: '2025-09-30T08:24:41Z',
                message: 'LandscaperDeployment phase: Succeeded',
                reason: null,
                status: 'True',
                type: 'LandscaperHealthy',
              },
              {
                lastTransitionTime: '2025-08-01T02:52:19Z',
                message: null,
                reason: 'AllComponentsReconciledSuccessfully',
                status: 'True',
                type: 'MCPSuccessful',
              },
            ],
            status: 'Not Ready',
          }}
          projectName="webapp-playground"
          workspaceName="development"
          mcpName="playground-mcp"
        />
      </div>

      <div className={styles.tile}>
        <span className={styles.tileHeader}>Members (14)</span>
        <MembersAvatarView
          members={[
            { kind: 'User', name: 'lasse.friedrich@sap.com' },
            { kind: 'User', name: 'johannes.ott@sap.com' },
            { kind: 'User', name: 'valentin.gerlach@sap.com' },
            { kind: 'User', name: 'enrico.kaack@sap.com' },
            { kind: 'User', name: 'caroline.schaefer@sap.com' },
            { kind: 'User', name: 'moritz.marby@sap.com' },
            { kind: 'User', name: 'ingo.kober@sap.com' },
            { kind: 'User', name: 'maximilian.braun@sap.com' },
            { kind: 'User', name: 'lukasz.goral@sap.com' },
            { kind: 'User', name: 'fabian.wolski@sap.com' },
            { kind: 'User', name: 'hubert.szczepanski@sap.com' },
            { kind: 'User', name: 'andreas.kienle@sap.com' },
            { kind: 'User', name: 'bozhidara.hristova@sap.com' },
            { kind: 'User', name: 'anna.helmke@sap.com' },
          ]}
          project="webapp-playground"
          workspace="development"
        />
      </div>
    </div>
  );
}

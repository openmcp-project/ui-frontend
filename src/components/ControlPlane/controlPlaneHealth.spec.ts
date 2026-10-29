import { describe, expect, it } from 'vitest';
import type { ControlPlaneCondition } from '../../spaces/onboarding/types/ControlPlane.ts';
import {
  accessEntryLabel,
  deriveControlPlaneHealth,
  humanizeConditionType,
  isProblemReason,
} from './controlPlaneHealth';

const cond = (type: string, status: 'True' | 'False', reason = '', message = ''): ControlPlaneCondition => ({
  type,
  status,
  reason,
  message,
  lastTransitionTime: '2026-10-20T10:00:00Z',
});

const healthy: ControlPlaneCondition[] = [
  cond('Meta', 'True'),
  cond('ClusterRequestReady', 'True', 'ClusterRequestGranted', 'ClusterRequest is ready'),
  cond('ClusterConditionsSynced', 'True'),
  cond('Cluster.Gardener_APIServerAvailable', 'True'),
  cond('Cluster.ShootManagement', 'True'),
  cond('AccessReady.oidc_openmcp', 'True'),
  cond('AccessReady.token_ci', 'True'),
  cond('AllAccessReady', 'True', '', 'All accesses are ready'),
];

const groupIds = (h: ReturnType<typeof deriveControlPlaneHealth>) => h.groups.map((g) => g.id);

describe('helpers', () => {
  it('detects problem reasons', () => {
    expect(isProblemReason('ConfigurationProblem')).toBe(true);
    expect(isProblemReason('PlatformClusterInteractionProblem')).toBe(true);
    expect(isProblemReason('InternalError')).toBe(true);
    expect(isProblemReason('WaitingForClusterRequest')).toBe(false);
    expect(isProblemReason('')).toBe(false);
  });

  it('humanizes condition types', () => {
    expect(humanizeConditionType('Cluster.Gardener_APIServerAvailable')).toBe('API server available');
    expect(humanizeConditionType('Cluster.ShootManagement')).toBe('Shoot management');
    expect(humanizeConditionType('Cluster.Gardener_ControlPlaneHealthy')).toBe('Control plane healthy');
  });

  it('labels access entries', () => {
    expect(accessEntryLabel('oidc_openmcp').key).toBe('ControlPlaneStatus.accessDefaultIdp');
    expect(accessEntryLabel('oidc_github')).toEqual({
      key: 'ControlPlaneStatus.accessIdp',
      params: { name: 'github' },
    });
    expect(accessEntryLabel('token_ci')).toEqual({ key: 'ControlPlaneStatus.accessToken', params: { name: 'ci' } });
  });
});

describe('deriveControlPlaneHealth', () => {
  it('returns unknown without any status', () => {
    expect(deriveControlPlaneHealth({}).state).toBe('unknown');
  });

  it('is ready when phase is Ready and every signal is ok', () => {
    const health = deriveControlPlaneHealth({
      phase: 'Ready',
      conditions: healthy,
      services: { crossplane: { phase: 'Ready' }, flux: { phase: 'Ready' } },
    });
    expect(health.state).toBe('ready');
    expect(health.headline.label.key).toBe('ControlPlaneStatus.headlineReady');
    expect(groupIds(health)).toEqual(['cluster', 'access', 'services']);
    expect(health.groups.every((g) => g.tone === 'ok' && g.items.length === 0)).toBe(true);
    expect(health.groups.find((g) => g.id === 'services')?.summary.params).toEqual({ count: 2, total: 2 });
  });

  it('reports waiting for the cluster as setting up with pending later stages', () => {
    const health = deriveControlPlaneHealth({
      phase: 'Progressing',
      conditions: [
        cond('Meta', 'True'),
        cond('ClusterRequestReady', 'False', 'WaitingForClusterRequest', 'ClusterRequest is not ready yet'),
      ],
    });
    expect(health.state).toBe('settingUp');
    expect(health.headline.label.key).toBe('ControlPlaneStatus.headlineClusterProvisioning');
    expect(health.headline.detail).toBe('ClusterRequest is not ready yet');
    const access = health.groups.find((g) => g.id === 'access');
    expect(access?.tone).toBe('pending');
  });

  it('lists only failing mirrored cluster conditions with readable labels', () => {
    const health = deriveControlPlaneHealth({
      phase: 'Progressing',
      conditions: healthy.map((c) =>
        c.type === 'Cluster.Gardener_APIServerAvailable'
          ? cond(c.type, 'False', 'HealthzRequestFailed', 'API server not reachable')
          : c,
      ),
    });
    const cluster = health.groups.find((g) => g.id === 'cluster');
    expect(cluster?.tone).toBe('progress');
    expect(cluster?.items).toHaveLength(1);
    expect(cluster?.items[0].label.params).toEqual({ name: 'API server available' });
    expect(health.state).toBe('settingUp');
  });

  it('flags problem reasons as attention needed even though phase is Progressing', () => {
    const health = deriveControlPlaneHealth({
      phase: 'Progressing',
      conditions: [
        ...healthy.filter((c) => c.type !== 'AllAccessReady'),
        cond('AllAccessReady', 'False', 'ConfigurationProblem', 'invalid OIDC issuer'),
      ],
    });
    expect(health.state).toBe('attention');
    expect(health.headline.label.key).toBe('ControlPlaneStatus.headlineAccessProblem');
    expect(health.headline.detail).toBe('invalid OIDC issuer');
  });

  it('counts per-entry access readiness', () => {
    const health = deriveControlPlaneHealth({
      phase: 'Progressing',
      conditions: [
        ...healthy.filter((c) => c.type !== 'AccessReady.token_ci' && c.type !== 'AllAccessReady'),
        cond('AccessReady.token_ci', 'False', 'WaitingForAccessRequest', 'AccessRequest is not ready yet'),
        cond('AllAccessReady', 'False', 'WaitingForAccessRequest'),
      ],
    });
    const access = health.groups.find((g) => g.id === 'access');
    expect(access?.summary).toEqual({ key: 'ControlPlaneStatus.accessPartial', params: { ready: 1, total: 2 } });
    expect(access?.items.map((i) => i.id)).toEqual(['AccessReady.token_ci']);
    expect(health.headline.label.key).toBe('ControlPlaneStatus.headlineAccessPreparing');
  });

  it('keeps a Ready control plane in setting up while a service installs', () => {
    const health = deriveControlPlaneHealth({
      phase: 'Ready',
      conditions: healthy,
      services: { crossplane: { phase: 'Ready' }, flux: { phase: 'Progressing' } },
    });
    expect(health.state).toBe('settingUp');
    expect(health.headline.label.key).toBe('ControlPlaneStatus.headlineServicesInstalling');
    expect(health.groups.find((g) => g.id === 'services')?.summary.params).toEqual({ ready: 1, total: 2 });
  });

  it('treats an unrecognised service phase as a problem', () => {
    const health = deriveControlPlaneHealth({
      phase: 'Ready',
      conditions: healthy,
      services: { flux: { phase: 'Failed' } },
    });
    expect(health.state).toBe('attention');
    expect(health.headline.label.key).toBe('ControlPlaneStatus.headlineServicesProblem');
  });

  it('surfaces Meta and unknown condition types under platform only when not ok', () => {
    const health = deriveControlPlaneHealth({
      phase: 'Progressing',
      conditions: [...healthy, cond('SomethingNew', 'False', 'Waiting')],
    });
    expect(groupIds(health)[0]).toBe('platform');
    expect(health.groups[0].items[0].label.params).toEqual({ name: 'Something new' });
  });

  it('shows deletion steps in order while terminating', () => {
    const health = deriveControlPlaneHealth({
      phase: 'Terminating',
      deletionTimestamp: '2026-10-26T08:00:00Z',
      conditions: [
        cond('AllServicesDeleted', 'False', 'WaitingForServiceDeletion', 'Waiting for services: crossplane'),
        cond('Meta', 'False', 'WaitingForNamespaceDeletion'),
      ],
    });
    expect(health.state).toBe('deleting');
    expect(groupIds(health)).toEqual(['deletion']);
    expect(health.groups[0].items.map((i) => i.tone)).toEqual(['progress', 'pending', 'pending']);
    expect(health.headline.detail).toBe('Waiting for services: crossplane');
  });

  it('marks deletion as deleting from the deletionTimestamp even before the phase flips', () => {
    expect(deriveControlPlaneHealth({ phase: 'Ready', conditions: healthy, deletionTimestamp: 'x' }).state).toBe(
      'deleting',
    );
  });
});

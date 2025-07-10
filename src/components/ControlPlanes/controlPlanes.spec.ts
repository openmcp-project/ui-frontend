import { describe, it, expect } from 'vitest';

import { ControlPlaneType, ControlPlaneStatusCondition, ReadyStatus } from '../../lib/api/types/crate/controlPlanes';
import { canConnectToMCP } from './controlPlanes';

const createCondition = (overrides: Partial<ControlPlaneStatusCondition>): ControlPlaneStatusCondition => ({
  type: 'Unknown',
  status: false,
  reason: 'DefaultReason',
  message: 'Default message',
  lastTransitionTime: new Date().toISOString(),
  ...overrides,
});

const createControlPlane = (conditions: ControlPlaneStatusCondition[]): ControlPlaneType => ({
  metadata: {
    name: '',
    namespace: '',
  },
  spec: {
    authentication: {
      enableSystemIdentityProvider: true,
    },
    components: {
      crossplane: undefined,
      btpServiceOperator: undefined,
      externalSecretsOperator: undefined,
      kyverno: undefined,
      flux: undefined,
    },
  },
  status: {
    conditions,
    status: ReadyStatus.Ready,
    access: undefined,
  },
});

const baseConditions = [
  createCondition({ type: 'APIServerHealthy', status: 'True' }),
  createCondition({ type: 'AuthenticationHealthy', status: 'True' }),
  createCondition({ type: 'AuthorizationHealthy', status: 'True' }),
];

describe('canConnectToMCP', () => {
  it('returns true when all required conditions are True', () => {
    const controlPlane = createControlPlane([...baseConditions]);
    expect(canConnectToMCP(controlPlane)).toBe(true);
  });

  it('returns false when one required condition is missing', () => {
    const controlPlane = createControlPlane([
      createCondition({ type: 'APIServerHealthy', status: 'True' }),
      createCondition({ type: 'AuthorizationHealthy', status: 'True' }),
    ]);
    expect(canConnectToMCP(controlPlane)).toBe(false);
  });

  it('returns false when one required condition has status "False"', () => {
    const controlPlane = createControlPlane([
      createCondition({ type: 'APIServerHealthy', status: 'True' }),
      createCondition({ type: 'AuthenticationHealthy', status: 'False' }),
      createCondition({ type: 'AuthorizationHealthy', status: 'True' }),
    ]);
    expect(canConnectToMCP(controlPlane)).toBe(false);
  });

  it('returns true even if other conditions exist', () => {
    const controlPlane = createControlPlane([
      ...baseConditions,
      createCondition({ type: 'SomethingElse', status: 'True' }),
    ]);
    expect(canConnectToMCP(controlPlane)).toBe(true);
  });

  it('returns true when required statuses are lowercase', () => {
    const controlPlane = createControlPlane(
      baseConditions.map((c) => ({
        ...c,
        status: 'true',
      })),
    );
    expect(canConnectToMCP(controlPlane)).toBe(true);
  });

  it('returns true when required statuses are boolean', () => {
    const controlPlane = createControlPlane(
      baseConditions.map((c) => ({
        ...c,
        status: true,
      })),
    );
    expect(canConnectToMCP(controlPlane)).toBe(true);
  });

  it('returns false when there are no conditions', () => {
    const controlPlane = createControlPlane([]);
    expect(canConnectToMCP(controlPlane)).toBe(false);
  });

  it('returns false when status field is missing', () => {
    const controlPlane = {
      metadata: {
        name: '',
        namespace: '',
      },
      spec: {
        components: {
          crossplane: undefined,
          btpServiceOperator: undefined,
          externalSecretsOperator: undefined,
          kyverno: undefined,
          flux: undefined,
        },
      },
    } as ControlPlaneType;
    expect(canConnectToMCP(controlPlane)).toBe(false);
  });
});

import {
  EGRESS_IP_ANNOTATION,
  EGRESS_IP_ENABLED_ANNOTATION,
  EGRESS_IP_READY_CONDITION,
} from './api/types/shared/keyNames.ts';

export interface EgressIpInfo {
  enabled: boolean;
  /** Reserved static IP, once the platform has reported it. */
  ip?: string;
  ready: boolean;
  /** Reason of the `EgressIPReady` condition while not ready (e.g. `ClusterNotReady`). */
  reason?: string;
}

interface Condition {
  type: string;
  status: string;
  reason?: string | null;
}

export function isEgressIpEnabled(annotations: Record<string, string> | null | undefined): boolean {
  return (annotations ?? {})[EGRESS_IP_ENABLED_ANNOTATION] === 'true';
}

/**
 * Reads the Static Egress IP state of a v2 ControlPlane. Returns `undefined` when the
 * feature is neither enabled nor reported, so callers can hide the field entirely.
 */
export function extractEgressIpInfo(
  annotations: Record<string, string> | null | undefined,
  conditions: Condition[] | null | undefined,
): EgressIpInfo | undefined {
  const ip = (annotations ?? {})[EGRESS_IP_ANNOTATION] || undefined;
  const enabled = isEgressIpEnabled(annotations);
  if (!enabled && !ip) return undefined;
  const condition = (conditions ?? []).find((c) => c.type === EGRESS_IP_READY_CONDITION);
  const ready = condition ? condition.status === 'True' : !!ip;
  return {
    enabled: enabled || !!ip,
    ip,
    ready,
    reason: !ready ? condition?.reason || undefined : undefined,
  };
}

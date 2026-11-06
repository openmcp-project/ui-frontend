import { describe, expect, it } from 'vitest';
import { extractEgressIpInfo, isEgressIpEnabled } from './egressIp.ts';
import { EGRESS_IP_ANNOTATION, EGRESS_IP_ENABLED_ANNOTATION } from './api/types/shared/keyNames.ts';

describe('isEgressIpEnabled', () => {
  it('is true only for the literal "true" annotation value', () => {
    expect(isEgressIpEnabled({ [EGRESS_IP_ENABLED_ANNOTATION]: 'true' })).toBe(true);
    expect(isEgressIpEnabled({ [EGRESS_IP_ENABLED_ANNOTATION]: 'false' })).toBe(false);
    expect(isEgressIpEnabled({})).toBe(false);
    expect(isEgressIpEnabled(undefined)).toBe(false);
  });
});

describe('extractEgressIpInfo', () => {
  it('returns undefined when the feature is not enabled', () => {
    expect(extractEgressIpInfo({}, [])).toBeUndefined();
  });

  it('returns the reserved IP when ready', () => {
    expect(
      extractEgressIpInfo({ [EGRESS_IP_ENABLED_ANNOTATION]: 'true', [EGRESS_IP_ANNOTATION]: '34.90.123.45' }, [
        { type: 'EgressIPReady', status: 'True', reason: 'Ready' },
      ]),
    ).toEqual({ enabled: true, ip: '34.90.123.45', ready: true, reason: undefined });
  });

  it('reports the condition reason while not ready', () => {
    expect(
      extractEgressIpInfo({ [EGRESS_IP_ENABLED_ANNOTATION]: 'true' }, [
        { type: 'EgressIPReady', status: 'False', reason: 'ClusterNotReady' },
      ]),
    ).toEqual({ enabled: true, ip: undefined, ready: false, reason: 'ClusterNotReady' });
  });

  it('treats enabled without condition or IP as pending', () => {
    expect(extractEgressIpInfo({ [EGRESS_IP_ENABLED_ANNOTATION]: 'true' }, undefined)).toEqual({
      enabled: true,
      ip: undefined,
      ready: false,
      reason: undefined,
    });
  });
});

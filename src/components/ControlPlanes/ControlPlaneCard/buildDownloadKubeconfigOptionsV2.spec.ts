import { describe, it, expect } from 'vitest';
import { buildDownloadKubeconfigOptionsV2 } from './buildDownloadKubeconfigOptionsV2';
import type { ControlPlaneStatus } from '../../../spaces/onboarding/types/ControlPlane.ts';

type Access = ControlPlaneStatus['access'];

describe('buildDownloadKubeconfigOptionsV2', () => {
  it('returns an empty array for undefined access', () => {
    expect(buildDownloadKubeconfigOptionsV2(undefined)).toEqual([]);
  });

  it('returns a single system option', () => {
    const access = { oidc_openmcp: { name: 'secret-openmcp' } } satisfies Access;

    expect(buildDownloadKubeconfigOptionsV2(access)).toEqual([
      { idpKey: 'oidc_openmcp', user: 'openmcp', isSystemIdP: true, secretName: 'secret-openmcp' },
    ]);
  });

  it('orders the system IdP first, then custom IdPs, with the correct secret name per key', () => {
    const access = {
      'oidc_my-corp-idp': { name: 'secret-corp' },
      oidc_openmcp: { name: 'secret-openmcp' },
      oidc_partner: { name: 'secret-partner' },
    } satisfies Access;

    expect(buildDownloadKubeconfigOptionsV2(access)).toEqual([
      { idpKey: 'oidc_openmcp', user: 'openmcp', isSystemIdP: true, secretName: 'secret-openmcp' },
      { idpKey: 'oidc_my-corp-idp', user: 'my-corp-idp', isSystemIdP: false, secretName: 'secret-corp' },
      { idpKey: 'oidc_partner', user: 'partner', isSystemIdP: false, secretName: 'secret-partner' },
    ]);
  });

  it('filters out oidc entries without a secret name', () => {
    const access = {
      oidc_openmcp: { name: 'secret-openmcp' },
      oidc_reconciling: {},
    } satisfies Access;

    const result = buildDownloadKubeconfigOptionsV2(access);

    expect(result).toHaveLength(1);
    expect(result[0].idpKey).toBe('oidc_openmcp');
  });

  it('ignores non-oidc access fields (key/name/namespace/kubeconfig)', () => {
    // The runtime shape carries flat V1-style fields alongside the dynamic oidc_ keys;
    // the .catchall-derived type can't express that mix, so build it as a plain object.
    const access = {
      key: 'some-key',
      name: 'some-name',
      namespace: 'some-namespace',
      kubeconfig: 'some-kubeconfig',
      oidc_openmcp: { name: 'secret-openmcp' },
    } as unknown as Access;

    const result = buildDownloadKubeconfigOptionsV2(access);

    expect(result).toHaveLength(1);
    expect(result[0].idpKey).toBe('oidc_openmcp');
  });
});

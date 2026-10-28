import type { ControlPlaneStatus } from '../../../spaces/onboarding/types/ControlPlane.ts';

const OIDC_PREFIX = 'oidc_';
const SYSTEM_IDP_KEY = 'oidc_openmcp';
const SYSTEM_IDP_USER = 'openmcp';

export interface DownloadKubeconfigOption {
  idpKey: string;
  user: string;
  isSystemIdP: boolean;
  secretName: string;
}

/**
 * Builds the per-IdP kubeconfig download options from a V2 ControlPlane's `status.access` map.
 */
export function buildDownloadKubeconfigOptionsV2(
  access: ControlPlaneStatus['access'] | undefined,
): DownloadKubeconfigOption[] {
  if (!access) {
    return [];
  }

  const oidcKeys = Object.keys(access).filter((key) => key.startsWith(OIDC_PREFIX) && !!access[key]?.name);
  const systemKeys = oidcKeys.filter((key) => key === SYSTEM_IDP_KEY);
  const customKeys = oidcKeys.filter((key) => key !== SYSTEM_IDP_KEY);

  return [
    ...systemKeys.map((key) => ({
      idpKey: key,
      user: SYSTEM_IDP_USER,
      isSystemIdP: true,
      secretName: access[key]!.name!,
    })),
    ...customKeys.map((key) => ({
      idpKey: key,
      user: key.slice(OIDC_PREFIX.length),
      isSystemIdP: false,
      secretName: access[key]!.name!,
    })),
  ];
}

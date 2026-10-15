import { generatePath } from 'react-router-dom';
import { Routes } from '../../../Routes.ts';
import type { ControlPlaneStatus } from '../../../spaces/onboarding/types/ControlPlane.ts';
import type { ConnectOption } from './buildConnectOptions.ts';

const OIDC_PREFIX = 'oidc_';
const SYSTEM_IDP_KEY = 'oidc_openmcp';
const SYSTEM_IDP_USER = 'openmcp';

/**
 * Builds the connect options for a V2 ControlPlane from its `status.access` map.
 * Unlike V1 (which parses kubeconfig contexts), V2 exposes one access entry per IdP,
 * keyed `oidc_<providerName>` — the system IdP is `oidc_openmcp`, the rest are custom.
 * The system option navigates without `?idp`; custom options pass the bare provider name.
 */
export function buildConnectOptionsV2(
  access: ControlPlaneStatus['access'] | undefined,
  projectName: string,
  workspaceName: string,
  controlPlaneName: string,
): ConnectOption[] {
  if (!access) {
    return [];
  }

  const basePath = generatePath(Routes.McpV2, { projectName, workspaceName, controlPlaneName });
  const buildUrl = (idp?: string) => {
    const params = new URLSearchParams({ version: 'v2', ...(idp ? { idp } : {}) });
    return `${basePath}?${params.toString()}`;
  };

  // Only offer IdPs whose access entry carries a secret name — a keyed-but-nameless entry
  // (still reconciling, or a provider removed from spec) would dead-end in McpContext.
  const oidcKeys = Object.keys(access).filter((key) => key.startsWith(OIDC_PREFIX) && !!access[key]?.name);
  const systemKeys = oidcKeys.filter((key) => key === SYSTEM_IDP_KEY);
  const customKeys = oidcKeys.filter((key) => key !== SYSTEM_IDP_KEY);

  return [
    ...systemKeys.map(() => ({
      name: SYSTEM_IDP_KEY,
      user: SYSTEM_IDP_USER,
      url: buildUrl(),
      isSystemIdP: true,
    })),
    ...customKeys.map((key) => {
      const providerName = key.slice(OIDC_PREFIX.length);
      return {
        name: key,
        user: providerName,
        url: buildUrl(providerName),
        isSystemIdP: false,
      };
    }),
  ];
}

import LogoCrossplane from '../../../assets/images/logo-crossplane.svg';
import LogoEso from '../../../assets/images/logo-eso.svg';
import LogoFlux from '../../../assets/images/logo-flux.svg';
import LogoKro from '../../../assets/images/logo-kro.svg';
import LogoLandscaper from '../../../assets/images/logo-landscaper.svg';
import LogoMetricsOperator from '../../../assets/images/logo-metrics.svg';
import LogoOcm from '../../../assets/images/logo-ocm.svg';
import type { McpComponentKind } from '../../../components/Yaml/YamlViewButton.tsx';
import type { CrossplaneServiceEntry, ServiceSelection } from '../../mcp/schemas/mcpV2Input.schema.ts';

export type ServiceKey = keyof ServiceSelection;

export interface ControlPlaneV2ServiceDef {
  key: ServiceKey;
  labelKey: string;
  logo: string;
  /** Name of the service in the managed-services catalog (used to look up available versions). */
  serviceName: string;
  apiVersion: string;
  kind: string;
  /** Component identifier understood by the YAML side panel loader. */
  yamlComponent: McpComponentKind;
}

export const CONTROL_PLANE_V2_SERVICES: ControlPlaneV2ServiceDef[] = [
  {
    key: 'crossplane',
    labelKey: 'ServiceSelectionStep.crossplane',
    logo: LogoCrossplane,
    serviceName: 'crossplane',
    apiVersion: 'crossplane.services.open-control-plane.io/v1alpha1',
    kind: 'Crossplane',
    yamlComponent: 'crossplane',
  },
  {
    key: 'flux',
    labelKey: 'ServiceSelectionStep.flux',
    logo: LogoFlux,
    serviceName: 'flux',
    apiVersion: 'flux.services.open-control-plane.io/v1alpha1',
    kind: 'Flux',
    yamlComponent: 'flux',
  },
  {
    key: 'landscaper',
    labelKey: 'ServiceSelectionStep.landscaper',
    logo: LogoLandscaper,
    serviceName: 'landscaper',
    apiVersion: 'landscaper.services.open-control-plane.io/v1alpha2',
    kind: 'Landscaper',
    yamlComponent: 'landscaper',
  },
  {
    key: 'externalSecretsOperator',
    labelKey: 'ServiceSelectionStep.externalSecretsOperator',
    logo: LogoEso,
    serviceName: 'external-secrets-operator',
    apiVersion: 'external-secrets.services.open-control-plane.io/v1alpha1',
    kind: 'ExternalSecretsOperator',
    yamlComponent: 'eso',
  },
  {
    key: 'ocm',
    labelKey: 'ServiceSelectionStep.ocm',
    logo: LogoOcm,
    serviceName: 'ocm',
    apiVersion: 'ocm.services.open-control-plane.io/v1alpha1',
    kind: 'OCM',
    yamlComponent: 'ocm',
  },
  {
    key: 'kro',
    labelKey: 'ServiceSelectionStep.kro',
    logo: LogoKro,
    serviceName: 'kro',
    apiVersion: 'kro.services.open-control-plane.io/v1alpha1',
    kind: 'KRO',
    yamlComponent: 'kro',
  },
  {
    key: 'metricsOperator',
    labelKey: 'ServiceSelectionStep.metricsOperator',
    logo: LogoMetricsOperator,
    serviceName: 'metrics-operator',
    apiVersion: 'metrics.services.open-control-plane.io/v1alpha1',
    kind: 'MetricsOperator',
    yamlComponent: 'metrics-operator',
  },
];

export function getControlPlaneV2Service(key: ServiceKey): ControlPlaneV2ServiceDef {
  return CONTROL_PLANE_V2_SERVICES.find((s) => s.key === key)!;
}

// Landscaper is toggle-gated; callers decide whether it should be offered.
export function getVisibleControlPlaneV2Services(showLandscaper: boolean): ControlPlaneV2ServiceDef[] {
  return showLandscaper ? CONTROL_PLANE_V2_SERVICES : CONTROL_PLANE_V2_SERVICES.filter((s) => s.key !== 'landscaper');
}

/**
 * Builds the service custom resource exactly as the wizard submits it, so the YAML preview and
 * the create/update mutation payload can never drift apart.
 */
export function buildServiceResource(
  key: ServiceKey,
  entry: ServiceSelection[ServiceKey],
  name: string,
  namespace: string,
) {
  const { apiVersion, kind } = getControlPlaneV2Service(key);
  const version = entry?.version || 'latest';
  return {
    apiVersion,
    kind,
    metadata: { name, namespace },
    spec:
      key === 'crossplane'
        ? {
            version,
            providers: ((entry as CrossplaneServiceEntry | undefined)?.providers ?? []).map((p) => ({
              name: p.name,
              version: p.version || 'latest',
            })),
          }
        : { version },
  };
}

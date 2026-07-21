import { useMemo } from 'react';
import { useCrossplaneQuery } from '../../../spaces/controlPlaneV2/components/Kpi/useCrossplaneQuery';
import { useFluxQuery } from '../../../spaces/controlPlaneV2/components/Kpi/useFluxQuery';
import { useLandscaperQuery } from '../../../spaces/controlPlaneV2/components/Kpi/useLandscaperQuery';
import { useEsoQuery } from '../../../spaces/controlPlaneV2/components/Kpi/useEsoQuery';

interface ComponentVersion {
  version?: string | null;
}

export interface McpV2Components {
  crossplane?: ComponentVersion;
  flux?: ComponentVersion;
  landscaper?: ComponentVersion;
  externalSecretsOperator?: ComponentVersion;
}

/**
 * Returns installed-service data for a v2 ControlPlane card using the four
 * GraphQL queries the detail page already makes. `components` is `null` while
 * any query is still loading so callers can show a skeleton.
 *
 * Pass `skip = true` for v1 cards to avoid firing unnecessary requests.
 */
export function useMcpV2Components(name: string, namespace: string, skip = false) {
  const effectiveName = skip ? '' : name;
  const effectiveNs = skip ? '' : namespace;

  const { crossplaneData, isLoading: isLoadingCrossplane } = useCrossplaneQuery(effectiveName, effectiveNs);
  const { fluxData, isLoading: isLoadingFlux } = useFluxQuery(effectiveName, effectiveNs);
  const { landscaperData, isLoading: isLoadingLandscaper } = useLandscaperQuery(effectiveName, effectiveNs);
  const { esoData, isLoading: isLoadingEso } = useEsoQuery(effectiveName, effectiveNs);

  const isLoading = isLoadingCrossplane || isLoadingFlux || isLoadingLandscaper || isLoadingEso;

  const components = useMemo<McpV2Components | null>(() => {
    if (isLoading) return null;
    return {
      ...(crossplaneData?.isInstalled ? { crossplane: { version: crossplaneData.version } } : {}),
      ...(fluxData?.isInstalled ? { flux: { version: fluxData.version } } : {}),
      ...(landscaperData?.isInstalled ? { landscaper: { version: landscaperData.version } } : {}),
      ...(esoData?.isInstalled ? { externalSecretsOperator: { version: esoData.version } } : {}),
    };
  }, [isLoading, crossplaneData, fluxData, landscaperData, esoData]);

  return { components, isLoading };
}

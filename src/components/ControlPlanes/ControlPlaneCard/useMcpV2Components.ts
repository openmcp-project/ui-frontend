import { useMemo } from 'react';
import { useCrossplaneQuery } from '../../../spaces/controlPlaneV2/components/Kpi/useCrossplaneQuery';
import { useFluxQuery } from '../../../spaces/controlPlaneV2/components/Kpi/useFluxQuery';
import { useLandscaperQuery } from '../../../spaces/controlPlaneV2/components/Kpi/useLandscaperQuery';
import { useEsoQuery } from '../../../spaces/controlPlaneV2/components/Kpi/useEsoQuery';
import { useOcmQuery } from '../../../spaces/controlPlaneV2/components/Kpi/useOcmQuery';
import { useKroQuery } from '../../../spaces/controlPlaneV2/components/Kpi/useKroQuery';

export interface McpV2Components {
  crossplane?: true;
  flux?: true;
  landscaper?: true;
  externalSecretsOperator?: true;
  ocm?: true;
  kro?: true;
}

/** `components` is `null` while loading; pass `skip = true` for v1 cards. */
export function useMcpV2Components(name: string, namespace: string, skip = false) {
  const effectiveName = skip ? '' : name;
  const effectiveNs = skip ? '' : namespace;

  const { crossplaneData, isLoading: isLoadingCrossplane } = useCrossplaneQuery(effectiveName, effectiveNs);
  const { fluxData, isLoading: isLoadingFlux } = useFluxQuery(effectiveName, effectiveNs);
  const { landscaperData, isLoading: isLoadingLandscaper } = useLandscaperQuery(effectiveName, effectiveNs);
  const { esoData, isLoading: isLoadingEso } = useEsoQuery(effectiveName, effectiveNs);
  const { ocmData, isLoading: isLoadingOcm } = useOcmQuery(effectiveName, effectiveNs);
  const { kroData, isLoading: isLoadingKro } = useKroQuery(effectiveName, effectiveNs);

  const isLoading =
    isLoadingCrossplane || isLoadingFlux || isLoadingLandscaper || isLoadingEso || isLoadingOcm || isLoadingKro;

  const components = useMemo<McpV2Components | null>(() => {
    if (isLoading) return null;
    return {
      ...(crossplaneData?.isInstalled ? { crossplane: true as const } : {}),
      ...(fluxData?.isInstalled ? { flux: true as const } : {}),
      ...(landscaperData?.isInstalled ? { landscaper: true as const } : {}),
      ...(esoData?.isInstalled ? { externalSecretsOperator: true as const } : {}),
      ...(ocmData?.isInstalled ? { ocm: true as const } : {}),
      ...(kroData?.isInstalled ? { kro: true as const } : {}),
    };
  }, [isLoading, crossplaneData, fluxData, landscaperData, esoData, ocmData, kroData]);

  return { components, isLoading };
}

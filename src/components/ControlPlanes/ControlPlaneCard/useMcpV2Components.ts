import { useCrossplaneQuery } from '../../../spaces/controlPlaneV2/components/Kpi/useCrossplaneQuery';
import { useFluxQuery } from '../../../spaces/controlPlaneV2/components/Kpi/useFluxQuery';
import { useLandscaperQuery } from '../../../spaces/controlPlaneV2/components/Kpi/useLandscaperQuery';
import { useEsoQuery } from '../../../spaces/controlPlaneV2/components/Kpi/useEsoQuery';

interface ComponentVersion {
  version?: string | null;
}

interface McpV2Components {
  crossplane?: ComponentVersion;
  flux?: ComponentVersion;
  landscaper?: ComponentVersion;
  externalSecretsOperator?: ComponentVersion;
}

/**
 * Returns installed-component data for a v2 ControlPlane card using the same
 * four GraphQL queries the detail page (ControlPlanePageV2) already makes.
 * Returns `null` while loading so callers can skip rendering the content row.
 */
export function useMcpV2Components(name: string, namespace: string, skip = false) {
  const { crossplaneData, isLoading: isLoadingCrossplane } = useCrossplaneQuery(
    skip ? '' : name,
    skip ? '' : namespace,
  );
  const { fluxData, isLoading: isLoadingFlux } = useFluxQuery(skip ? '' : name, skip ? '' : namespace);
  const { landscaperData, isLoading: isLoadingLandscaper } = useLandscaperQuery(
    skip ? '' : name,
    skip ? '' : namespace,
  );
  const { esoData, isLoading: isLoadingEso } = useEsoQuery(skip ? '' : name, skip ? '' : namespace);

  const isLoading = isLoadingCrossplane || isLoadingFlux || isLoadingLandscaper || isLoadingEso;

  if (isLoading) {
    return { components: null, isLoading };
  }

  const components: McpV2Components = {
    ...(crossplaneData?.isInstalled ? { crossplane: { version: crossplaneData.version } } : {}),
    ...(fluxData?.isInstalled ? { flux: { version: fluxData.version } } : {}),
    ...(landscaperData?.isInstalled ? { landscaper: { version: landscaperData.version } } : {}),
    ...(esoData?.isInstalled ? { externalSecretsOperator: { version: esoData.version } } : {}),
  };

  return { components, isLoading };
}

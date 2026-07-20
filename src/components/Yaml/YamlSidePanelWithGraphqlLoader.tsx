import { useTranslation } from 'react-i18next';
import { parse } from 'yaml';

import IllustratedError from '../Shared/IllustratedError.tsx';
import Loading from '../Shared/Loading.tsx';
import { useCrossplaneYamlQuery } from '../../spaces/mcp/hooks/useCrossplaneYamlQuery.ts';
import { useEsoYamlQuery } from '../../spaces/mcp/hooks/useEsoYamlQuery.ts';
import { useFluxYamlQuery } from '../../spaces/mcp/hooks/useFluxYamlQuery.ts';
import { useLandscaperYamlQuery } from '../../spaces/mcp/hooks/useLandscaperYamlQuery.ts';
import { Resource } from '../../utils/removeManagedFieldsAndFilterData.ts';
import { buildYamlFilename } from './buildYamlFilename.ts';
import { YamlSidePanel } from './YamlSidePanel.tsx';
import type { McpComponentKind } from './YamlViewButton.tsx';

export interface YamlSidePanelWithGraphqlLoaderProps {
  component: McpComponentKind;
  mcpName: string;
  mcpNamespace: string;
}

export function YamlSidePanelWithGraphqlLoader({
  component,
  mcpName,
  mcpNamespace,
}: YamlSidePanelWithGraphqlLoaderProps) {
  const { t } = useTranslation();

  // All four hooks are called unconditionally (rules of hooks); exactly one
  // is not skipped, so only one network request actually fires.
  const crossplane = useCrossplaneYamlQuery(mcpName, mcpNamespace, component !== 'crossplane');
  const flux = useFluxYamlQuery(mcpName, mcpNamespace, component !== 'flux');
  const landscaper = useLandscaperYamlQuery(mcpName, mcpNamespace, component !== 'landscaper');
  const eso = useEsoYamlQuery(mcpName, mcpNamespace, component !== 'eso');

  const { yaml, isLoading, error } = { crossplane, flux, landscaper, eso }[component];

  if (isLoading) return <Loading />;
  if (error || !yaml) return <IllustratedError details={t('common.cannotLoadData')} />;

  let resource: Resource;
  try {
    resource = parse(yaml) as Resource;
  } catch {
    return <IllustratedError details={t('common.cannotLoadData')} />;
  }

  const filename = buildYamlFilename(resource.kind ?? component, resource.metadata?.name ?? mcpName);
  return <YamlSidePanel resource={resource} filename={filename} isEdit={false} />;
}

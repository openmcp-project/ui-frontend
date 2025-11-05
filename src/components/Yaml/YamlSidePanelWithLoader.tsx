import { useApiResource } from '../../lib/api/useApiResource.ts';
import { ResourceObject } from '../../lib/api/types/crate/resourceObject.ts';
import { useTranslation } from 'react-i18next';
import Loading from '../Shared/Loading.tsx';
import IllustratedError from '../Shared/IllustratedError.tsx';

import { Resource } from '../../utils/removeManagedFieldsAndFilterData.ts';
import { YamlSidePanel } from './YamlSidePanel.tsx';
import { CustomResourceDefinitionName } from './YamlViewerSchemaLoader.tsx';

export interface YamlSidePanelWithLoaderProps {
  workspaceName?: string;
  resourceType: 'projects' | 'workspaces' | 'managedcontrolplanes';
  resourceName: string;
  isEdit?: boolean;
  customResourceDefinitionName?: CustomResourceDefinitionName;
}
export function YamlSidePanelWithLoader({
  workspaceName,
  resourceType,
  resourceName,
  isEdit = false,
  customResourceDefinitionName,
}: YamlSidePanelWithLoaderProps) {
  const { t } = useTranslation();
  const { isLoading, data, error } = useApiResource(
    ResourceObject(workspaceName ?? '', resourceType, resourceName),
    undefined,
    true,
  );

  if (isLoading) return <Loading />;
  if (error) return <IllustratedError details={t('common.cannotLoadData')} />;

  const filename = `${workspaceName ? `${workspaceName}_` : ''}${resourceType}_${resourceName}`;

  return (
    <YamlSidePanel
      resource={data as Resource}
      filename={filename}
      isEdit={isEdit}
      customResourceDefinitionName={customResourceDefinitionName}
    />
  );
}

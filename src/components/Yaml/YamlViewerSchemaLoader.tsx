import { FC } from 'react';

import { YamlViewer, YamlViewerProps } from './YamlViewer.tsx';
import { useApiResource } from '../../lib/api/useApiResource.ts';
import Loading from '../Shared/Loading.tsx';

interface YamlViewerSchemaLoaderProps extends YamlViewerProps {
  customResourceDefinitionName?: CustomResourceDefinitionName;
}

export type CustomResourceDefinitionName = 'workspaces.core.openmcp.cloud';
export const YamlViewerSchemaLoader: FC<YamlViewerSchemaLoaderProps> = ({
  yamlString,
  filename,
  isEdit = false,
  onApply,
  customResourceDefinitionName,
}) => {
  // Load custom resource definition for the resource
  const { data: crdData, isLoading } = useApiResource(
    {
      path: `/apis/apiextensions.k8s.io/v1/customresourcedefinitions/${customResourceDefinitionName}`,
    },
    undefined,
    true,
    !customResourceDefinitionName,
  );
  console.log('Custom Resource Definitions:', crdData);
  if (customResourceDefinitionName && isLoading) {
    return <Loading />;
  }
  return <YamlViewer yamlString={yamlString} filename={filename} isEdit={isEdit} onApply={onApply} />;
};

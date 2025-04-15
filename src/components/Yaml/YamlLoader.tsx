import { ResourceProps } from './YamlViewButton.tsx';
import { FC } from 'react';
import Loading from '@components/Shared/Loading.tsx';
import useResource from '@lib/api/useApiResource.ts';
import { ResourceObject } from '@lib/api/types/crate/resourceObject.ts';
import { stringify } from 'yaml';
import YamlViewer from '@components/Yaml/YamlViewer.tsx';

export const YamlLoader: FC<ResourceProps> = ({
  workspaceName,
  projectName,
  resourceType,
  resourceName,
}) => {
  // const { data, loading } = useManagedControlPlaneYamlQuery(
  //   workspaceName,
  //   projectName,
  // );

  const { isLoading, data } = useResource(
    ResourceObject(projectName, workspaceName, resourceType, resourceName),
  );
  if (isLoading) return <Loading />;
  // if (!workspaceName || !projectName || !resourceName || resourceType)
  //   return <div />;
  return <YamlViewer yamlString={stringify(data)} />;
};
